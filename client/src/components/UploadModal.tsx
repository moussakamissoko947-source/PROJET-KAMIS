import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { formatBytes } from '../utils/formatters';
import { api } from '../api/client';
import { FileItem, StorageUsage } from '../types';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: FileItem;
}

interface UploadModalProps {
  filesToUpload: File[];
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (newFiles: FileItem[], updatedStorage: StorageUsage) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  filesToUpload,
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (filesToUpload.length > 0) {
      const initialItems: UploadItem[] = filesToUpload.map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        progress: 0,
        status: 'pending'
      }));
      setItems(initialItems);
    }
  }, [filesToUpload]);

  useEffect(() => {
    if (isOpen && items.length > 0 && !isProcessing) {
      processUploads();
    }
  }, [isOpen, items.length]);

  const processUploads = async () => {
    setIsProcessing(true);
    const completedFiles: FileItem[] = [];
    let latestStorage: StorageUsage | null = null;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.status === 'completed') continue;

      // Update state to uploading
      setItems((prev) =>
        prev.map((it, idx) => (idx === i ? { ...it, status: 'uploading' } : it))
      );

      try {
        const res = await api.files.upload(item.file, (percent) => {
          setItems((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, progress: percent } : it))
          );
        });

        completedFiles.push(res.file);
        latestStorage = res.storage;

        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'completed', progress: 100, uploadedFile: res.file } : it
          )
        );
      } catch (err: any) {
        setItems((prev) =>
          prev.map((it, idx) =>
            idx === i ? { ...it, status: 'error', error: err.message || 'Erreur lors du téléversement' } : it
          )
        );
      }
    }

    setIsProcessing(false);
    if (completedFiles.length > 0 && latestStorage) {
      onUploadSuccess(completedFiles, latestStorage);
    }
  };

  if (!isOpen) return null;

  const totalCount = items.length;
  const completedCount = items.filter((it) => it.status === 'completed').length;
  const errorCount = items.filter((it) => it.status === 'error').length;
  const isFinished = !isProcessing && (completedCount + errorCount === totalCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Téléversement en cours ({completedCount}/{totalCount})
              </h3>
              <p className="text-xs text-slate-500">
                {isProcessing ? 'Envoi sécurisé vers votre coffre-fort privé...' : 'Opération terminée'}
              </p>
            </div>
          </div>
          {isFinished && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* File items list */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <span className="font-semibold text-slate-800 truncate max-w-[260px]">
                  {item.file.name}
                </span>
                <span className="text-slate-400 flex-shrink-0">{formatBytes(item.file.size)}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-200 ${
                    item.status === 'completed'
                      ? 'bg-emerald-500'
                      : item.status === 'error'
                      ? 'bg-rose-500'
                      : 'bg-indigo-600'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>

              {/* Status footer */}
              <div className="flex items-center justify-between text-[11px]">
                {item.status === 'uploading' && (
                  <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Envoi... {item.progress} %
                  </span>
                )}
                {item.status === 'completed' && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Enregistré en lieu sûr
                  </span>
                )}
                {item.status === 'error' && (
                  <span className="flex items-center gap-1 text-rose-600 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {item.error || 'Échec du transfert'}
                  </span>
                )}
                {item.status === 'pending' && (
                  <span className="text-slate-400">En attente...</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isProcessing
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
            }`}
          >
            {isFinished ? 'Terminé' : 'Patientez...'}
          </button>
        </div>
      </div>
    </div>
  );
};
