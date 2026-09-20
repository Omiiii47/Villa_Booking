const nodemailer = require('nodemailer');
const {
  verificationEmailHtml,
  resetEmailHtml,
  resendVerificationEmailHtml,
} = require('./emailTemplates');

const APP_NAME = 'Solscape Stays';

// SMTP configuration. All values come from the environment — never hardcode.
const smtpConfig = () => {
  const host = process.env.SMTP_HOST;
  return {
    host,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  };
};

// Reusable transporter — lazily created on first send.
let transporter;
const getTransporter = () => {
  if (!transporter) transporter = nodemailer.createTransport(smtpConfig());
  return transporter;
};

// True when SMTP + sender + FRONTEND_URL are all available.
const isEmailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_FROM && process.env.FRONTEND_URL);

const fromAddress = () => {
  const raw = process.env.EMAIL_FROM || '';
  if (raw.includes('<')) return raw; // "Name <addr@example.com>"
  return `"${APP_NAME}" <${raw}>`;
};

const sendMail = async ({ to, subject, html }) => {
  await getTransporter().sendMail({
    from: fromAddress(),
    to,
    subject,
    text: `${subject}\n\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`,
    html,
  });
};

// Builds the verification link used across verification emails.
const buildVerificationLink = (token) =>
  `${process.env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(token)}`;

const buildPasswordResetLink = (token) =>
  `${process.env.FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;

const sendVerificationEmail = ({ to, name, token, mode = 'initial' }) =>
  sendMail({
    to,
    subject: mode === 'resend'
      ? 'Your new email verification link'
      : 'Verify your email address',
    html: mode === 'resend'
      ? resendVerificationEmailHtml({ name, link: buildVerificationLink(token), expiresInHours: 24 })
      : verificationEmailHtml({ name, link: buildVerificationLink(token), expiresInHours: 24 }),
  });

const sendPasswordResetEmail = ({ to, name, token }) =>
  sendMail({
    to,
    subject: 'Reset your password',
    html: resetEmailHtml({ name, link: buildPasswordResetLink(token), expiresInMinutes: 60 }),
  });

module.exports = {
  isEmailConfigured,
  sendVerificationEmail,
  sendPasswordResetEmail,
  buildVerificationLink,
  buildPasswordResetLink,
};