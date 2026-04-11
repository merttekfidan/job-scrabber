'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Send, RefreshCw, StopCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MockProgressBar } from './MockProgressBar';

type MockSessionInterfaceProps = {
  sessionId: number;
  firstQuestion: string;
  totalQuestions: number;
  onSubmitAnswer: (questionIndex: number, answer: string) => Promise<{
    nextQuestion: string;
    isLastQuestion: boolean;
    questionsAnswered: number;
  }>;
  onEndSession: () => void;
  isSubmitting: boolean;
  isEnding: boolean;
};

type Message = {
  role: 'interviewer' | 'candidate';
  text: string;
};

export const MockSessionInterface = ({
  firstQuestion,
  totalQuestions,
  onSubmitAnswer,
  onEndSession,
  isSubmitting,
  isEnding,
}: MockSessionInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([{ role: 'interviewer', text: firstQuestion }]);
  const [answer, setAnswer] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [isLastQuestion, setIsLastQuestion] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;

  const handleSubmit = useCallback(async () => {
    if (!answer.trim() || isSubmitting) return;
    const myAnswer = answer.trim();
    setMessages((prev) => [...prev, { role: 'candidate', text: myAnswer }]);
    setAnswer('');

    const result = await onSubmitAnswer(questionIndex, myAnswer);
    setQuestionsAnswered(result.questionsAnswered);
    setIsLastQuestion(result.isLastQuestion);
    setQuestionIndex((i) => i + 1);
    setMessages((prev) => [...prev, { role: 'interviewer', text: result.nextQuestion }]);
  }, [answer, isSubmitting, questionIndex, onSubmitAnswer]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Progress */}
      <MockProgressBar current={questionsAnswered} total={totalQuestions} />

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-[300px] max-h-[400px] pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'interviewer'
                ? 'bg-gray-800/60 border border-gray-700/50 text-gray-200'
                : 'bg-purple-600/20 border border-purple-500/30 text-white'
            }`}>
              {msg.role === 'interviewer' && (
                <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Interviewer</p>
              )}
              {msg.text}
            </div>
          </div>
        ))}
        {isSubmitting && (
          <div className="flex justify-start">
            <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isLastQuestion ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            className="w-full bg-gray-900/60 border border-gray-700/50 rounded-xl p-3 text-sm text-gray-200 outline-none resize-none placeholder:text-gray-600 focus:border-purple-500/50 transition-colors min-h-[100px]"
            placeholder="Type your answer… (Ctrl+Enter to submit)"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            aria-label="Your answer"
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <span>⏱ {formatTime(elapsed)}</span>
              <span>{wordCount} words</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-red-400/70 hover:text-red-400 gap-1.5"
                onClick={onEndSession}
                disabled={isEnding}
                aria-label="End session early"
              >
                <StopCircle size={13} /> End Early
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-purple-600 hover:bg-purple-700 border-none gap-1.5"
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                aria-label="Submit answer"
              >
                {isSubmitting ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center space-y-3 py-4">
          <p className="text-sm text-gray-400">All questions answered. Ready for your scorecard?</p>
          <Button
            className="bg-purple-600 hover:bg-purple-700 border-none gap-2"
            onClick={onEndSession}
            disabled={isEnding}
          >
            {isEnding ? <><RefreshCw size={14} className="animate-spin" /> Generating Scorecard…</> : '📊 Get My Scorecard'}
          </Button>
        </div>
      )}
    </div>
  );
};
