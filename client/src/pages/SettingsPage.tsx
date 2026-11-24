import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Lock, 
  Trash2, 
  ShieldCheck, 
  HardDrive, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Music, 
  Archive, 
  File,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { api } from '../api/client';
import { AccountData } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { formatBytes, formatDate } from '../utils/formatters';
import { QuotaGauge } from '../components/QuotaGauge';
import { ConfirmModal } from '../components/ConfirmModal';
import { UpgradeModal } from '../components/UpgradeModal';

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { logout } = useAuth();
  const { notify } = useNotification();

  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  const fetchAccount = async () => {
    setIsLoading(true);
    try {
      const data = await api.account.get();
      setAccountData(data);
    } catch (err: any) {
      notify('error', err.message || 'Impossible de charger les données du compte');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      notify('error', 'Le nouveau mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.account.changePassword({ oldPassword, newPassword });
      notify('success', 'Votre mot de passe a été mis à jour.');
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      notify('error', err.message || 'Erreur lors du changement de mot de passe');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true);
    try {
      await api.account.deleteAccount();
      notify('info', 'Votre compte et tous vos fichiers ont été définitivement supprimés.');
      await logout();
    } catch (err: any) {
      notify('error', err.message || 'Échec de la suppression du compte.');
      setIsDeletingAccount(false);
      setIsDeleteModalOpen(false);
    }
  };

  if (isLoading || !accountData) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { user, storage, totalFiles, breakdown } = accountData;

  const categoryCards = [
    { label: 'Documents', count: breakdown.documents.count, bytes: breakdown.documents.bytes, icon: FileText, color: 'text-blue-600 bg-blue-50' },
    { label: 'Photos & Images', count: breakdown.images.count, bytes: breakdown.images.bytes, icon: ImageIcon, color: 'text-purple-600 bg-purple-50' },
    { label: 'Vidéos', count: breakdown.videos.count, bytes: breakdown.videos.bytes, icon: Film, color: 'text-amber-600 bg-amber-50' },
    { label: 'Audio', count: breakdown.audio.count, bytes: breakdown.audio.bytes, icon: Music, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Archives', count: breakdown.archives.count, bytes: breakdown.archives.bytes, icon: Archive, color: 'text-orange-600 bg-orange-50' },
    { label: 'Autres', count: breakdown.others.count, bytes: breakdown.others.bytes, icon: File, color: 'text-slate-600 bg-slate-100' }
  ];

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux documents
        </button>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Paramètres du compte</h1>
        <p className="text-xs text-slate-500 mt-1">
          Gérez votre profil, observez vos statistiques de stockage et vos options de sécurité.
        </p>
      </div>

      {/* Profile & Quota Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white font-extrabold text-xl flex items-center justify-center uppercase shadow-md shadow-indigo-600/20 mb-4">
            {user.email.substring(0, 2)}
          </div>
          <h2 className="text-base font-bold text-slate-900 truncate max-w-full">{user.email}</h2>
          <span className="inline-flex items-center gap-1 mt-2 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Compte vérifié
          </span>
          <p className="text-xs text-slate-400 mt-4">
            Membre depuis le {formatDate(user.createdAt || '')}
          </p>
        </div>

        <div className="md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Capacité et usage de stockage</h3>
            <p className="text-xs text-slate-500 mb-4">
              Votre quota est appliqué côté serveur pour chaque téléversement.
            </p>
            <QuotaGauge usedBytes={storage.used_bytes} quotaBytes={storage.quota_bytes} />
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsUpgradeOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-xs transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>Passer à un forfait supérieur (Orange Money)</span>
              </button>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Nombre total de fichiers : <strong>{totalFiles}</strong></span>
            <span>Espace restant : <strong>{formatBytes(Math.max(0, storage.quota_bytes - storage.used_bytes))}</strong></span>
          </div>
        </div>
      </div>

      {/* Breakdown by Category */}
      <div>
        <h2 className="text-base font-bold text-slate-900 mb-4">Répartition par catégorie de document</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categoryCards.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="p-4 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${cat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-800 truncate">{cat.label}</div>
                <div className="text-xs text-slate-500 font-mono mt-0.5">{formatBytes(cat.bytes)}</div>
                <div className="text-[10px] text-slate-400 mt-1">{cat.count} fichier{cat.count > 1 ? 's' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security: Change password */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs max-w-xl">
        <h2 className="text-base font-bold text-slate-900 mb-1">Sécurité & Mot de passe</h2>
        <p className="text-xs text-slate-500 mb-6">
          Modifiez votre mot de passe d'accès à Kamis Docs.
        </p>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mot de passe actuel
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nouveau mot de passe (min. 8 caractères)
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition-colors"
          >
            {isChangingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
          </button>
        </form>
      </div>

      {/* Danger Zone: Account Deletion (PR-DAT-02) */}
      <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs max-w-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-rose-900">Zone de danger : Supprimer mon compte</h2>
            <p className="text-xs text-rose-700 mt-1 leading-relaxed">
              La suppression de votre compte est définitive. Tous vos documents, métadonnées, sessions et identifiants seront irrémédiablement effacés du disque et de la base de données.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="mt-4 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              Demander la suppression de mon compte
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Supprimer définitivement votre compte ?"
        message="Attention : cette action est irréversible. L'ensemble de vos documents enregistrés et vos identifiants seront immédiatement et définitivement détruits. Souhaitez-vous continuer ?"
        confirmLabel="Oui, détruire mon compte"
        cancelLabel="Conserver mon compte"
        isDestructive={true}
        isLoading={isDeletingAccount}
        onConfirm={handleDeleteAccountConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <UpgradeModal
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
      />
    </div>
  );
};
