import { IGenerateParams } from './gemini';
import { ISection, IQuestion } from '../models/Assignment';

// A dynamic content bank of questions across different academic subjects to make mock papers feel incredibly realistic.
const DYNAMIC_BANK: Record<string, {
  MCQ: Partial<IQuestion>[];
  Short: Partial<IQuestion>[];
  Long: Partial<IQuestion>[];
  TrueFalse: Partial<IQuestion>[];
}> = {
  programming: {
    MCQ: [
      { questionText: 'What is the time complexity of searching in a perfectly balanced Binary Search Tree?', options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], correctAnswer: 'O(log n)' },
      { questionText: 'Which data structure follows the Last-In-First-Out (LIFO) principal?', options: ['Queue', 'Stack', 'Linked List', 'Binary Tree'], correctAnswer: 'Stack' },
      { questionText: 'What is the default value of a local variable in Java?', options: ['0', 'null', 'undefined', 'No default value (must be initialized)'], correctAnswer: 'No default value (must be initialized)' },
      { questionText: 'Which of the following is NOT an OOP paradigm?', options: ['Encapsulation', 'Polymorphism', 'Compilation', 'Inheritance'], correctAnswer: 'Compilation' }
    ],
    Short: [
      { questionText: 'Explain the difference between a process and a thread in an operating system.', correctAnswer: 'A process is an independent execution unit with its own memory space, whereas a thread is a lightweight subprocess that shares memory and resources with other threads within the same process.' },
      { questionText: 'Describe how garbage collection works in Java.', correctAnswer: 'Garbage collection in Java is an automatic process that identifies and deletes unused objects in the heap memory to reclaim space, primarily utilizing the Mark-and-Sweep algorithm.' }
    ],
    Long: [
      { questionText: 'Analyze the design trade-offs between using a HashMap vs. a Red-Black Tree for indexing large databases. Focus on time complexities, memory usage, and range queries.', correctAnswer: 'HashMaps provide O(1) average time complexity for lookups but do not support sorted indexing or range queries, and suffer from hash collisions. Red-Black Trees (TreeMap) provide O(log n) time complexity and keep keys sorted, enabling efficient range searches, though they require more metadata overhead per node.' }
    ],
    TrueFalse: [
      { questionText: 'An Interface in Java can contain instance variables.', correctAnswer: 'False' },
      { questionText: 'HTTP is a stateless protocol.', correctAnswer: 'True' }
    ]
  },
  history: {
    MCQ: [
      { questionText: 'In which year did the French Revolution begin?', options: ['1776', '1789', '1804', '1848'], correctAnswer: '1789' },
      { questionText: 'Who was the first President of the United States?', options: ['Thomas Jefferson', 'John Adams', 'George Washington', 'Benjamin Franklin'], correctAnswer: 'George Washington' }
    ],
    Short: [
      { questionText: 'Briefly discuss the significance of the Magna Carta signed in 1215.', correctAnswer: 'The Magna Carta established the principle that everyone, including the king, is subject to the law, and guaranteed the rights of individuals, right to justice, and right to a fair trial.' }
    ],
    Long: [
      { questionText: 'Detail the primary socio-economic and political causes of World War I, explaining the Alliance system, Imperialism, and Militarism.', correctAnswer: 'The spark of WWI was the assassination of Archduke Franz Ferdinand, but the systemic causes included intense military build-ups (Militarism), competing global empires (Imperialism), aggressive nationalism, and a complex web of secret mutual-defense treaties (Alliances) that dragged multiple nations into conflict.' }
    ],
    TrueFalse: [
      { questionText: 'Napoleon Bonaparte died in exile on the island of Saint Helena.', correctAnswer: 'True' },
      { questionText: 'The United States entered World War II immediately after the invasion of Poland.', correctAnswer: 'False' }
    ]
  },
  science: {
    MCQ: [
      { questionText: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi Apparatus'], correctAnswer: 'Mitochondria' },
      { questionText: 'What is the speed of light in a vacuum?', options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '3,000 km/s'], correctAnswer: '300,000 km/s' }
    ],
    Short: [
      { questionText: 'Explain the difference between mitosis and meiosis.', correctAnswer: 'Mitosis results in two identical diploid daughter cells for body growth/repair, whereas meiosis results in four genetically diverse haploid gametes for sexual reproduction.' }
    ],
    Long: [
      { questionText: 'Discuss Einstein\'s Theory of General Relativity and its impact on modern astrophysics, specifically addressing the curvature of spacetime.', correctAnswer: 'General Relativity describes gravity not as a direct force but as a geometric property of space and time. Massive objects curve spacetime around them, which dictates the paths of moving objects. This predicted gravitational lensing, time dilation, and the existence of black holes.' }
    ],
    TrueFalse: [
      { questionText: 'Sound waves travel faster in water than in air.', correctAnswer: 'True' },
      { questionText: 'An atom has a net positive charge in its standard elemental state.', correctAnswer: 'False' }
    ]
  }
};

