import "server-only"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM ?? "BJJFlow <noreply@bjjflow.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

interface SendEmailOptions {
  to: string
  subject: string
  html: string
}

async function sendEmail({ to, subject, html }: SendEmailOptions): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping email to:", to)
    return false
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error("[email] Failed to send:", res.status, body)
      return false
    }

    return true
  } catch (err) {
    console.error("[email] Error sending:", err)
    return false
  }
}

// ─── Email Templates ──────────────────────────────────────────────────────────

export async function sendWelcomeEmail(to: string, academyName: string) {
  return sendEmail({
    to,
    subject: `Welcome to ${academyName} on BJJFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Welcome to ${academyName}!</h2>
        <p>Your academy is set up and ready to go on BJJFlow.</p>
        <p>Here's what to do next:</p>
        <ol>
          <li>Add your students and instructors</li>
          <li>Create class templates</li>
          <li>Generate upcoming sessions</li>
          <li>Start tracking attendance</li>
        </ol>
        <p>
          <a href="${APP_URL}/app" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
            Go to Dashboard
          </a>
        </p>
        <p style="color:#888;font-size:13px;">— The BJJFlow Team</p>
      </div>
    `,
  })
}

export async function sendClassReminderEmail(
  to: string,
  className: string,
  date: string,
  time: string,
) {
  return sendEmail({
    to,
    subject: `Reminder: ${className} tomorrow at ${time}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Class Reminder</h2>
        <p>You have <strong>${className}</strong> scheduled for:</p>
        <p style="font-size:18px;font-weight:bold;">${date} at ${time}</p>
        <p>
          <a href="${APP_URL}/app/checkin" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
            Check In
          </a>
        </p>
        <p style="color:#888;font-size:13px;">— BJJFlow</p>
      </div>
    `,
  })
}

export async function sendInviteEmail(
  to: string,
  academyName: string,
  inviteToken: string,
) {
  const inviteUrl = `${APP_URL}/invite?token=${inviteToken}`
  return sendEmail({
    to,
    subject: `You've been invited to join ${academyName} on BJJFlow`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>You've been invited!</h2>
        <p><strong>${academyName}</strong> has invited you to join their academy on BJJFlow as an instructor.</p>
        <p>Click below to accept the invitation:</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
            Accept Invitation
          </a>
        </p>
        <p style="color:#888;font-size:13px;">This invite expires in 7 days.</p>
        <p style="color:#888;font-size:13px;">— BJJFlow</p>
      </div>
    `,
  })
}

export async function sendBeltPromotionEmail(
  to: string,
  memberName: string,
  newBelt: string,
) {
  return sendEmail({
    to,
    subject: `Congratulations on your ${newBelt} belt, ${memberName}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>Belt Promotion!</h2>
        <p>Congratulations, <strong>${memberName}</strong>!</p>
        <p>You've been promoted to <strong style="text-transform:capitalize;">${newBelt} Belt</strong>.</p>
        <p>Keep training hard and see your progress on BJJFlow:</p>
        <p>
          <a href="${APP_URL}/app/portal" style="display:inline-block;padding:10px 20px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;">
            View My Progress
          </a>
        </p>
        <p style="color:#888;font-size:13px;">— BJJFlow</p>
      </div>
    `,
  })
}
