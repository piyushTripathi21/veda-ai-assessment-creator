'use client';

import React, { useEffect, useState } from 'react';
import { useAssignmentStore, IAssignment } from '../store/useAssignmentStore';
import { useWebSocket } from '../hooks/useWebSocket';
import Header from '../components/Header';
import CreateForm from '../components/CreateForm';
import LiveConsole from '../components/LiveConsole';
import PaperPreview from '../components/PaperPreview';
import AnalyticsPanel from '../components/AnalyticsPanel';
import { 
  Sparkles, 
  FileText, 
  PlusCircle, 
  History, 
  Trash2, 
  Download, 
  RefreshCw, 
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Home() {
  const {
    assignments,
    activeAssignment,
    isGenerating,
    isLoading,
    error,
    fetchAssignments,
    fetchAssignment,
    regenerateAssignment,
    deleteAssignment,
    setActiveAssignment,
    startJob
  } = useAssignmentStore();

  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  // Subscribe to real-time WebSocket updates if a job is generating
  useWebSocket(activeJobId);

  // Load all historic assessments on component mount
  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // Trigger celebration confetti upon success completion
  useEffect(() => {
    if (activeAssignment && activeAssignment.status === 'completed' && activeJobId) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#a855f7', '#6366f1', '#ec4899']
      });
      setActiveJobId(null); // Reset job trigger flag
    }
  }, [activeAssignment, activeJobId]);

  const handleFormSuccess = (assignmentId: string) => {
    setActiveJobId(assignmentId);
    startJob(assignmentId);
  };

  const handleSelectAssignment = async (id: string) => {
    setActiveJobId(null);
    const doc = await fetchAssignment(id);
    if (doc && (doc.status === 'pending' || doc.status === 'processing')) {
      setActiveJobId(doc._id);
      startJob(doc._id);
    }
  };

  const handleRegenerate = async () => {
    if (!activeAssignment) return;
    const success = await regenerateAssignment(activeAssignment._id);
    if (success) {
      setActiveJobId(activeAssignment._id);
      startJob(activeAssignment._id);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid selecting deleted item
    if (confirm('Are you sure you want to delete this assessment paper?')) {
      await deleteAssignment(id);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 no-print">
        
        {/* Error Notification banner */}
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center gap-2 animate-fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT SIDEBAR: History log list */}
          <div className="lg:col-span-4 space-y-6">
            <div className="glass-panel rounded-2xl border border-slate-200/85 p-5 space-y-4 bg-white">
              
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <History className="w-4.5 h-4.5 text-purple-600" />
                  <h2 className="font-outfit font-bold text-sm text-slate-800">Previous Assessments</h2>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-mono border border-slate-200/60 font-bold">
                  {assignments.length} Total
                </span>
              </div>

              {/* Assignments list */}
              <div className="space-y-2 max-h-80 lg:max-h-[500px] overflow-y-auto pr-1">
                {isLoading && assignments.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 animate-pulse">
                    Querying past blueprints...
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl text-xs text-slate-500 space-y-2 bg-slate-50/50">
                    <FileText className="w-6 h-6 mx-auto text-slate-400 animate-pulse" />
                    <p className="font-medium text-slate-700">No assessment blueprints saved</p>
                    <p className="text-[10px] text-slate-400">Draft one on the right to start</p>
                  </div>
                ) : (
                  assignments.map((item) => {
                    const isActive = activeAssignment?._id === item._id;
                    const isProcessing = item.status === 'pending' || item.status === 'processing';

                    return (
                      <div
                        key={item._id}
                        onClick={() => handleSelectAssignment(item._id)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all duration-300 flex items-center justify-between group ${
                          isActive
                            ? 'border-purple-500 bg-purple-50 shadow-md shadow-purple-500/5'
                            : 'border-slate-100 bg-slate-50 hover:bg-slate-100/60'
                        }`}
                      >
                        <div className="space-y-1 pr-3 flex-grow min-w-0">
                          <span className="font-semibold text-xs text-slate-800 block truncate leading-tight">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-500 block truncate font-medium">
                            Topic: {item.topic}
                          </span>
                          <div className="flex gap-2 items-center pt-1.5">
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200/50 text-slate-600 font-mono font-medium">
                              {item.totalQuestions} Questions
                            </span>
                            {isProcessing ? (
                              <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-bold tracking-wider uppercase animate-pulse border border-purple-200/60">
                                Compiling...
                              </span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 font-mono font-bold border border-purple-100">
                                {item.totalMarks} Marks
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDelete(item._id, e)}
                          className="p-1.5 rounded-lg border border-transparent hover:border-red-100 hover:bg-red-50 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                          title="Delete Assessment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Add New Button */}
              {activeAssignment && (
                <button
                  onClick={() => setActiveAssignment(null)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-purple-300 bg-purple-50 hover:bg-purple-100/60 text-purple-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Draft New Assessment</span>
                </button>
              )}

            </div>
          </div>

          {/* RIGHT VIEW PANEL: Create Form, Live Console, or Output Preview */}
          <div className="lg:col-span-8 space-y-6">
            
            {isGenerating ? (
              // Stage 1: Websocket streaming progress terminal
              <LiveConsole />
            ) : activeAssignment && activeAssignment.status === 'completed' ? (
              
              // Stage 2: Loaded exam sheet page (Split view with controller panel & PDF engine)
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
                
                {/* Control Panel (PDF engine triggers, analytics) */}
                <div className="md:col-span-4 space-y-4">
                  <div className="glass-panel rounded-2xl border border-slate-200/80 p-4 space-y-4 bg-white">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block select-none">Assessment</span>
                      <h2 className="font-outfit font-bold text-base text-slate-800 truncate leading-tight">
                        {activeAssignment.title}
                      </h2>
                    </div>

                    <div className="space-y-2">
                      <button
                        onClick={handlePrint}
                        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-purple-500/10 cursor-pointer animate-pulse-subtle"
                      >
                        <Download className="w-4 h-4" />
                        <span>Export Institutional PDF</span>
                      </button>

                      <button
                        onClick={handleRegenerate}
                        className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-purple-600" />
                        <span>Re-generate Assessment</span>
                      </button>
                    </div>
                  </div>

                  {/* Assessment Analytics Summary */}
                  <div className="glass-panel rounded-2xl border border-slate-200/80 p-4 bg-white">
                    <AnalyticsPanel assignment={activeAssignment} />
                  </div>
                </div>

                {/* Physical Assessment Sheet Page */}
                <div className="md:col-span-8">
                  <PaperPreview assignment={activeAssignment} />
                </div>

              </div>
            ) : (
              // Stage 3: Assessment Drafting Form
              <div className="glass-panel rounded-2xl border border-slate-200/80 p-6 sm:p-8 space-y-6 relative bg-white">
                <div className="space-y-1 border-b border-slate-100 pb-4 select-none">
                  <div className="flex items-center gap-1.5 text-purple-600 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    <span>AI Engine Console</span>
                  </div>
                  <h1 className="font-outfit font-bold text-2xl text-slate-800">Create New Assessment Blueprint</h1>
                  <p className="text-slate-500 text-xs sm:text-sm">
                    Feed in your topics, adjust Bloom's taxonomy, choose styles, and watch the AI engineer build your exams.
                  </p>
                </div>

                <CreateForm onSuccess={handleFormSuccess} />
              </div>
            )}

          </div>
        </div>
      </div>

      {/* PRINT MEDIA ONLY BANNER */}
      <div className="hidden print:block text-[10px] text-center text-slate-400 font-serif border-t border-slate-200 mt-12 pt-4 select-none">
        Exam paper generated organically using VedaAI Assessment Suite. All rights reserved.
      </div>
    </div>
  );
}
