import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAssignmentStore } from '../store/useAssignmentStore';

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export const useWebSocket = (assignmentId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  const { updateJobProgress, completeJob, failJob, addConsoleLog } = useAssignmentStore();

  useEffect(() => {
    if (!assignmentId) return;

    // Connect to WebSockets backend
    const socket = io(SOCKET_SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      // Join the assignment room
      socket.emit('join-assignment', assignmentId);
      addConsoleLog('Connected to WebSocket generation server.', 'info');
    });

    socket.on('progress', (data: { progress: number; message: string }) => {
      updateJobProgress(data.progress, data.message);
    });

    socket.on('completed', (data: any) => {
      completeJob(data);
    });

    socket.on('failed', (data: { error: string }) => {
      failJob(data.error);
    });

    socket.on('disconnect', () => {
      // Quiet disconnect logging
    });

    return () => {
      if (socket) {
        socket.emit('leave-assignment', assignmentId);
        socket.disconnect();
      }
    };
  }, [assignmentId, updateJobProgress, completeJob, failJob, addConsoleLog]);

  return socketRef.current;
};
