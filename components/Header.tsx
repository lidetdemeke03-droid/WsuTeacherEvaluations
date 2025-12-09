
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Bell, LogOut, Menu } from 'lucide-react';
import BackButton from './BackButton';
import { motion } from 'framer-motion';
import { apiGetNotifications, apiMarkNotificationRead } from '../services/api';

type NotificationItem = { _id: string; message: string; read: boolean; createdAt: string };

type HeaderProps = {
  onToggleSidebar?: () => void;
};

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const data = await apiGetNotifications();
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n: any) => !n.read).length);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center">
        <BackButton />
        <button onClick={onToggleSidebar} className="mr-3 md:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Toggle sidebar">
          <Menu size={20} className="text-gray-700 dark:text-gray-200" />
        </button>
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">WSU Evaluation System</h1>
      </div>
      <div className="flex items-center space-x-4">
        <div className="relative md:hidden">
          <motion.button 
            onClick={() => setIsMobileMenuOpen(o => !o)} 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }} 
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
            aria-label="Toggle mobile menu"
          >
            <User size={24} />
          </motion.button>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border rounded shadow-lg z-50 md:hidden"
            >
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-2">
                    <User size={20} className="text-gray-500 dark:text-gray-400"/>
                    <span className="text-sm font-medium text-gray-800 dark:text-white">{user?.name} ({user?.role})</span>
                </div>
                <motion.button 
                  onClick={logout} 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg w-full justify-center"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="relative">
          <motion.button onClick={() => setOpen(o => !o)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`relative text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white ${unreadCount ? 'animate-pulse' : ''}`}>
            <Bell size={24} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">{unreadCount}</span>}
          </motion.button>
          {open && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 border rounded shadow-lg z-50">
              <div className="p-2">
                <div className="text-sm font-semibold">Notifications</div>
                <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
                  {notifications.length === 0 && <div className="text-sm text-gray-500 p-2">No notifications</div>}
                  {notifications.map(n => (
                    <div key={n._id} className={`p-2 rounded ${n.read ? '' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                      <div className="text-sm">{n.message}</div>
                      <div className="text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</div>
                      {!n.read && <button className="text-xs text-blue-600 mt-1" onClick={async () => { await apiMarkNotificationRead(n._id); fetchNotifications(); }}>Mark read</button>}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
        <div className="hidden md:flex items-center space-x-2">
            <User size={24} className="text-gray-500 dark:text-gray-400"/>
            <span className="text-sm font-medium text-gray-800 dark:text-white">{user?.name} ({user?.role})</span>
        </div>
        <motion.button 
          onClick={logout} 
          whileHover={{ scale: 1.1 }} 
          whileTap={{ scale: 0.9 }}
          className="hidden md:flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 bg-red-100 dark:bg-red-900/50 rounded-lg"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </motion.button>
      </div>
    </header>
  );
};

export default Header;
