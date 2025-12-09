import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

type BackButtonProps = {
  className?: string;
};

const BackButton: React.FC<BackButtonProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render on the login page
  if (location.pathname === '/login') return null;

  const handleBack = () => {
    try {
      // Prefer history back; fallback to home if no history
      if (window.history.length > 2) {
        navigate(-1);
      } else {
        navigate('/');
      }
    } catch (e) {
      navigate('/');
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`md:hidden mr-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      aria-label="Go back"
      title="Back"
    >
      <ArrowLeft size={20} className="text-gray-700 dark:text-gray-200" />
    </button>
  );
};

export default BackButton;
