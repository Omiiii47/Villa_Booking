const APP_NAME = 'Solscape Stays';

const base = (title, bodyContent, primaryColor = '#1c2e21') => `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
    <style>
      /* cli@safe */
      @media only screen and (max-width: 600px) {
        .container { width: 100% !important; }
        .button { display: block !important; width: 100% !important; padding: 14px 0 !important; }
        .stack { display: block !important; width: 100% !important; }
      }
      body { margin: 0; padding: 0; background-color: #f4f4f2; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2b2b2b; }
      a { color: ${primaryColor}; }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f2;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f2;padding:24px 12px;">
      <tr>
        <td align="center">
          <table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:${primaryColor};color:#ffffff;padding:28px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:22px;font-weight:700;letter-spacing:.5px;">${APP_NAME}</td></tr></table>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${bodyContent}
                <p style="margin:28px 0 0;font-size:12px;line-height:1.7;color:#9a9a9a;border-top:1px solid #eee;padding-top:16px;">
                  <strong>Security note:</strong> This email was sent automatically. If you did not request it, you can safely ignore it &mdash; no changes will be made to your account. We will never ask for your password by email.
                  <br /><br />&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

const button = ({ url, label }) => `
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 0;">
  <tr>
    <td align="center" style="border-radius:10px;background:#1c2e21;">
      <a href="${url}" class="button" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#ffffff !important;text-decoration:none;border-radius:10px;">${label}</a>
    </td>
  </tr>
</table>
`;

const verificationEmailHtml = ({ name, link, expiresInHours }) => base(
  'Verify your email',
  `
  <h1 style="margin:0 0 12px;font-size:20px;color:#1c2e21;">Verify your email address</h1>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;">Hi ${name},</p>
  <p style="margin:0;font-size:15px;line-height:1.7;">
    Welcome to ${APP_NAME}! Click the button below to confirm your email address and activate your account.
    This link is valid for <strong>${expiresInHours} hour(s)</strong> and can be used only once.
  </p>
  ${button({ url: link, label: 'Verify Email' })}
  <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#7a7a7a;">
    If the button does not work, copy and paste this link into your browser:<br />
    <a href="${link}" style="word-break:break-all;">${link}</a>
  </p>
  `
);

const resetEmailHtml = ({ name, link, expiresInMinutes }) => base(
  'Reset your password',
  `
  <h1 style="margin:0 0 12px;font-size:20px;color:#1c2e21;">Reset your password</h1>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;">Hi ${name},</p>
  <p style="margin:0;font-size:15px;line-height:1.7;">
    We received a request to reset the password for your ${APP_NAME} account. Click below to choose a new password.
    This link is valid for <strong>${expiresInMinutes} minute(s)</strong> and becomes invalid as soon as you use it.
  </p>
  ${button({ url: link, label: 'Reset Password' })}
  <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#7a7a7a;">
    If the button does not work, copy and paste this link into your browser:<br />
    <a href="${link}" style="word-break:break-all;">${link}</a>
  </p>
  <p style="margin:12px 0 0;font-size:13px;line-height:1.7;color:#7a7a7a;">
    If you did not request a password reset, you can safely ignore this email &mdash; your password will not change.
  </p>
  `
);

const resendVerificationEmailHtml = ({ name, link, expiresInHours }) => base(
  'New verification link',
  `
  <h1 style="margin:0 0 12px;font-size:20px;color:#1c2e21;">Resend your verification link</h1>
  <p style="margin:0 0 8px;font-size:15px;line-height:1.7;">Hi ${name},</p>
  <p style="margin:0;font-size:15px;line-height:1.7;">
    You asked for a fresh email verification link. Use the button below to confirm your account.
    This link is valid for <strong>${expiresInHours} hour(s)</strong> and can be used only once.
  </p>
  ${button({ url: link, label: 'Verify Email' })}
  <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#7a7a7a;">
    If the button does not work, copy and paste this link into your browser:<br />
    <a href="${link}" style="word-break:break-all;">${link}</a>
  </p>
  `
);

module.exports = { verificationEmailHtml, resetEmailHtml, resendVerificationEmailHtml };