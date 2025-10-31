import User from '../models/User';
import { UserRole } from '../types';
import bcrypt from 'bcryptjs';

export const seedAdminUser = async () => {
    try {
        const adminExists = await User.findOne({ email: 'admin@wsu.edu' });

        if (!adminExists) {
            console.log('Admin user not found. Creating a new one...');

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password', salt);

            await User.create({
                firstName: 'Demo',
                lastName: 'Admin',
                email: 'admin@wsu.edu',
                password: hashedPassword,
                role: UserRole.Admin,
                isActive: true,
            });
            console.log('Admin user created successfully.');
        } else {
            console.log('Admin user already exists. Seeding not required.');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};
