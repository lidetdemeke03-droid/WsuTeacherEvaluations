import { Schema, model, Document } from 'mongoose';
import { IUser } from './User';
import { ICourse } from './Course';
import { IEvaluationPeriod } from './EvaluationPeriod';

export interface IEvaluation extends Document {
    student: IUser['_id'];
    course: ICourse['_id'];
    teacher: IUser['_id'];
    period: IEvaluationPeriod['_id'];
    status: 'Pending' | 'Completed';
}

const evaluationSchema = new Schema({
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    teacher: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    period: { type: Schema.Types.ObjectId, ref: 'EvaluationPeriod', required: true },
    status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' },
});

export default model<IEvaluation>('Evaluation', evaluationSchema);
