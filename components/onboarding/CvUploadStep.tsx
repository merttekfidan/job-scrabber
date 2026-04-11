'use client';

import React, { useCallback, useState } from 'react';
import { Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import type { CvExtracted } from '@/types/onboarding';

type CvUploadStepProps = {
  onUploadComplete: (extracted: CvExtracted) => void;
  uploadCv: (file: File) => void;
  isUploading: boolean;
};

export const CvUploadStep = ({ onUploadComplete, uploadCv, isUploading }: CvUploadStepProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      const isValid = file.name.endsWith('.pdf') || file.name.endsWith('.txt') || file.name.endsWith('.doc') || file.name.endsWith('.docx');
      if (!isValid) {
        alert('Please upload a PDF or text file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File too large. Maximum 10MB.');
        return;
      }
      setFileName(file.name);
      uploadCv(file);
    },
    [uploadCv]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback(() => setDragActive(false), []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">Upload Your CV</h2>
        <p className="mt-2 text-gray-400">
          We&apos;ll analyze your experience to personalize everything for you.
        </p>
      </div>

      <label
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative flex w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all duration-200 ${
          dragActive
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
        }`}
        tabIndex={0}
        aria-label="Upload CV file"
        role="button"
      >
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleInputChange}
          disabled={isUploading}
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={48} className="animate-spin text-indigo-400" />
            <p className="text-sm text-gray-300">Analyzing your CV with AI...</p>
            <p className="text-xs text-gray-500">This may take 10-15 seconds</p>
          </div>
        ) : fileName ? (
          <div className="flex flex-col items-center gap-3">
            <FileText size={48} className="text-indigo-400" />
            <p className="text-sm text-white">{fileName}</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload size={48} className="text-gray-500" />
            <p className="text-sm text-gray-300">Drop your CV here or click to browse</p>
            <p className="text-xs text-gray-500">PDF or text files, max 10MB</p>
          </div>
        )}
      </label>
    </div>
  );
};
