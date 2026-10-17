import { Resend } from 'resend';
import { config } from '../../config.js';
import { AppError } from '../../shared/app-error.js';
import type { MemberInvitationEmailSender } from './members.types.js';

const emailRequestTimeoutMilliseconds = 10_000;

function escapeHtml(value: string) {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return value.replace(/[&<>"']/g, (character) => entities[character]);
}

export class ResendMemberInvitationEmailSender implements MemberInvitationEmailSender {
  async send(input: Parameters<MemberInvitationEmailSender['send']>[0]) {
    if (!config.RESEND_API_KEY) {
      throw new AppError(
        503,
        'EMAIL_NOT_CONFIGURED',
        'Member invitation email is not configured yet.',
      );
    }
    const resend = new Resend(config.RESEND_API_KEY);
    const safeInviterName = input.inviterName.replace(/[\r\n]+/g, ' ');
    const safeWeddingName = input.weddingName.replace(/[\r\n]+/g, ' ');
    const { error } = await resend.emails.send(
      {
        from: config.EMAIL_FROM,
        to: input.to,
        subject: `${safeInviterName} invited you to ${safeWeddingName} on Vivah`,
        html: `<p>${escapeHtml(safeInviterName)} invited you to help plan <strong>${escapeHtml(safeWeddingName)}</strong> as ${input.role === 'ADMIN' ? 'an Admin' : 'a Manager'}.</p><p><a href="${escapeHtml(input.invitationUrl)}">View and accept invitation</a></p><p>This invitation expires in ${config.MEMBER_INVITATION_DURATION_DAYS} days.</p>`,
      },
      {
        signal: AbortSignal.timeout(emailRequestTimeoutMilliseconds),
      },
    );
    if (error) {
      throw new AppError(
        502,
        'EMAIL_DELIVERY_FAILED',
        'The invitation email could not be sent. Please try again.',
      );
    }
  }
}
