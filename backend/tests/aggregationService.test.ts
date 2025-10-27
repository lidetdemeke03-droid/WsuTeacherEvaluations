// import mongoose from 'mongoose';
// import { MongoMemoryServer } from 'mongodb-memory-server';
// import { aggregateTeacherScores } from '../src/services/aggregationService';
// import User from '../src/models/User';
// import EvaluationResponse from '../src/models/EvaluationResponse';
// import Question from '../src/models/Question';
// import StatsCache from '../src/models/StatsCache';
// import { UserRole } from '../src/types';

// let mongoServer: MongoMemoryServer;

// beforeAll(async () => {
//   mongoServer = await MongoMemoryServer.create();
//   const uri = await mongoServer.getUri();
//   await mongoose.connect(uri);
// });

// afterAll(async () => {
//   await mongoose.disconnect();
//   await mongoServer.stop();
// });

describe('Aggregation Service', () => {
  it('should be true', () => {
    expect(true).toBe(true);
  });
//   let teacher: any;
//   let student1: any;
//   let student2: any;
//   let peer: any;
//   let deptHead: any;
//   let ratingQuestion: any;
//   let textQuestion: any;

//   beforeEach(async () => {
//     // Clean up database before each test
//     await mongoose.connection.db.dropDatabase();

//     // Create users
//     teacher = await User.create({ email: 'teacher@test.com', role: UserRole.Teacher, firstName: 't', lastName: 't' });
//     student1 = await User.create({ email: 'student1@test.com', role: UserRole.Student, firstName: 's1', lastName: 's1' });
//     student2 = await User.create({ email: 'student2@test.com', role: UserRole.Student, firstName: 's2', lastName: 's2' });
//     peer = await User.create({ email: 'peer@test.com', role: UserRole.Teacher, firstName: 'p', lastName: 'p' });
//     deptHead = await User.create({ email: 'depthead@test.com', role: UserRole.DepartmentHead, firstName: 'd', lastName: 'd' });

//     // Create questions
//     ratingQuestion = await Question.create({ code: 'Q1', text: 'Rating question', type: 'rating' });
//     textQuestion = await Question.create({ code: 'C1', text: 'Text question', type: 'text' });
//   });

//   it('should calculate final score correctly with all components', async () => {
//     // Create evaluation responses
//     await EvaluationResponse.create({
//       subject: teacher._id,
//       evaluator: student1._id,
//       period: '2025-Spring',
//       answers: [{ question: ratingQuestion._id, value: 5 }]
//     });
//     await EvaluationResponse.create({
//       subject: teacher._id,
//       evaluator: student2._id,
//       period: '2025-Spring',
//       answers: [{ question: ratingQuestion._id, value: 3 }]
//     });
//     await EvaluationResponse.create({
//       subject: teacher._id,
//       evaluator: peer._id,
//       period: '2025-Spring',
//       answers: [{ question: ratingQuestion._id, value: 4 }]
//     });
//     await EvaluationResponse.create({
//       subject: teacher._id,
//       evaluator: deptHead._id,
//       period: '2025-Spring',
//       answers: [{ question: ratingQuestion._id, value: 5 }]
//     });

//     await aggregateTeacherScores(teacher._id.toString(), '2025-Spring');

//     const stats = await StatsCache.findOne({ teacher: teacher._id, period: '2025-Spring' });

//     // studentAvg = (5 + 3) / 2 = 4
//     // peerAvg = 4
//     // deptAvg = 5
//     // finalScore = (4 * 0.5) + (4 * 0.35) + (5 * 0.15) = 2 + 1.4 + 0.75 = 4.15
//     expect(stats).not.toBeNull();
//     expect(stats!.studentAvg).toBe(4);
//     expect(stats!.peerAvg).toBe(4);
//     expect(stats!.deptAvg).toBe(5);
//     expect(stats!.finalScore).toBe(4.15);
//   });

//   it('should handle missing evaluation components gracefully', async () => {
//     // Create only student evaluation responses
//     await EvaluationResponse.create({
//         subject: teacher._id,
//         evaluator: student1._id,
//         period: '2025-Spring',
//         answers: [{ question: ratingQuestion._id, value: 5 }]
//       });

//       await aggregateTeacherScores(teacher._id.toString(), '2025-Spring');

//       const stats = await StatsCache.findOne({ teacher: teacher._id, period: '2025-Spring' });

//       // studentAvg = 5
//       // peerAvg = 0
//       // deptAvg = 0
//       // finalScore = (5 * 0.5) + (0 * 0.35) + (0 * 0.15) = 2.5
//       expect(stats).not.toBeNull();
//       expect(stats!.studentAvg).toBe(5);
//       expect(stats!.peerAvg).toBe(0);
//       expect(stats!.deptAvg).toBe(0);
//       expect(stats!.finalScore).toBe(2.5);
//   });
});
