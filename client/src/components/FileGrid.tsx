import React from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  File, 
  Eye, 
  Download, 
  Trash2 
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatRelativeDate, getFileCategory, getCategoryBadgeLabel } from '../utils/formatters';
import { api } from '../api/client';

interface FileGridProps {
  files: FileItem[];
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileGrid: React.FC<FileGridProps> = ({
  files,
  onPreview,
  onDownload,
  onDelete
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'images':
        return <ImageIcon className="w-6 h-6 text-purple-600" />;
      case 'videos':
        return <Film className="w-6 h-6 text-amber-600" />;
      case 'audio':
        return <Music className="w-6 h-6 text-emerald-600" />;
      case 'documents':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'archives':
        return <Archive className="w-6 h-6 text-orange-600" />;
      default:
        return <File className="w-6 h-6 text-slate-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => {
        const category = getFileCategory(file.content_type_claimed, file.original_name);
        const isImage = category === 'images';

        return (
          <div
            key={file.id}
            className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            {/* Top thumbnail or icon */}
            <div
              onClick={() => onPreview(file)}
              className="w-full h-36 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center cursor-pointer overflow-hidden relative mb-3 group-hover:bg-indigo-50/30 transition-colors"
            >
              {isImage ? (
                <img
                  src={api.files.getPreviewUrl(file.id)}
                  alt={file.original_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                  {getIcon(category)}
                </div>
              )}

              <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-slate-700 shadow-xs backdrop-blur-xs">
                {getCategoryBadgeLabel(category)}
              </span>
            </div>

            {/* Info */}
            <div className="mb-3">
              <h4
                onClick={() => onPreview(file)}
                className="font-bold text-sm text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                title={file.original_name}
              >
                {file.original_name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 flex items-center justify-between">
                <span>{formatBytes(file.size_bytes)}</span>
                <span>{formatRelativeDate(file.created_at)}</span>
              </p>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => onPreview(file)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                Aperçu
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDownload(file)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  title="Télécharger"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(file)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
