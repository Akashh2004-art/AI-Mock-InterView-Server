import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import interviewRoutes from "./routes/interviews";
import generateRoutes from "./routes/generate";
import answerRoutes from "./routes/answers";
import feedbackRoutes from "./routes/feedback";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "InterviewAI API running!" });
});

app.use("/api/interviews", interviewRoutes);
app.use("/api/generate", generateRoutes);
app.use("/api/answers", answerRoutes);
app.use("/api/feedback", feedbackRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});