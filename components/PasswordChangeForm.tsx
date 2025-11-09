import React, { useState } from 'react';
import { apiChangePassword } from '../services/api';
import { toast } from 'react-hot-toast';

const passwordStrength = (pw: string) => {
  if (pw.length < 8) return false;
  // basic strength: min 8 chars, include number and letter
  return /[0-9]/.test(pw) && /[A-Za-z]/.test(pw);
};

const PasswordChangeForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (!passwordStrength(newPassword)) return toast.error('Password must be at least 8 chars and contain letters and numbers');
    setLoading(true);
    try {
      await apiChangePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to change password');
    } finally { setLoading(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm">Current Password</label>
        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="block text-sm">New Password</label>
        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input" required />
      </div>
      <div>
        <label className="block text-sm">Confirm Password</label>
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input" required />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
      </div>
    </form>
  );
};

export default PasswordChangeForm;
