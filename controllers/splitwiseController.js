// this code is for normallizing the expense data and logic for calculating the amount owed by each user
const mongoose = require('mongoose');
const Expense = require('../models/expense');

// Function to calculate the amount owed by each user in a group
const calculateSettlements = async (groupId) => {
    try {
        const expenses = await Expense.find({ group: groupId })
            .populate('paidBy')
            .populate('splitBetween');

        const balances = {};

        // Step 1: Calculate net balance for each user
        expenses.forEach(expense => {
            const totalAmount = expense.amount;

            // CASE 1: Equal Split
            let splits = {};
            if (!expense.splits || expense.splits.length === 0) {
                const equalShare = totalAmount / expense.splitBetween.length;

                expense.splitBetween.forEach(user => {
                    splits[user._id] = equalShare;
                });
            } 
            // CASE 2: Unequal Split
            else {
                // expense.splits = [{user: id, amount: 300}, ...]
                expense.splits.forEach(split => {
                    splits[split.user.toString()] = split.amount;
                });
            }

            // Add balances
            expense.splitBetween.forEach(user => {
                const userId = user._id.toString();

                if (!balances[userId]) balances[userId] = 0;

                // subtract what user owes
                balances[userId] -= splits[userId] || 0;
            });

            // Add to payer
            const payerId = expense.paidBy._id.toString();
            if (!balances[payerId]) balances[payerId] = 0;

            balances[payerId] += totalAmount;
        });

        // Step 2: Separate creditors and debtors
        const creditors = [];
        const debtors = [];

        for (let userId in balances) {
            const amount = balances[userId];

            if (amount > 0) {
                creditors.push({ userId, amount });
            } else if (amount < 0) {
                debtors.push({ userId, amount: -amount });
            }
        }

        // Step 3: Settlement (who pays whom)
        const settlements = [];

        let i = 0, j = 0;

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            const settleAmount = Math.min(debtor.amount, creditor.amount);

            settlements.push({
                from: debtor.userId,
                to: creditor.userId,
                amount: settleAmount
            });

            debtor.amount -= settleAmount;
            creditor.amount -= settleAmount;

            if (debtor.amount === 0) i++;
            if (creditor.amount === 0) j++;
        }

        return settlements;

    } catch (error) {
        throw new Error('Error calculating settlements');
    }
};

const User = require('../models/user');
const Group = require('../models/group');
const { getAcceptedFriendIds } = require('./friendController');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

async function validateBaseSplitPayload(body, currentUser) {
    const { name, amount, group, paidBy, splitBetween } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
        throw new Error('Expense name is required');
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Amount must be greater than 0');
    }

    if (group && !isValidObjectId(group)) {
        throw new Error('Group id is invalid');
    }

    const payerId = paidBy || (currentUser && currentUser._id);
    if (!payerId || !isValidObjectId(payerId)) {
        throw new Error('Valid paidBy user id is required');
    }

    if (!Array.isArray(splitBetween) || splitBetween.length === 0) {
        throw new Error('splitBetween must be a non-empty array of user ids');
    }

    splitBetween.forEach((uid) => {
        if (!isValidObjectId(uid)) {
            throw new Error(`Invalid user id in splitBetween: ${uid}`);
        }
    });

    // Ensure all participant ids reference real users on the platform
    const participantIds = Array.from(new Set([payerId.toString(), ...splitBetween.map(String)]));
    const foundCount = await User.countDocuments({ _id: { $in: participantIds } });
    if (foundCount !== participantIds.length) {
        throw new Error('One or more selected users do not exist on the platform');
    }

    const myId = currentUser && currentUser._id ? currentUser._id.toString() : null;
    if (!myId) throw new Error('Authentication required');

    if (group) {
        // Group-scoped expense: every participant must be a member of that group, and the current
        // user must also be a member (so strangers can't push expenses into a group they don't belong to).
        const groupDoc = await Group.findById(group);
        if (!groupDoc) throw new Error('Group not found');
        if (groupDoc.status === 'settled') throw new Error('This group is fully settled — start a new group for new expenses');

        const memberIds = new Set(groupDoc.members.map((m) => String(m)));
        if (!memberIds.has(myId)) throw new Error('You are not a member of this group');

        const outsider = participantIds.find((id) => !memberIds.has(id));
        if (outsider) throw new Error('Every participant must be a member of this group');
    } else {
        // Ad-hoc split: every non-self participant must be an accepted friend of the current user.
        const others = participantIds.filter((id) => id !== myId);
        if (others.length > 0) {
            const friendIds = await getAcceptedFriendIds(myId);
            const stranger = others.find((id) => !friendIds.has(id));
            if (stranger) {
                throw new Error('You can only split with users who have accepted your friend request');
            }
        }
    }

    return {
        name: name.trim(),
        amount: parsedAmount,
        group: group || null,
        paidBy: payerId,
        splitBetween,
        date: body.date ? new Date(body.date) : new Date()
    };
}

