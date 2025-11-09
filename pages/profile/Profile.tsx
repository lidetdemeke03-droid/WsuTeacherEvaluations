
import React from 'react';
import ProfileCard from '../../components/ProfileCard';
import PasswordChangeForm from '../../components/PasswordChangeForm';

const Profile: React.FC = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Manage Profile</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Change Password</h2>
          <PasswordChangeForm />
        </div>
      </div>
    </div>
  );
};

export default Profile;
