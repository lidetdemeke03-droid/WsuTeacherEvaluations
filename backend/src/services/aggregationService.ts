import EvaluationResponse from '../models/EvaluationResponse';
import StatsCache from '../models/StatsCache';
import User from '../models/User';
import { UserRole } from '../types';

const RATING_QUESTION_TYPE = 'rating';

/**
 * Calculates the final weighted score for a teacher.
 * finalScore = round((studentAvg * 0.50) + (peerAvg * 0.35) + (deptAvg * 0.15), 2)
 */
function calculateFinalScore(studentAvg: number, peerAvg: number, deptAvg: number): number {
  const finalScore = (studentAvg * 0.50) + (peerAvg * 0.35) + (deptAvg * 0.15);
  // Round to 2 decimal places
  return Math.round(finalScore * 100) / 100;
}

/**
 * Calculates the average score from a set of evaluation responses.
 * Only considers 'rating' type questions.
 */
async function calculateAverageScore(responses: any[]): Promise<number> {
  if (responses.length === 0) {
    return 0;
  }

  let totalScore = 0;
  let ratingAnswersCount = 0;

  for (const response of responses) {
    await response.populate({
        path: 'answers.question',
        model: 'Question'
    });

    for (const answer of response.answers) {
      if (answer.question.type === RATING_QUESTION_TYPE) {
        totalScore += Number(answer.value) || 0;
        ratingAnswersCount++;
      }
    }
  }

  return ratingAnswersCount > 0 ? totalScore / ratingAnswersCount : 0;
}


/**
 * Aggregates all evaluation data for a specific teacher and period,
 * then saves the result to the StatsCache.
 */
export const aggregateTeacherScores = async (teacherId: string, period: string) => {
  // 1. Fetch all responses for the given teacher and period, separated by evaluator role
  const responses = await EvaluationResponse.find({ subject: teacherId, period }).populate('evaluator');

  const studentResponses = responses.filter(r => (r.evaluator as any).role === UserRole.Student);
  const peerResponses = responses.filter(r => (r.evaluator as any).role === UserRole.Teacher); // Assuming peers are other teachers for now
  const deptHeadResponses = responses.filter(r => (r.evaluator as any).role === UserRole.DepartmentHead);

  // 2. Calculate the average score for each category
  const studentAvg = await calculateAverageScore(studentResponses);
  const peerAvg = await calculateAverageScore(peerResponses);
  const deptAvg = await calculateAverageScore(deptHeadResponses);

  // 3. Calculate the final weighted score
  const finalScore = calculateFinalScore(studentAvg, peerAvg, deptAvg);

  // 4. Update or create the StatsCache entry
  await StatsCache.findOneAndUpdate(
    { teacher: teacherId, period },
    {
      studentAvg,
      peerAvg,
      deptAvg,
      finalScore,
      lastUpdated: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`Successfully aggregated scores for teacher ${teacherId} for period ${period}`);
};
