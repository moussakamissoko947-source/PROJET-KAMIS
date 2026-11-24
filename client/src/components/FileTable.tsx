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
  Trash2,
  ArrowUpDown
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes, formatDate, getFileCategory, getCategoryBadgeLabel } from '../utils/formatters';

interface FileTableProps {
  files: FileItem[];
  sortBy: 'date' | 'name' | 'size';
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: 'date' | 'name' | 'size') => void;
  onPreview: (file: FileItem) => void;
  onDownload: (file: FileItem) => void;
  onDelete: (file: FileItem) => void;
}

export const FileTable: React.FC<FileTableProps> = ({
  files,
  sortBy,
  sortOrder,
  onSortChange,
  onPreview,
  onDownload,
  onDelete
}) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'images':
        return <ImageIcon className="w-4 h-4 text-purple-600" />;
      case 'videos':
        return <Film className="w-4 h-4 text-amber-600" />;
      case 'audio':
        return <Music className="w-4 h-4 text-emerald-600" />;
      case 'documents':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'archives':
        return <Archive className="w-4 h-4 text-orange-600" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <tr>
            <th className="py-3.5 px-4 cursor-pointer hover:text-slate-800" onClick={() => onSortChange('name')}>
              <div className="flex items-center gap-1.5">
                <span>Nom du fichier</span>
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'name' ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
            </th>
            <th className="py-3.5 px-4 hidden sm:table-cell">Type</th>
            <th className="py-3.5 px-4 cursor-pointer hover:text-slate-800" onClick={() => onSortChange('size')}>
              <div className="flex items-center gap-1.5">
                <span>Taille</span>
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'size' ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
            </th>
            <th className="py-3.5 px-4 cursor-pointer hover:text-slate-800 hidden md:table-cell" onClick={() => onSortChange('date')}>
              <div className="flex items-center gap-1.5">
                <span>Date d'envoi</span>
                <ArrowUpDown className={`w-3.5 h-3.5 ${sortBy === 'date' ? 'text-indigo-600' : 'text-slate-400'}`} />
              </div>
            </th>
            <th className="py-3.5 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {files.map((file) => {
            const category = getFileCategory(file.content_type_claimed, file.original_name);
            return (
              <tr key={file.id} className="hover:bg-slate-50/70 transition-colors group">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      {getIcon(category)}
                    </div>
                    <span
                      onClick={() => onPreview(file)}
                      className="font-semibold text-slate-800 hover:text-indigo-600 cursor-pointer truncate max-w-[200px] sm:max-w-xs md:max-w-md block"
                      title={file.original_name}
                    >
                      {file.original_name}
                    </span>
                  </div>
                </td>
                <td className="py-3.5 px-4 hidden sm:table-cell">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                    {getCategoryBadgeLabel(category)}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                  {formatBytes(file.size_bytes)}
                </td>
                <td className="py-3.5 px-4 text-slate-500 text-xs hidden md:table-cell">
                  {formatDate(file.created_at)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onPreview(file)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
