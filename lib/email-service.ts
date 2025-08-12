import nodemailer from 'nodemailer'

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Send password reset email
export const sendPasswordResetEmail = async (
  email: string,
  name: string,
  resetUrl: string
) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Password Reset Request - BotrixAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">BotrixAI</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            <p style="color: #666; line-height: 1.6;">
              We received a request to reset your password for your BotrixAI account. 
              If you didn't make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Reset Your Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              <strong>Important:</strong> This link will expire in 1 hour for security reasons. 
              If you need a new password reset link, please request one from the login page.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px; margin: 10px 0;">
              ${resetUrl}
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>This email was sent from BotrixAI. Please do not reply to this email.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Password reset email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending password reset email:', error)
    throw new Error('Failed to send password reset email')
  }
}

// Send email verification
export const sendEmailVerification = async (
  email: string,
  name: string,
  verificationUrl: string
) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Verify Your Email - BotrixAI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">BotrixAI</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Email Verification</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to BotrixAI, ${name}!</h2>
            <p style="color: #666; line-height: 1.6;">
              Thank you for signing up! To complete your registration and start using BotrixAI, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              <strong>Note:</strong> This verification link will expire in 24 hours. 
              If you need a new verification link, please request one from your account settings.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: #f1f1f1; padding: 10px; border-radius: 5px; margin: 10px 0;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>Welcome to BotrixAI! We're excited to have you on board.</p>
            <p>If you have any questions, please contact our support team.</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email verification sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email verification:', error)
    throw new Error('Failed to send email verification')
  }
}

// Send welcome email
export const sendWelcomeEmail = async (
  email: string,
  name: string
) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: 'Welcome to BotrixAI! 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Welcome to BotrixAI!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your AI-powered chatbot platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Hello ${name},</h2>
            <p style="color: #666; line-height: 1.6;">
              Welcome to BotrixAI! We're thrilled to have you join our community of innovators 
              who are transforming customer engagement with AI-powered chatbots.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #667eea;">
              <h3 style="color: #333; margin-top: 0;">🚀 What you can do now:</h3>
              <ul style="color: #666; line-height: 1.8;">
                <li>Create your first AI chatbot</li>
                <li>Customize bot responses and flows</li>
                <li>Integrate with your website</li>
                <li>Monitor conversations and analytics</li>
                <li>Scale your customer support</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 25px; 
                        display: inline-block; 
                        font-weight: bold;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                Get Started Now
              </a>
            </div>
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h3 style="color: #333; margin-top: 0;">💡 Need help getting started?</h3>
            <p style="color: #666; line-height: 1.6;">
              Check out our <a href="#" style="color: #667eea;">documentation</a> or 
              <a href="#" style="color: #667eea;">contact our support team</a> for assistance.
            </p>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
            <p>Thank you for choosing BotrixAI!</p>
            <p>We're here to help you succeed with AI-powered customer engagement.</p>
          </div>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Welcome email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending welcome email:', error)
    throw new Error('Failed to send welcome email')
  }
}

// Generic email sender
export const sendEmail = async (
  to: string,
  subject: string,
  htmlContent: string
) => {
  try {
    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: htmlContent,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return info
  } catch (error) {
    console.error('Error sending email:', error)
    throw new Error('Failed to send email')
  }
}
