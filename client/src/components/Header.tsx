'use client';

import React from 'react';
import { Cpu, Sparkles, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-xl bg-purple-600/10 border border-purple-500/20 group-hover:border-purple-500/40 transition-colors duration-300">
            <Cpu className="w-5 h-5 text-purple-600 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <span className="font-outfit font-bold text-xl tracking-wide bg-gradient-to-r from-slate-950 via-slate-800 to-purple-600 bg-clip-text text-transparent">
            Veda<span className="text-purple-600">AI</span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1 bg-slate-100 border border-slate-200/60 rounded-full px-3 py-1 text-xs text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" />
            <span>AI Assessment Creator Suite</span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 hover:bg-slate-50 text-slate-700 transition duration-200"
          >
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
