const mongoose = require("mongoose");
const Group = require("../models/group");
const Expense = require("../models/expense");
const Settlement = require("../models/settlement");
const User = require("../models/user");
const { getAcceptedFriendIds } = require("./friendController");
const sendEmail = require("../services/emailService");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

async function ensureMember(groupId, userId) {
  if (!isValidObjectId(groupId)) throw new Error("Invalid group id");
  const group = await Group.findById(groupId);
  if (!group) throw new Error("Group not found");
  const isMember = group.members.some((m) => String(m) === String(userId));
  if (!isMember) throw new Error("You are not a member of this group");
  return group;
}

// ---- CREATE ----
exports.createGroup = async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const description = String(req.body?.description || "").trim();
    const memberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];

    if (!name) return res.status(400).json({ message: "Group name is required" });
    if (memberIds.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: "Invalid member id in list" });
    }

    // All non-self members must be accepted friends.
    const friendIds = await getAcceptedFriendIds(req.user._id);
    const stranger = memberIds.find((id) => String(id) !== String(req.user._id) && !friendIds.has(String(id)));
    if (stranger) return res.status(403).json({ message: "All members must be your accepted friends" });

    // Always include the creator
    const memberSet = new Set([String(req.user._id), ...memberIds.map(String)]);
    if (memberSet.size < 2) return res.status(400).json({ message: "Add at least one friend to the group" });

    const group = await Group.create({
      name,
      description,
      createdBy: req.user._id,
      members: Array.from(memberSet)
    });

    res.status(201).json(await populateGroup(group._id));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ---- LIST groups for current user with their net balance per group ----
exports.listGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("members", "name email")
      .sort({ updatedAt: -1 });

    // Pull all relevant expenses in one go
    const groupIds = groups.map((g) => g._id);
    const expenses = await Expense.find({ group: { $in: groupIds } })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .populate("splits.user", "name email");

    const byGroup = new Map();
    expenses.forEach((e) => {
      const k = String(e.group);
      if (!byGroup.has(k)) byGroup.set(k, []);
      byGroup.get(k).push(e);
    });

    const enriched = groups.map((g) => {
      const exps = byGroup.get(String(g._id)) || [];
      const myNet = computeMyNetForGroup(exps, req.user._id);
      return {
        _id: g._id,
        name: g.name,
        description: g.description,
        members: g.members,
        memberCount: g.members.length,
        status: g.status,
        settledAt: g.settledAt,
        expenseCount: exps.length,
        totalSpent: round2(exps.reduce((s, e) => s + e.amount, 0)),
        myNet: round2(myNet),
        updatedAt: g.updatedAt
      };
    });

    res.json({ groups: enriched });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---- DETAIL ----
exports.getGroup = async (req, res) => {
  try {
    const group = await ensureMember(req.params.id, req.user._id);

    const populated = await Group.findById(group._id).populate("members", "name email").populate("createdBy", "name email");

    const expenses = await Expense.find({ group: group._id })
      .populate("paidBy", "name email")
      .populate("splitBetween", "name email")
      .populate("splits.user", "name email")
      .sort({ date: -1, createdAt: -1 });

    const balances = computeBalances(populated.members, expenses);

    const settlements = await Settlement.find({ group: group._id })
      .populate("from", "name email")
      .populate("to", "name email")
      .sort({ plan: -1, createdAt: 1 });

    // Filter to the latest plan only
    const latestPlan = settlements.reduce((max, s) => Math.max(max, s.plan), 0);
    const currentLegs = settlements.filter((s) => s.plan === latestPlan);

    // Stale check: if any expense was created/updated after the most recent leg, the plan is out of date.
    let stale = false;
    if (currentLegs.length > 0 && currentLegs.some((l) => l.status === "pending")) {
      const latestLegTs = Math.max(...currentLegs.map((l) => new Date(l.createdAt).getTime()));
      const latestExpTs = expenses.length
        ? Math.max(...expenses.map((e) => new Date(e.updatedAt || e.createdAt).getTime()))
        : 0;
      stale = latestExpTs > latestLegTs;
    }

    res.json({
      group: populated,
      expenses,
      balances,
      settlement: currentLegs.length
        ? { plan: latestPlan, legs: currentLegs, stale }
        : null
    });
  } catch (error) {
    res.status(error.message === "You are not a member of this group" ? 403 : 400)
      .json({ message: error.message });
  }
};

