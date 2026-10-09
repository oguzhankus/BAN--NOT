import nodemailer from 'nodemailer';

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const port = Number(process.env.SMTP_PORT);
  const from = process.env.SMTP_FROM?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;

  if (!host || !Number.isInteger(port) || port < 1 || port > 65535 || !from) return null;
  if (Boolean(user) !== Boolean(pass)) return null;

  return {
    host,
    port,
    from,
    auth: user && pass ? { user, pass } : undefined,
  };
}

export function isMailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const config = getSmtpConfig();
  if (!config) {
    throw new Error('SMTP ayarları eksik veya geçersiz.');
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verificationUrl = new URL('/e-posta-dogrula', baseUrl);
  verificationUrl.searchParams.set('token', token);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: config.auth,
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: 'BANÜ NOT e-posta adresini doğrula',
    text: `Hesabını doğrulamak için bu bağlantıyı 24 saat içinde aç: ${verificationUrl.toString()}`,
    html: `<p>BANÜ NOT hesabını doğrulamak için <a href="${verificationUrl.toString()}">bu bağlantıyı</a> 24 saat içinde aç.</p>`,
  });
}
