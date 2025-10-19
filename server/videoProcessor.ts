import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import {
  updateVideoStatus,
  updateTranscriptionStatus,
  updateAnalysisStatus,
  createCut,
  updateCutStatus,
  getAnalysisCuts,
} from "./db";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const OUTPUTS_DIR = path.join(process.cwd(), "outputs");

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    await fs.mkdir(OUTPUTS_DIR, { recursive: true });
  } catch (error) {
    console.error("Error creating directories:", error);
  }
}

ensureDirectories();

/**
 * Execute a Python script and return the output
 */
function executePythonScript(script: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [script, ...args], {
      cwd: path.join(process.cwd(), "server"),
    });

    let stdout = "";
    let stderr = "";

    python.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Python script failed: ${stderr}`));
      }
    });

    python.on("error", (error) => {
      reject(error);
    });
  });
}

/**
 * Transcribe a video using Whisper
 */
export async function transcribeVideo(videoId: string, videoPath: string, transcriptionId: string) {
  try {
    await updateTranscriptionStatus(transcriptionId, "processing");

    // Create a temporary SRT file path
    const srtPath = path.join(OUTPUTS_DIR, `${videoId}.srt`);

    // Run the transcription script
    // Note: This is a placeholder. You'll need to modify transcrever.py to accept command-line arguments
    console.log(`Transcribing video: ${videoPath}`);

    // For now, we'll create a mock SRT file
    const mockSRT = `1
00:00:00,000 --> 00:00:05,000
Este é um exemplo de transcrição.

2
00:00:05,000 --> 00:00:10,000
A transcrição será gerada aqui.`;

    await fs.writeFile(srtPath, mockSRT, "utf-8");

    // Update transcription in database
    await updateTranscriptionStatus(transcriptionId, "completed");
    await updateVideoStatus(videoId, "analyzing");

    return srtPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateTranscriptionStatus(transcriptionId, "error", errorMessage);
    await updateVideoStatus(videoId, "error", errorMessage);
    throw error;
  }
}

/**
 * Analyze transcription and identify cuts
 */
export async function analyzeTranscription(
  videoId: string,
  transcriptionId: string,
  analysisId: string,
  srtPath: string
) {
  try {
    await updateAnalysisStatus(analysisId, "processing");

    // Create a temporary JSON file path for cuts
    const cutsPath = path.join(OUTPUTS_DIR, `${videoId}_cuts.json`);

    // Run the analysis script
    // Note: This is a placeholder. You'll need to modify analisar.py to accept command-line arguments
    console.log(`Analyzing transcription: ${srtPath}`);

    // For now, we'll create mock cuts data
    const mockCuts = [
      {
        start: 0,
        end: 30,
        text_preview: "Este é o primeiro corte do vídeo.",
      },
      {
        start: 35,
        end: 65,
        text_preview: "Este é o segundo corte do vídeo.",
      },
    ];

    await fs.writeFile(cutsPath, JSON.stringify(mockCuts, null, 2), "utf-8");

    // Create cut records in database
    for (let i = 0; i < mockCuts.length; i++) {
      const cut = mockCuts[i];
      const cutId = `cut_${videoId}_${i}`;

      await createCut({
        id: cutId,
        videoId,
        analysisId,
        cutNumber: i + 1,
        startTime: Math.round(cut.start),
        endTime: Math.round(cut.end),
        textPreview: cut.text_preview,
        status: "pending",
      });
    }

    // Update analysis in database
    await updateAnalysisStatus(
      analysisId,
      "completed",
      undefined,
      JSON.stringify(mockCuts),
      mockCuts.length
    );
    await updateVideoStatus(videoId, "ready");

    return cutsPath;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await updateAnalysisStatus(analysisId, "error", errorMessage);
    await updateVideoStatus(videoId, "error", errorMessage);
    throw error;
  }
}

/**
 * Generate video cuts from analysis
 */
export async function generateVideocuts(
  videoId: string,
  videoPath: string,
  analysisId: string
) {
  try {
    const cuts = await getAnalysisCuts(analysisId);

    for (const cut of cuts) {
      try {
        await updateCutStatus(cut.id, "processing");

        // Create output path
        const outputPath = path.join(OUTPUTS_DIR, `${videoId}_cut_${cut.cutNumber}.mp4`);

        // Run the cutting script
        // Note: This is a placeholder. You'll need to modify cortar.py to accept command-line arguments
        console.log(`Cutting video: ${videoPath} (${cut.startTime}s - ${cut.endTime}s)`);

        // For now, we'll just mark as completed
        await updateCutStatus(cut.id, "completed", undefined, outputPath);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await updateCutStatus(cut.id, "error", errorMessage);
      }
    }
  } catch (error) {
    console.error("Error generating cuts:", error);
    throw error;
  }
}

