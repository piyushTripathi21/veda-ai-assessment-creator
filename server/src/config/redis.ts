import { Queue, ConnectionOptions } from 'bullmq';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import Assignment from '../models/Assignment';
import { generateAssessmentWithAI } from '../services/gemini';
import { generateAssessmentMock } from '../services/mockGenerator';
import { getIO } from './socket';

dotenv.config();

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  maxRetriesPerRequest: null,
  ...(process.env.REDIS_HOST?.includes('upstash.io') ? { tls: {} } : {}),
};

let isRedisOnline = false;
let bullQueue: Queue | null = null;

// Test Redis connection status immediately
const testRedisConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const client = new Redis({
      host: redisConnection.host,
      port: redisConnection.port,
      connectTimeout: 2000,
      lazyConnect: true,
      retryStrategy: () => null, // Stop reconnection attempts on test failure
      ...(redisConnection.host?.includes('upstash.io') ? { tls: {} } : {}),
    });

    // Suppress Node event emitter warnings for expected connection failures during checks
    client.on('error', () => {});

    client.connect()
      .then(() => {
        isRedisOnline = true;
        client.disconnect();
        resolve(true);
      })
      .catch(() => {
        isRedisOnline = false;
        resolve(false);
      });
  });
};

// Unified Queue wrapper exposing standard addJob interface
export const initAssessmentQueue = async (): Promise<void> => {
  const online = await testRedisConnection();
  
  if (online) {
    bullQueue = new Queue('assessment-generation', {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
      },
    });
  } else {
    // Quiet warning, no boilerplate comments
  }
};

// Local in-memory processor for sandbox execution
const processLocalJob = async (assignmentId: string) => {
  const assignment = await Assignment.findById(assignmentId);
  if (!assignment) return;

  // Set processing state
  assignment.status = 'processing';
  assignment.progress = 5;
  await assignment.save();

  const io = getIO();
  const streamUpdate = async (progress: number, message: string) => {
    await Assignment.findByIdAndUpdate(assignmentId, { progress });
    io.to(assignmentId).emit('progress', { progress, message });
  };

  // Run the processing in a setImmediate / setTimeout loop to simulate a background thread
  setTimeout(async () => {
    try {
      streamUpdate(10, 'Queued generation task in Veda In-Memory Queue engine...');
      await new Promise(r => setTimeout(r, 1000));

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
          await new Promise(r => setTimeout(r, 1500));
          generatedSections = await generateAssessmentMock(genParams);
        }
      } else {
        streamUpdate(15, 'No Gemini API key configured. Launching dynamic offline mock generation...');
        await new Promise(r => setTimeout(r, 1500));
        generatedSections = await generateAssessmentMock(genParams);
      }

      assignment.sections = generatedSections;
      assignment.status = 'completed';
      assignment.progress = 100;
      await assignment.save();

      io.to(assignmentId).emit('completed', assignment);
    } catch (error: any) {
      assignment.status = 'failed';
      assignment.progress = 0;
      await assignment.save();
      io.to(assignmentId).emit('failed', { error: error.message });
    }
  }, 100);
};

// Public method to add assignments to queue
export const addAssignmentJob = async (assignmentId: string): Promise<{ id: string; type: 'bullmq' | 'memory' }> => {
  if (isRedisOnline && bullQueue) {
    const job = await bullQueue.add(`generate-${assignmentId}`, { assignmentId });
    return { id: job.id || '', type: 'bullmq' };
  } else {
    // Fallback to local execution loop
    processLocalJob(assignmentId);
    return { id: `local-${assignmentId}`, type: 'memory' };
  }
};

export const getRedisOnlineStatus = () => isRedisOnline;
