import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  teacherId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
  period: { type: String, required: true },
  periodId: { type: Schema.Types.ObjectId, ref: 'EvaluationPeriod' },
  type: { type: String, enum: ['print', 'email'], required: true },
  path: { type: String },
  studentAvg: { type: Number },
  peerAvg: { type: Number },
  deptAvg: { type: Number },
  finalScore: { type: Number },
  studentRespondents: { type: Number, default: 0 },
  peerRespondents: { type: Number, default: 0 },
  topComments: {
    studentStrengths: [{ type: String }],
    studentImprovements: [{ type: String }],
    peerStrengths: [{ type: String }],
    peerImprovements: [{ type: String }],
    deptComments: [{ type: String }]
  },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['generated', 'sent'], default: 'generated' },
  createdAt: { type: Date, default: Date.now }
});

reportSchema.index({ teacherId: 1, period: 1 }, { unique: true });

const Report = model('Report', reportSchema);

export default Report;
