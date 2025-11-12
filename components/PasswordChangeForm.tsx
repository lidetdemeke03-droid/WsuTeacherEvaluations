import React, { useState, useMemo } from 'react';
import { apiChangePassword } from '../services/api';
import { toast } from 'react-hot-toast';

const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const strengthLevels = [
  { text: 'Very Weak', color: 'bg-red-500' },
  { text: 'Weak', color: 'bg-orange-500' },
  { text: 'Medium', color: 'bg-yellow-500' },
  { text: 'Strong', color: 'bg-green-500' },
  { text: 'Very Strong', color: 'bg-blue-500' },
];

const PasswordChangeForm: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (passwordStrength < 3) return toast.error('Password is not strong enough');
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
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg shadow-sm">
      <div>
        <label className="block text-sm font-medium text-gray-700">Current Password</label>
        <input 
          type="password" 
          value={currentPassword} 
          onChange={e => setCurrentPassword(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input 
          type="password" 
          value={newPassword} 
          onChange={e => setNewPassword(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
        />
        {newPassword && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full transition-all duration-300 ${strengthLevels[passwordStrength-1]?.color ?? 'bg-gray-400'}`}
                style={{ width: `${(passwordStrength / 5) * 100}%` }}
              ></div>
            </div>
            <p className={`text-sm mt-1 ${strengthLevels[passwordStrength-1]?.color?.replace('bg-', 'text-') ?? 'text-gray-500'}`}>
              Strength: {strengthLevels[passwordStrength-1]?.text ?? 'Very Weak'}
            </p>
          </div>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <input 
          type="password" 
          value={confirmPassword} 
          onChange={e => setConfirmPassword(e.target.value)} 
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" 
          required 
        />
      </div>
      <div className="flex justify-end">
        <button 
          type="submit" 
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50" 
          disabled={loading || passwordStrength < 3}
        >
          {loading ? 'Saving...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

export default PasswordChangeForm;
