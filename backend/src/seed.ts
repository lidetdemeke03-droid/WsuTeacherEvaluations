import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { seedAdminUser } from './utils/seeder';

const seedDB = async () => {
    await connectDB();
    console.log('Running the seeder...');

    try {
        await seedAdminUser();
        console.log('Database seeding complete!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
