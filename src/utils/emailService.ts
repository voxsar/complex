import nodemailer from "nodemailer";
import passwordResetTemplate from "./emailTemplates/passwordReset";
import verificationTemplate from "./emailTemplates/verification";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const FROM = process.env.EMAIL_FROM || "no-reply@example.com";
const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export const emailService = {
  async sendPasswordReset(to: string, token: string) {
    const resetLink = `${BASE_URL}/reset-password?token=${token}`;
    const template = passwordResetTemplate(resetLink);
    await transporter.sendMail({ from: FROM, to, ...template });
  },

  async sendVerification(to: string, token: string) {
    const verificationLink = `${BASE_URL}/verify-email?token=${token}`;
    const template = verificationTemplate(verificationLink);
    await transporter.sendMail({ from: FROM, to, ...template });
  }
};

export default emailService;
