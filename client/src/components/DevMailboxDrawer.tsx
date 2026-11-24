import React, { useState, useEffect } from 'react';
import { Mail, ExternalLink, Trash2, X, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { SentEmail } from '../types';
import { formatDate } from '../utils/formatters';

interface DevMailboxDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUrl: (url: string) => void;
}

export const DevMailboxDrawer: React.FC<DevMailboxDrawerProps> = ({ isOpen, onClose, onOpenUrl }) => {
  const [emails, setEmails] = useState<SentEmail[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const res = await api.dev.getMailbox();
      setEmails(res.emails);
    } catch (err) {
      console.warn('Dev mailbox non disponible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEmails();
    }
  }, [isOpen]);

  const handleClear = async () => {
    try {
      await api.dev.clearMailbox();
      setEmails([]);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Centre de messagerie</h2>
              <p className="text-xs text-slate-500">Courriels de confirmation et de sécurité</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchEmails}
              disabled={isLoading}
              title="Actualiser"
              className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {emails.length > 0 && (
              <button
                onClick={handleClear}
                title="Vider la boîte"
                className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {emails.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Mail className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">Aucun courriel récent</p>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Les courriels de validation de compte ou de réinitialisation envoyés par le serveur apparaîtront ici.
              </p>
            </div>
          ) : (
            emails.map((email) => (
              <div
                key={email.id}
                className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 uppercase">
                    {email.type === 'verification' ? 'Validation e-mail' : 'Mot de passe oublié'}
                  </span>
                  <span className="text-xs text-slate-400">{formatDate(email.sentAt)}</span>
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  À : <span className="font-semibold text-slate-800">{email.to}</span>
                </div>
                <div className="text-sm font-bold text-slate-900 mb-2">{email.subject}</div>

                {email.actionUrl && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        onOpenUrl(email.actionUrl!);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {email.type === 'verification' ? 'Valider mon compte' : 'Réinitialiser mon mot de passe'}
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
