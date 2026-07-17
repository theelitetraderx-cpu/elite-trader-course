import type { LiveMeeting, MeetingAudience } from "@/types";
import { BRAND, CONTACT } from "@/lib/constants";
import { listUsers, getUserCourseIds } from "@/lib/data/user-store";
import {
  getResendClient,
  getResendFromAddress,
  isResendConfigured,
} from "@/lib/email/resend";

export type MeetingEmailKind = "scheduled" | "live";

export interface MeetingEmailRecipient {
  id: string;
  email: string;
  full_name: string;
}

function portalBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;
  return "https://course.theelitetrader.in";
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function hasProOrElite(userId: string): boolean {
  const courseIds = getUserCourseIds(userId);
  return (
    courseIds.includes("course-pro") || courseIds.includes("course-elite")
  );
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function getMeetingEmailRecipients(
  audience: MeetingAudience = "all",
  extra?: { email?: string; full_name?: string; id?: string }[]
): MeetingEmailRecipient[] {
  const byEmail = new Map<string, MeetingEmailRecipient>();

  const add = (recipient: MeetingEmailRecipient) => {
    if (!isValidEmail(recipient.email)) return;
    const key = normalizeEmail(recipient.email);
    if (!byEmail.has(key)) byEmail.set(key, recipient);
  };

  for (const user of listUsers()) {
    if (user.status !== "active" || !user.email) continue;

    if (user.role === "student") {
      if (audience === "pro_elite" && !hasProOrElite(user.id)) continue;
      add({
        id: user.id,
        email: user.email.trim(),
        full_name: user.full_name,
      });
      continue;
    }

    // Always CC active staff so admins receive a copy
    if (
      user.role === "super_admin" ||
      user.role === "admin" ||
      user.role === "moderator"
    ) {
      add({
        id: user.id,
        email: user.email.trim(),
        full_name: user.full_name,
      });
    }
  }

  // Brand contact always gets a copy
  add({
    id: "brand-contact",
    email: CONTACT.email,
    full_name: BRAND.shortName,
  });

  for (const person of extra ?? []) {
    if (!person.email) continue;
    add({
      id: person.id || `extra-${normalizeEmail(person.email)}`,
      email: person.email.trim(),
      full_name: person.full_name?.trim() || "Admin",
    });
  }

  return [...byEmail.values()];
}

function buildMeetingEmailHtml(
  meeting: LiveMeeting,
  recipientName: string,
  kind: MeetingEmailKind
): string {
  const when = formatWhen(meeting.scheduled_at);
  const portalUrl = `${portalBaseUrl()}/dashboard/meetings`;
  const headline =
    kind === "live"
      ? "Your live session is starting — Join Now"
      : "You're invited to a live meeting";
  const ctaLabel = kind === "live" ? "Join Now" : "Open Meeting Link";
  const description = meeting.description
    ? `<p style="margin:0 0 16px;color:#555;font-size:14px;line-height:1.5;">${escapeHtml(meeting.description)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e7e5e4;">
          <tr>
            <td style="background:#050505;padding:24px 28px;">
              <p style="margin:0;color:#D4AF37;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(BRAND.shortName)}</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;line-height:1.3;">${escapeHtml(headline)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 12px;color:#18181b;font-size:15px;">Hi ${escapeHtml(recipientName)},</p>
              <p style="margin:0 0 16px;color:#3f3f46;font-size:15px;line-height:1.5;">
                ${
                  kind === "live"
                    ? "A live meeting is available now. Use the button below to join."
                    : "A new live meeting has been scheduled for you."
                }
              </p>
              <h2 style="margin:0 0 8px;color:#18181b;font-size:18px;">${escapeHtml(meeting.title)}</h2>
              ${description}
              <p style="margin:0 0 6px;color:#52525b;font-size:14px;"><strong>When:</strong> ${escapeHtml(when)} (IST)</p>
              <p style="margin:0 0 20px;color:#52525b;font-size:14px;"><strong>Duration:</strong> ${meeting.duration_minutes} minutes</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
                <tr>
                  <td style="border-radius:8px;background:#D4AF37;">
                    <a href="${escapeAttr(meeting.meeting_url)}" style="display:inline-block;padding:12px 22px;color:#050505;text-decoration:none;font-weight:700;font-size:14px;">
                      ${ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#71717a;font-size:12px;word-break:break-all;">
                Meeting link: <a href="${escapeAttr(meeting.meeting_url)}" style="color:#B8860B;">${escapeHtml(meeting.meeting_url)}</a>
              </p>
              <p style="margin:16px 0 0;color:#71717a;font-size:12px;">
                Or open your portal meetings page:
                <a href="${escapeAttr(portalUrl)}" style="color:#B8860B;">${escapeHtml(portalUrl)}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #f4f4f5;color:#a1a1aa;font-size:11px;">
              ${escapeHtml(BRAND.motto)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

export async function sendMeetingInviteEmails(
  meeting: LiveMeeting,
  kind: MeetingEmailKind = "scheduled",
  options?: {
    creatorEmail?: string;
    creatorName?: string;
    creatorId?: string;
  }
): Promise<{ sent: number; failed: number; skipped: boolean; error?: string }> {
  if (!isResendConfigured()) {
    console.warn("[email] RESEND_API_KEY not set — skipping meeting emails");
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      error:
        "RESEND_API_KEY is missing on this Vercel project. Add it under Settings → Environment Variables, then redeploy.",
    };
  }

  const resend = getResendClient();
  if (!resend) {
    return {
      sent: 0,
      failed: 0,
      skipped: true,
      error: "Resend client failed to initialize",
    };
  }

  const recipients = getMeetingEmailRecipients(meeting.audience, [
    {
      id: options?.creatorId,
      email: options?.creatorEmail,
      full_name: options?.creatorName,
    },
  ]);

  if (recipients.length === 0) {
    return {
      sent: 0,
      failed: 0,
      skipped: false,
      error: "No recipients with valid email addresses",
    };
  }

  const subject =
    kind === "live"
      ? `Join Now: ${meeting.title}`
      : `Live Meeting: ${meeting.title} — ${formatWhen(meeting.scheduled_at)}`;

  let sent = 0;
  let failed = 0;
  let lastError: string | undefined;

  for (const recipient of recipients) {
    try {
      const { error } = await resend.emails.send({
        from: getResendFromAddress(),
        to: recipient.email,
        subject,
        html: buildMeetingEmailHtml(meeting, recipient.full_name, kind),
      });
      if (error) {
        failed += 1;
        lastError = error.message;
        console.warn(
          `[email] meeting mail failed for ${recipient.email}:`,
          error.message
        );
      } else {
        sent += 1;
      }
    } catch (err) {
      failed += 1;
      lastError = err instanceof Error ? err.message : "Send failed";
      console.warn(`[email] meeting mail error for ${recipient.email}:`, err);
    }
  }

  return { sent, failed, skipped: false, error: lastError };
}
