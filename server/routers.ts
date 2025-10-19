import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import {
  createVideo,
  getVideo,
  getUserVideos,
  updateVideoStatus,
  createTranscription,
  getVideoTranscription,
  updateTranscriptionStatus,
  createAnalysis,
  getVideoAnalysis,
  updateAnalysisStatus,
  createCut,
  getAnalysisCuts,
  updateCutStatus,
  getCut,
} from "./db";
import { transcribeVideo, analyzeTranscription, generateVideocuts } from "./videoProcessor";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Video management procedures
  video: router({
    // Upload and create a new video
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        fileSize: z.number(),
        duration: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const videoId = uuidv4();
        const video = await createVideo({
          id: videoId,
          userId: ctx.user.id,
          filename: input.filename,
          fileSize: input.fileSize,
          duration: input.duration,
          status: "pending",
        });
        return video;
      }),

    // Get user's videos
    list: protectedProcedure
      .query(async ({ ctx }) => {
        return getUserVideos(ctx.user.id);
      }),

    // Get a specific video
    get: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ input }) => {
        return getVideo(input.videoId);
      }),

    // Transcribe a video
    transcribe: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const video = await getVideo(input.videoId);
        if (!video) throw new Error("Video not found");
        if (video.userId !== ctx.user.id) throw new Error("Unauthorized");

        // Update video status
        await updateVideoStatus(input.videoId, "transcribing");

        const transcriptionId = uuidv4();
        const transcription = await createTranscription({
          id: transcriptionId,
          videoId: input.videoId,
          srtContent: "",
          status: "processing",
        });

        // Start transcription in background
        transcribeVideo(input.videoId, video.filename, transcriptionId).catch((error) => {
          console.error("Transcription error:", error);
        });

        return transcription;
      }),

    // Analyze transcription
    analyze: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const video = await getVideo(input.videoId);
        if (!video) throw new Error("Video not found");
        if (video.userId !== ctx.user.id) throw new Error("Unauthorized");

        const transcription = await getVideoTranscription(input.videoId);
        if (!transcription) throw new Error("Transcription not found");

        const analysisId = uuidv4();
        const analysis = await createAnalysis({
          id: analysisId,
          videoId: input.videoId,
          transcriptionId: transcription.id,
          status: "processing",
        });

        // Start analysis in background
        analyzeTranscription(input.videoId, transcription.id, analysisId, transcription.srtContent).catch((error) => {
          console.error("Analysis error:", error);
        });

        return analysis;
      }),

    // Get analysis results
    getAnalysis: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .query(async ({ ctx, input }) => {
        const video = await getVideo(input.videoId);
        if (!video) throw new Error("Video not found");
        if (video.userId !== ctx.user.id) throw new Error("Unauthorized");

        const analysis = await getVideoAnalysis(input.videoId);
        if (!analysis) return null;

        const cutsList = await getAnalysisCuts(analysis.id);
        const cutsData = analysis.cutsData ? JSON.parse(analysis.cutsData) : [];

        return {
          ...analysis,
          cuts: cutsList,
          cutsData,
        };
      }),

    // Generate cuts from analysis
    generateCuts: protectedProcedure
      .input(z.object({ videoId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const video = await getVideo(input.videoId);
        if (!video) throw new Error("Video not found");
        if (video.userId !== ctx.user.id) throw new Error("Unauthorized");

        const analysis = await getVideoAnalysis(input.videoId);
        if (!analysis) throw new Error("Analysis not found");

        // Start cut generation in background
        generateVideocuts(input.videoId, video.filename, analysis.id).catch((error) => {
          console.error("Cut generation error:", error);
        });

        // Get cuts from analysis
        const cutsList = await getAnalysisCuts(analysis.id);
        return cutsList;
      }),

    // Get cut details
    getCut: protectedProcedure
      .input(z.object({ cutId: z.string() }))
      .query(async ({ ctx, input }) => {
        // TODO: Verify user ownership
        const cut = await getCut(input.cutId);
        return cut;
      }),
  }),
});

export type AppRouter = typeof appRouter;

