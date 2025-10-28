import Evaluation from '../models/EvaluationResponse';
import mongoose from 'mongoose';

export const getInstructorReportData = async (instructorId: mongoose.Types.ObjectId, from?: Date, to?: Date, groupBy?: 'week' | 'month') => {
    const dateFilter: any = {};
    if (from) dateFilter.$gte = from;
    if (to) dateFilter.$lte = to;

    const pipeline: mongoose.PipelineStage[] = [
        {
            $match: {
                instructor: instructorId,
                ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
            }
        },
        { $unwind: '$scores' },
    ];

    if (groupBy) {
        pipeline.push({
            $group: {
                _id: {
                    criterion: '$scores.criterion',
                    year: { $year: '$createdAt' },
                    ...(groupBy === 'month' && { month: { $month: '$createdAt' } }),
                    ...(groupBy === 'week' && { week: { $week: '$createdAt' } }),
                },
                averageScore: { $avg: '$scores.score' },
            }
        }, {
            $sort: { '_id.year': 1, ...((groupBy === 'month') && { '_id.month': 1 }), ...((groupBy === 'week') && { '_id.week': 1 }) }
        });
    } else {
        pipeline.push({
            $group: {
                _id: '$scores.criterion',
                averageScore: { $avg: '$scores.score' },
                count: { $sum: 1 }
            }
        });
    }

    pipeline.push(
        {
            $lookup: {
                from: 'criteria',
                localField: '_id.criterion',
                foreignField: '_id',
                as: 'criterion'
            }
        },
        { $unwind: '$criterion' },
        {
            $project: {
                _id: 0,
                criterion: '$criterion.text',
                averageScore: { $round: ['$averageScore', 2] },
                ...(groupBy && {
                    year: '$_id.year',
                    ...(groupBy === 'month' && { month: '$_id.month' }),
                    ...(groupBy === 'week' && { week: '$_id.week' }),
                }),
                ...(!groupBy && { totalResponses: '$count' })
            }
        }
    );

    const results = await Evaluation.aggregate(pipeline);
    return results;
};

export const getDepartmentReportData = async (departmentId: mongoose.Types.ObjectId) => {
    const pipeline: mongoose.PipelineStage[] = [
        // Step 1: Find all evaluations linked to instructors in the specified department
        {
            $lookup: {
                from: 'users', // The collection name for Users
                localField: 'instructor',
                foreignField: '_id',
                as: 'instructorInfo'
            }
        },
        { $unwind: '$instructorInfo' },
        { $match: { 'instructorInfo.department': departmentId } },

        // Step 2: Unwind scores to process them individually
        { $unwind: '$scores' },

        // Step 3: Group by instructor to calculate average score
        {
            $group: {
                _id: '$instructorInfo._id',
                instructorName: { $first: '$instructorInfo.name' },
                averageScore: { $avg: '$scores.score' },
                totalEvaluations: { $sum: 1 } // This counts scores, not unique evaluations
            }
        },
         // Step 4: Refine the output
        {
            $project: {
                _id: 0,
                instructorId: '$_id',
                instructorName: '$instructorName',
                averageScore: { $round: ['$averageScore', 2] },
            }
        },
        { $sort: { averageScore: -1 } }
    ];

    const results = await Evaluation.aggregate(pipeline);
    return results;
};

export const getInstructorRatingDistribution = async (instructorId: mongoose.Types.ObjectId) => {
    const pipeline: mongoose.PipelineStage[] = [
        { $match: { instructor: instructorId } },
        { $unwind: '$scores' },
        {
            $group: {
                _id: '$scores.score',
                count: { $sum: 1 }
            }
        },
        { $sort: { '_id': 1 } },
        {
            $project: {
                _id: 0,
                rating: '$_id',
                count: '$count'
            }
        }
    ];

    const results = await Evaluation.aggregate(pipeline);
    return results;
}