// ---- ADD MEMBERS to an existing group ----
exports.addMembers = async (req, res) => {
  try {
    const group = await ensureMember(req.params.id, req.user._id);
    if (group.status === "settled") {
      return res.status(400).json({ message: "This group is fully settled — start a new one to add people" });
    }

    const memberIds = Array.isArray(req.body?.memberIds) ? req.body.memberIds : [];
    if (memberIds.length === 0) return res.status(400).json({ message: "Pick at least one friend to add" });
    if (memberIds.some((id) => !isValidObjectId(id))) {
      return res.status(400).json({ message: "Invalid member id" });
    }

    // The inviter's friends — any added user must be friends with the current user.
    const friendIds = await getAcceptedFriendIds(req.user._id);
    const stranger = memberIds.find((id) => !friendIds.has(String(id)));
    if (stranger) return res.status(403).json({ message: "You can only add your accepted friends to a group" });

    const existing = new Set(group.members.map((m) => String(m)));
    const toAdd = memberIds.filter((id) => !existing.has(String(id)));
    if (toAdd.length === 0) {
      return res.status(400).json({ message: "All selected users are already in this group" });
    }

    group.members.push(...toAdd);
    await group.save();

    res.json(await populateGroup(group._id));
  } catch (error) {
    res.status(error.message === "You are not a member of this group" ? 403 : 400)
      .json({ message: error.message });
  }
};

// ---- SETTLE UP: build (or rebuild) the simplified plan ----
exports.settleUp = async (req, res) => {
  try {
    const group = await ensureMember(req.params.id, req.user._id);

    if (group.status === "settled") {
      return res.status(400).json({ message: "This group is already fully settled" });
    }

    const expenses = await Expense.find({ group: group._id });
    if (expenses.length === 0) {
      return res.status(400).json({ message: "No expenses to settle yet" });
    }

    // Always recompute. Strategy:
    //   • Find the latest plan (if any).
    //   • Keep any *paid* legs from that plan (they're real money movements).
    //   • Delete any *pending* legs from that plan (they're stale).
    //   • Recompute balances including the paid-leg adjustments.
    //   • If there's still imbalance, write new pending legs under the same plan number.
    const existing = await Settlement.find({ group: group._id }).sort({ plan: -1 });
    const latestPlan = existing[0]?.plan || 0;
    const latestLegs = existing.filter((s) => s.plan === latestPlan);
    const paidLegs   = latestLegs.filter((s) => s.status === "paid");
    const pendingLegIds = latestLegs.filter((s) => s.status === "pending").map((s) => s._id);

    if (pendingLegIds.length > 0) {
      await Settlement.deleteMany({ _id: { $in: pendingLegIds } });
    }

    const balances = computeBalanceMap(expenses);
    // Apply paid legs: each "from -> to ₹X" already-settled means from gets +X back, to loses +X.
    paidLegs.forEach((leg) => {
      const fromId = String(leg.from);
      const toId = String(leg.to);
      balances[fromId] = (balances[fromId] || 0) + leg.amount;
      balances[toId]   = (balances[toId]   || 0) - leg.amount;
    });

    const legs = simplifyDebts(balances);

    if (legs.length === 0) {
      // Already balanced (could happen if paid legs neutralize everything).
      group.status = "settled";
      group.settledAt = new Date();
      await group.save();
      notifyGroupSettled(group).catch(() => {});
      return res.json({ plan: latestPlan, legs: [], message: "Group is already balanced" });
    }

    // Reuse the current plan number so paid legs and new pending legs stay grouped.
    // Bump only if there was no prior plan.
    const planNumber = latestPlan || 1;
    const created = await Settlement.insertMany(legs.map((l) => ({
      group: group._id,
      plan: planNumber,
      from: l.from,
      to: l.to,
      amount: round2(l.amount),
      status: "pending"
    })));

    group.status = "settling";
    await group.save();

    const allLegs = await Settlement.find({ group: group._id, plan: planNumber })
      .populate("from", "name email").populate("to", "name email").sort({ createdAt: 1 });

    res.status(201).json({ plan: planNumber, legs: allLegs });
  } catch (error) {
    res.status(error.message === "You are not a member of this group" ? 403 : 400)
      .json({ message: error.message });
  }
};

// ---- MARK a settlement leg paid ----
exports.markSettlementPaid = async (req, res) => {
  try {
    const group = await ensureMember(req.params.id, req.user._id);

    if (!isValidObjectId(req.params.sid)) {
      return res.status(400).json({ message: "Invalid settlement id" });
    }

    const leg = await Settlement.findOne({ _id: req.params.sid, group: group._id });
    if (!leg) return res.status(404).json({ message: "Settlement leg not found" });
    if (leg.status === "paid") return res.status(400).json({ message: "Already marked paid" });

    // Either party (payer or payee) may confirm.
    const isParty = String(leg.from) === String(req.user._id) || String(leg.to) === String(req.user._id);
    if (!isParty) {
      return res.status(403).json({ message: "Only the payer or receiver can mark this paid" });
    }

    leg.status = "paid";
    leg.paidAt = new Date();
    leg.markedBy = req.user._id;
    await leg.save();

    // If every leg in the latest plan is paid, close the group.
    const latestPlan = leg.plan;
    const remaining = await Settlement.countDocuments({
      group: group._id, plan: latestPlan, status: "pending"
    });

    let allDone = false;
    if (remaining === 0) {
      group.status = "settled";
      group.settledAt = new Date();
      await group.save();
      allDone = true;
      // Fire-and-forget — don't block the response on email.
      notifyGroupSettled(group).catch(() => {});
    }

    res.json({ message: "Marked paid", allSettled: allDone });
  } catch (error) {
    res.status(error.message === "You are not a member of this group" ? 403 : 400)
      .json({ message: error.message });
  }
};

