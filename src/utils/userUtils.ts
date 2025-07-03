import bcrypt from 'bcrypt';
import jwt , {SignOptions}from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { AppError } from './AppError';
import dotenv from "dotenv"
dotenv.config();

export const encodePassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

export const decodePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s]{2,}$/;
  return nameRegex.test(name);
};

export const generateToken = (
  user: { _id: unknown },
  expiry: string = "30d",
  extraPayload: Record<string, any> = {}
): string => {
  if (!process.env.JWT_SECRET) {
    throw new AppError("JWT_SECRET is not defined in environment variables", 500);
  }
  
  return jwt.sign(
    { id:String( user._id), ...extraPayload },
    process.env.JWT_SECRET,
    { expiresIn: expiry } as SignOptions
  );
};

export const verifyToken = (token: string): any | null => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new AppError("JWT_SECRET is not defined in environment variables", 500);
    }
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

export const sendEmail = async (email: string, link: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Elevate Shop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
     html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #f9f9f9; color: #333;">
        <h2 style="color: #1a73e8; text-align: center;">Welcome to QuickPing!</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          Thanks for registering with us. Please verify your email address by clicking the button below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${link}" 
            target="_blank" 
            style="
              background-color: #1a73e8; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              font-weight: bold; 
              border-radius: 6px;
              display: inline-block;
              box-shadow: 0 4px 6px rgba(26, 115, 232, 0.3);
              transition: background-color 0.3s ease;
            "
          >
            Verify Email
          </a>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.4;">
          Or copy and paste this link into your browser:<br>
          <a href="${link}" target="_blank" style="color: #1a73e8; word-break: break-all;">${link}</a>
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you did not sign up for this account, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent:", info.response);
  } catch (error) {
    console.error("❌ Failed to send verification email:", error);
    throw new AppError("Failed to send verification email", 500);
  }
};

export const sendPasswordResetEmail = async (email: string, resetLink: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Elevate Shop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
     html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #f9f9f9; color: #333;">
        <h2 style="color: #1a73e8; text-align: center;">Password Reset</h2>
        <p style="font-size: 16px; line-height: 1.5;">
          We received a request to reset your password. If you didn't make this request, you can ignore this email.
          Otherwise, you can reset your password using the link below:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a 
            href="${resetLink}" 
            target="_blank" 
            style="
              background-color: #1a73e8; 
              color: white; 
              padding: 15px 30px; 
              text-decoration: none; 
              font-weight: bold; 
              border-radius: 6px;
              display: inline-block;
              box-shadow: 0 4px 6px rgba(26, 115, 232, 0.3);
              transition: background-color 0.3s ease;
            "
          >
            Reset Password
          </a>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.4;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetLink}" target="_blank" style="color: #1a73e8; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.4;">
          <strong>Note:</strong> This link will expire in  6 min for security reasons.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">
          If you didn't request this password reset, we recommend securing your account as your email may be compromised.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent:", info.response);
  } catch (error) {
    console.error("❌ Failed to send password reset email:", error);
    throw new AppError("Failed to send password reset email", 500);
  }
};

export const sendInvitationEmail = async (email: string, name: string, tempPassword: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"Elevate Shop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "You're Invited! Your Temporary Password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; background: #f9f9f9; color: #333;">
        <h2 style="color: #1a73e8; text-align: center;">Welcome, ${name}!</h2>
        <p style="font-size: 16px; line-height: 1.5;">You have been invited to join our platform. Here is your temporary password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="background-color: #1a73e8; color: white; padding: 10px 20px; border-radius: 6px; font-size: 18px; letter-spacing: 2px;">${tempPassword}</span>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.4;">Please login and change your password after first login.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">If you did not expect this invitation, you can ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Invitation email sent:", info.response);
  } catch (error) {
    console.error("❌ Failed to send invitation email:", error);
    throw new AppError("Failed to send invitation email", 500);
  }
};