async function populateExpense(expenseId) {
    return Expense.findById(expenseId)
        .populate('paidBy', 'name email')
        .populate('splitBetween', 'name email')
        .populate('splits.user', 'name email');
}

// CREATE — Equal split
exports.createEqualSplitExpense = async (req, res) => {
    try {
        const base = await validateBaseSplitPayload(req.body, req.user);

        let expense = await Expense.create({
            ...base,
            splitType: 'equal',
            splits: []
        });

        expense = await populateExpense(expense._id);
        res.status(201).json(expense);
    } catch (error) {
        console.error('[splitwise] error:', error);
        res.status(400).json({ message: error.message });
    }
};

// CREATE — Unequal split
exports.createUnequalSplitExpense = async (req, res) => {
    try {
        const base = await validateBaseSplitPayload(req.body, req.user);
        const { splits } = req.body;

        if (!Array.isArray(splits) || splits.length === 0) {
            throw new Error('splits array is required for unequal split');
        }

        const normalizedSplits = splits.map((s) => {
            if (!s || !isValidObjectId(s.user)) {
                throw new Error('Each split must include a valid user id');
            }

            const splitAmount = Number(s.amount);
            if (!Number.isFinite(splitAmount) || splitAmount < 0) {
                throw new Error('Each split amount must be a non-negative number');
            }

            return { user: s.user, amount: splitAmount };
        });

        const splitUserIds = new Set(normalizedSplits.map((s) => s.user.toString()));
        const participantIds = new Set(base.splitBetween.map((u) => u.toString()));

        if (splitUserIds.size !== normalizedSplits.length) {
            throw new Error('Duplicate users in splits are not allowed');
        }

        for (const uid of participantIds) {
            if (!splitUserIds.has(uid)) {
                throw new Error('Every user in splitBetween must have an entry in splits');
            }
        }

        for (const uid of splitUserIds) {
            if (!participantIds.has(uid)) {
                throw new Error('splits contains a user not present in splitBetween');
            }
        }

        const splitsTotal = normalizedSplits.reduce((sum, s) => sum + s.amount, 0);
        if (Math.abs(splitsTotal - base.amount) > 0.01) {
            throw new Error(`Sum of splits (${splitsTotal}) must equal total amount (${base.amount})`);
        }

        let expense = await Expense.create({
            ...base,
            splitType: 'unequal',
            splits: normalizedSplits
        });

        expense = await populateExpense(expense._id);
        res.status(201).json(expense);
    } catch (error) {
        console.error('[splitwise] error:', error);
        res.status(400).json({ message: error.message });
    }
};

// LIST — splitwise expenses involving current user (paid by them or part of splitBetween)
exports.listMySplitwise = async (req, res) => {
    try {
        const userId = req.user._id;

        // Personal (non-group) splits only — group expenses live under the group detail view.
        const expenses = await Expense.find({
            group: null,
            $or: [{ paidBy: userId }, { splitBetween: userId }]
        })
            .populate('paidBy', 'name email')
            .populate('splitBetween', 'name email')
            .populate('splits.user', 'name email')
            .sort({ date: -1, createdAt: -1 });

        // Compute net balance for the current user across all these splits.
        let youAreOwed = 0;
        let youOwe = 0;

        expenses.forEach((exp) => {
            const myShare = computeMyShare(exp, userId);
            const paidByMe = exp.paidBy && exp.paidBy._id.toString() === userId.toString();

            if (paidByMe) {
                // Others owe me: total - my own share
                youAreOwed += exp.amount - myShare;
            } else {
                // I owe payer my share
                youOwe += myShare;
            }
        });

        res.json({
            expenses,
            summary: {
                youAreOwed: round2(youAreOwed),
                youOwe: round2(youOwe),
                net: round2(youAreOwed - youOwe)
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

function computeMyShare(expense, userId) {
    const idStr = userId.toString();
    const isParticipant = expense.splitBetween.some((u) => u._id.toString() === idStr);
    if (!isParticipant) return 0;

    if (expense.splitType === 'unequal' && expense.splits && expense.splits.length) {
        const mine = expense.splits.find((s) => s.user && s.user._id.toString() === idStr);
        return mine ? mine.amount : 0;
    }
    return expense.amount / expense.splitBetween.length;
}

function round2(n) {
    return Math.round(n * 100) / 100;
}

exports.calculateSettlements = calculateSettlements;