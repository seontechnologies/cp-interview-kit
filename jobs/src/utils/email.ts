import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(email: any): Promise<void> {
  console.log('Sending email to:', email.to);
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@insighthub.io',
      to: email.to,
      subject: email.subject,
      html: email.body
    });
    console.log(`Email sent to ${email.to}: ${email.subject}`);
  } catch (err) {
    console.log('Failed to send email:', err);
  }
}
