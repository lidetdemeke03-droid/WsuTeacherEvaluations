
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LayoutDashboard, Users, Building, Calendar, FileText, BarChart2, MessageSquare, FileDown, GraduationCap, ClipboardList, Home, X, UserCircle, FilePlus2, BarChart3 } from 'lucide-react';

type SidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

const navLinkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200";
const activeLinkClasses = "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold";

const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user } = useAuth();
  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case UserRole.SuperAdmin:
        return [
            { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
            { to: "/superadmin/admins", icon: <Users size={20} />, label: "Manage Admins" },
        ];
      case UserRole.Admin:
        return [
          { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { to: "/admin/users", icon: <Users size={20} />, label: "Manage Users" },
          { to: "/admin/courses", icon: <GraduationCap size={20} />, label: "Manage Courses" },
          { to: "/admin/departments", icon: <Building size={20} />, label: "Manage Departments" },
          { to: "/admin/periods", icon: <Calendar size={20} />, label: "Evaluation Periods" },
          { to: "/admin/criteria", icon: <ClipboardList size={20} />, label: "Manage Criteria" },
          { to: "/complaints", icon: <MessageSquare size={20} />, label: "Complaints" },
          { to: "/reports", icon: <FileDown size={20} />, label: "Reports" },
        ];
      case UserRole.DepartmentHead:
        return [
          { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { to: "/instructor/results", icon: <BarChart3 size={20} />, label: "Instructors Result" },
          { to: "/evaluation/new", icon: <FilePlus2 size={20} />, label: "Make Evaluation" },
        ];
      case UserRole.Teacher:
        return [
          { to: "/dashboard", icon: <Home size={20} />, label: "Home" },
          { to: "/evaluation/new", icon: <FilePlus2 size={20} />, label: "Make Evaluation" },
          { to: "/peer/reviews", icon: <Users size={20} />, label: "Peer Reviews" },
          { to: "/profile", icon: <UserCircle size={20} />, label: "Manage Profile" },
          { to: "/instructor/performance", icon: <BarChart2 size={20} />, label: "My Performance" },
        ];
      case UserRole.Student:
        return [
          { to: "/dashboard", icon: <Home size={20} />, label: "Home" },
          { to: "/student/evaluations", icon: <FileText size={20} />, label: "My Evaluations" },
          { to: "/profile", icon: <UserCircle size={20} />, label: "Manage Profile" },
        ];
      default:
        return [];
    }
  };
  
  const links = getNavLinks();

  return (
    <>
      <aside className="hidden md:flex w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <GraduationCap className="text-blue-600 dark:text-blue-400" size={32} />
          <span className="text-xl font-bold">WSU</span>
        </div>
        <nav className="flex-1 space-y-2">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
            >
              {link.icon}
              <span className="ml-3">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className={`md:hidden fixed inset-0 z-40 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
        {/* backdrop */}
        <div
          className={`absolute inset-0 bg-black bg-opacity-40 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={onClose}
        />

        <aside className={`absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 p-4 transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <GraduationCap className="text-blue-600 dark:text-blue-400" size={28} />
              <span className="text-lg font-bold">WSU</span>
            </div>
            <button onClick={onClose} aria-label="Close sidebar" className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
              <X size={20} className="text-gray-700 dark:text-gray-200" />
            </button>
          </div>
          <nav className="flex-1 space-y-2">
            {links.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) => `${navLinkClasses} ${isActive ? activeLinkClasses : ''}`}
              >
                {link.icon}
                <span className="ml-3">{link.label}</span>
              </NavLink>
            ))}
          </nav>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
