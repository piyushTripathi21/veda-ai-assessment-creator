'use client';

import React, { useEffect, useRef } from 'react';
import { Terminal, Cpu, Info, AlertTriangle, CheckCircle, Flame } from 'lucide-react';
import { useAssignmentStore } from '../store/useAssignmentStore';

export default function LiveConsole() {
  const { generationLogs, generationProgress } = useAssignmentStore();
  const consoleEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [generationLogs]);

  return (
    <div className="w-full glass-panel rounded-2xl border border-slate-200 p-5 space-y-5 relative overflow-hidden shadow-xl bg-white">
      {/* Top Console header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5 select-none">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5 ml-2 select-none">
            <Terminal className="w-3.5 h-3.5 text-purple-600" />
            veda-engine-worker://log-stream
          </span>
        </div>
        <div className="flex items-center gap-1 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full select-none">
          <Cpu className="w-3 h-3 text-purple-600 animate-spin" />
          <span className="text-[10px] font-bold text-purple-600 tracking-wider">CREATING PAPER</span>
        </div>
      </div>

      {/* Progress metrics */}
      <div className="space-y-2">
        <div className="flex justify-between items-end select-none">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-500 block font-semibold">Synthesis Processing Status</span>
            <span className="text-[10px] text-purple-600 block font-mono">Formulating Bloom's Cognitive Weights...</span>
          </div>
          <span className="text-2xl font-bold font-mono text-purple-600">{generationProgress}%</span>
        </div>

        {/* Custom loading bar */}
        <div className="w-full h-2.5 rounded-full bg-slate-100 border border-slate-200/50 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 transition-all duration-500 ease-out"
            style={{ width: `${generationProgress}%` }}
          />
        </div>
      </div>

      {/* Real-time Logs Console Box */}
      <div className="h-60 rounded-xl bg-slate-950 border border-slate-800 font-mono p-4 overflow-y-auto text-xs space-y-2.5 relative">
        {generationLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center flex-col gap-2 text-slate-500">
            <Flame className="w-8 h-8 animate-pulse text-purple-500/40" />
            <span>Establishing connection with job worker...</span>
          </div>
        ) : (
          generationLogs.map((log, idx) => {
            let icon = <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />;
            let textColor = 'text-slate-300';
            
            if (log.type === 'success') {
              icon = <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
              textColor = 'text-emerald-300 font-semibold';
            } else if (log.type === 'warning') {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
              textColor = 'text-amber-300';
            } else if (log.type === 'error') {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />;
              textColor = 'text-red-300 font-semibold';
            }

            return (
              <div key={idx} className="flex gap-2 items-start animate-fade-in leading-relaxed">
                <span className="text-[10px] text-slate-500 select-none shrink-0 mt-0.5">[{log.timestamp}]</span>
                {icon}
                <span className={`${textColor} break-all`}>{log.message}</span>
              </div>
            );
          })
        )}
        <div ref={consoleEndRef} />
      </div>

      {/* Small terminal instruction details */}
      <div className="text-[10px] text-slate-400 flex justify-between select-none">
        <span>Worker Instance: veda-worker-node-1</span>
        <span className="animate-pulse">● Live streaming progress via Socket.io</span>
      </div>
    </div>
  );
}
