import { Router } from "express";
import { db } from "../db";
import { interviews, questions, answers, feedback } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

router.get("/user/:userId/insights", async (req, res) => {
  try {
    const { userId } = req.params;

    const userInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId));

    if (userInterviews.length === 0) {
      return res.json({ noData: true });
    }

    const interviewIds = userInterviews.map((i) => i.id);
    const allQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.interviewId, interviewIds));

    const questionIds = allQuestions.map((q) => q.id);
    const allAnswers = questionIds.length > 0
      ? await db.select().from(answers).where(inArray(answers.questionId, questionIds))
      : [];

    const answerIds = allAnswers.map((a) => a.id);
    const allFeedback = answerIds.length > 0
      ? await db.select().from(feedback).where(inArray(feedback.answerId, answerIds))
      : [];

    if (allFeedback.length === 0) {
      return res.json({ noData: true });
    }

    // Feedback summary banao Groq er jonno
    const feedbackSummary = allFeedback.map((f, i) => {
      const answer = allAnswers.find((a) => a.id === f.answerId);
      const question = allQuestions.find((q) => q.id === answer?.questionId);
      return `Q${i + 1}: ${question?.text || "Unknown"}\nScore: ${f.score}/10\nFeedback: ${f.aiFeedback}`
    }).join("\n\n")

    const { generateInsights } = await import("../grok");
    const insights = await generateInsights(feedbackSummary);

    res.json(insights);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate insights" });
  }
});

// GET user interview stats — total, avg score, best score
router.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;

    const userInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId));

    const totalInterviews = userInterviews.length;

    if (totalInterviews === 0) {
      return res.json({ totalInterviews: 0, avgScore: 0, bestScore: 0 });
    }

    const interviewIds = userInterviews.map((i) => i.id);
    const allQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.interviewId, interviewIds));

    if (allQuestions.length === 0) {
      return res.json({ totalInterviews, avgScore: 0, bestScore: 0 });
    }

    const questionIds = allQuestions.map((q) => q.id);
    const allAnswers = await db
      .select()
      .from(answers)
      .where(inArray(answers.questionId, questionIds));

    if (allAnswers.length === 0) {
      return res.json({ totalInterviews, avgScore: 0, bestScore: 0 });
    }

    const answerIds = allAnswers.map((a) => a.id);
    const allFeedback = await db
      .select()
      .from(feedback)
      .where(inArray(feedback.answerId, answerIds));

    if (allFeedback.length === 0) {
      return res.json({ totalInterviews, avgScore: 0, bestScore: 0 });
    }

    const interviewScores = userInterviews.map((interview) => {
      const iQuestions = allQuestions.filter((q) => q.interviewId === interview.id);
      const iAnswerIds = allAnswers
        .filter((a) => iQuestions.some((q) => q.id === a.questionId))
        .map((a) => a.id);
      const iFeedback = allFeedback.filter((f) => iAnswerIds.includes(f.answerId));

      if (iFeedback.length === 0) return null;

      const avgRaw = iFeedback.reduce((sum, f) => sum + f.score, 0) / iFeedback.length;
      return Math.round((avgRaw / 10) * 100);
    }).filter((s): s is number => s !== null);

    const avgScore = interviewScores.length > 0
      ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewScores.length)
      : 0;

    const bestScore = interviewScores.length > 0
      ? Math.max(...interviewScores)
      : 0;

    res.json({ totalInterviews, avgScore, bestScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// GET recent interviews with scores
router.get("/user/:userId/recent", async (req, res) => {
  try {
    const { userId } = req.params;

    const userInterviews = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId));

    if (userInterviews.length === 0) return res.json([]);

    const interviewIds = userInterviews.map((i) => i.id);
    const allQuestions = await db
      .select()
      .from(questions)
      .where(inArray(questions.interviewId, interviewIds));

    const questionIds = allQuestions.map((q) => q.id);
    const allAnswers = questionIds.length > 0
      ? await db.select().from(answers).where(inArray(answers.questionId, questionIds))
      : [];

    const answerIds = allAnswers.map((a) => a.id);
    const allFeedback = answerIds.length > 0
      ? await db.select().from(feedback).where(inArray(feedback.answerId, answerIds))
      : [];

    const result = userInterviews.map((interview) => {
      const iQuestions = allQuestions.filter((q) => q.interviewId === interview.id);
      const iAnswers = allAnswers.filter((a) => iQuestions.some((q) => q.id === a.questionId));
      const iFeedback = allFeedback.filter((f) => iAnswers.some((a) => a.id === f.answerId));

      const score = iFeedback.length > 0
        ? Math.round((iFeedback.reduce((sum, f) => sum + f.score, 0) / iFeedback.length / 10) * 100)
        : null;

      return {
        id: interview.id,
        role: interview.role,
        level: interview.level,
        type: interview.type,
        createdAt: interview.createdAt,
        score,
      };
    })
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 5);

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recent interviews" });
  }
});

// GET all interviews for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db
      .select()
      .from(interviews)
      .where(eq(interviews.userId, userId));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// GET questions for an interview
router.get("/:interviewId/questions", async (req, res) => {
  try {
    const { interviewId } = req.params;
    const result = await db
      .select()
      .from(questions)
      .where(eq(questions.interviewId, parseInt(interviewId)))
      .orderBy(questions.orderNum);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch questions" });
  }
});

// POST create new interview
router.post("/", async (req, res) => {
  try {
    const { userId, role, level, type, questionCount } = req.body;
    const result = await db
      .insert(interviews)
      .values({ userId, role, level, type, questionCount })
      .returning();
    res.json(result[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to create interview" });
  }
});

export default router;