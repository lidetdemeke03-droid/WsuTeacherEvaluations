import Nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
  attachments?: any[];
}

if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
  console.error('MAILTRAP_USER or MAILTRAP_PASS is not set. Email functionality will be disabled.');
}

const transport = Nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS
  }
});

export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
    console.log('Email not sent because Mailtrap is not configured.');
    return;
  }

  const mailOptions = {
    from: process.env.MAILTRAP_SENDER_EMAIL || 'no-reply@localhost',
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments,
  };

  try {
    const info = await transport.sendMail(mailOptions);
    console.log('Email sent successfully:', info);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};
