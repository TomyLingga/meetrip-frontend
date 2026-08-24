'use client';

import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { UploadCloud, FileText, X, Image as ImageIcon } from 'lucide-react';

import { useAlert } from '@/context/FeedbackContext';

interface DragDropUploadProps {
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  existingFileName?: string | null;
  existingFilePath?: string | null;
  onClearExisting?: () => void;
  accept?: string;
  maxSizeMB?: number;
}

export default function DragDropUpload({
  onFileSelect,
  selectedFile,
  existingFileName,
  existingFilePath,
  onClearExisting,
  accept = '.pdf,image/*',
  maxSizeMB = 5,
}: DragDropUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { showAlert } = useAlert();

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateAndSelectFile = (file: File | null) => {
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      showAlert(`Ukuran file maksimal adalah ${maxSizeMB}MB`, 'error');
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  const handleRemove = () => {
    onFileSelect(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const hasFile = !!selectedFile || !!existingFileName;

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleChange}
      />

      {!hasFile ? (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
            isDragActive
              ? 'border-teal-500 bg-teal-500/5 dark:bg-teal-500/10'
              : 'border-slate-200 hover:border-teal-400 dark:border-slate-800 dark:hover:border-teal-900/60 bg-surface-card hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
          }`}
        >
          <div className="p-3 rounded-full bg-surface-sunken border border-slate-200/70 dark:border-white/[0.05] mb-3 shadow-neu-in-sm group-hover:scale-105 transition-transform">
            <UploadCloud className="h-5 w-5 text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 text-center">
            Pilih file atau seret & jatuhkan di sini
          </p>
          <p className="text-[10px] text-slate-400 mt-1 text-center">
            Maks. {maxSizeMB}MB (PDF, PNG, JPG)
          </p>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-white/[0.06] bg-surface-card shadow-neu-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/20 shrink-0">
              {selectedFile?.type.startsWith('image/') || existingFileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <ImageIcon className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-400 truncate">
                {selectedFile ? selectedFile.name : existingFileName}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                {selectedFile ? formatBytes(selectedFile.size) : 'Berkas Tersimpan'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (selectedFile) {
                handleRemove();
              } else if (onClearExisting) {
                onClearExisting();
              }
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
