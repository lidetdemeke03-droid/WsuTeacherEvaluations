import { Response } from 'express';
import asyncHandler from 'express-async-handler';
import { IRequest } from '../middleware/auth';
import StatsCache from '../models/StatsCache';
import { Request } from 'express';
import Report from '../models/Report';
import EvaluationResponse from '../models/EvaluationResponse';
import EvaluationPeriod from '../models/EvaluationPeriod';
import User from '../models/User';
import { EvaluationType, UserRole } from '../types';
import reportGenerator from '../utils/reportGenerator';
import { sendEmail } from '../utils/email';
import { Types } from 'mongoose';
import path from 'path';
import Course from '../models/Course';
import fs from 'fs';
import crypto from 'crypto';

// @desc    Get performance data for the current instructor
// @route   GET /api/reports/my-performance
// @access  Private (Instructor)
export const getMyPerformance = asyncHandler(async (req: IRequest, res: Response) => {
    const instructorId = req.user!._id;

    const performanceData = await StatsCache.find({ teacher: instructorId });

    if (!performanceData) {
        res.status(404);
        throw new Error('No performance data found for this instructor.');
    }

    // populate period name for frontend display
    const populated = await StatsCache.find({ teacher: instructorId }).populate('period', 'name');

    res.status(200).json({
        success: true,
        data: populated,
    });
});

// @desc    Get all reports for the current department head's department
// @route   GET /api/reports/department
// @access  Private (DepartmentHead)
export const getDepartmentReport = asyncHandler(async (req: IRequest, res: Response) => {
    const departmentId = req.user!.department;

    if (!departmentId) {
        res.status(400);
        throw new Error('User is not assigned to a department.');
    }

    const reports = await StatsCache.find({})
        .populate({
            path: 'teacher',
            model: 'User',
            match: { department: departmentId },
            select: 'firstName lastName',
        })
        .populate('period', 'name');

    const departmentReports = reports.filter(r => r.teacher);

    res.json({
        success: true,
        data: departmentReports,
    });
});

