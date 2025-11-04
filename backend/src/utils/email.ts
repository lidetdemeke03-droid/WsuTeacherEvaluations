import Nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const TOKEN = process.env.MAILTRAP_API_TOKEN;

if (!TOKEN) {
  console.error('MAILTRAP_API_TOKEN is not set. Email functionality will be disabled.');
}

const transport = TOKEN ? Nodemailer.createTransport(
  MailtrapTransport({
    token: TOKEN,
    testInboxId: 3714384,
  })
) : null;

export const sendEmail = async (options: EmailOptions) => {
  if (!transport) {
    console.log('Email not sent because Mailtrap is not configured.');
    return;
  }

  const sender = {
    address: process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@localhost',
    name: process.env.MAILTRAP_SENDER_NAME || 'Teacher Evaluation System',
  };

  const mailOptions = {
    from: sender,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    category: "Integration Test", // As per your demo
    sandbox: true,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
