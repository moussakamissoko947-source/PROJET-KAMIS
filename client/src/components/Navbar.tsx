import React, { useState } from 'react';
import { Shield, Search, User as UserIcon, LogOut, Settings, FileText, Mail, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { QuotaGauge } from './QuotaGauge';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenSettings: () => void;
  onOpenLegal: () => void;
  onOpenDevMailbox: () => void;
  onToggleMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenSettings,
  onOpenLegal,
  onOpenDevMailbox,
  onToggleMobileMenu
}) => {
  const { user, storage, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.location.hash = ''}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">Kamis</span>
              <span className="font-medium text-lg text-indigo-600 ml-1">Docs</span>
            </div>
          </div>
        </div>

        {/* Center: Search input */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher par nom de document..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-sm rounded-xl border border-transparent focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right: Actions & User */}
        <div className="flex items-center gap-3">
          {/* Storage mini gauge for desktop */}
          {storage && (
            <div className="hidden md:block mr-2">
              <QuotaGauge usedBytes={storage.used_bytes} quotaBytes={storage.quota_bytes} compact />
            </div>
          )}

          {/* Mailbox button */}
          <button
            onClick={onOpenDevMailbox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            title="Boîte des notifications et courriels"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Courriels</span>
          </button>

          {/* User Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs">
                {user?.email ? user.email.substring(0, 2) : 'U'}
              </div>
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-scale-up">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400">Connecté en tant que</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      Paramètres du compte
                    </button>

                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenLegal();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      Mentions légales & CGU
                    </button>
                  </div>

                  <div className="border-t border-slate-100 pt-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
