import nodemailer from 'nodemailer';
import { User } from '../models/user.model';

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendNewRegistrationAlert(user: User) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: process.env.ADMIN_EMAILS?.split(',') || [],
      subject: 'New User Registration - Action Required',
      html: `
        <h2>New User Registration</h2>
        <p>A new user has registered and requires approval:</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Registered:</strong> ${new Date(user.registrationDate).toLocaleString()}</li>
        </ul>
        <p>Please log in to the admin dashboard to approve or reject this request.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send registration alert email:', error);
    }
  }

  async sendPasswordResetEmail(user: User) {
    const resetToken = 'generate-reset-token'; // Implement token generation
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
  }

  async sendPaymentApprovedNotification(user: User, amount: number, type: string) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Payment Approved',
      html: `
        <h2>Payment Approved</h2>
        <p>Hello ${user.name},</p>
        <p>Your payment of <strong>₦${amount.toLocaleString()}</strong> for <strong>${type}</strong> has been approved.</p>
        <p>Thank you for your contribution!</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send payment approval email:', error);
    }
  }

  async sendLoanIssuedEmail(user: User, loan: any) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Loan Approved',
      html: `
        <h2>Loan Approved</h2>
        <p>Hello ${user.name},</p>
        <p>Your loan application has been approved:</p>
        <ul>
          <li><strong>Principal Amount:</strong> ₦${loan.amount.toLocaleString()}</li>
          <li><strong>Disbursed Amount:</strong> ₦${loan.disbursementAmount.toLocaleString()}</li>
          <li><strong>Interest (5% upfront):</strong> ₦${loan.interestAmount.toLocaleString()}</li>
          <li><strong>Due Date:</strong> ${new Date(loan.closingDate).toLocaleDateString()}</li>
        </ul>
        <p>Please make sure to repay on time to avoid additional interest.</p>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send loan issued email:', error);
    }
  }
}