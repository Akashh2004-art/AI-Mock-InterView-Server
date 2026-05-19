import { Router } from "express";
import { db } from "../db";
import { answers, questions } from "../db/schema";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// POST save answer
router.post("/", async (req, res) => {
  try {
    const { questionId, userId, answerText, durationSec } = req.body;

    const [answer] = await db
      .insert(answers)
      .values({
        questionId: parseInt(questionId),
        userId,
        answerText,
        durationSec: durationSec || 0,
      })
      .returning();

    res.json(answer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to save answer" });
  }
});

// GET /api/answers/interview/:interviewId
// FeedbackPage er jonno — question text + answer text + answer id
router.get("/interview/:interviewId", async (req, res) => {
  try {
    const interviewId = parseInt(req.params.interviewId as string);

    // Interview er sob questions fetch
    const interviewQuestions = await db
      .select()
      .from(questions)
      .where(eq(questions.interviewId, interviewId));

    if (interviewQuestions.length === 0) {
      return res.json([]);
    }

    const questionIds = interviewQuestions.map((q) => q.id);

    // Oi questions er answers fetch
    const interviewAnswers = await db
      .select()
      .from(answers)
      .where(inArray(answers.questionId, questionIds));

    // Combine — answer id, question text, answer text
    const result = interviewAnswers.map((ans) => {
      const question = interviewQuestions.find((q) => q.id === ans.questionId);
      return {
        id: ans.id,
        questionText: question?.text || "",
        answerText: ans.answerText,
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch answers" });
  }
});

export default router;