// @desc Generate reports (print or email) for a list of teachers
// @route POST /api/reports/generate
// @access Admin
export const generateReports = asyncHandler(async (req: IRequest, res: Response) => {
    const user = req.user!;
    if (!user || user.role !== UserRole.Admin) {
        res.status(403);
        throw new Error('Only admins can generate reports.');
    }

    const { teacherIds, departmentId, period, type } = req.body as { teacherIds: string[]; departmentId?: string; period: string; type: 'print' | 'email' };

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
        res.status(400);
        throw new Error('teacherIds must be a non-empty array');
    }

    const periodDoc = await EvaluationPeriod.findById(period);
    if (!periodDoc) {
        res.status(404);
        throw new Error('Evaluation period not found');
    }

    const now = new Date();
    if (periodDoc.endDate > now) {
        res.status(400);
        throw new Error('Evaluation period is still active. Reports can only be generated after the period has ended.');
    }

    const results: any[] = [];

    for (const tId of teacherIds) {
    const teacher = await User.findById(tId).select('firstName lastName email department').populate('department', 'name');
        if (!teacher) continue;

        // Try to read StatsCache first
        const stats = await StatsCache.findOne({ teacher: tId, period }).lean();

        // fallback values
        let studentAvg = stats?.studentScore ?? 0;
        let peerAvg = stats?.peerScore ?? 0;
        let deptAvg = stats?.deptHeadScore ?? 0;
        let finalScore = stats?.finalScore ?? ((studentAvg * 0.5) + (peerAvg * 0.35) + (deptAvg * 0.15));

        // respondents
        const studentRespondents = await EvaluationResponse.countDocuments({ targetTeacher: tId, period, type: EvaluationType.Student });
        const peerRespondents = await EvaluationResponse.countDocuments({ targetTeacher: tId, period, type: EvaluationType.Peer });

        // top comments: collect textual responses from evaluation answers
        const responses = await EvaluationResponse.find({ targetTeacher: tId, period }).lean();
        const studentStrengths: string[] = [];
        const studentImprovements: string[] = [];
        const peerStrengths: string[] = [];
        const peerImprovements: string[] = [];
        const deptComments: string[] = [];

        for (const r of responses) {
            const rType = r.type as EvaluationType;
            if (!r.answers) continue;
            for (const ans of r.answers) {
                const txt = ans.response && typeof ans.response === 'string' ? ans.response.trim() : '';
                if (!txt || txt.length < 10) continue;

                if (rType === EvaluationType.Student) {
                    // heuristic: sentences containing 'improve' or 'needs' considered improvements
                    if (/improv|need to|should/.test(txt.toLowerCase())) studentImprovements.push(txt);
                    else studentStrengths.push(txt);
                } else if (rType === EvaluationType.Peer) {
                    if (/improv|need to|should/.test(txt.toLowerCase())) peerImprovements.push(txt);
                    else peerStrengths.push(txt);
                } else if (rType === EvaluationType.DepartmentHead) {
                    deptComments.push(txt);
                }
            }
        }

        // Deduplicate and take top 5
        const uniq = (arr: string[]) => Array.from(new Set(arr)).slice(0, 5);

        const reportDoc = await Report.findOneAndUpdate(
            { teacherId: tId, period: periodDoc.name },
            {
                teacherId: tId,
                departmentId: departmentId ? new Types.ObjectId(departmentId) : undefined,
                period: periodDoc.name,
                periodId: periodDoc._id,
                type,
                studentAvg,
                peerAvg,
                deptAvg,
                finalScore,
                studentRespondents,
                peerRespondents,
                topComments: {
                    studentStrengths: uniq(studentStrengths),
                    studentImprovements: uniq(studentImprovements),
                    peerStrengths: uniq(peerStrengths),
                    peerImprovements: uniq(peerImprovements),
                    deptComments: uniq(deptComments),
                },
                generatedBy: user._id,
                status: 'generated',
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // Generate PDF
        // fetch courses taught by this teacher
        const courses = await Course.find({ teacher: tId }).select('title code').lean();

        const pdfPath = await reportGenerator.generatePDF(String(tId), {
            teacherName: `${(teacher as any).firstName} ${(teacher as any).lastName}`,
            departmentName: (teacher as any).department && (teacher as any).department.name ? (teacher as any).department.name : ((teacher as any).department ? String((teacher as any).department) : undefined),
            periodName: periodDoc.name,
            courses: courses.map(c => `${c.code ? c.code + ' - ' : ''}${c.title}`),
            studentAvg,
            peerAvg,
            deptAvg,
            finalScore,
            studentRespondents,
            peerRespondents,
            topComments: reportDoc.topComments,
            generatedByName: `${user.firstName} ${user.lastName}`,
        }, type);

        // generate a temporary download token valid for 24 hours
        const token = crypto.randomBytes(18).toString('hex');
        reportDoc.downloadToken = token;
        reportDoc.downloadTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        reportDoc.path = pdfPath;
        await reportDoc.save();

        // Email if required
        if (type === 'email') {
            const teacherEmail = (teacher as any).email;
            try {
                // read file buffer
                const fileBuffer = fs.readFileSync(pdfPath);
                // build download URL (public token-based)
                const host = (req as any).protocol + '://' + (req as any).get('host');
                const downloadUrl = `${host}/api/reports/download?token=${token}`;

                await sendEmail({
                    to: teacherEmail,
                    subject: `Teacher Performance Evaluation Report – ${(teacher as any).firstName} ${(teacher as any).lastName}, ${periodDoc.name}`,
                    text: `Please find attached the detailed evaluation report for ${(teacher as any).firstName} ${(teacher as any).lastName}. You can also download it here: ${downloadUrl}`,
                    html: `<p>Please find attached the detailed evaluation report for <strong>${(teacher as any).firstName} ${(teacher as any).lastName}</strong>.</p><p><a href="${downloadUrl}">Download report</a></p>`,
                    attachments: [{ filename: path.basename(pdfPath), content: fileBuffer, contentType: 'application/pdf' }]
                });
                reportDoc.status = 'sent';
                await reportDoc.save();
            } catch (e) {
                console.error('Failed to send email for report', e);
            }
        }

        results.push({ teacherId: tId, reportId: reportDoc._id, path: reportDoc.path, status: reportDoc.status });
    }

    res.status(200).json({ success: true, data: results });
});

// @desc List previous reports (filter by departmentId & period)
// @route GET /api/reports
// @access Admin
export const listReports = asyncHandler(async (req: IRequest, res: Response) => {
    const { departmentId, period } = req.query as any;
    const filter: any = {};
    if (departmentId) filter.departmentId = departmentId;
    if (period) filter.period = period;

    const reports = await Report.find(filter).populate('teacherId', 'firstName lastName email').sort({ createdAt: -1 });
    res.json({ success: true, data: reports });
});

// @desc Download report PDF
// @route GET /api/reports/:id/download
// @access Admin or owner
export const downloadReport = asyncHandler(async (req: IRequest, res: Response) => {
    const report = await Report.findById(req.params.id).lean();
    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Only admins or the generating user can download
    const user = req.user!;
    if (user.role !== UserRole.Admin && String(report.generatedBy) !== String(user._id)) {
        res.status(403);
        throw new Error('Not authorized to download this report');
    }

    if (!report.path) {
        res.status(404);
        throw new Error('Report file not available');
    }

    return res.sendFile(report.path);
});

// @desc Download report by token (no auth) - link sent via email
// @route GET /api/reports/download?token=
export const downloadReportByToken = asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query as any;
    if (!token) {
        res.status(400);
        throw new Error('Token is required');
    }

    const report = await Report.findOne({ downloadToken: token }).lean();
    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    const expires = (report as any).downloadTokenExpires;
    if (!expires || new Date(expires) < new Date()) {
        res.status(410);
        throw new Error('Download token expired');
    }

    if (!report.path) {
        res.status(404);
        throw new Error('Report file not available');
    }

    return res.sendFile(report.path);
});
