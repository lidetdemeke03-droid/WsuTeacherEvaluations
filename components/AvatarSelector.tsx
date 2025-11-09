import React from 'react';
import { User } from '../types';

interface Props {
  currentAvatar?: string;
  currentGender?: 'male' | 'female';
  onSelect: (avatarKey: string, gender?: 'male' | 'female') => void;
}

const AvatarSelector: React.FC<Props> = ({ currentAvatar, currentGender, onSelect }) => {
  const presets = [
    { key: 'male', label: '👦', gender: 'male' },
    { key: 'female', label: '👧', gender: 'female' },
  ];

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">Select an avatar</div>
      <div className="flex items-center space-x-4">
        {presets.map(p => (
          <button
            key={p.key}
            onClick={() => onSelect(p.key, p.gender as 'male' | 'female')}
            className={`p-3 rounded-md border ${currentAvatar === p.key ? 'border-blue-500' : 'border-gray-200'}`}
            aria-label={`Select ${p.key} avatar`}
          >
            <span style={{ fontSize: 28 }}>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AvatarSelector;
