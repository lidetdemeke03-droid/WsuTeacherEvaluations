import React, { useState, useEffect } from 'react';
import AvatarSelector from './AvatarSelector';
import { apiGetMe, apiUpdateProfile } from '../services/api';
import { User } from '../types';
import { toast } from 'react-hot-toast';

const ProfileCard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState<string | undefined>();
  const [gender, setGender] = useState<'male'|'female'|undefined>();

  useEffect(() => {
    apiGetMe().then(setUser).catch(() => toast.error('Failed to load profile'));
  }, []);

  const handleSaveAvatar = async (av: string, g?: 'male'|'female') => {
    try {
      const updated = await apiUpdateProfile({ avatar: av, gender: g });
      setUser(updated);
      setAvatar(av);
      setGender(g);
      toast.success('Avatar updated');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update avatar');
    }
  };

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center space-x-4">
        <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gray-100">
          <span style={{ fontSize: 36 }}>{(user.avatar === 'female') ? '👧' : '👦'}</span>
        </div>
        <div>
          <div className="text-xl font-bold">{user.firstName} {user.lastName}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-sm text-gray-500">{(user as any).department?.name || (user.departmentName) || 'N/A'}</div>
        </div>
      </div>

      <div className="mt-4">
        <button onClick={() => setEditing(!editing)} className="btn-secondary">{editing ? 'Close' : 'Edit Avatar'}</button>
        {editing && <div className="mt-3"><AvatarSelector currentAvatar={user.avatar} currentGender={user.gender as any} onSelect={handleSaveAvatar} /></div>}
      </div>
    </div>
  );
};

export default ProfileCard;
