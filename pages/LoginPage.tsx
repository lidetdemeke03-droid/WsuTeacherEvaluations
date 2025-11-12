import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@wsu.edu');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => navigate('/');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-gray-100 to-blue-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl ring-1 ring-gray-100 dark:ring-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={goBack}
            aria-label="Go back to homepage"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
          </button>
        </div>

        {/* Logo + Title */}
        <div className="text-center mb-6">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="inline-flex justify-center"
          >
            <GraduationCap className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </motion.div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
            WSU Evaluation System
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        {/* Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                placeholder="Enter your email"
              />
            </div>
<div className="relative">
  <label
    htmlFor="password"
    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
  >
    Password
  </label>
  <input
    id="password"
    type={showPassword ? 'text' : 'password'}
    required
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-3 py-3 pr-10 rounded-lg border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
    placeholder="Enter your password"
  />
  <button
    type="button"
    onClick={() => setShowPassword((s) => !s)}
    aria-label={showPassword ? 'Hide password' : 'Show password'}
    className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center text-gray-500 dark:text-gray-300 hover:text-blue-500"
  >
    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
  </button>
</div>
</div>

          {error && (
            <p className="text-sm text-center text-red-500 font-medium">
              {error}
            </p>
          )}

          {/* Login Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default LoginPage;
