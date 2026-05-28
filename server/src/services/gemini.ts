import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { ISection, IQuestion } from '../models/Assignment';

dotenv.config();

// Define input parameters interface
export interface IGenerateParams {
  topic: string;
  questionTypes: ('MCQ' | 'Short' | 'Long' | 'TrueFalse')[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  totalQuestions: number;
  totalMarks: number;
  additionalInstructions?: string;
  onProgress?: (progress: number, message: string) => void;
}

export const generateAssessmentWithAI = async (params: IGenerateParams): Promise<ISection[]> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // Using gemini-1.5-flash as it is extremely fast and robust at structured JSON outputs
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  if (params.onProgress) params.onProgress(10, 'Formulating structured prompt guidelines...');

  const prompt = `
You are an expert curriculum designer and academic examiner.
Generate a comprehensive, high-quality question paper on the topic: "${params.topic}" based on the following exact specifications.

### Specifications:
- Total Questions to Generate: ${params.totalQuestions}
- Total Marks for the entire paper: ${params.totalMarks}
- Question Types to Include: ${params.questionTypes.join(', ')}
- Difficulty Distribution (Ensure questions are marked with these difficulties):
  - Easy: ${params.difficultyDistribution.easy}% of questions
  - Medium: ${params.difficultyDistribution.medium}% of questions
  - Hard: ${params.difficultyDistribution.hard}% of questions
- Additional Instructions/Focus Area: "${params.additionalInstructions || 'None provided'}"

### Structure Guidelines:
1. Group questions into logical sections based on question type. For example:
   - Section A: Multiple Choice Questions (if MCQ is selected)
   - Section B: True or False Questions (if TrueFalse is selected)
   - Section C: Short Answer Questions (if Short is selected)
   - Section D: Long Answer / Subjective Questions (if Long is selected)
2. Every section must have:
   - "id": A unique string (e.g., "sec-a")
   - "title": Clear header (e.g., "Section A: Multiple Choice Questions")
   - "instructions": Specific exam instructions (e.g., "Answer all questions. Each question is worth 2 marks.")
   - "questions": Array of question objects.
3. Every question must have:
   - "id": Unique string (e.g., "q-1", "q-2")
   - "questionText": The clear academic question
   - "questionType": Must match one of: "MCQ", "Short", "Long", "TrueFalse"
   - "options": Array of exactly 4 strings for MCQ questions. DO NOT include this field for other question types.
   - "correctAnswer": A string indicating the correct answer. For MCQ, it should match one of the option strings exactly. For TrueFalse, it should be "True" or "False". For Short/Long, provide a brief sample answer or grading key.
   - "marks": A number. The sum of all question marks must equal exactly ${params.totalMarks}. Distribute marks logically (e.g., MCQ = 2 marks, Short = 5 marks, Long = 10 marks).
   - "difficulty": Must be exactly one of "easy", "medium", "hard", conforming as closely as possible to the requested distribution.

### Response format:
You must return a JSON array of sections. Follow the schema strictly. Do not include markdown wraps or conversational text.

JSON Schema to return:
[
  {
    "id": "string",
    "title": "string",
    "instructions": "string",
    "questions": [
      {
        "id": "string",
        "questionText": "string",
        "questionType": "MCQ" | "Short" | "Long" | "TrueFalse",
        "options": ["string", "string", "string", "string"], // Only for MCQ
        "correctAnswer": "string",
        "marks": number,
        "difficulty": "easy" | "medium" | "hard"
      }
    ]
  }
]
`;

  if (params.onProgress) params.onProgress(30, 'Requesting assessment payload from Gemini API...');

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  if (params.onProgress) params.onProgress(70, 'Received payload. Verifying structure and marks balancing...');

  try {
    const sections: ISection[] = JSON.parse(responseText);

    // Validate that sections and questions were parsed successfully
    if (!Array.isArray(sections)) {
      throw new Error('API did not return an array of sections');
    }

    let parsedQuestionsCount = 0;
    let parsedMarksSum = 0;

    sections.forEach((sec) => {
      if (!sec.id || !sec.title || !sec.questions) {
        throw new Error('Invalid section structure received');
      }
      sec.questions.forEach((q) => {
        parsedQuestionsCount++;
        parsedMarksSum += q.marks;
      });
    });

    if (params.onProgress) {
      params.onProgress(90, `Successfully validated ${parsedQuestionsCount} questions summing to ${parsedMarksSum} marks.`);
    }

    return sections;
  } catch (error: any) {
    throw new Error(`Failed to parse structured output from Gemini: ${error.message}. Response was: ${responseText}`);
  }
};
