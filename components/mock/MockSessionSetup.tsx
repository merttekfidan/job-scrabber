'use client';

import React, { useState } from 'react';
import { Mic, Zap, Target, Brain, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MockDifficulty, MockRoundType } from '@/types/mock';

type MockSessionSetupProps = {
  onStart: (roundType: MockRoundType, difficulty: MockDifficulty) => void;
  isPending: boolean;
  defaultRoundType?: MockRoundType;
};

const ROUND_TYPES: { value: MockRoundType; label: string; desc: string }[] = [
  { value: 'Screening', label: 'Screening', desc: 'Fit, background, salary expectations' },
  { value: 'Technical', label: 'Technical', desc: 'Skills, system design, coding concepts' },
  { value: 'Behavioral', label: 'Behavioral', desc: 'STAR stories, leadership, conflict' },
  { value: 'Final', label: 'Final Round', desc: 'Culture fit, strategy, vision alignment' },
];

const DIFFICULTIES: { value: MockDifficulty; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'Easy', label: 'Easy', color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10', icon: <Zap size={14} /> },
  { value: 'Medium', label: 'Medium', color: 'border-yellow-500/40 text-yellow-400 bg-yellow-500/10', icon: <Target size={14} /> },
  { value: 'Hard', label: 'Hard', color: 'border-red-500/40 text-red-400 bg-red-500/10', icon: <Brain size={14} /> },
];

export const MockSessionSetup = ({ onStart, isPending, defaultRoundType = 'Technical' }: MockSessionSetupProps) => {
  const [roundType, setRoundType] = useState<MockRoundType>(defaultRoundType);
  const [difficulty, setDifficulty] = useState<MockDifficulty>('Medium');

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
          <Mic size={22} className="text-purple-400" />
        </div>
        <h3 className="text-base font-bold text-white">Mock Interview</h3>
        <p className="text-xs text-gray-500 max-w-xs mx-auto">
          Practice with an AI hiring manager. Get real-time questions and a detailed scorecard after.
        </p>
      </div>

      {/* Round type */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Round Type</p>
        <div className="grid grid-cols-2 gap-2">
          {ROUND_TYPES.map((rt) => (
            <button
              key={rt.value}
              type="button"
              onClick={() => setRoundType(rt.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                roundType === rt.value
                  ? 'border-purple-500/60 bg-purple-500/10'
                  : 'border-gray-700/50 bg-gray-800/30 hover:border-gray-600'
              }`}
              aria-pressed={roundType === rt.value}
              tabIndex={0}
            >
              <p className={`text-xs font-bold ${roundType === rt.value ? 'text-purple-300' : 'text-white'}`}>{rt.label}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{rt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Difficulty</p>
        <div className="flex gap-2">
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => setDifficulty(d.value)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-semibold transition-all ${
                difficulty === d.value ? d.color : 'border-gray-700/50 text-gray-500 hover:border-gray-600'
              }`}
              aria-pressed={difficulty === d.value}
              tabIndex={0}
            >
              {d.icon} {d.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 border-none gap-2"
        onClick={() => onStart(roundType, difficulty)}
        disabled={isPending}
      >
        {isPending ? (
          <><RefreshCw size={14} className="animate-spin" /> Preparing Interview…</>
        ) : (
          <><Mic size={14} /> Start Mock Interview</>
        )}
      </Button>
    </div>
  );
};
