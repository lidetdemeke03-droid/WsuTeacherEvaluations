import mongoose from 'mongoose';
import dotenv from 'dotenv';

if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
} else {
    dotenv.config();
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI as string);
        if (process.env.NODE_ENV !== 'test') {
            console.log('MongoDB connected');
        }
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

export { connectDB, disconnectDB };
