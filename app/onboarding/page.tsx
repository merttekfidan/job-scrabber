'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { CvUploadStep } from '@/components/onboarding/CvUploadStep';
import { ProfileReviewStep } from '@/components/onboarding/ProfileReviewStep';
import { QuestionsStep } from '@/components/onboarding/QuestionsStep';
import {
  useOnboardingStatus,
  useUploadCv,
  useGenerateQuestions,
  useCompleteOnboarding,
} from '@/hooks/use-onboarding';
import type { CvExtracted, OnboardingQuestion, OnboardingAnswer } from '@/types/onboarding';

type Step = 'upload' | 'review' | 'questions' | 'complete';

const STEPS: { id: Step; label: string }[] = [
  { id: 'upload', label: 'Upload CV' },
  { id: 'review', label: 'Review Profile' },
  { id: 'questions', label: 'Quick Questions' },
  { id: 'complete', label: 'Done' },
];

const OnboardingPage = () => {
  const router = useRouter();
  const { data: status } = useOnboardingStatus();
  const uploadCvMutation = useUploadCv();
  const generateQuestionsMutation = useGenerateQuestions();
  const completeOnboardingMutation = useCompleteOnboarding();

  const [step, setStep] = useState<Step>('upload');
  const [extractedProfile, setExtractedProfile] = useState<CvExtracted | null>(null);
  const [questions, setQuestions] = useState<OnboardingQuestion[]>([]);

  useEffect(() => {
    if (status?.onboardingCompleted) {
      router.push('/kanban');
    }
  }, [status?.onboardingCompleted, router]);

  const handleCvUploaded = useCallback(
    (file: File) => {
      uploadCvMutation.mutate(file, {
        onSuccess: (data) => {
          setExtractedProfile(data.extracted);
          setStep('review');
        },
      });
    },
    [uploadCvMutation]
  );

  const handleReviewContinue = useCallback(() => {
    generateQuestionsMutation.mutate(undefined, {
      onSuccess: (data) => {
        setQuestions(data.questions || []);
        setStep('questions');
      },
    });
  }, [generateQuestionsMutation]);

  const handleQuestionsComplete = useCallback(
    (answers: OnboardingAnswer[]) => {
      completeOnboardingMutation.mutate(answers, {
        onSuccess: () => {
          setStep('complete');
          setTimeout(() => router.push('/kanban'), 2000);
        },
      });
    },
    [completeOnboardingMutation, router]
  );

  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0b0f]">
      <header className="border-b border-white/5 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <Sparkles size={20} className="text-indigo-400" />
          <span className="text-lg font-bold text-white">HuntIQ</span>
          <span className="text-sm text-gray-500">Setup</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        <div className="mb-10 flex items-center justify-center gap-2">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    i < currentStepIndex
                      ? 'bg-green-500/20 text-green-400'
                      : i === currentStepIndex
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/5 text-gray-600'
                  }`}
                >
                  {i < currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:inline ${
                    i === currentStepIndex ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-8 ${
                    i < currentStepIndex ? 'bg-green-500/50' : 'bg-white/10'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {step === 'upload' && (
          <CvUploadStep
            onUploadComplete={(ext) => {
              setExtractedProfile(ext);
              setStep('review');
            }}
            uploadCv={handleCvUploaded}
            isUploading={uploadCvMutation.isPending}
          />
        )}

        {step === 'review' && extractedProfile && (
          <ProfileReviewStep
            profile={extractedProfile}
            onContinue={handleReviewContinue}
          />
        )}

        {step === 'questions' && questions.length > 0 && (
          <QuestionsStep
            questions={questions}
            onComplete={handleQuestionsComplete}
            isSubmitting={completeOnboardingMutation.isPending}
          />
        )}

        {step === 'complete' && (
          <div className="flex flex-col items-center gap-4 py-16">
            <CheckCircle2 size={64} className="text-green-400" />
            <h2 className="text-2xl font-bold text-white">You&apos;re All Set!</h2>
            <p className="text-gray-400">Redirecting to your board...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
