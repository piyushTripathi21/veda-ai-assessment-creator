import { Router, Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { addAssignmentJob } from '../config/redis';

const router = Router();

// Helper to validate request parameters
const validateAssignmentInput = (body: any): string | null => {
  const { title, topic, dueDate, questionTypes, difficultyDistribution, totalQuestions, totalMarks } = body;

  if (!title || typeof title !== 'string' || title.trim() === '') return 'Title is required';
  if (!topic || typeof topic !== 'string' || topic.trim() === '') return 'Topic is required';
  if (!dueDate) return 'Due date is required';
  if (isNaN(Date.parse(dueDate))) return 'Invalid due date format';
  if (new Date(dueDate) < new Date()) return 'Due date must be in the future';

  if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
    return 'At least one question type must be selected';
  }
  const validTypes = ['MCQ', 'Short', 'Long', 'TrueFalse'];
  for (const type of questionTypes) {
    if (!validTypes.includes(type)) return `Invalid question type: ${type}`;
  }

  if (!difficultyDistribution || typeof difficultyDistribution !== 'object') {
    return 'Difficulty distribution is required';
  }
  const { easy, medium, hard } = difficultyDistribution;
  if (typeof easy !== 'number' || typeof medium !== 'number' || typeof hard !== 'number') {
    return 'All difficulty percentages must be numeric';
  }
  if (easy < 0 || medium < 0 || hard < 0) return 'Difficulty percentages cannot be negative';
  if (easy + medium + hard !== 100) return 'Difficulty percentages must sum to exactly 100%';

  if (typeof totalQuestions !== 'number' || totalQuestions <= 0) {
    return 'Total questions must be a positive integer';
  }
  if (typeof totalMarks !== 'number' || totalMarks <= 0) {
    return 'Total marks must be a positive integer';
  }

  return null;
};

// 1. Create a new Assignment & Queue background generation
router.post('/', async (req: Request, res: Response) => {
  try {
    const errorMsg = validateAssignmentInput(req.body);
    if (errorMsg) {
      return res.status(400).json({ success: false, error: errorMsg });
    }

    const {
      title,
      topic,
      dueDate,
      questionTypes,
      difficultyDistribution,
      totalQuestions,
      totalMarks,
      additionalInstructions,
    } = req.body;

    const newAssignment = new Assignment({
      title,
      topic,
      dueDate: new Date(dueDate),
      questionTypes,
      difficultyDistribution,
      totalQuestions,
      totalMarks,
      additionalInstructions,
      status: 'pending',
      progress: 0,
      sections: [],
    });

    const savedAssignment = await newAssignment.save();

    // Push task onto Redis Queue / Fail-safe Memory Queue
    const job = await addAssignmentJob(savedAssignment._id.toString());

    return res.status(201).json({
      success: true,
      data: savedAssignment,
      jobId: job.id,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Fetch all Assignments (historical log)
router.get('/', async (req: Request, res: Response) => {
  try {
    const assignments = await Assignment.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: assignments });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Fetch a specific Assignment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    return res.json({ success: true, data: assignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Update assignment questions or configuration (Granular Editing Support)
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { title, sections } = req.body;
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    if (title !== undefined) assignment.title = title;
    if (sections !== undefined) {
      assignment.sections = sections;
      
      // Re-sum total questions and marks dynamically based on manual modifications
      let questionCount = 0;
      let marksCount = 0;
      sections.forEach((sec: any) => {
        if (sec.questions) {
          questionCount += sec.questions.length;
          sec.questions.forEach((q: any) => {
            marksCount += q.marks || 0;
          });
        }
      });
      
      assignment.totalQuestions = questionCount;
      assignment.totalMarks = marksCount;
    }

    const updatedAssignment = await assignment.save();
    return res.json({ success: true, data: updatedAssignment });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Regenerate Assignment (Adds back to BullMQ)
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }

    // Reset status and progress
    assignment.status = 'pending';
    assignment.progress = 0;
    assignment.sections = [];
    await assignment.save();

    // Trigger Redis Queue / Fail-safe Memory Queue regeneration
    const job = await addAssignmentJob(assignment._id.toString());

    return res.json({
      success: true,
      message: 'Regeneration job queued successfully',
      data: assignment,
      jobId: job.id,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Delete Assignment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await Assignment.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Assignment not found' });
    }
    return res.json({ success: true, message: 'Assignment deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
