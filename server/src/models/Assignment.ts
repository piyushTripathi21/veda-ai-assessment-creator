import mongoose, { Schema, Document } from 'mongoose';

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

export interface IAssignment extends Document {
  title: string;
  topic: string;
  dueDate: Date;
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
  progress: number; // For real-time loading status (0-100)
  sections: ISection[];
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema = new Schema<IQuestion>({
  id: { type: String, required: true },
  questionText: { type: String, required: true },
  questionType: { type: String, enum: ['MCQ', 'Short', 'Long', 'TrueFalse'], required: true },
  options: { type: [String], default: undefined },
  correctAnswer: { type: String },
  marks: { type: Number, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }
}, { _id: false });

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  title: { type: String, required: true },
  instructions: { type: String, required: true },
  questions: [QuestionSchema]
}, { _id: false });

const AssignmentSchema = new Schema<IAssignment>({
  title: { type: String, required: true },
  topic: { type: String, required: true },
  dueDate: { type: Date, required: true },
  questionTypes: [{ type: String, enum: ['MCQ', 'Short', 'Long', 'TrueFalse'] }],
  difficultyDistribution: {
    easy: { type: Number, required: true },
    medium: { type: Number, required: true },
    hard: { type: Number, required: true }
  },
  totalQuestions: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  additionalInstructions: { type: String },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'pending' },
  progress: { type: Number, default: 0 },
  sections: [SectionSchema]
}, { timestamps: true });

export default mongoose.model<IAssignment>('Assignment', AssignmentSchema);