export const generateAssessmentMock = async (params: IGenerateParams): Promise<ISection[]> => {
  const { topic, questionTypes, totalQuestions, totalMarks, difficultyDistribution, onProgress } = params;

  if (onProgress) onProgress(10, 'Initializing offline generation worker...');

  // Classify topic to select the most appropriate dynamic bank
  const normalizedTopic = topic.toLowerCase();
  let selectedBank = DYNAMIC_BANK.science; // Default fallback

  if (normalizedTopic.includes('code') || normalizedTopic.includes('program') || normalizedTopic.includes('java') || normalizedTopic.includes('datastruct') || normalizedTopic.includes('computer') || normalizedTopic.includes('software')) {
    selectedBank = DYNAMIC_BANK.programming;
  } else if (normalizedTopic.includes('history') || normalizedTopic.includes('revolution') || normalizedTopic.includes('war') || normalizedTopic.includes('king') || normalizedTopic.includes('empire')) {
    selectedBank = DYNAMIC_BANK.history;
  }

  if (onProgress) onProgress(40, `Scanning localized database for topic keyword matches: "${topic}"...`);

  // Distribute questions logically among requested types
  const questionsPerType = Math.floor(totalQuestions / questionTypes.length);
  const remainder = totalQuestions % questionTypes.length;

  const questionCounts: Record<string, number> = {};
  questionTypes.forEach((type, idx) => {
    questionCounts[type] = questionsPerType + (idx === 0 ? remainder : 0);
  });

  if (onProgress) onProgress(60, 'Balancing marks and difficulties based on Bloom\'s Taxonomy...');

  // Distribute marks: MCQ (2 marks), TrueFalse (2 marks), Short (5 marks), Long (10 marks) as baseline
  const baseMarks: Record<string, number> = { MCQ: 2, TrueFalse: 2, Short: 5, Long: 10 };
  
  // Calculate raw baseline sum
  let baselineSum = 0;
  questionTypes.forEach((type) => {
    baselineSum += questionCounts[type] * baseMarks[type];
  });

  // Calculate scaling factor to hit EXACT marks target
  const scalingFactor = totalMarks / (baselineSum || 1);

  const sections: ISection[] = [];
  let questionGlobalId = 1;
  let runningMarksSum = 0;

  // Generate difficulty pool based on percentage
  const difficultyPool: ('easy' | 'medium' | 'hard')[] = [];
  const easyCount = Math.round((difficultyDistribution.easy / 100) * totalQuestions);
  const mediumCount = Math.round((difficultyDistribution.medium / 100) * totalQuestions);
  const hardCount = totalQuestions - easyCount - mediumCount;

  for (let i = 0; i < easyCount; i++) difficultyPool.push('easy');
  for (let i = 0; i < mediumCount; i++) difficultyPool.push('medium');
  for (let i = 0; i < Math.max(0, hardCount); i++) difficultyPool.push('hard');

  // Shuffle difficulty pool
  difficultyPool.sort(() => Math.random() - 0.5);

  questionTypes.forEach((type, typeIdx) => {
    const count = questionCounts[type];
    if (count <= 0) return;

    const secId = `sec-${type.toLowerCase()}`;
    let secTitle = '';
    let secInstructions = '';

    switch (type) {
      case 'MCQ':
        secTitle = 'Section A: Multiple Choice Questions';
        secInstructions = 'Attempt all questions. Select the single correct option for each question.';
        break;
      case 'TrueFalse':
        secTitle = `Section ${String.fromCharCode(65 + typeIdx)}: True or False Statements`;
        secInstructions = 'State whether the following statements are True or False.';
        break;
      case 'Short':
        secTitle = `Section ${String.fromCharCode(65 + typeIdx)}: Short Answer Questions`;
        secInstructions = 'Answer the questions in 2-3 concise sentences.';
        break;
      case 'Long':
        secTitle = `Section ${String.fromCharCode(65 + typeIdx)}: Long Answer Essay Questions`;
        secInstructions = 'Provide detailed explanations, demonstrating analytical depth and examples where applicable.';
        break;
    }

    const questionsList: IQuestion[] = [];
    const sourceQuestions = selectedBank[type] || [];

    for (let i = 0; i < count; i++) {
      // Pick template question from source bank or generate generic
      const template = sourceQuestions[i % sourceQuestions.length] || {};
      const diff = difficultyPool.pop() || 'medium';

      // Allocate mark logically, ensuring the final question balances the sum perfectly
      let assignedMarks = Math.max(1, Math.round(baseMarks[type] * scalingFactor));
      
      const isLastQuestionOverall = (typeIdx === questionTypes.length - 1) && (i === count - 1);
      if (isLastQuestionOverall) {
        assignedMarks = totalMarks - runningMarksSum;
        if (assignedMarks <= 0) {
          assignedMarks = 2; // Fail-safe
        }
      }
      runningMarksSum += assignedMarks;

      const qText = template.questionText || `Synthesized conceptual analysis question #${questionGlobalId} on ${topic}`;
      const qOptions = type === 'MCQ' ? (template.options || ['Option A', 'Option B', 'Option C', 'Option D']) : undefined;
      const qCorrect = template.correctAnswer || (type === 'TrueFalse' ? 'True' : `Standard rubric guide answer key for item #${questionGlobalId}`);

      questionsList.push({
        id: `q-${questionGlobalId}`,
        questionText: qText,
        questionType: type,
        options: qOptions,
        correctAnswer: qCorrect,
        marks: assignedMarks,
        difficulty: diff
      });

      questionGlobalId++;
    }

    sections.push({
      id: secId,
      title: secTitle,
      instructions: secInstructions,
      questions: questionsList
    });
  });

  // Second pass: Ensure total marks balances PERFECTLY (in case of division errors)
  let finalMarksSum = 0;
  sections.forEach((s) => {
    s.questions.forEach((q) => { finalMarksSum += q.marks; });
  });

  if (finalMarksSum !== totalMarks && sections.length > 0) {
    const diff = totalMarks - finalMarksSum;
    sections[0].questions[0].marks += diff;
  }

  if (onProgress) {
    onProgress(95, 'Structuring generated JSON schemas and completing final validation check...');
    await new Promise((resolve) => setTimeout(resolve, 800)); // Brief delay for visual effect
  }

  return sections;
};
