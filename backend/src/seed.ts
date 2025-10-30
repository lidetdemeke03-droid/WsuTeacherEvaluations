import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import User from './models/User';
import Department from './models/Department';
import Course from './models/Course';
import EvaluationForm from './models/EvaluationForm';
import Question from './models/Question';
import { UserRole } from './types';
import bcrypt from 'bcryptjs';

const seedDB = async () => {
    await connectDB();
    console.log('Seeding database...');

    try {
        // Check if the admin user already exists
        let adminUser = await User.findOne({ email: 'admin@wsu.edu' });

        if (!adminUser) {
            console.log('Admin user not found. Creating a new one...');

            // Hash the password before creating the user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password', salt);

            adminUser = await User.create({
                firstName: 'Demo',
                lastName: 'Admin',
                email: 'admin@wsu.edu',
                password: hashedPassword,
                role: UserRole.Admin,
                isActive: true,
            });
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists.');
        }

        console.log('Database seeding complete!');

    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
