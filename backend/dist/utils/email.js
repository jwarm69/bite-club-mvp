"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = exports.sendPasswordResetEmail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
// Email configuration
const createTransporter = () => {
    // For development, we'll use a simple test transport
    // In production, you would configure with a real email service like SendGrid, AWS SES, etc.
    return nodemailer_1.default.createTransport({
        host: 'smtp.ethereal.email', // Ethereal Email for testing
        port: 587,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
            pass: process.env.EMAIL_PASS || 'ethereal.pass'
        }
    });
};
const sendPasswordResetEmail = async (email, resetToken, userType) => {
    try {
        const transporter = createTransporter();
        // Create reset URL
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&type=${userType}`;
        const mailOptions = {
            from: '"Bite Club Support" <noreply@biteclub.com>',
            to: email,
            subject: 'Reset Your Bite Club Password',
            html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Bite Club</h1>
            <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              You've requested to reset your password for your Bite Club ${userType} account. 
              Click the button below to create a new password:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              This link will expire in 1 hour for security reasons.
            </p>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If you didn't request this password reset, please ignore this email. 
              Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 14px; text-align: center;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">© 2025 Bite Club. All rights reserved.</p>
          </div>
        </div>
      `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset email sent:', info.messageId);
        // For development, log the preview URL
        if (process.env.NODE_ENV !== 'production') {
            console.log('Preview URL:', nodemailer_1.default.getTestMessageUrl(info));
        }
    }
    catch (error) {
        console.error('Error sending password reset email:', error);
        throw new Error('Failed to send password reset email');
    }
};
exports.sendPasswordResetEmail = sendPasswordResetEmail;
const sendWelcomeEmail = async (email, firstName, userType) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: '"Bite Club Support" <noreply@biteclub.com>',
            to: email,
            subject: 'Welcome to Bite Club!',
            html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Bite Club!</h1>
          </div>
          
          <div style="padding: 40px 20px; background: white;">
            <h2 style="color: #333; margin-bottom: 20px;">Hi ${firstName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Welcome to Bite Club! We're excited to have you join our community.
            </p>
            
            ${userType === 'student' ? `
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                As a student, you can now:
              </p>
              <ul style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                <li>Browse restaurants at your school</li>
                <li>Place orders with customizations</li>
                <li>Track your order status in real-time</li>
                <li>Manage your credit balance</li>
              </ul>
            ` : `
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                Your restaurant account has been created and is pending admin approval. 
                Once approved, you'll be able to:
              </p>
              <ul style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                <li>Manage your menu and pricing</li>
                <li>Receive and process orders</li>
                <li>Update order statuses</li>
                <li>View analytics and revenue</li>
              </ul>
              <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
                You'll receive another email once your account is approved.
              </p>
            `}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;">
                Get Started
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px;">
            <p style="margin: 0;">© 2025 Bite Club. All rights reserved.</p>
          </div>
        </div>
      `
        };
        const info = await transporter.sendMail(mailOptions);
        console.log('Welcome email sent:', info.messageId);
    }
    catch (error) {
        console.error('Error sending welcome email:', error);
        // Don't throw here since welcome email is not critical
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
//# sourceMappingURL=email.js.map