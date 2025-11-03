import User from '../models/User';
import Question from '../models/Question';
import EvaluationForm from '../models/EvaluationForm';
import { UserRole, QuestionType } from '../types';
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

export const seedEvaluationForms = async () => {
    try {
        const formExists = await EvaluationForm.findOne({ formCode: 'STUDENT_EVAL_V1' });
        if (formExists) {
            console.log('Evaluation forms already exist. Seeding not required.');
            return;
        }

        console.log('Creating evaluation questions and forms...');

        const questions = [
            // Student Questions
            { code: 'STU_Q1', text: 'Gives course outline and references at beginning', type: QuestionType.Rating },
            { code: 'STU_Q2', text: 'Offers lab/practical sessions when applicable', type: QuestionType.Rating },
            { code: 'STU_Q3', text: 'Punctual for class', type: QuestionType.Rating },
            { code: 'STU_Q4', text: 'Well prepared and organized', type: QuestionType.Rating },
            { code: 'STU_Q5', text: 'Strong subject matter knowledge', type: QuestionType.Rating },
            { code: 'STU_Q6', text: 'Clear delivery of topics', type: QuestionType.Rating },
            { code: 'STU_Q7', text: 'Encourages participation and questions', type: QuestionType.Rating },
            { code: 'STU_Q8', text: 'Fully covers course outline', type: QuestionType.Rating },
            { code: 'STU_Q9', text: 'Relates topics to real-world', type: QuestionType.Rating },
            { code: 'STU_Q10', text: 'Informs grading criteria early', type: QuestionType.Rating },
            { code: 'STU_Q11', text: 'Creates interest in the subject', type: QuestionType.Rating },
            { code: 'STU_Q12', text: 'Returns assessments on time', type: QuestionType.Rating },
            { code: 'STU_Q13', text: 'Writes key points clearly', type: QuestionType.Rating },
            { code: 'STU_Q14', text: 'Uses relevant instructional aids', type: QuestionType.Rating },
            { code: 'STU_Q15', text: 'Uses continuous assessment', type: QuestionType.Rating },
            { code: 'STU_Q16', text: 'Available for consultation', type: QuestionType.Rating },
            { code: 'STU_Q17', text: 'Considers differences among learners', type: QuestionType.Rating },
            { code: 'STU_Q18', text: 'Exams reflect topics covered', type: QuestionType.Rating },
            { code: 'STU_Q19', text: 'Demonstrates discipline and professionalism', type: QuestionType.Rating },
            { code: 'STU_S1', text: 'Strengths', type: QuestionType.Text },
            { code: 'STU_S2', text: 'Areas for improvement', type: QuestionType.Text },

            // Peer Teacher Questions
            { code: 'PEER_Q1', text: 'Prepares and updates teaching materials', type: QuestionType.Rating },
            { code: 'PEER_Q2', text: 'Updates subject matter continuously', type: QuestionType.Rating },
            { code: 'PEER_Q3', text: 'Demonstrates subject expertise', type: QuestionType.Rating },
            { code: 'PEER_Q4', text: 'Engages in research & community services', type: QuestionType.Rating },
            { code: 'PEER_Q5', text: 'Participates in seminars/workshops', type: QuestionType.Rating },
            { code: 'PEER_Q6', text: 'Collaborates with colleagues', type: QuestionType.Rating },
            { code: 'PEER_Q7', text: 'Teamwork attitude', type: QuestionType.Rating },
            { code: 'PEER_Q8', text: 'Advising and supporting students', type: QuestionType.Rating },
            { code: 'PEER_Q9', text: 'Contributes to improving teaching-learning', type: QuestionType.Rating },
            { code: 'PEER_Q10', text: 'Preparedness for new teaching methods', type: QuestionType.Rating },
            { code: 'PEER_Q11', text: 'Ethical & respectful behavior', type: QuestionType.Rating },
            { code: 'PEER_Q12', text: 'Follows institutional regulations', type: QuestionType.Rating },
            { code: 'PEER_Q13', text: 'Demonstrates professionalism', type: QuestionType.Rating },
            { code: 'PEER_Q14', text: 'Time management & consultation hours', type: QuestionType.Rating },
            { code: 'PEER_S1', text: 'Strengths', type: QuestionType.Text },
            { code: 'PEER_S2', text: 'Areas for improvement', type: QuestionType.Text },

            // Department Head Questions
            { code: 'DEPT_Q1', text: 'Course plan quality', type: QuestionType.Rating },
            { code: 'DEPT_Q2', text: 'Assessment strategy compliance', type: QuestionType.Rating },
            { code: 'DEPT_Q3', text: 'Documentation submission', type: QuestionType.Rating },
            { code: 'DEPT_Q4', text: 'Collaboration with department', type: QuestionType.Rating },
            { code: 'DEPT_Q5', text: 'Professional behavior', type: QuestionType.Rating },
            { code: 'DEPT_Q6', text: 'Punctuality & scheduling', type: QuestionType.Rating },
            { code: 'DEPT_Q7', text: 'Contribution to curriculum development', type: QuestionType.Rating },
            { code: 'DEPT_Q8', text: 'Supports institutional goals', type: QuestionType.Rating },
            { code: 'DEPT_Q9', text: 'Participation in committees', type: QuestionType.Rating },
            { code: 'DEPT_Q10', text: 'Communication with staff', type: QuestionType.Rating },
            { code: 'DEPT_S1', text: 'Strengths', type: QuestionType.Text },
            { code: 'DEPT_S2', text: 'Improvement Needed', type: QuestionType.Text },
        ];

        const createdQuestions = await Question.insertMany(questions);
        const questionMap = new Map(createdQuestions.map(q => [q.code, q._id]));

        const forms = [
            {
                formCode: 'STUDENT_EVAL_V1',
                title: 'Student Evaluation of Teacher',
                isDefault: true,
                questions: questions.filter(q => q.code.startsWith('STU_')).map(q => questionMap.get(q.code))
            },
            {
                formCode: 'PEER_EVAL_V1',
                title: 'Peer Teacher Evaluation Form',
                questions: questions.filter(q => q.code.startsWith('PEER_')).map(q => questionMap.get(q.code))
            },
            {
                formCode: 'DEPT_HEAD_EVAL_V1',
                title: 'Department Head Evaluation Form',
                questions: questions.filter(q => q.code.startsWith('DEPT_')).map(q => questionMap.get(q.code))
            }
        ];

        await EvaluationForm.insertMany(forms);
        console.log('Successfully seeded evaluation forms and questions.');

    } catch (error) {
        console.error('Error seeding evaluation forms:', error);
    }
};
