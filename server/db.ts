import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, videos, transcriptions, analyses, cuts, Video, Transcription, Analysis, Cut, InsertVideo, InsertTranscription, InsertAnalysis, InsertCut } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.id) {
    throw new Error("User ID is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      id: user.id,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role === undefined) {
      if (user.id === ENV.ownerId) {
        user.role = 'admin';
        values.role = 'admin';
        updateSet.role = 'admin';
      }
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUser(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== Video Queries =====
export async function createVideo(video: InsertVideo): Promise<Video> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(videos).values(video);
  const result = await db.select().from(videos).where(eq(videos.id, video.id)).limit(1);
  return result[0];
}

export async function getVideo(id: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserVideos(userId: string): Promise<Video[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(videos).where(eq(videos.userId, userId));
}

export async function updateVideoStatus(videoId: string, status: Video["status"], errorMessage?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  
  await db.update(videos).set(updateData).where(eq(videos.id, videoId));
}

export async function updateVideoProgress(videoId: string, transcriptionProgress?: number, analysisProgress?: number, cuttingProgress?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (transcriptionProgress !== undefined) updateData.transcriptionProgress = transcriptionProgress;
  if (analysisProgress !== undefined) updateData.analysisProgress = analysisProgress;
  if (cuttingProgress !== undefined) updateData.cuttingProgress = cuttingProgress;
  
  await db.update(videos).set(updateData).where(eq(videos.id, videoId));
}

// ===== Transcription Queries =====
export async function createTranscription(transcription: InsertTranscription): Promise<Transcription> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(transcriptions).values(transcription);
  const result = await db.select().from(transcriptions).where(eq(transcriptions.id, transcription.id)).limit(1);
  return result[0];
}

export async function getTranscription(id: string): Promise<Transcription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(transcriptions).where(eq(transcriptions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideoTranscription(videoId: string): Promise<Transcription | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(transcriptions).where(eq(transcriptions.videoId, videoId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTranscriptionStatus(transcriptionId: string, status: Transcription["status"], errorMessage?: string, progress?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  if (progress !== undefined) updateData.progress = progress;
  
  await db.update(transcriptions).set(updateData).where(eq(transcriptions.id, transcriptionId));
}

// ===== Analysis Queries =====
export async function createAnalysis(analysis: InsertAnalysis): Promise<Analysis> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(analyses).values(analysis);
  const result = await db.select().from(analyses).where(eq(analyses.id, analysis.id)).limit(1);
  return result[0];
}

export async function getAnalysis(id: string): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(analyses).where(eq(analyses.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getVideoAnalysis(videoId: string): Promise<Analysis | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(analyses).where(eq(analyses.videoId, videoId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateAnalysisStatus(analysisId: string, status: Analysis["status"], errorMessage?: string, cutsData?: string, totalCuts?: number, progress?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  if (cutsData) updateData.cutsData = cutsData;
  if (totalCuts !== undefined) updateData.totalCuts = totalCuts;
  if (progress !== undefined) updateData.progress = progress;
  
  await db.update(analyses).set(updateData).where(eq(analyses.id, analysisId));
}

// ===== Cut Queries =====
export async function createCut(cut: InsertCut): Promise<Cut> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.insert(cuts).values(cut);
  const result = await db.select().from(cuts).where(eq(cuts.id, cut.id)).limit(1);
  return result[0];
}

export async function getCut(id: string): Promise<Cut | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(cuts).where(eq(cuts.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAnalysisCuts(analysisId: string): Promise<Cut[]> {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(cuts).where(eq(cuts.analysisId, analysisId));
}

export async function updateCutStatus(cutId: string, status: Cut["status"], errorMessage?: string, outputPath?: string, progress?: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  const updateData: Record<string, unknown> = { status, updatedAt: new Date() };
  if (errorMessage) updateData.errorMessage = errorMessage;
  if (outputPath) updateData.outputPath = outputPath;
  if (progress !== undefined) updateData.progress = progress;
  
  await db.update(cuts).set(updateData).where(eq(cuts.id, cutId));
}

