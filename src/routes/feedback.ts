import { Router, Request, Response } from "express";
import { db } from "../db/index";
import { feedback, questions, answers } from "../db/schema";
import { evaluateAnswer } from "../grok";
import { eq, inArray } from "drizzle-orm";

const router = Router();

// POST /api/feedback
router.post("/", async (req: Request, res: Response) => {
    try {
        const { answer_id, question_text, answer_text } = req.body;

        if (!answer_id || !question_text || !answer_text) {
            return res.status(400).json({ error: "answer_id, question_text, answer_text required" });
        }

        const { feedback: aiFeedback, score } = await evaluateAnswer(question_text, answer_text);

        const [saved] = await db
            .insert(feedback)
            .values({
                answerId: answer_id,
                aiFeedback: aiFeedback,
                score,
            })
            .returning();

        res.json(saved);
    } catch (err) {
        console.error("Feedback error:", err);
        res.status(500).json({ error: "Failed to generate feedback" });
    }
});

// GET /api/feedback/interview/:interviewId
router.get("/interview/:interviewId", async (req: Request, res: Response) => {
    try {
        const interviewId = parseInt(req.params.interviewId as string);

        const interviewQuestions = await db
            .select()
            .from(questions)
            .where(eq(questions.interviewId, interviewId));

        if (interviewQuestions.length === 0) {
            return res.json([]);
        }

        const questionIds = interviewQuestions.map((q) => q.id);

        const interviewAnswers = await db
            .select()
            .from(answers)
            .where(inArray(answers.questionId, questionIds));

        if (interviewAnswers.length === 0) {
            return res.json([]);
        }

        const answerIds = interviewAnswers.map((a) => a.id);

        const feedbackRows = await db
            .select()
            .from(feedback)
            .where(inArray(feedback.answerId, answerIds));

        const result = interviewQuestions.map((q) => {
            const answer = interviewAnswers.find((a) => a.questionId === q.id);
            const fb = feedbackRows.find((f) => f.answerId === answer?.id);
            return {
                question: q.text,
                answer: answer?.answerText || null,
                feedback: fb?.aiFeedback || null,
                score: fb?.score || null,
            };
        });

        res.json(result);
    } catch (err) {
        console.error("Get feedback error:", err);
        res.status(500).json({ error: "Failed to fetch feedback" });
    }
});

export default router;