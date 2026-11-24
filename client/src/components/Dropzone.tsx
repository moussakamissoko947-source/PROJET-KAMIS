import React, { useRef, useState } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';
import { formatBytes } from '../utils/formatters';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  maxSizeBytes: number;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, maxSizeBytes }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        isDragOver
          ? 'border-indigo-600 bg-indigo-50/60 scale-[1.01]'
          : 'border-slate-200 hover:border-indigo-300 bg-white/60 hover:bg-white'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleChange}
        className="hidden"
      />

      <div className="flex flex-col items-center justify-center gap-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
          isDragOver ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-indigo-50 text-indigo-600'
        }`}>
          <UploadCloud className="w-7 h-7" />
        </div>

        <div>
          <p className="text-base font-bold text-slate-800">
            Glissez-déposez vos fichiers ici, ou <span className="text-indigo-600 underline">parcourez votre appareil</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tous types de documents, photos, vidéos, archives acceptés (max. {formatBytes(maxSizeBytes)} par fichier).
          </p>
        </div>
      </div>
    </div>
  );
};
