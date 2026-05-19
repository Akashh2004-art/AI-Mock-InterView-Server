import { Router } from "express";
import multer from "multer";
import { generateInterviewQuestions, detectRoleFromResume } from "../grok";
import { db } from "../db";
import { interviews, questions } from "../db/schema";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// PDF text extract using pdfjs-dist
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as any);
  
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(" ");
    fullText += pageText + "\n";
  }
  
  return fullText.trim();
}

// Normal Interview
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { userId, role, level, type, questionCount } = req.body;

    let resumeText = ""
    if (req.file) {
      try {
        resumeText = await extractPdfText(req.file.buffer)
        console.log("Resume extracted — chars:", resumeText.length)
      } catch (e) {
        console.error("PDF parse failed:", e)
        resumeText = ""
      }
    }

    const generatedQuestions = await generateInterviewQuestions(
      role, level, type, parseInt(questionCount), resumeText
    )

    const [interview] = await db
      .insert(interviews)
      .values({ userId, role, level, type, questionCount: parseInt(questionCount) })
      .returning()

    const questionInserts = generatedQuestions.map((q, i) => ({
      interviewId: interview.id, text: q, orderNum: i + 1,
    }))

    await db.insert(questions).values(questionInserts)
    res.json({ interviewId: interview.id, questions: generatedQuestions })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to generate questions" })
  }
})

// Resume Interview — auto detect role
router.post("/resume", upload.single("resume"), async (req, res) => {
  try {
    const { userId, level, type, questionCount } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Resume file is required!" })
    }

    let resumeText = ""
    try {
      resumeText = await extractPdfText(req.file.buffer)
      console.log("Resume extracted — chars:", resumeText.length)
    } catch (e) {
      console.error("PDF extract failed:", e)
      return res.status(400).json({ error: "Failed to read PDF. Please upload a valid PDF file!" })
    }

    if (!resumeText || resumeText.length < 50) {
      return res.status(400).json({ error: "Could not extract text from PDF. Please make sure your PDF contains readable text!" })
    }

    const detectedRole = await detectRoleFromResume(resumeText)
    console.log("Detected role:", detectedRole)

    const generatedQuestions = await generateInterviewQuestions(
      detectedRole, level, type, parseInt(questionCount), resumeText
    )

    const [interview] = await db
      .insert(interviews)
      .values({ userId, role: detectedRole, level, type, questionCount: parseInt(questionCount) })
      .returning()

    const questionInserts = generatedQuestions.map((q, i) => ({
      interviewId: interview.id, text: q, orderNum: i + 1,
    }))

    await db.insert(questions).values(questionInserts)
    res.json({
      interviewId: interview.id,
      questions: generatedQuestions,
      detectedRole,
    })

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Failed to generate questions" })
  }
})

export default router