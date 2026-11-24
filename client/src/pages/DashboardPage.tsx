import React, { useState, useEffect, useMemo } from 'react';
import { 
  UploadCloud, 
  LayoutGrid, 
  List, 
  Filter, 
  Search, 
  FolderPlus, 
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { api } from '../api/client';
import { FileItem, StorageUsage } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FileTable } from '../components/FileTable';
import { FileGrid } from '../components/FileGrid';
import { Dropzone } from '../components/Dropzone';
import { UploadModal } from '../components/UploadModal';
import { FilePreviewModal } from '../components/FilePreviewModal';
import { ConfirmModal } from '../components/ConfirmModal';

interface DashboardPageProps {
  currentCategory: string;
  searchQuery: string;
  isUploadModalOpen: boolean;
  onCloseUploadModal: () => void;
  onOpenUploadModal: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentCategory,
  searchQuery,
  isUploadModalOpen,
  onCloseUploadModal,
  onOpenUploadModal
}) => {
  const { storage, updateStorage } = useAuth();
  const { notify } = useNotification();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [fileToDelete, setFileToDelete] = useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);

  // Fetch files
  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const res = await api.files.list({
        search: searchQuery,
        category: currentCategory,
        sortBy,
        sortOrder
      });
      setFiles(res.files);
      if (res.storage) {
        updateStorage(res.storage);
      }
    } catch (err: any) {
      notify('error', err.message || 'Impossible de récupérer la liste des fichiers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [currentCategory, searchQuery, sortBy, sortOrder]);

  const handleSortChange = (field: 'date' | 'name' | 'size') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc');
    }
  };

  const handleFilesDropped = (incomingFiles: File[]) => {
    setFilesToUpload(incomingFiles);
    onOpenUploadModal();
  };

  const handleUploadSuccess = (newFiles: FileItem[], updatedStorage: StorageUsage) => {
    setFiles((prev) => [...newFiles, ...prev]);
    updateStorage(updatedStorage);
    notify('success', `${newFiles.length} fichier(s) sauvegardé(s) avec succès.`);
  };

  const handleDownload = (file: FileItem) => {
    const downloadUrl = api.files.getDownloadUrl(file.id);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.original_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('info', `Téléchargement de "${file.original_name}" lancé.`);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      const res = await api.files.delete(fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      updateStorage(res.storage);
      notify('success', `Le fichier "${fileToDelete.original_name}" a été définitivement supprimé.`);
      setFileToDelete(null);
    } catch (err: any) {
      notify('error', err.message || 'Échec de la suppression.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-4 lg:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {currentCategory === 'all'
              ? 'Tous les documents'
              : currentCategory === 'documents'
              ? 'Documents texte & PDF'
              : currentCategory === 'images'
              ? 'Photos & Images'
              : currentCategory === 'videos'
              ? 'Vidéos'
              : currentCategory === 'audio'
              ? 'Fichiers audio'
              : 'Archives & Zip'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {files.length} élément{files.length > 1 ? 's' : ''} dans cet espace privé
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex items-center bg-slate-200/70 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue en liste"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vue en grille"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onOpenUploadModal}
            className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Ajouter des fichiers</span>
          </button>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <Dropzone
        onFilesSelected={handleFilesDropped}
        maxSizeBytes={100 * 1024 * 1024}
      />

      {/* Files Display */}
      {isLoading ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Chargement de votre coffre-fort...</p>
        </div>
      ) : files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Aucun document pour le moment</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? 'Aucun résultat ne correspond à votre recherche.'
              : 'Commencez à protéger et organiser vos fichiers en les glissant sur cette page.'}
          </p>
          <button
            onClick={onOpenUploadModal}
            className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            Téléverser mon premier fichier
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <FileTable
          files={files}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onPreview={setPreviewFile}
          onDownload={handleDownload}
          onDelete={setFileToDelete}
        />
      ) : (
        <FileGrid
          files={files}
          onPreview={setPreviewFile}
          onDownload={handleDownload}
          onDelete={setFileToDelete}
        />
      )}

      {/* Modals */}
      <UploadModal
        filesToUpload={filesToUpload}
        isOpen={isUploadModalOpen}
        onClose={onCloseUploadModal}
        onUploadSuccess={handleUploadSuccess}
      />

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
      />

      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Supprimer ce document ?"
        message={`Êtes-vous certain de vouloir supprimer définitivement "${fileToDelete?.original_name}" ? Cette action est irréversible et libérera l'espace correspondant sur votre quota.`}
        confirmLabel="Supprimer définitivement"
        cancelLabel="Conserver le fichier"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setFileToDelete(null)}
      />
    </div>
  );
};
