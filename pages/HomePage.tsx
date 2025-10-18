import React, { useState, useEffect } from 'react';
// FIX: Import Variants type from framer-motion
import { motion, useAnimation, Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { GraduationCap, Users, FileText, BarChart2, ShieldCheck, TrendingUp, Zap, ArrowRight } from 'lucide-react';

// Import the local PNG file located in the same folder as this file
import WSU_LOGO from './Wolaita_Sodo_University_Logo-removebg-preview.png';

// Mock URLs for images - in a real app, these would be in an assets folder.
const HERO_BG_URL = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop';

// FIX: Add explicit Variants type to the cardVariants object.
const cardVariants: Variants = {
  offscreen: { y: 50, opacity: 0 },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      bounce: 0.4,
      duration: 0.8
    }
  }
};

const FeatureCard = ({ icon, title, text, index }: { icon: React.ReactNode, title: string, text: string, index: number }) => (
    <motion.div 
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg text-center"
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.5 }}
        variants={cardVariants}
        custom={index}
    >
        <div className="mx-auto bg-blue-100 dark:bg-blue-900/50 rounded-full h-16 w-16 flex items-center justify-center mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{text}</p>
    </motion.div>
);


const HomePage: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        { icon: <FileText className="text-blue-500" size={32}/>, title: "Students Provide Feedback", text: "Students securely log in to complete detailed, criteria-based evaluations for their instructors." },
        { icon: <BarChart2 className="text-blue-500" size={32}/>, title: "Instructors View Performance", text: "Instructors access personalized dashboards to view their evaluation results and track performance over time." },
        { icon: <Users className="text-blue-500" size={32}/>, title: "Admins Gain Insights", text: "Administrators and department heads analyze comprehensive data to make informed decisions." },
    ];

    const benefits = [
        { icon: <Zap className="text-green-500"/>, title: "Streamlined Process", text: "Automate and simplify the entire evaluation lifecycle, saving time and reducing administrative overhead." },
        { icon: <TrendingUp className="text-green-500"/>, title: "Data-Driven Decisions", text: "Leverage powerful analytics to identify trends, reward excellence, and support faculty development." },
        { icon: <ShieldCheck className="text-green-500"/>, title: "Secure & Confidential", text: "Ensure the integrity and confidentiality of all evaluation data with our role-based access control system." },
    ];


    return (
        <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            {/* Header */}
            <motion.header 
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-md' : 'bg-transparent'}`}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                        <img src={WSU_LOGO} alt="WSU Logo" className="h-12" />
                        <span className="text-xl font-bold text-gray-800 dark:text-white">Wolaita Sodo University</span>
                    </div>
                    <Link to="/login">
                        <motion.button 
                            className="bg-blue-600 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Login
                        </motion.button>
                    </Link>
                </div>
            </motion.header>

            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center text-white" style={{ backgroundImage: `url(${HERO_BG_URL})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="relative z-10 text-center px-4">
                    <motion.h1 
                        className="text-5xl md:text-7xl font-extrabold mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        Shape the Future of Education
                    </motion.h1>
                    <motion.p 
                        className="text-lg md:text-xl max-w-3xl mx-auto mb-8 text-gray-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        A seamless, transparent, and efficient evaluation system for Wolaita Sodo University. Empowering students, instructors, and administration.
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <Link to="/login" className="bg-white text-blue-600 font-bold text-lg px-8 py-4 rounded-full inline-flex items-center space-x-2 hover:bg-gray-200 transition-colors shadow-lg">
                            <span>Get Started</span>
                            <ArrowRight />
                        </Link>
                    </motion.div>
                </div>
            </section>
            
            {/* How It Works Section */}
            <section className="py-24 bg-white dark:bg-gray-900">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">A Simple, Powerful Process</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">Our system simplifies teacher evaluations into three straightforward steps.</p>
                    <div className="grid md:grid-cols-3 gap-10">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} index={index} {...feature} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-gray-50 dark:bg-gray-800/50">
                <div className="container mx-auto px-6">
                    <div className="text-center">
                         <h2 className="text-4xl font-bold mb-4 text-gray-800 dark:text-white">Why Choose Our System?</h2>
                         <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-16">Unlock a new level of efficiency and insight in academic performance management.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 text-gray-800 dark:text-gray-200">
                        {benefits.map((benefit, i) => (
                            <motion.div 
                                key={i}
                                className="flex items-start space-x-4 p-4"
                                initial="offscreen"
                                whileInView="onscreen"
                                viewport={{ once: true, amount: 0.5 }}
                                variants={cardVariants}
                            >
                                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                                    {benefit.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold">{benefit.title}</h3>
                                    <p className="mt-1 text-gray-600 dark:text-gray-400">{benefit.text}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-800 dark:bg-gray-900 text-white py-8">
                <div className="container mx-auto px-6 text-center">
                    <p>&copy; {new Date().getFullYear()} Wolaita Sodo University. All Rights Reserved.</p>
                    <p className="text-sm text-gray-400 mt-2">Teacher Evaluation & Performance Management System</p>
                </div>
            </footer>
        </div>
    );
};

export default HomePage;
