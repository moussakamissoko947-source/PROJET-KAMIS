import React, { useState, useEffect } from 'react';
import { Download, X, FileText, Image as ImageIcon, Film, Music, AlertCircle } from 'lucide-react';
import { FileItem } from '../types';
import { api } from '../api/client';
import { formatBytes, formatDate, getFileCategory } from '../utils/formatters';

interface FilePreviewModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: (file: FileItem) => void;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  isOpen,
  onClose,
  onDownload
}) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoadingText, setIsLoadingText] = useState(false);

  useEffect(() => {
    if (file && isOpen) {
      const category = getFileCategory(file.content_type_claimed, file.original_name);
      if (category === 'documents' && file.content_type_claimed.includes('text') || file.original_name.endsWith('.txt')) {
        setIsLoadingText(true);
        fetch(api.files.getPreviewUrl(file.id), { credentials: 'include' })
          .then((res) => res.text())
          .then((txt) => setTextContent(txt))
          .catch(() => setTextContent('Impossible de charger le texte'))
          .finally(() => setIsLoadingText(false));
      } else {
        setTextContent(null);
      }
    }
  }, [file, isOpen]);

  if (!isOpen || !file) return null;

  const category = getFileCategory(file.content_type_claimed, file.original_name);
  const previewUrl = api.files.getPreviewUrl(file.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              {category === 'images' && <ImageIcon className="w-5 h-5" />}
              {category === 'videos' && <Film className="w-5 h-5" />}
              {category === 'audio' && <Music className="w-5 h-5" />}
              {category === 'documents' && <FileText className="w-5 h-5" />}
              {category === 'archives' && <FileText className="w-5 h-5" />}
              {category === 'others' && <FileText className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                {file.original_name}
              </h3>
              <p className="text-xs text-slate-400">
                {formatBytes(file.size_bytes)} • Ajouté le {formatDate(file.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(file)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto py-6 flex items-center justify-center min-h-[300px] bg-slate-50/50 rounded-xl my-4">
          {category === 'images' ? (
            <img
              src={previewUrl}
              alt={file.original_name}
              className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
            />
          ) : category === 'videos' ? (
            <video
              src={previewUrl}
              controls
              className="max-h-[60vh] max-w-full rounded-lg shadow-sm"
            />
          ) : category === 'audio' ? (
            <div className="w-full max-w-md p-6 bg-white rounded-2xl shadow-sm text-center">
              <Music className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
              <p className="font-semibold text-slate-800 mb-4">{file.original_name}</p>
              <audio src={previewUrl} controls className="w-full" />
            </div>
          ) : textContent !== null ? (
            <div className="w-full h-full p-4">
              {isLoadingText ? (
                <div className="text-slate-400 text-sm text-center">Chargement...</div>
              ) : (
                <pre className="text-xs text-slate-700 font-mono bg-white p-4 rounded-xl border border-slate-200 overflow-x-auto max-h-[55vh] whitespace-pre-wrap">
                  {textContent}
                </pre>
              )}
            </div>
          ) : file.content_type_claimed.includes('pdf') || file.original_name.endsWith('.pdf') ? (
            <div className="text-center p-8">
              <FileText className="w-16 h-16 text-rose-500 mx-auto mb-3" />
              <p className="font-bold text-slate-800">Document PDF</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Pour une visualisation optimale, ouvrez ou téléchargez le fichier dans votre lecteur PDF.
              </p>
              <a
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          ) : (
            <div className="text-center p-8">
              <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-3" />
              <p className="font-bold text-slate-800">Aperçu non disponible pour ce format</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Vous pouvez télécharger ce document en toute sécurité pour le consulter sur votre appareil.
              </p>
              <button
                onClick={() => onDownload(file)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Télécharger le fichier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
