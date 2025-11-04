import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiVerifyResetToken, apiResetPassword } from '../services/api';

const ResetPasswordPage: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

    useEffect(() => {
        const verifyToken = async () => {
            if (token) {
                try {
                    await apiVerifyResetToken(token);
                    setIsValidToken(true);
                } catch (err) {
                    setIsValidToken(false);
                    setError('Invalid or expired token.');
                }
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (token) {
            try {
                await apiResetPassword(token, password);
                setSuccess('Password has been reset successfully. You can now log in.');
                setTimeout(() => navigate('/login'), 3000);
            } catch (err) {
                setError('Failed to reset password.');
            }
        }
    };

    if (isValidToken === null) {
        return <div>Loading...</div>;
    }

    if (!isValidToken) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirm New Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit">Reset Password</button>
            </form>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {success && <p style={{ color: 'green' }}>{success}</p>}
        </div>
    );
};

export default ResetPasswordPage;
