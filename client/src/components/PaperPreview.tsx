'use client';

import React, { useState } from 'react';
import { Edit2, Trash2, CheckCircle, RefreshCw, Eye, EyeOff, Plus, FileText, Check } from 'lucide-react';
import { IAssignment, IQuestion, ISection, useAssignmentStore } from '../store/useAssignmentStore';

interface PaperPreviewProps {
  assignment: IAssignment;
}

export default function PaperPreview({ assignment }: PaperPreviewProps) {
  const { updateAssignment } = useAssignmentStore();
  const [showAnswers, setShowAnswers] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editMarks, setEditMarks] = useState<number>(0);
  const [editDifficulty, setEditDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');

  // Triggered when saving changes on a question
  const handleSaveQuestion = async (sectionId: string, questionId: string) => {
    const updatedSections = assignment.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: sec.questions.map((q) => {
            if (q.id === questionId) {
              return {
                ...q,
                questionText: editText,
                marks: editMarks,
                difficulty: editDifficulty,
              };
            }
            return q;
          }),
        };
      }
      return sec;
    });

    await updateAssignment(assignment._id, { sections: updatedSections });
    setEditingQuestionId(null);
  };

  // Delete question
  const handleDeleteQuestion = async (sectionId: string, questionId: string) => {
    const updatedSections = assignment.sections.map((sec) => {
      if (sec.id === sectionId) {
        return {
          ...sec,
          questions: sec.questions.filter((q) => q.id !== questionId),
        };
      }
      return sec;
    }).filter(sec => sec.questions.length > 0); // Remove empty sections

    await updateAssignment(assignment._id, { sections: updatedSections });
  };

  // Start inline editing state
  const startEdit = (q: IQuestion) => {
    setEditingQuestionId(q.id);
    setEditText(q.questionText);
    setEditMarks(q.marks);
    setEditDifficulty(q.difficulty);
  };

  // Dynamic estimated completion time calculation
  let totalMcq = 0;
  let totalTf = 0;
  let totalShort = 0;
  let totalLong = 0;

  assignment.sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      if (q.questionType === 'MCQ') totalMcq++;
      else if (q.questionType === 'TrueFalse') totalTf++;
      else if (q.questionType === 'Short') totalShort++;
      else if (q.questionType === 'Long') totalLong++;
    });
  });
  const allowedMinutes = Math.round(totalMcq * 2 + totalTf * 1.5 + totalShort * 7 + totalLong * 20);

  return (
    <div className="space-y-6">
      {/* Action Bar (Interactive Toggles) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl no-print">
        <span className="text-xs text-slate-500 font-medium">Exam Paper Customizer Options</span>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              showAnswers
                ? 'bg-purple-50 border-purple-500 text-purple-700'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showAnswers ? 'Hide Answer Keys' : 'Reveal Answer Keys'}</span>
          </button>
        </div>
      </div>

      {/* Main Academic Styled Paper */}
      <div className="academic-sheet w-full max-w-4xl mx-auto p-12 relative overflow-hidden bg-white text-slate-900 border-2 border-slate-300">
        
        {/* Exam Header */}
        <div className="text-center space-y-2 select-none">
          <h2 className="text-xl font-bold font-serif uppercase tracking-widest text-black">
            Veda Academy of Higher Studies
          </h2>
          <p className="text-xs font-serif uppercase tracking-widest text-slate-700">
            Annual Scholastic Assessment & Evaluation
          </p>
          <div className="w-full flex justify-center py-1">
            <div className="border-t border-double border-slate-600 w-4/5 h-[3px]" />
          </div>
        </div>

        {/* Paper title & constraints */}
        <div className="grid grid-cols-2 text-xs font-serif text-black uppercase font-bold pt-4 select-none">
          <div>
            <div>Course/Topic: <span className="underline">{assignment.topic}</span></div>
            <div>Paper Code: <span className="underline">VA-{assignment._id.substring(19).toUpperCase()}</span></div>
          </div>
          <div className="text-right">
            <div>Maximum Marks: <span className="underline">{assignment.totalMarks} pts</span></div>
            <div>Time Allowed: <span className="underline">{allowedMinutes} Mins</span></div>
          </div>
        </div>

        {/* Student Info Lines (Required in user assignment spec) */}
        <div className="mt-8 border border-slate-600 p-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm font-serif select-none">
          <div className="flex items-center gap-1 bg-transparent">
            <span className="text-slate-800 font-bold">Student Name:</span>
            <input
              type="text"
              placeholder="e.g. Piyush Tripathi"
              className="flex-grow border-b border-slate-800 focus:outline-none focus:border-purple-600 bg-transparent text-black px-1 print-line-input"
            />
          </div>
          <div className="flex items-center gap-1 bg-transparent">
            <span className="text-slate-800 font-bold">Roll Number:</span>
            <input
              type="text"
              placeholder="e.g. 21CS89"
              className="flex-grow border-b border-slate-800 focus:outline-none focus:border-purple-600 bg-transparent text-black px-1 print-line-input"
            />
          </div>
          <div className="flex items-center gap-1 bg-transparent">
            <span className="text-slate-800 font-bold">Section Code:</span>
            <input
              type="text"
              placeholder="e.g. Section A"
              className="flex-grow border-b border-slate-800 focus:outline-none focus:border-purple-600 bg-transparent text-black px-1 print-line-input"
            />
          </div>
        </div>

        <div className="w-full flex justify-center py-6 select-none">
          <div className="border-t-2 border-slate-600 w-full" />
        </div>

        {/* Question Sections */}
        <div className="space-y-8 font-serif">
          {assignment.sections.map((sec, secIdx) => (
            <div key={sec.id} className="space-y-4">
              
              {/* Section Header */}
              <div className="space-y-1 select-none">
                <h3 className="text-base font-bold uppercase text-black font-serif">
                  {sec.title}
                </h3>
                <p className="text-xs italic text-slate-700 font-serif">
                  Instructions: {sec.instructions}
                </p>
              </div>

              {/* Questions List */}
              <div className="space-y-6">
                {sec.questions.map((q, qIdx) => {
                  const isEditing = editingQuestionId === q.id;

                  return (
                    <div
                      key={q.id}
                      className="group relative rounded-lg transition-all border border-transparent p-2 -mx-2 hover:border-purple-200 hover:bg-purple-50/20"
                    >
                      {/* Floating hover editor (only visible on client, hidden on print) */}
                      <div className="absolute top-2 right-2 flex gap-1 bg-white border border-slate-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 no-print p-0.5">
                        <button
                          onClick={() => startEdit(q)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-purple-600 transition"
                          title="Edit Question"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(sec.id, q.id)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600 transition"
                          title="Delete Question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Main Question Body */}
                      <div className="space-y-2">
                        {isEditing ? (
                          // Inline Editing Form
                          <div className="space-y-3 p-3.5 rounded bg-slate-50 border border-slate-200 no-print font-sans text-xs">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full p-2.5 rounded border border-slate-300 text-slate-800 bg-white"
                              rows={3}
                            />
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-semibold">Marks:</span>
                                <input
                                  type="number"
                                  value={editMarks}
                                  onChange={(e) => setEditMarks(Math.max(1, parseInt(e.target.value) || 0))}
                                  className="w-16 p-1 rounded border border-slate-300 text-slate-800 text-center bg-white"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-semibold">Difficulty:</span>
                                <select
                                  value={editDifficulty}
                                  onChange={(e) => setEditDifficulty(e.target.value as any)}
                                  className="p-1 rounded border border-slate-300 text-slate-800 bg-white"
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </select>
                              </div>
                              <div className="ml-auto flex gap-1.5">
                                <button
                                  onClick={() => setEditingQuestionId(null)}
                                  className="px-2.5 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 font-medium transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveQuestion(sec.id, q.id)}
                                  className="px-2.5 py-1 rounded bg-purple-600 text-white hover:bg-purple-500 font-medium flex items-center gap-1 transition"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Save</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Standard Academic Question text
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1.5 flex-grow">
                              <p className="text-sm text-black leading-relaxed font-serif">
                                <span className="font-bold select-none pr-1">Q{qIdx + 1}.</span>
                                {q.questionText}
                              </p>

                              {/* MCQ Option lists */}
                              {q.questionType === 'MCQ' && q.options && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-6 pt-1 select-none">
                                  {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className="text-xs text-slate-800 font-serif leading-relaxed">
                                      <span className="font-bold mr-1">({String.fromCharCode(65 + optIdx)})</span>
                                      {opt}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* True/False Options visual lines */}
                              {q.questionType === 'TrueFalse' && (
                                <div className="pl-6 pt-1 text-[11px] text-slate-600 italic select-none font-serif flex gap-3">
                                  <span>( ) True</span>
                                  <span>( ) False</span>
                                </div>
                              )}

                              {/* Short / Long Answer physical lines (for print look) */}
                              {(q.questionType === 'Short' || q.questionType === 'Long') && (
                                <div className="pl-6 pt-2 space-y-1.5 hidden print:block">
                                  <div className="w-full border-b border-dashed border-slate-300 h-2" />
                                  <div className="w-full border-b border-dashed border-slate-300 h-2" />
                                  {q.questionType === 'Long' && (
                                    <>
                                      <div className="w-full border-b border-dashed border-slate-300 h-2" />
                                      <div className="w-full border-b border-dashed border-slate-300 h-2" />
                                    </>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Marks and Difficulty Pill (Right aligned, styled) */}
                            <div className="flex items-center gap-1.5 shrink-0 select-none">
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase no-print ${
                                  q.difficulty === 'easy'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : q.difficulty === 'medium'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-700 italic shrink-0 whitespace-nowrap font-serif">
                                [{q.marks} Marks]
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Answer Key block (only visible if toggled, hidden on print) */}
                        {showAnswers && q.correctAnswer && !isEditing && (
                          <div className="pl-6 pt-1.5 no-print">
                            <div className="p-2 rounded bg-purple-500/5 border border-purple-500/10 text-xs font-sans text-purple-700 flex gap-2">
                              <span className="font-bold shrink-0">Grading Key:</span>
                              <span>{q.correctAnswer}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
