'use client';

import React from 'react';
import { BarChart3, Clock, Award, Sparkles } from 'lucide-react';
import { IAssignment } from '../store/useAssignmentStore';

interface AnalyticsPanelProps {
  assignment: IAssignment;
}

export default function AnalyticsPanel({ assignment }: AnalyticsPanelProps) {
  const { sections, difficultyDistribution } = assignment;

  // 1. Calculate question breakdown
  let mcqCount = 0;
  let tfCount = 0;
  let shortCount = 0;
  let longCount = 0;

  sections.forEach((sec) => {
    sec.questions.forEach((q) => {
      if (q.questionType === 'MCQ') mcqCount++;
      else if (q.questionType === 'TrueFalse') tfCount++;
      else if (q.questionType === 'Short') shortCount++;
      else if (q.questionType === 'Long') longCount++;
    });
  });

  const totalQuestions = mcqCount + tfCount + shortCount + longCount;

  // 2. Calculate dynamic exam duration based on question styles
  const estimatedDuration = Math.round(
    mcqCount * 2 +
    tfCount * 1.5 +
    shortCount * 7 +
    longCount * 20
  );

  return (
    <div className="w-full space-y-4 no-print">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
        <BarChart3 className="w-4 h-4 text-purple-600" />
        <h3 className="font-outfit font-bold text-sm text-slate-800">Paper Cognitive Analytics</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Metric Card 1 */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold leading-none">Est. Duration</span>
            <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">{estimatedDuration} Mins</span>
          </div>
        </div>

        {/* Metric Card 2 */}
        <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-50 text-purple-600 shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block font-semibold leading-none">Avg. Points / Item</span>
            <span className="text-sm font-bold font-mono text-slate-800 mt-1 block">
              {(assignment.totalMarks / (totalQuestions || 1)).toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>

      {/* Difficulty Distribution Chart */}
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">Difficulty Load Balance</span>
          <span className="text-[10px] text-purple-600 flex items-center gap-1 font-mono font-bold bg-purple-50 px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> Balanced
          </span>
        </div>

        <div className="space-y-2">
          {/* Easy */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Easy (Remembering)</span>
              <span className="font-bold text-slate-700">{difficultyDistribution.easy}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${difficultyDistribution.easy}%` }} />
            </div>
          </div>

          {/* Medium */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Moderate (Application)</span>
              <span className="font-bold text-slate-700">{difficultyDistribution.medium}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${difficultyDistribution.medium}%` }} />
            </div>
          </div>

          {/* Hard */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Hard (Synthesis/Critical)</span>
              <span className="font-bold text-slate-700">{difficultyDistribution.hard}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200/60 overflow-hidden">
              <div className="h-full bg-rose-50 rounded-full" style={{ width: `${difficultyDistribution.hard}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Question Style Breakdown */}
      <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
        <span className="text-xs font-semibold text-slate-700 block mb-2">Structure Breakdown</span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {mcqCount > 0 && (
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Multiple Choice</span>
              <span className="font-mono text-slate-800 font-bold">{mcqCount}</span>
            </div>
          )}
          {tfCount > 0 && (
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">True or False</span>
              <span className="font-mono text-slate-800 font-bold">{tfCount}</span>
            </div>
          )}
          {shortCount > 0 && (
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Short Answers</span>
              <span className="font-mono text-slate-800 font-bold">{shortCount}</span>
            </div>
          )}
          {longCount > 0 && (
            <div className="flex justify-between border-b border-slate-100 pb-1">
              <span className="text-slate-500">Long Essays</span>
              <span className="font-mono text-slate-800 font-bold">{longCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
