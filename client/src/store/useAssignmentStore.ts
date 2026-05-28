import { create } from 'zustand';

export interface IQuestion {
  id: string;
  questionText: string;
  questionType: 'MCQ' | 'Short' | 'Long' | 'TrueFalse';
  options?: string[];
  correctAnswer?: string;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ISection {
  id: string;
  title: string;
  instructions: string;
  questions: IQuestion[];
}

export interface IAssignment {
  _id: string;
  title: string;
  topic: string;
  dueDate: string;
  questionTypes: ('MCQ' | 'Short' | 'Long' | 'TrueFalse')[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  sections: ISection[];
  createdAt: string;
  updatedAt: string;
}

interface IConsoleLog {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface AssignmentState {
  assignments: IAssignment[];
  activeAssignment: IAssignment | null;
  isGenerating: boolean;
  generationProgress: number;
  generationLogs: IConsoleLog[];
  isLoading: boolean;
  error: string | null;

  // REST API Actions
  fetchAssignments: () => Promise<void>;
  fetchAssignment: (id: string) => Promise<IAssignment | null>;
  createAssignment: (data: Omit<IAssignment, '_id' | 'status' | 'progress' | 'sections' | 'createdAt' | 'updatedAt'>) => Promise<IAssignment | null>;
  updateAssignment: (id: string, data: Partial<IAssignment>) => Promise<boolean>;
  regenerateAssignment: (id: string) => Promise<boolean>;
  deleteAssignment: (id: string) => Promise<boolean>;

  // WebSocket Actions
  startJob: (assignmentId: string) => void;
  updateJobProgress: (progress: number, message: string) => void;
  completeJob: (assignment: IAssignment) => void;
  failJob: (errorMsg: string) => void;
  addConsoleLog: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  clearConsoleLogs: () => void;
  setActiveAssignment: (assignment: IAssignment | null) => void;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const useAssignmentStore = create<AssignmentState>((set, get) => ({
  assignments: [],
  activeAssignment: null,
  isGenerating: false,
  generationProgress: 0,
  generationLogs: [],
  isLoading: false,
  error: null,

  fetchAssignments: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`);
      const resData = await response.json();
      if (resData.success) {
        set({ assignments: resData.data, isLoading: false });
      } else {
        set({ error: resData.error || 'Failed to fetch assignments', isLoading: false });
      }
    } catch (err: any) {
      set({ error: err.message || 'Server connection error', isLoading: false });
    }
  },

  fetchAssignment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`);
      const resData = await response.json();
      if (resData.success) {
        set({ activeAssignment: resData.data, isLoading: false });
        return resData.data;
      } else {
        set({ error: resData.error || 'Failed to fetch assignment', isLoading: false });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message || 'Server connection error', isLoading: false });
      return null;
    }
  },

  createAssignment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (resData.success) {
        set((state) => ({
          assignments: [resData.data, ...state.assignments],
          activeAssignment: resData.data,
          isLoading: false,
        }));
        return resData.data;
      } else {
        set({ error: resData.error || 'Failed to create assignment', isLoading: false });
        return null;
      }
    } catch (err: any) {
      set({ error: err.message || 'Server connection error', isLoading: false });
      return null;
    }
  },

  updateAssignment: async (id, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await response.json();
      if (resData.success) {
        set((state) => ({
          assignments: state.assignments.map((a) => (a._id === id ? resData.data : a)),
          activeAssignment: state.activeAssignment?._id === id ? resData.data : state.activeAssignment,
        }));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  regenerateAssignment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}/regenerate`, {
        method: 'POST',
      });
      const resData = await response.json();
      if (resData.success) {
        set((state) => ({
          assignments: state.assignments.map((a) => (a._id === id ? resData.data : a)),
          activeAssignment: state.activeAssignment?._id === id ? resData.data : state.activeAssignment,
        }));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  deleteAssignment: async (id) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${id}`, {
        method: 'DELETE',
      });
      const resData = await response.json();
      if (resData.success) {
        set((state) => ({
          assignments: state.assignments.filter((a) => a._id !== id),
          activeAssignment: state.activeAssignment?._id === id ? null : state.activeAssignment,
        }));
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  },

  // WebSocket Actions
  startJob: (assignmentId) => {
    set({
      isGenerating: true,
      generationProgress: 5,
      generationLogs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          message: 'Queued generation task in Redis backend...',
          type: 'info',
        },
      ],
    });
  },

  updateJobProgress: (progress, message) => {
    const logType = message.toLowerCase().includes('error')
      ? 'error'
      : message.toLowerCase().includes('success') || message.toLowerCase().includes('complete')
      ? 'success'
      : message.toLowerCase().includes('fallback') || message.toLowerCase().includes('offline')
      ? 'warning'
      : 'info';

    set((state) => ({
      generationProgress: progress,
      generationLogs: [
        ...state.generationLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type: logType,
        },
      ],
    }));
  },

  completeJob: (assignment) => {
    set((state) => ({
      isGenerating: false,
      generationProgress: 100,
      activeAssignment: assignment,
      assignments: state.assignments.map((a) => (a._id === assignment._id ? assignment : a)),
      generationLogs: [
        ...state.generationLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          message: 'SUCCESS: Assignment successfully drafted, formatted, and loaded.',
          type: 'success',
        },
      ],
    }));
  },

  failJob: (errorMsg) => {
    set((state) => ({
      isGenerating: false,
      generationProgress: 0,
      generationLogs: [
        ...state.generationLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          message: `ERROR: Generation failed. ${errorMsg}`,
          type: 'error',
        },
      ],
    }));
  },

  addConsoleLog: (message, type = 'info') => {
    set((state) => ({
      generationLogs: [
        ...state.generationLogs,
        {
          timestamp: new Date().toLocaleTimeString(),
          message,
          type,
        },
      ],
    }));
  },

  clearConsoleLogs: () => {
    set({ generationLogs: [] });
  },

  setActiveAssignment: (assignment) => {
    set({ activeAssignment: assignment });
  },
}));
