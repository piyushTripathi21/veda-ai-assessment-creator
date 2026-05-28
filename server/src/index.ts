import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { initSocket } from './config/socket';
import { initAssessmentQueue, getRedisOnlineStatus } from './config/redis';
import { startWorker } from './queues/worker';
import assignmentRoutes from './routes/assignments';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

// Enable CORS for frontend interactions
app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use(express.json());

// Main REST API Route mounting
app.use('/api/assignments', assignmentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'VedaAI Assessment engine running successfully' });
});

const startServer = async () => {
  try {
    // 1. Establish MongoDB connection
    await connectDB();

    // 2. Initialize WebSocket Socket.io server
    initSocket(server);

    // 3. Initialize Unified Queue Manager
    await initAssessmentQueue();

    // 4. Launch BullMQ Worker ONLY if Redis is online
    if (getRedisOnlineStatus()) {
      startWorker();
    } else {
      // Offline mode active
    }

    // 5. Start listening
    server.listen(PORT, () => {
      // Express listening success log
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
