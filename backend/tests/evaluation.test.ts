import request from 'supertest';
import { app, server } from '../src/index';
import mongoose from 'mongoose';
import User from '../src/models/User';
import Course from '../src/models/Course';
import Evaluation from '../src/models/evaluationModel';
import EvaluationResponse from '../src/models/EvaluationResponse';
import StatsCache from '../src/models/StatsCache';

beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || '');
});

afterAll(async () => {
    await mongoose.connection.close();
    server.close();
});

describe('Evaluation API', () => {
    let student: any;
    let teacher: any;
    let course: any;
    let token: string;
    let adminToken: string;

    beforeEach(async () => {
        // Create an admin user for assigning evaluations
        await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@test.com',
            role: 'admin',
            password: 'password123',
        });

        // Create a student, teacher, and course for testing
        await User.create({
            firstName: 'Test',
            lastName: 'Student',
            email: 'student@test.com',
            role: 'student',
            password: 'password123',
        });
        student = await User.findOne({ email: 'student@test.com' });

        teacher = await User.create({
            firstName: 'Test',
            lastName: 'Teacher',
            email: 'teacher@test.com',
            role: 'teacher',
        });

        course = await Course.create({
            title: 'Test Course',
            code: 'TEST101',
            teacher: teacher._id,
            students: [student._id],
        });

        // Generate tokens
        const adminRes = await request(app).post('/api/auth/login').send({
            email: 'admin@test.com',
            password: 'password123',
        });
        adminToken = adminRes.body.data.token;

        const studentRes = await request(app).post('/api/auth/login').send({
            email: 'student@test.com',
            password: 'password123',
        });
        token = studentRes.body.data.token;
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Course.deleteMany({});
        await Evaluation.deleteMany({});
        await EvaluationResponse.deleteMany({});
        await StatsCache.deleteMany({});
    });

    it('should complete the full evaluation flow', async () => {
        // 1. Assign an evaluation to the student
        await request(app)
            .post('/api/evaluations/assign')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                student: student._id,
                courseId: course._id,
                teacherId: teacher._id,
            });

        // 2. Fetch assigned evaluations for the student
        const assignedRes = await request(app)
            .get(`/api/evaluations/assigned?studentId=${student._id}`)
            .set('Authorization', `Bearer ${token}`);
        expect(assignedRes.status).toBe(200);
        expect(assignedRes.body.data.length).toBe(1);

        // 3. Submit the evaluation
        const submissionRes = await request(app)
            .post('/api/evaluations/student')
            .set('Authorization', `Bearer ${token}`)
            .send({
                courseId: course._id,
                teacherId: teacher._id,
                period: '2025-Fall',
                answers: [
                    { questionId: new mongoose.Types.ObjectId(), score: 5 },
                    { questionId: new mongoose.Types.ObjectId(), score: 4 },
                ],
            });
        expect(submissionRes.status).toBe(201);
        expect(submissionRes.body.success).toBe(true);
        expect(submissionRes.body.data.totalScore).toBe(4.5);

        // 4. Verify the StatsCache was updated
        const stats = await StatsCache.findOne({
            teacher: teacher._id,
            course: course._id,
            period: '2025-Fall',
        });
        expect(stats).not.toBeNull();
        expect(stats?.studentScore).toBe(90); // (4.5 / 5) * 100
    });
});
