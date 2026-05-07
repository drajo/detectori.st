import nodemailer from 'nodemailer';
import { env } from '../config/env';

function createTransporter(): nodemailer.Transporter | null {
  if (!env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? 587,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
}

export async function sendVerificationEmail(to: string, token: string, frontendUrl: string): Promise<void> {
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
  const from = env.EMAIL_FROM ?? 'noreply@detectorist.app';
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV] Verification link for ${to}: ${verificationUrl}`);
    return;
  }

  console.log(`[SMTP] Sending verification email to: ${to}`);
  await transporter.sendMail({
    from,
    to,
    subject: 'Verify your email — Detectorist',
    text: `Hello!\n\nPlease verify your email address by clicking the link below:\n${verificationUrl}\n\nThis link expires in 24 hours.\n\nIf you didn't create an account, you can ignore this email.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1a1d27;border-radius:12px;border:1px solid #2a2d3e;">
        <div style="margin-bottom:24px;">
          <span style="font-size:20px;font-weight:700;color:#e2e8f0;">Detectorist</span>
        </div>
        <h1 style="font-size:18px;font-weight:600;color:#e2e8f0;margin-bottom:8px;">Verify your email address</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Click the button below to activate your account. This link expires in 24 hours.
        </p>
        <a href="${verificationUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Verify email address
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">
          If you didn't create a Detectorist account, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string, frontendUrl: string): Promise<void> {
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;
  const from = env.EMAIL_FROM ?? 'noreply@detectorist.app';
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`[DEV] Password reset link for ${to}: ${resetUrl}`);
    return;
  }

  await transporter.sendMail({
    from,
    to,
    subject: 'Reset your password — Detectorist',
    text: `Hello!\n\nWe received a request to reset your password.\n\nClick the link below to set a new password:\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you didn't request a password reset, you can ignore this email.`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#1a1d27;border-radius:12px;border:1px solid #2a2d3e;">
        <div style="margin-bottom:24px;">
          <span style="font-size:20px;font-weight:700;color:#e2e8f0;">Detectorist</span>
        </div>
        <h1 style="font-size:18px;font-weight:600;color:#e2e8f0;margin-bottom:8px;">Reset your password</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin-bottom:24px;">
          Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
          Reset password
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">
          If you didn't request a password reset, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}
