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

const studentEvaluationForm = {
  formCode: "STU-2025-DEFAULT",
  title: "Student Teaching Evaluation - Computer Science",
  anonymous: true,
  questions: [
    {"code":"Q1","text":"The instructor gives course outline with objectives and reading list","type":"rating","weight":1},
    {"code":"Q2","text":"The instructor offers laboratory and/or practical for the course","type":"rating","weight":1},
    {"code":"Q3","text":"The instructor is punctual for class","type":"rating","weight":1},
    {"code":"Q4","text":"The instructor is well prepared and organized for the class","type":"rating","weight":1},
    {"code":"Q5","text":"The instructor has subject matter knowledge","type":"rating","weight":1},
    {"code":"Q6","text":"The instructor delivers the subject matter clearly","type":"rating","weight":1},
    {"code":"Q7","text":"The instructor motivates students to raise questions and express ideas","type":"rating","weight":1},
    {"code":"Q8","text":"The instructor covers topics in the course outline in given time","type":"rating","weight":1},
    {"code":"Q9","text":"The instructor relates course to real-world examples","type":"rating","weight":1},
    {"code":"Q10","text":"The instructor informs students the basis of grading","type":"rating","weight":1},
    {"code":"Q11","text":"The instructor attempts to create interest in the subject","type":"rating","weight":1},
    {"code":"Q12","text":"The instructor returns checked papers on time","type":"rating","weight":1},
    {"code":"Q13","text":"The instructor writes important points on the board","type":"rating","weight":1},
    {"code":"Q14","text":"The instructor uses appropriate instructional teaching aids","type":"rating","weight":1},
    {"code":"Q15","text":"The instructor uses continuous assessment (quizzes, assignments, projects)","type":"rating","weight":1},
    {"code":"Q16","text":"The instructor is available for consultation","type":"rating","weight":1},
    {"code":"Q17","text":"The instructor considers individual differences in teaching","type":"rating","weight":1},
    {"code":"Q18","text":"Exam coverage is consistent with topics covered","type":"rating","weight":1},
    {"code":"Q19","text":"The instructor is disciplined and acts as role model","type":"rating","weight":1},
    {"code":"C1","text":"What are the strengths of the instructor?","type":"text"},
    {"code":"C2","text":"Suggest points the instructor should improve","type":"text"}
  ]
};

const peerEvaluationForm = {
    formCode: "PEER-2025-DEFAULT",
    title: "Peer Teaching Evaluation - General",
    anonymous: true,
    questions: [
        {"code":"P1","text":"The instructor demonstrates strong subject matter expertise.","type":"rating"},
        {"code":"P2","text":"Course materials are well-organized and relevant.","type":"rating"},
        {"code":"P3","text":"The instructor uses effective and varied teaching methods.","type":"rating"},
        {"code":"P4","text":"Assessments and grading are fair and align with learning objectives.","type":"rating"},
        {"code":"P5","text":"The instructor provides timely and constructive feedback.","type":"rating"},
        {"code":"P6","text":"The instructor fosters an inclusive and respectful classroom environment.","type":"rating"},
        {"code":"P7","text":"The instructor is accessible to students for consultation.","type":"rating"},
        {"code":"P8","text":"The instructor contributes positively to departmental goals.","type":"rating"},
        {"code":"PC1","text":"Strengths of the instructor's teaching.","type":"text"},
        {"code":"PC2","text":"Areas for professional development or improvement.","type":"text"}
    ]
};

const departmentHeadEvaluationForm = {
  formCode:"DEPT-2025-DEFAULT",
  title:"Department Head Evaluation (Short)",
  anonymous": false,
  questions:[
    {"code":"D1","text":"Overall teaching effectiveness (clarity, preparation)","type":"rating"},
    {"code":"D2","text":"Contribution to curriculum and course planning","type":"rating"},
    {"code":"D3","text":"Mentoring and student advising effectiveness","type":"rating"},
    {"code":"D4","text":"Participation in departmental responsibilities","type":"rating"},
    {"code":"D5","text":"Professional behavior & ethics","type":"rating"},
    {"code":"D6","text":"Time management & consultation availability","type":"rating"},
    {"code":"DC1","text":"Overall comments","type":"text"}
  ]
};

const seedDB = async () => {
    await connectDB();
    console.log('Seeding database...');

    try {
        // Clear existing data
        await Promise.all([
            User.deleteMany({}),
            Department.deleteMany({}),
            Course.deleteMany({}),
            EvaluationForm.deleteMany({}),
            Question.deleteMany({}),
        ]);

        // Create Departments
        const csDept = await Department.create({ name: 'Computer Science', code: 'CS' });
        const mathDept = await Department.create({ name: 'Mathematics', code: 'MATH' });

        // Create Questions and Forms
        const createFormWithQuestions = async (formData) => {
            const questionIds = await Question.insertMany(formData.questions).then(docs => docs.map(d => d._id));
            return EvaluationForm.create({ ...formData, questions: questionIds });
        };

        await Promise.all([
            createFormWithQuestions(studentEvaluationForm),
            createFormWithQuestions(peerEvaluationForm),
            createFormWithQuestions(departmentHeadEvaluationForm),
        ]);

        // Create Users
        const superadmin = await User.create({
            firstName: 'Super', lastName: 'Admin', email: 'superadmin@test.com',
            password: 'Password123!', role: UserRole.SuperAdmin, department: csDept._id
        });
        const deptHead = await User.create({
            firstName: 'Dept', lastName: 'Head', email: 'depthead@test.com',
            password: 'Password123!', role: UserRole.DepartmentHead, isDeptHead: true, department: csDept._id
        });
        const teacher1 = await User.create({
            firstName: 'John', lastName: 'Doe', email: 'teacher1@test.com',
            password: 'Password123!', role: UserRole.Teacher, department: csDept._id
        });
        const teacher2 = await User.create({
            firstName: 'Jane', lastName: 'Smith', email: 'teacher2@test.com',
            password: 'Password123!', role: UserRole.Teacher, department: mathDept._id
        });
        const student1 = await User.create({
            firstName: 'Alice', lastName: 'Wonder', email: 'student1@test.com',
            password: 'Password123!', role: UserRole.Student, department: csDept._id
        });
        const student2 = await User.create({
            firstName: 'Bob', lastName: 'Builder', email: 'student2@test.com',
            password: 'Password123!', role: UserRole.Student, department: csDept._id
        });


        // Create Courses and Assign
        await Course.create({
            title: 'Intro to Programming', code: 'CS101', department: csDept._id,
            teacher: teacher1._id, students: [student1._id, student2._id]
        });
        await Course.create({
            title: 'Calculus I', code: 'MATH101', department: mathDept._id,
            teacher: teacher2._id, students: [student1._id]
        });


        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    } finally {
        mongoose.connection.close();
    }
};

seedDB();
