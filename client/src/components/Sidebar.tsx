import React from 'react';
import { 
  Folder, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  Settings, 
  FileCheck2, 
  Upload,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuotaGauge } from './QuotaGauge';

interface SidebarProps {
  currentCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenUpload: () => void;
  onOpenSettings: () => void;
  onOpenLegal: () => void;
  onOpenUpgrade?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  onSelectCategory,
  onOpenUpload,
  onOpenSettings,
  onOpenLegal,
  onOpenUpgrade,
  isMobileOpen = false,
  onCloseMobile
}) => {
  const { storage } = useAuth();

  const categories = [
    { id: 'all', label: 'Tous les fichiers', icon: Folder },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'images', label: 'Photos & Images', icon: ImageIcon },
    { id: 'videos', label: 'Vidéos', icon: Film },
    { id: 'audio', label: 'Audio & Sons', icon: Music },
    { id: 'archives', label: 'Archives & Zip', icon: Archive }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full p-4 lg:p-6 bg-white border-r border-slate-200/80">
      {/* Mobile close button */}
      {isMobileOpen && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 lg:hidden">
          <span className="font-bold text-slate-800">Menu</span>
          <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Primary Action Button */}
      <button
        onClick={() => {
          onOpenUpload();
          if (onCloseMobile) onCloseMobile();
        }}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] mb-6"
      >
        <Upload className="w-4 h-4" />
        <span>Téléverser des fichiers</span>
      </button>

      {/* Category Navigation */}
      <div className="flex-1 space-y-1">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Catégories
        </div>
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = currentCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => {
                onSelectCategory(cat.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <span>{cat.label}</span>
            </button>
          );
        })}

        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 pt-6 mb-2">
          Système & Compte
        </div>
        <button
          onClick={() => {
            onOpenSettings();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Paramètres du compte</span>
        </button>

        <button
          onClick={() => {
            onOpenLegal();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all"
        >
          <FileCheck2 className="w-4 h-4 text-slate-400" />
          <span>Mentions & Confidentialité</span>
        </button>
      </div>

      {/* Storage Gauge at bottom */}
      {storage && (
        <div className="pt-4 mt-auto border-t border-slate-100 space-y-2.5">
          <QuotaGauge usedBytes={storage.used_bytes} quotaBytes={storage.quota_bytes} />
          {onOpenUpgrade && (
            <button
              onClick={() => {
                onOpenUpgrade();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100 border border-orange-200 text-orange-800 text-xs font-bold transition-all shadow-xs"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>Augmenter mon stockage</span>
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 min-h-[calc(100vh-65px)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
