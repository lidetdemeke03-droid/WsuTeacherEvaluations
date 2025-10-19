
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

type HeaderProps = {
  onToggleSidebar?: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <button onClick={onToggleSidebar} className="mr-3 md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle sidebar">
          <Menu size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">WSU Evaluation System</h1>
      </div>
      <div className="flex items-center space-x-4">
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white">
          <Bell size={24} />
          <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
        </motion.button>
        <div className="flex items-center space-x-2">
            <User size={24} className="text-gray-500 dark:text-gray-400"/>
            <span className="text-sm font-medium">{user?.name} ({user?.role})</span>
        </div>
        <motion.button 
          onClick={logout} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
