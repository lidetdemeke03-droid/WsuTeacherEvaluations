import { Request, Response } from 'express';
import User from '../models/User';
import jwt from 'jsonwebtoken';
import { UserRole } from '../types';
import crypto from 'crypto';
import { sendEmail } from '../utils/email';

const generateTokens = (user: any) => {
    const accessToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET as string, { expiresIn: '8h' });
    const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, password, role, department } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, error: 'User already exists' });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            role: role || UserRole.Student, // Default role
            department
        });

        await user.save();

        const userResponse: any = user.toObject();
        delete userResponse.password;

        res.status(201).json({ success: true, data: { user: userResponse } });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const tokens = generateTokens(user);

        const userResponse: any = user.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, data: { ...tokens, user: userResponse } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const refresh = async (req: Request, res: Response) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(401).json({ success: false, error: 'Refresh token required' });
        }

        const decoded: any = jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(403).json({ success: false, error: 'Invalid token' });
        }

        const tokens = generateTokens(user);
        res.status(200).json({ success: true, data: tokens });

    } catch (error) {
        return res.status(403).json({ success: false, error: 'Invalid or expired token' });
    }
};

export const verifyResetToken = async (req: Request, res: Response) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
        }

        res.status(200).json({ success: true, message: 'Token is valid' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
}

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, error: 'Token is invalid or has expired' });
        }

        user.password = req.body.password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        const tokens = generateTokens(user);

        const userResponse: any = user.toObject();
        delete userResponse.password;

        res.status(200).json({ success: true, data: { ...tokens, user: userResponse } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

export const requestPasswordReset = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, error: 'Email is required' });

        const user = await User.findOne({ email });

        // For security do not reveal whether email exists
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetExpires = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
        await user.save();

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        const message = `Hello ${user.firstName || ''},\n\nYou requested a password reset for your account. Click the link below to set a new password. This link will expire in 2 hours.\n\n${resetUrl}\n\nIf you did not request this, please ignore this email or contact support.`;

        await sendEmail({ to: user.email, subject: 'Password reset request', text: message });

        return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent' });
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ success: false, error: error.message });
    }
};
