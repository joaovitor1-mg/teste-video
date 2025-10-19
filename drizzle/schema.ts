import { mysqlEnum, mysqlTable, text, timestamp, varchar, int, boolean } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabela para armazenar vídeos enviados pelos usuários
 */
export const videos = mysqlTable("videos", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: varchar("userId", { length: 64 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileSize: int("fileSize").notNull(), // em bytes
  duration: int("duration"), // em segundos
  status: mysqlEnum("status", ["pending", "transcribing", "analyzing", "ready", "error"]).default("pending").notNull(),
  transcriptionProgress: int("transcriptionProgress").default(0), // 0-100
  analysisProgress: int("analysisProgress").default(0), // 0-100
  cuttingProgress: int("cuttingProgress").default(0), // 0-100
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = typeof videos.$inferInsert;

/**
 * Tabela para armazenar transcrições de vídeos
 */
export const transcriptions = mysqlTable("transcriptions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  srtContent: text("srtContent").notNull(), // Conteúdo do arquivo SRT
  progress: int("progress").default(0), // 0-100
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Transcription = typeof transcriptions.$inferSelect;
export type InsertTranscription = typeof transcriptions.$inferInsert;

/**
 * Tabela para armazenar análises de transcrições
 */
export const analyses = mysqlTable("analyses", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  transcriptionId: varchar("transcriptionId", { length: 64 }).notNull(),
  cutsData: text("cutsData"), // JSON com os cortes identificados
  totalCuts: int("totalCuts").default(0),
  progress: int("progress").default(0), // 0-100
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;

/**
 * Tabela para armazenar vídeos cortados
 */
export const cuts = mysqlTable("cuts", {
  id: varchar("id", { length: 64 }).primaryKey(),
  videoId: varchar("videoId", { length: 64 }).notNull(),
  analysisId: varchar("analysisId", { length: 64 }).notNull(),
  cutNumber: int("cutNumber").notNull(),
  startTime: int("startTime").notNull(), // em segundos
  endTime: int("endTime").notNull(), // em segundos
  textPreview: text("textPreview"),
  outputPath: varchar("outputPath", { length: 255 }), // Caminho do arquivo de saída
  progress: int("progress").default(0), // 0-100
  status: mysqlEnum("status", ["pending", "processing", "completed", "error"]).default("pending").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

export type Cut = typeof cuts.$inferSelect;
export type InsertCut = typeof cuts.$inferInsert;