// ===== helpers =====
async function populateGroup(id) {
  return Group.findById(id).populate("members", "name email").populate("createdBy", "name email");
}

function computeMyShare(expense, userId) {
  const idStr = String(userId);
  const isParticipant = expense.splitBetween.some((u) => String(u._id || u) === idStr);
  if (!isParticipant) return 0;
  if (expense.splitType === "unequal" && expense.splits?.length) {
    const mine = expense.splits.find((s) => s.user && String(s.user._id || s.user) === idStr);
    return mine ? Number(mine.amount) : 0;
  }
  return Number(expense.amount) / expense.splitBetween.length;
}

function computeMyNetForGroup(expenses, userId) {
  let net = 0;
  expenses.forEach((e) => {
    const myShare = computeMyShare(e, userId);
    const paidByMe = e.paidBy && String(e.paidBy._id || e.paidBy) === String(userId);
    if (paidByMe) net += e.amount - myShare;
    else net -= myShare;
  });
  return net;
}

function computeBalances(members, expenses) {
  const map = {};
  members.forEach((m) => { map[String(m._id)] = { user: { _id: m._id, name: m.name, email: m.email }, net: 0 }; });

  expenses.forEach((e) => {
    const payerId = String(e.paidBy._id || e.paidBy);
    if (map[payerId]) map[payerId].net += e.amount;

    e.splitBetween.forEach((u) => {
      const id = String(u._id || u);
      const share = computeMyShare(e, id);
      if (map[id]) map[id].net -= share;
    });
  });

  return Object.values(map).map((b) => ({ ...b, net: round2(b.net) }));
}

function computeBalanceMap(expenses) {
  // Returns { userId: net } using raw ObjectId strings — used by simplifyDebts
  const map = {};
  expenses.forEach((e) => {
    const payerId = String(e.paidBy);
    map[payerId] = (map[payerId] || 0) + e.amount;

    const splits = {};
    if (e.splitType === "unequal" && e.splits?.length) {
      e.splits.forEach((s) => { splits[String(s.user)] = Number(s.amount); });
    } else {
      const share = Number(e.amount) / e.splitBetween.length;
      e.splitBetween.forEach((uid) => { splits[String(uid)] = share; });
    }
    Object.entries(splits).forEach(([uid, share]) => {
      map[uid] = (map[uid] || 0) - share;
    });
  });
  return map;
}

function simplifyDebts(balanceMap) {
  const creditors = [];
  const debtors = [];
  Object.entries(balanceMap).forEach(([userId, amt]) => {
    const rounded = round2(amt);
    if (rounded > 0.01) creditors.push({ userId, amount: rounded });
    else if (rounded < -0.01) debtors.push({ userId, amount: round2(-rounded) });
  });

  // Sort largest first for fewer transactions
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const legs = [];
  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const d = debtors[i], c = creditors[j];
    const amt = round2(Math.min(d.amount, c.amount));
    legs.push({ from: d.userId, to: c.userId, amount: amt });
    d.amount = round2(d.amount - amt);
    c.amount = round2(c.amount - amt);
    if (d.amount <= 0.01) i++;
    if (c.amount <= 0.01) j++;
  }
  return legs;
}

async function notifyGroupSettled(group) {
  const members = await User.find({ _id: { $in: group.members } }).select("name email");
  const subject = `🎉 ${group.name} is fully settled`;
  const text =
    `Hi {NAME},\n\n` +
    `All expenses in your group "${group.name}" have been settled. ` +
    `Everyone's even — no further payments needed.\n\n` +
    `– Expense Orbit`;
  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B1120;color:#E8ECF4;padding:24px;border-radius:12px">
      <h2 style="color:#F2B857;margin:0 0 8px">${escapeHtml(group.name)} is fully settled 🎉</h2>
      <p style="color:#CBD5E1">All expenses in this group have been paid up. Everyone is even — no further action needed.</p>
      <p style="color:#94A3B8;font-size:13px;margin-top:24px">— Expense Orbit</p>
    </div>`;

  await Promise.allSettled(
    members.map((m) =>
      sendEmail({
        to: m.email,
        subject,
        text: text.replace("{NAME}", m.name),
        html
      })
    )
  );
}

function escapeHtml(s = "") {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
