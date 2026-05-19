import { pgTable, text, integer, timestamp, serial } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interviews = pgTable("interviews", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  role: text("role").notNull(),
  level: text("level").notNull(),
  type: text("type").notNull(),
  questionCount: integer("question_count").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  interviewId: integer("interview_id").notNull(),
  text: text("text").notNull(),
  orderNum: integer("order_num").notNull(),
});

export const answers = pgTable("answers", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull(),
  userId: text("user_id").notNull(),
  answerText: text("answer_text").notNull(),
  durationSec: integer("duration_sec").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  answerId: integer("answer_id").notNull(),
  aiFeedback: text("ai_feedback").notNull(),
  score: integer("score").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});