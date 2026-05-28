'use client';

import React, { useState } from 'react';
import { Calendar, HelpCircle, FileText, CheckCircle2, ChevronRight, HelpCircle as HelpIcon, Sparkles } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

const PRESET_TOPICS = [
  'Data Structures & Algorithms in Java',
  'Primary Causes of the French Revolution',
  'Cell Division: Mitosis vs. Meiosis',
  'JavaScript Async Programming & Promises'
];

interface CreateFormProps {
  onSuccess: (assignmentId: string) => void;
}

export default function CreateForm({ onSuccess }: CreateFormProps) {
  const { createAssignment } = useAssignmentStore();
  
  // State variables for form parameters
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<('MCQ' | 'Short' | 'Long' | 'TrueFalse')[]>(['MCQ']);
  
  // Difficulty percentages state
  const [difficulty, setDifficulty] = useState({ easy: 40, medium: 40, hard: 20 });
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [totalMarks, setTotalMarks] = useState(50);
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset loader
  const loadPreset = (preset: string) => {
    setTopic(preset);
    if (!title) {
      setTitle(`Assessment: ${preset.split(':')[0] || preset}`);
    }
  };

  const toggleType = (type: 'MCQ' | 'Short' | 'Long' | 'TrueFalse') => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length > 1) {
        setSelectedTypes(selectedTypes.filter((t) => t !== type));
      }
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleDifficultyChange = (field: 'easy' | 'medium' | 'hard', val: number) => {
    const otherFields = field === 'easy' ? ['medium', 'hard'] : field === 'medium' ? ['easy', 'hard'] : ['easy', 'medium'];
    const currentOtherSum = difficulty[otherFields[0] as 'easy'|'medium'|'hard'] + difficulty[otherFields[1] as 'easy'|'medium'|'hard'];
    
    const targetOther = 100 - val;
    let newOther1 = 0;
    let newOther2 = 0;
    
    if (currentOtherSum > 0) {
      newOther1 = Math.round((difficulty[otherFields[0] as 'easy'|'medium'|'hard'] / currentOtherSum) * targetOther);
      newOther2 = targetOther - newOther1;
    } else {
      newOther1 = Math.round(targetOther / 2);
      newOther2 = targetOther - newOther1;
    }

    setDifficulty({
      [field]: val,
      [otherFields[0]]: Math.max(0, newOther1),
      [otherFields[1]]: Math.max(0, newOther2)
    } as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Front-end validations
    if (!title.trim()) return setError('Please enter an assignment title');
    if (!topic.trim()) return setError('Please enter a topic or copy-paste text syllabus');
    if (!dueDate) return setError('Please specify a due date');
    
    const parsedDate = new Date(dueDate);
    if (parsedDate < new Date()) {
      return setError('Due date must be in the future');
    }

    if (totalQuestions <= 0 || !Number.isInteger(totalQuestions)) {
      return setError('Number of questions must be a positive whole number');
    }

    if (totalMarks <= 0 || !Number.isInteger(totalMarks)) {
      return setError('Total marks must be a positive whole number');
    }

    const diffSum = difficulty.easy + difficulty.medium + difficulty.hard;
    if (diffSum !== 100) {
      return setError(`Difficulty distributions must sum to 100% (currently ${diffSum}%)`);
    }

    setIsSubmitting(true);
    try {
      const assignmentData = {
        title,
        topic,
        dueDate,
        questionTypes: selectedTypes,
        difficultyDistribution: difficulty,
        totalQuestions,
        totalMarks,
        additionalInstructions
      };

      const result = await createAssignment(assignmentData as any);
      if (result) {
        onSuccess(result._id);
      } else {
        setError('Failed to schedule creation job. Check backend server connection.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected networking failure occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const difficultySum = difficulty.easy + difficulty.medium + difficulty.hard;

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 block">Assignment Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Midterm Physics Exam or DSA Homework #3"
          className="w-full px-4 py-3 rounded-xl border glass-input focus:ring-2 focus:ring-purple-500/10"
          disabled={isSubmitting}
        />
      </div>

      {/* 2. Topic Input */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700 block">Syllabus Topic / Syllabus Text</label>
          <span className="text-[10px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">Gemini-Powered Parser</span>
        </div>
        <textarea
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Type your syllabus topic, copy-paste lecture transcripts, or upload text to construct questions from..."
          className="w-full px-4 py-3 rounded-xl border glass-input h-28 resize-none focus:ring-2 focus:ring-purple-500/10 text-sm"
          disabled={isSubmitting}
        />
        
        {/* QuickPresets */}
        <div className="flex flex-wrap gap-2 pt-1">
          {PRESET_TOPICS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => loadPreset(preset)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-slate-200 bg-slate-100 text-slate-600 hover:text-purple-600 hover:border-purple-600/30 hover:bg-purple-50 transition-all font-medium"
              disabled={isSubmitting}
            >
              + {preset}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Date & Parameters grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>Due Date</span>
          </label>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border glass-input text-xs sm:text-sm text-slate-800"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-purple-600" />
            <span>Total Questions</span>
          </label>
          <input
            type="number"
            min="1"
            value={totalQuestions}
            onChange={(e) => setTotalQuestions(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full px-4 py-3 rounded-xl border glass-input text-slate-800 font-mono"
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Total Marks</span>
          </label>
          <input
            type="number"
            min="1"
            value={totalMarks}
            onChange={(e) => setTotalMarks(Math.max(1, parseInt(e.target.value) || 0))}
            className="w-full px-4 py-3 rounded-xl border glass-input text-slate-800 font-mono"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* 4. Question Types Selection */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-slate-700 block">Question Styles Included</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'MCQ', name: 'Multiple Choice', desc: '4 options, 1 answer' },
            { id: 'TrueFalse', name: 'True / False', desc: 'Binary statement' },
            { id: 'Short', name: 'Short Answer', desc: '2-3 sentence replies' },
            { id: 'Long', name: 'Long Essay', desc: 'In-depth analysis' },
          ].map((type) => {
            const isSelected = selectedTypes.includes(type.id as any);
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => toggleType(type.id as any)}
                className={`p-3.5 rounded-xl border text-left flex flex-col justify-between transition-all duration-300 h-24 relative overflow-hidden ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50/50 shadow-md shadow-purple-500/5'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                disabled={isSubmitting}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-purple-600 absolute top-2 right-2" />
                )}
                <span className="font-semibold text-sm text-slate-800 block pr-4">{type.name}</span>
                <span className="text-[10px] text-slate-500 block mt-1">{type.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Difficulties Balance sliders */}
      <div className="space-y-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-slate-700">Cognitive Balance (Bloom's Taxonomy)</label>
          <span
            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              difficultySum === 100
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            Total: {difficultySum}% {difficultySum === 100 ? '✓' : '⚠️'}
          </span>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Easy / Recall (Knowledge)</span>
              <span className="text-purple-600 font-bold">{difficulty.easy}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={difficulty.easy}
              onChange={(e) => handleDifficultyChange('easy', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Medium / Application (Conceptual)</span>
              <span className="text-purple-600 font-bold">{difficulty.medium}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={difficulty.medium}
              onChange={(e) => handleDifficultyChange('medium', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Hard / Synthesis (Evaluation)</span>
              <span className="text-purple-600 font-bold">{difficulty.hard}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={difficulty.hard}
              onChange={(e) => handleDifficultyChange('hard', parseInt(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* 6. Extra Instructions */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700 block">Custom Instructions (Optional)</label>
        <textarea
          value={additionalInstructions}
          onChange={(e) => setAdditionalInstructions(e.target.value)}
          placeholder="e.g., Focus heavily on sorting algos. Do not include complexity questions in Sections C. Use professional formal language."
          className="w-full px-4 py-3 rounded-xl border glass-input h-20 resize-none focus:ring-2 focus:ring-purple-500/10 text-xs sm:text-sm text-slate-800"
          disabled={isSubmitting}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/10 text-white font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 group relative overflow-hidden disabled:bg-purple-200 disabled:text-slate-400 cursor-pointer"
        disabled={isSubmitting}
      >
        <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform duration-300" />
        <span>Generate Assessment Paper</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
      </button>
    </form>
  );
}
