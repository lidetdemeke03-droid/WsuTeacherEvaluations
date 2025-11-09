import React, { useState } from 'react';
import { apiRequestPasswordReset } from '../services/api';
import { toast } from 'react-hot-toast';

interface Props {
  email: string;
}

const PasswordResetButton: React.FC<Props> = ({ email }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!email) return toast.error('User has no email');
    setLoading(true);
    try {
      await apiRequestPasswordReset(email);
      toast.success('Password reset email queued');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset email');
    } finally { setLoading(false); }
  };

  return (
    <button onClick={handleClick} disabled={loading} className="text-yellow-600 hover:text-yellow-800 mr-2">
      {loading ? 'Sending...' : 'Reset Password'}
    </button>
  );
};

export default PasswordResetButton;
