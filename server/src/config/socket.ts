import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: '*', // Allow all origins for the development assignment, secure in prod
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    // Join a room specific to the assignment creation process to receive granular updates
    socket.on('join-assignment', (assignmentId: string) => {
      socket.join(assignmentId);
    });

    socket.on('leave-assignment', (assignmentId: string) => {
      socket.leave(assignmentId);
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized. Please call initSocket first.');
  }
  return io;
};
