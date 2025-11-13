import { Request, Response } from 'express';
import { IRequest } from '../middleware/auth';
import User from '../models/User';
import Department from '../models/Department';
import Course from '../models/Course';
import PeerAssignment from '../models/PeerAssignment';
import StatsCache from '../models/StatsCache';
import EvaluationResponse from '../models/EvaluationResponse'; // Added
import Complaint from '../models/Complaint'; // Added
import { UserRole, ComplaintStatus } from '../types'; // Modified
import crypto from 'crypto';
import { sendEmail } from '../utils/email';
import { aggregateTeacherScores } from '../services/aggregationService';
import { addAggregationJob } from '../jobs/queue';

// @desc    Create a new user
// @route   POST /api/admin/users
// @access  Admin, SuperAdmin
export const createUser = async (req: IRequest, res: Response) => {
  const { firstName, lastName, email, role, department, employeeId, studentId, isDeptHead } = req.body;

  // Prevent non-superadmins from creating Admin or SuperAdmin users via this endpoint
  if (role === UserRole.Admin || role === UserRole.SuperAdmin) {
    if (!req.user || req.user.role !== UserRole.SuperAdmin) {
      return res.status(403).json({ success: false, error: 'Only SuperAdmin can create Admin or SuperAdmin users via this endpoint.' });
    }
  }

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      role,
      department,
      employeeId,
      studentId,
      isActive: true, // Default to active
    });

    // Send welcome email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const setPasswordUrl = `${frontendUrl}/reset-password/${resetToken}`;
    const message = `Hello ${firstName},

An account has been created for you on the Wolaita Sodo University Evaluation System.

Role: ${role}
Please set your password and complete your profile by clicking the link below. This link will expire in 48 hours.

Set password: ${setPasswordUrl}

If you did not expect this email, please contact the admin at ${process.env.ADMIN_EMAIL}.

Regards,
Wolaita Sodo University — IT Services`;

    await sendEmail({
      to: user.email,
      subject: 'Welcome to Wolaita Sodo University Evaluation System — Set your password',
      text: message,
    });

    res.status(201).json({ success: true, data: {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Recompute teacher scores
// @route   POST /api/admin/reports/teacher/:id/recompute
// @access  Admin, SuperAdmin
export const recomputeTeacherScores = async (req: Request, res: Response) => {
  const { id: teacherId } = req.params;
  const { period } = req.body;

  if (!period) {
    return res.status(400).json({ success: false, error: 'Period is required' });
  }

  try {
    await addAggregationJob(teacherId, period);

    res.status(202).json({ success: true, message: 'Score re-computation has been queued.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get teacher report
// @route   GET /api/admin/reports/teacher/:id
// @access  Admin, SuperAdmin
export const getTeacherReport = async (req: Request, res: Response) => {
  const { id: teacherId } = req.params;
  const { period } = req.query;

  try {
    const query: any = { teacher: teacherId };
    if (period) {
      query.period = period;
    }

    const stats = await StatsCache.find(query);

    if (!stats || stats.length === 0) {
      // In a real implementation, you might want to trigger a re-computation here
      // For now, we'll just return a 404
      return res.status(404).json({ success: false, error: 'No statistics found for this teacher and period' });
    }

    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};


// @desc    Create a peer assignment
// @route   POST /api/admin/assignments/peer
// @access  Admin, SuperAdmin
export const createPeerAssignment = async (req: Request, res: Response) => {
  const { evaluatorId, evaluateeId, courseId, period } = req.body;

  try {
    // Validate that evaluator and evaluatee are students
    const evaluator = await User.findById(evaluatorId);
    if (!evaluator || evaluator.role !== UserRole.Student) {
      return res.status(400).json({ success: false, error: 'Evaluator must be a student' });
    }

    const evaluatee = await User.findById(evaluateeId);
    if (!evaluatee || evaluatee.role !== UserRole.Student) {
      return res.status(400).json({ success: false, error: 'Evaluatee must be a student' });
    }

    // Validate that both students are in the same course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }
    if (!course.students.includes(evaluatorId) || !course.students.includes(evaluateeId)) {
      return res.status(400).json({ success: false, error: 'Both students must be enrolled in the course' });
    }

    const assignment = await PeerAssignment.create({
      evaluator: evaluatorId,
      evaluatee: evaluateeId,
      course: courseId,
      period,
    });

    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Bulk import users from CSV
// @route   POST /api/admin/users/import
// @access  Admin, SuperAdmin
export const importUsers = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No CSV file uploaded' });
  }

  const results: any[] = [];
  const requiredHeaders = ['firstName', 'lastName', 'email', 'role', 'departmentCode'];

  // Basic CSV parsing (a more robust library like 'csv-parser' is recommended for production)
  const csvData = req.file.buffer.toString('utf-8');
  const rows = csvData.split('\n');
  const headers = rows[0].split(',').map(h => h.trim());

  // Check for required headers
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return res.status(400).json({ success: false, error: `Missing required CSV headers: ${missingHeaders.join(', ')}` });
  }

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i].split(',').map(r => r.trim());
    if (row.length !== headers.length) continue; // Skip malformed rows

    const userData: any = {};
    headers.forEach((header, index) => {
      userData[header] = row[index];
    });

    results.push(userData);
  }

  // At this point, `results` contains an array of user objects.
  // You would typically loop through `results` and create each user in the database.
  // For this example, we'll just return the parsed data.
  // In a real implementation, you would add the user creation logic here,
  // similar to the `createUser` function, but adapted for bulk operations.

  res.status(200).json({ success: true, data: { importedCount: results.length, users: results } });
};

// @desc    Assign a teacher to a course
// @route   PUT /api/admin/courses/:id/assign-teacher
// @access  Admin, SuperAdmin
export const assignTeacherToCourse = async (req: Request, res: Response) => {
  const { teacherId } = req.body;
  const { id: courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, error: 'Course not found' });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== UserRole.Teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found or user is not a teacher' });
    }

    course.teacher = teacher._id;
    await course.save();

    res.status(200).json({ success: true, data: course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Admin, SuperAdmin
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDepartments = await Department.countDocuments();
    const totalEvaluations = await EvaluationResponse.countDocuments();
    const openComplaints = await Complaint.countDocuments({ status: ComplaintStatus.New });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalDepartments,
        totalEvaluations,
        openComplaints,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Get evaluations by department for pie chart
// @route   GET /api/admin/dashboard/evaluations-by-department
// @access  Admin, SuperAdmin
export const getEvaluationsByDepartment = async (req: Request, res: Response) => {
  try {
    const evaluationsByDepartment = await EvaluationResponse.aggregate([
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'courseInfo',
        },
      },
      {
        $unwind: '$courseInfo',
      },
      {
        $lookup: {
          from: 'departments',
          localField: 'courseInfo.department',
          foreignField: '_id',
          as: 'departmentInfo',
        },
      },
      {
        $unwind: '$departmentInfo',
      },
      {
        $group: {
          _id: '$departmentInfo.name',
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0,
        },
      },
    ]);

    res.status(200).json({ success: true, data: evaluationsByDepartment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
