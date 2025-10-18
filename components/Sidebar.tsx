
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { LayoutDashboard, Users, Building, Calendar, FileText, BarChart2, MessageSquare, FileDown, GraduationCap, ClipboardList, Home } from 'lucide-react';

const navLinkClasses = "flex items-center px-4 py-3 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200";
const activeLinkClasses = "bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-semibold";

const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const getNavLinks = () => {
    switch (user.role) {
      case UserRole.Admin:
        return [
          { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { to: "/admin/users", icon: <Users size={20} />, label: "Manage Users" },
          { to: "/admin/departments", icon: <Building size={20} />, label: "Manage Departments" },
          { to: "/admin/periods", icon: <Calendar size={20} />, label: "Evaluation Periods" },
          { to: "/admin/criteria", icon: <ClipboardList size={20} />, label: "Manage Criteria" },
          { to: "/complaints", icon: <MessageSquare size={20} />, label: "Complaints" },
          { to: "/reports", icon: <FileDown size={20} />, label: "Reports" },
        ];
      case UserRole.DepartmentHead:
        return [
          { to: "/dashboard", icon: <LayoutDashboard size={20} />, label: "Dashboard" },
          { to: "/admin/criteria", icon: <ClipboardList size={20} />, label: "Manage Criteria" },
          { to: "/complaints", icon: <MessageSquare size={20} />, label: "Complaints" },
          { to: "/reports", icon: <FileDown size={20} />, label: "Reports" },
        ];
      case UserRole.Instructor:
        return [
          { to: "/dashboard", icon: <Home size={20} />, label: "Home" },
          { to: "/instructor/performance", icon: <BarChart2 size={20} />, label: "My Performance" },
          { to: "/complaints", icon: <MessageSquare size={20} />, label: "Complaints" },
        ];
      case UserRole.Student:
        return [
          { to: "/dashboard", icon: <Home size={20} />, label: "Home" },
          { to: "/student/evaluations", icon: <FileText size={20} />, label: "My Evaluations" },
          { to: "/complaints", icon: <MessageSquare size={20} />, label: "Complaints" },
        ];
      default:
        return [];
    }
  };
  
  const links = getNavLinks();

  return (
    <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
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
  );
};

export default Sidebar;
