import mongoose from 'mongoose';
import { seedAdminUser } from '../utils/seeder';

mongoose.set('strictQuery', true);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Run the seeder once after connection
    await seedAdminUser();

  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};
