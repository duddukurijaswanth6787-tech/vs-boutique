const nodemailer = require('nodemailer');

let cachedTransporter = null;

const createTransporter = async () => {
    if (cachedTransporter) return cachedTransporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        return cachedTransporter;
    }

    // Fallback to Ethereal test account for development
    const testAccount = await nodemailer.createTestAccount();
    console.log('📧 Using Ethereal test email:', testAccount.user);
    cachedTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
    return cachedTransporter;
};

const sendWelcomeEmail = async (ownerName, email, username, temporaryPassword) => {
    try {
        const transporter = await createTransporter();
        const loginUrl = 'http://10.10.1.25:5173/login'; // Update with actual frontend URL if different

        const mailOptions = {
            from: '"VS Boutique Admin" <admin@vsboutique.com>',
            to: email,
            subject: 'Your Boutique Admin Access',
            text: `Hello ${ownerName},\n\nYour boutique has been successfully registered.\n\nLogin Details:\nUsername: ${username}\nPassword: ${temporaryPassword}\n\nLogin here: ${loginUrl}\n\nPlease change your password after your first login.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
                    <h2 style="color: #333;">Your Boutique Admin Access</h2>
                    <p style="color: #555;">Hello <strong>${ownerName}</strong>,</p>
                    <p style="color: #555;">Your boutique has been successfully registered on the VS Boutique platform.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="margin-top: 0; color: #333;">Login Details:</h4>
                        <p style="margin: 5px 0; color: #555;"><strong>Username:</strong> ${username}</p>
                        <p style="margin: 5px 0; color: #555;"><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                    </div>
                    <a href="${loginUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-bottom: 20px;">Login Now</a>
                    <p style="color: #888; font-size: 12px;">Please change your password immediately after your first login for security purposes.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

const sendPasswordResetEmail = async (ownerName, email, resetUrl) => {
    try {
        const transporter = await createTransporter();

        const mailOptions = {
            from: '"VS Boutique Admin" <admin@vsboutique.com>',
            to: email,
            subject: 'Set Your Boutique Admin Password',
            text: `Hello ${ownerName},\n\nYou have been invited to manage your boutique on the VS Boutique platform.\n\nPlease click the link below to set your password and access your account:\n${resetUrl}\n\nThis link is valid for 24 hours.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
                    <h2 style="color: #333;">Set Your Password</h2>
                    <p style="color: #555;">Hello <strong>${ownerName}</strong>,</p>
                    <p style="color: #555;">You have been invited to manage your boutique on the VS Boutique platform.</p>
                    <p style="color: #555;">Please click the button below to securely set your password and gain access to your Owner Portal.</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #000; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin: 20px 0;">Set Password</a>
                    <p style="color: #888; font-size: 12px;">This link is valid for 24 hours. If you did not request this, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Password Reset Email sent: %s', info.messageId);
        console.log('📧 Preview URL: %s', nodemailer.getTestMessageUrl(info));

        return true;
    } catch (error) {
        console.error('❌ Error sending password reset email:', error);
        return false;
    }
};

module.exports = { sendWelcomeEmail, sendPasswordResetEmail };
