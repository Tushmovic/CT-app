import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

export const emailConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export const createTransporter = () => {
  return nodemailer.createTransport(emailConfig);
};

export const verifyEmailConnection = async () => {
  const transporter = createTransporter();
  try {
    await transporter.verify();
    console.log('Email service connected successfully');
  } catch (error) {
    console.error('Email service connection failed:', error);
  }
};