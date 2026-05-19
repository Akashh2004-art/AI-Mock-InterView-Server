import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function generateInterviewQuestions(
  role: string,
  level: string,
  type: string,
  questionCount: number,
  resumeText?: string
): Promise<string[]> {
  const prompt = `
You are an expert interviewer. Generate exactly ${questionCount} interview questions for the following:

Job Role: ${role}
Experience Level: ${level}
Interview Type: ${type}
${resumeText ? `Candidate Resume: ${resumeText}` : ""}

Rules:
- Return ONLY a valid JSON array of strings
- No extra text, no markdown, no explanation
- Each question should be specific to the role and level
- Example format: ["Question 1?", "Question 2?", "Question 3?"]

Generate ${questionCount} questions now:
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content || "[]";
  const cleaned = text.replace(/```json|```/g, "").trim();
  const questions: string[] = JSON.parse(cleaned);
  return questions;
}

export async function detectRoleFromResume(resumeText: string): Promise<string> {
  const prompt = `
Analyze this resume and detect the most suitable job role for this candidate.
Return ONLY the job role as a short string (e.g. "Frontend Engineer", "Backend Developer", "Data Scientist").
No explanation, no extra text — just the role name.

Resume:
${resumeText.slice(0, 3000)}
`
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  })

  return response.choices[0]?.message?.content?.trim() || "Software Engineer"
}



export async function evaluateAnswer(
  question: string,
  answer: string
): Promise<{ feedback: string; score: number }> {
  const prompt = `
You are an expert interview coach. Evaluate this interview answer.

Question: ${question}
Answer: ${answer}

Rules:
- Return ONLY a valid JSON object
- No extra text, no markdown, no explanation
- Format: {"feedback": "your detailed feedback here", "score": 7}
- score must be a number between 1 and 10
- feedback should be 2-3 sentences: what was good, what to improve

Evaluate now:
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const text = response.choices[0]?.message?.content || '{"feedback":"Could not evaluate.","score":5}';
  const cleaned = text.replace(/```json|```/g, "").trim();
  const result = JSON.parse(cleaned);
  return result;
}



export async function generateInsights(
  feedbackSummary: string
): Promise<{
  overallAnalysis: string
  strongAreas: string[]
  weakAreas: string[]
  tips: string[]
}> {
  const prompt = `
You are an expert interview coach. Analyze this candidate's interview performance data and provide insights.

Performance Data:
${feedbackSummary}

Rules:
- Return ONLY a valid JSON object
- No extra text, no markdown, no explanation
- Format exactly:
{
  "overallAnalysis": "2-3 sentence overall performance summary",
  "strongAreas": ["area 1", "area 2", "area 3"],
  "weakAreas": ["area 1", "area 2", "area 3"],
  "tips": ["actionable tip 1", "actionable tip 2", "actionable tip 3"]
}

Analyze now:
`;

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
  });

  const text = response.choices[0]?.message?.content || "{}";
  const cleaned = text.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}