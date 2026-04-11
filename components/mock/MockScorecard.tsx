'use client';

import React from 'react';
import { Trophy, TrendingUp, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MockSessionDebrief } from '@/types/mock';

type MockScorecardProps = {
  debrief: MockSessionDebrief;
  onStartNew: () => void;
};

const VERDICT_COLORS: Record<string, string> = {
  Strong: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Good: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Needs Work': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Weak: 'text-red-400 bg-red-500/10 border-red-500/20',
};

const DECISION_COLORS: Record<string, string> = {
  'Strong Hire': 'text-emerald-400',
  'Hire': 'text-green-400',
  'Lean Hire': 'text-yellow-400',
  'Lean No Hire': 'text-orange-400',
  'No Hire': 'text-red-400',
};

const ScoreBar = ({ label, score }: { label: string; score: number }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-xs">
      <span className="text-gray-400 capitalize">{label}</span>
      <span className="text-white font-bold">{score}</span>
    </div>
    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${score}%`,
          background: score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444',
        }}
      />
    </div>
  </div>
);

export const MockScorecard = ({ debrief, onStartNew }: MockScorecardProps) => {
  const decisionColor = DECISION_COLORS[debrief.hiringDecision] ?? 'text-gray-400';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <span className="text-2xl font-black text-white">{debrief.overallScore}/100</span>
          <span className="text-lg font-bold text-gray-400">({debrief.grade})</span>
        </div>
        <p className={`text-sm font-bold ${decisionColor}`}>{debrief.hiringDecision}</p>
        <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">{debrief.summary}</p>
      </div>

      {/* Category scores */}
      {Object.keys(debrief.categoryScores).length > 0 && (
        <div className="bg-gray-800/30 rounded-xl border border-gray-700/40 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category Scores</p>
          {Object.entries(debrief.categoryScores).map(([key, val]) => (
            <ScoreBar key={key} label={key} score={val} />
          ))}
        </div>
      )}

      {/* Strengths */}
      {debrief.topStrengths.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp size={12} /> Top Strengths
          </p>
          {debrief.topStrengths.map((s, i) => (
            <div key={i} className="bg-emerald-500/5 border border-emerald-500/15 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold text-emerald-300">{s.strength}</p>
              {s.evidence && <p className="text-xs text-gray-500 italic">"{s.evidence}"</p>}
            </div>
          ))}
        </div>
      )}

      {/* Improvements */}
      {debrief.topImprovements.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertCircle size={12} /> Top Improvements
          </p>
          {debrief.topImprovements.map((imp, i) => (
            <div key={i} className="bg-orange-500/5 border border-orange-500/15 rounded-lg p-3 space-y-1.5">
              <p className="text-xs font-semibold text-orange-300">{imp.area}</p>
              <p className="text-xs text-gray-400">{imp.howToFix}</p>
              {imp.practiceExercise && (
                <p className="text-xs text-gray-500 bg-gray-800/40 rounded px-2 py-1">
                  📝 {imp.practiceExercise}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Q-by-Q feedback */}
      {debrief.answerByAnswerFeedback.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Answer-by-Answer</p>
          {debrief.answerByAnswerFeedback.map((fb) => {
            const verdictClass = VERDICT_COLORS[fb.verdict] ?? 'text-gray-400 bg-gray-800 border-gray-700';
            return (
              <div key={fb.questionNumber} className="bg-gray-800/30 border border-gray-700/40 rounded-lg p-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500">Q{fb.questionNumber}</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictClass}`}>
                      {fb.verdict}
                    </span>
                    <span className="text-xs font-bold text-white">{fb.score}/100</span>
                  </div>
                </div>
                <p className="text-xs text-gray-300">{fb.feedback}</p>
                {fb.rewriteSuggestion && (
                  <p className="text-xs text-blue-400 bg-blue-500/5 rounded px-2 py-1 border border-blue-500/15">
                    💡 {fb.rewriteSuggestion}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Next focus */}
      {debrief.nextSessionFocus && (
        <div className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-3">
          <p className="text-xs font-semibold text-purple-400 mb-1">🎯 Next Session Focus</p>
          <p className="text-xs text-gray-300">{debrief.nextSessionFocus}</p>
        </div>
      )}

      <Button
        className="w-full bg-purple-600 hover:bg-purple-700 border-none gap-2"
        onClick={onStartNew}
      >
        <RotateCcw size={14} /> Start Another Mock
      </Button>
    </div>
  );
};
