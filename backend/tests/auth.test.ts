import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/index'; // Assuming your express app is exported from index.ts
import User from '../src/models/User';
import { UserRole } from '../src/types';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = await mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with firstName and lastName', async () => {
      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toHaveProperty('firstName', 'John');
      expect(res.body.data.user).toHaveProperty('lastName', 'Doe');
      expect(res.body.data.user).toHaveProperty('email', 'john.doe@example.com');

      const dbUser = await User.findOne({ email: 'john.doe@example.com' });
      expect(dbUser).not.toBeNull();
      expect(dbUser?.firstName).toBe('John');
    });

    it('should fail to register a user without firstName', async () => {
        const userData = {
            lastName: 'Doe',
            email: 'jane.doe@example.com',
            password: 'password123',
        };

        const res = await request(app)
            .post('/api/auth/register')
            .send(userData);

        expect(res.status).toBe(500); // Mongoose validation error
        expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a user to test login
      const user = new User({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123',
        role: UserRole.Student,
      });
      await user.save();
    });

    it('should login a registered user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      expect(res.body.data.user).toHaveProperty('email', 'test@example.com');
    });

    it('should fail to login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid credentials');
    });
  });
});
