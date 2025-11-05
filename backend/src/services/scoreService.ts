import StatsCache from '../models/StatsCache';

// Define weights
const WEIGHTS = {
  student: 0.50,
  peer: 0.35,
  deptHead: 0.15,
};

/**
 * Calculates the normalized score for a set of answers.
 * @param answers - The array of answers from an evaluation.
 * @param totalQuestions - The total number of rating questions in the form.
 * @returns The normalized score (0-100).
 */
export const calculateNormalizedScore = (answers: any[], totalQuestions: number): number => {
  const ratedAnswers = answers.filter(a => typeof a.score === 'number' && a.score !== -1);
  if (ratedAnswers.length === 0) {
    return 0;
  }

  const sumOfRatings = ratedAnswers.reduce((sum, a) => sum + a.score, 0);
  const maxPossibleScore = ratedAnswers.length * 5;

  return (sumOfRatings / maxPossibleScore) * 100;
};

/**
 * Recalculates the final score in the StatsCache based on available normalized scores.
 * @param stats - The StatsCache document to update.
 */
export const recalculateFinalScore = async (statsId: any) => {
    const stats = await StatsCache.findById(statsId);
    if (!stats) return;

    let totalWeight = 0;
    let weightedScoreSum = 0;

    if (stats.studentScore > 0) {
        totalWeight += WEIGHTS.student;
        weightedScoreSum += stats.studentScore * WEIGHTS.student;
    }
    if (stats.peerScore > 0) {
        totalWeight += WEIGHTS.peer;
        weightedScoreSum += stats.peerScore * WEIGHTS.peer;
    }
    if (stats.deptHeadScore > 0) {
        totalWeight += WEIGHTS.deptHead;
        weightedScoreSum += stats.deptHeadScore * WEIGHTS.deptHead;
    }

    stats.finalScore = totalWeight > 0 ? weightedScoreSum / totalWeight : 0;
    stats.lastUpdated = new Date();
    await stats.save();
};
