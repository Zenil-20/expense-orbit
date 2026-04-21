const {
  APP_NAME,
  APP_URL,
  APP_TAGLINE,
  BRAND_COLORS,
  getCategoryMeta
} = require("./brand");

function logoBadge() {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-block;">
      <tr>
        <td style="width:44px;height:44px;background:#0B1120;border:2px solid #2DD4BF;border-radius:12px;text-align:center;vertical-align:middle;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:15px;letter-spacing:0.02em;color:#F2B857;line-height:40px;">
          EO
        </td>
      </tr>
    </table>`;
}

function buildLayout({ preheader, eyebrow, title, bodyHtml, footerNote, accent }) {
  const barAccent = accent || BRAND_COLORS.accent;
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#0B1120;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:${BRAND_COLORS.text};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0B1120;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0F1A2E;border-radius:20px;overflow:hidden;border:1px solid #1C2A44;">
            <tr>
              <td style="height:4px;background:linear-gradient(90deg,#2DD4BF 0%, ${barAccent} 100%);"></td>
            </tr>
            <tr>
              <td style="padding:32px 32px 8px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:middle;width:50px;">
                      ${logoBadge()}
                    </td>
                    <td style="vertical-align:middle;padding-left:12px;">
                      <div style="font-size:16px;font-weight:700;color:#F8FAFC;letter-spacing:-0.01em;">${APP_NAME}</div>
                      <div style="font-size:11px;color:#94A3B8;letter-spacing:0.12em;text-transform:uppercase;">${eyebrow}</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px;">
                <h1 style="margin:0;font-size:26px;line-height:1.25;color:#F8FAFC;font-weight:800;letter-spacing:-0.02em;">${title}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px 32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#0B1120;border-top:1px solid #1C2A44;">
                <div style="font-size:12px;line-height:1.6;color:#94A3B8;">${footerNote}</div>
                <div style="margin-top:8px;font-size:11px;color:#64748B;">
                  ${APP_NAME} &middot; <a href="${APP_URL}" style="color:#2DD4BF;text-decoration:none;">Open dashboard</a>
                </div>
              </td>
            </tr>
          </table>
          <div style="margin-top:16px;font-size:11px;color:#475569;">${APP_TAGLINE}</div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}


function infoRow(label, value, accent) {
  return `
    <tr>
      <td style="padding:12px 14px;background:#0B1120;border:1px solid #1C2A44;border-radius:12px;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.12em;color:${accent};font-weight:700;">${label}</div>
        <div style="margin-top:4px;font-size:15px;color:#F8FAFC;font-weight:600;">${value}</div>
      </td>
    </tr>
    <tr><td style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
  `;
}

exports.buildReminderVerificationTemplate = ({ userName, otp, targetEmail }) => ({
  subject: `${APP_NAME} - verify ${targetEmail}`,
  text: `Your ${APP_NAME} verification code is ${otp}. It expires in 10 minutes.`,
  html: buildLayout({
    preheader: `Your verification code is ${otp}`,
    eyebrow: "Email verification",
    title: "Confirm your reminder email",
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#CBD5E1;">Hi ${userName || "there"},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#CBD5E1;">
        Use the code below to verify <strong style="color:#F8FAFC;">${targetEmail}</strong>. Once verified, a confirmation test email is sent automatically and all future due alerts will arrive at this address.
      </p>
      <div style="margin:24px 0;padding:24px;background:#0B1120;border-radius:16px;border:1px solid #1C2A44;text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.2em;color:#94A3B8;font-weight:700;">One-time code</div>
        <div style="margin-top:12px;font-size:36px;letter-spacing:0.3em;color:#F2B857;font-weight:800;font-family:Menlo,Consolas,monospace;">${otp}</div>
        <div style="margin-top:12px;font-size:12px;color:#64748B;">Expires in 10 minutes</div>
      </div>
      <p style="margin:0;font-size:13px;line-height:1.7;color:#94A3B8;">Didn't request this? You can safely ignore this email.</p>
    `,
    footerNote: "This verification keeps your notifications going to an inbox you control."
  })
});

exports.buildTestEmailTemplate = ({ userName, targetEmail }) => ({
  subject: `${APP_NAME} - notifications are live`,
  text: `Hi ${userName || "there"}, your ${APP_NAME} notifications to ${targetEmail} are working.`,
  html: buildLayout({
    preheader: `Notifications to ${targetEmail} are working.`,
    eyebrow: "Delivery confirmed",
    title: "You're all set",
    accent: BRAND_COLORS.mint,
    bodyHtml: `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#CBD5E1;">Hi ${userName || "there"},</p>
      <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#CBD5E1;">
        <strong style="color:#F8FAFC;">${targetEmail}</strong> is verified and receiving ${APP_NAME} notifications. Upcoming, due-today, and overdue reminders will now land here.
      </p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
        ${infoRow("What's next", "Add a recurring expense with a due date to start receiving reminders.", "#2DD4BF")}
      </table>
      <div style="margin-top:24px;">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 22px;background:#F2B857;color:#0B1120;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Open dashboard</a>
      </div>
    `,
    footerNote: "You received this because you verified this address in settings."
  })
});

exports.buildReminderTemplate = ({
  userName,
  expenseName,
  amount,
  dueLabel,
  frequency,
  status,
  category
}) => {
  const meta = getCategoryMeta(category);
  const statusLabel =
    status === "today" ? "Due today" : status === "overdue" ? "Overdue" : "Upcoming";
  const statusColor =
    status === "today" ? BRAND_COLORS.accent : status === "overdue" ? BRAND_COLORS.rose : BRAND_COLORS.teal;
  const subjectSuffix =
    status === "today" ? "is due today" : status === "overdue" ? "is overdue" : "is due soon";

  return {
    subject: `${APP_NAME} - ${expenseName} ${subjectSuffix}`,
    text: `${expenseName} (${amount}) ${subjectSuffix}. Frequency: ${frequency || "Not set"}. Category: ${category || "Other"}.`,
    html: buildLayout({
      preheader: `${expenseName} ${subjectSuffix}.`,
      eyebrow: statusLabel,
      title: expenseName,
      accent: statusColor,
      bodyHtml: `
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#CBD5E1;">Hi ${userName || "there"}, this is a reminder for your tracked expense.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0;">
          ${infoRow("Amount", amount, BRAND_COLORS.accent)}
          ${infoRow("When", dueLabel, statusColor)}
          ${infoRow("Frequency", frequency || "Not set", BRAND_COLORS.teal)}
          ${infoRow("Category", `${meta.icon}  ${category || "Other"}`, meta.accent)}
        </table>
        <div style="margin-top:24px;">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 22px;background:#F2B857;color:#0B1120;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">Mark paid in dashboard</a>
        </div>
      `,
      footerNote: "You're receiving this because reminder emails are enabled for recurring expenses."
    })
  };
};
