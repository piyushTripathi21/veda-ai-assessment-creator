import { Worker, Job } from 'bullmq';
import { redisConnection } from '../config/redis';
import Assignment from '../models/Assignment';
import { generateAssessmentWithAI } from '../services/gemini';
import { generateAssessmentMock } from '../services/mockGenerator';
import { getIO } from '../config/socket';

export const startWorker = (): void => {
  const worker = new Worker(
    'assessment-generation',
    async (job: Job) => {
      const { assignmentId } = job.data;

      // Find the assignment
      const assignment = await Assignment.findById(assignmentId);
      if (!assignment) {
        throw new Error(`Assignment with ID ${assignmentId} not found`);
      }

      // Update status to processing
      assignment.status = 'processing';
      assignment.progress = 5;
      await assignment.save();

      const io = getIO();
      // Socket room emit helper
      const streamUpdate = async (progress: number, message: string) => {
        await Assignment.findByIdAndUpdate(assignmentId, { progress });
        io.to(assignmentId).emit('progress', { progress, message });
      };

      streamUpdate(10, 'Initializing background worker. Fetching instructions...');

      try {
        const genParams = {
          topic: assignment.topic,
          questionTypes: assignment.questionTypes,
          difficultyDistribution: assignment.difficultyDistribution,
          totalQuestions: assignment.totalQuestions,
          totalMarks: assignment.totalMarks,
          additionalInstructions: assignment.additionalInstructions,
          onProgress: (prog: number, msg: string) => {
            streamUpdate(prog, msg);
          },
        };

        let generatedSections;
        const apiKey = process.env.GEMINI_API_KEY;

        if (apiKey && apiKey.trim() !== '') {
          try {
            streamUpdate(20, 'API key detected. Initiating Gemini AI...');
            generatedSections = await generateAssessmentWithAI(genParams);
          } catch (aiError: any) {
            streamUpdate(25, `Gemini API error: ${aiError.message}. Initiating dynamic offline fallback...`);
            await new Promise((resolve) => setTimeout(resolve, 1500)); // Visual pause for the teacher console
            generatedSections = await generateAssessmentMock(genParams);
          }
        } else {
          streamUpdate(15, 'No Gemini API key found. Launching dynamic offline mock generation...');
          await new Promise((resolve) => setTimeout(resolve, 1500)); // Visual pause for the teacher console
          generatedSections = await generateAssessmentMock(genParams);
        }

        // Save generated questions to the database
        assignment.sections = generatedSections;
        assignment.status = 'completed';
        assignment.progress = 100;
        await assignment.save();

        // Broadcast success to WebSocket clients
        io.to(assignmentId).emit('completed', assignment);
      } catch (error: any) {
        assignment.status = 'failed';
        assignment.progress = 0;
        await assignment.save();

        io.to(assignmentId).emit('failed', { error: error.message });
        throw error;
      }
    },
    {
      connection: redisConnection,
      concurrency: 2, // Allow up to 2 assessments to generate concurrently
    }
  );
};
