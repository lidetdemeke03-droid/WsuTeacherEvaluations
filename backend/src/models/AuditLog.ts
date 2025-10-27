import { Schema, model } from 'mongoose';
import { IAuditLog, LogLevel } from '../types';

const auditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  level: { type: String, enum: Object.values(LogLevel), required: true },
  details: { type: Schema.Types.Mixed },
}, { timestamps: true });

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
