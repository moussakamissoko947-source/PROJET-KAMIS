import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';

interface VerifyEmailPageProps {
  initialToken?: string;
  onNavigateLogin: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({ initialToken = '', onNavigateLogin }) => {
  const { notify } = useNotification();
  const [token, setToken] = useState(initialToken);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const executeVerification = async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      await api.auth.verifyEmail(tokenToVerify);
      setStatus('success');
      notify('success', 'Votre adresse e-mail a été validée avec succès !');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Lien de confirmation invalide ou expiré.');
    }
  };

  useEffect(() => {
    if (initialToken) {
      executeVerification(initialToken);
    }
  }, [initialToken]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 text-center animate-scale-up">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight mb-2">
          Confirmation d'adresse e-mail
        </h1>

        {status === 'loading' && (
          <div className="py-8">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-500">Validation de votre jeton d'activation...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">Adresse e-mail confirmée !</p>
            <p className="text-xs text-slate-500 mb-6">
              Votre compte Kamis Docs est désormais activé. Vous pouvez vous connecter pour accéder à votre espace de stockage.
            </p>
            <button
              onClick={onNavigateLogin}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2"
            >
              <span>Se connecter</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800 mb-1">Validation impossible</p>
            <p className="text-xs text-rose-600 mb-6">{errorMessage}</p>
            <button
              onClick={onNavigateLogin}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition-colors"
            >
              Retour à la connexion
            </button>
          </div>
        )}

        {status === 'idle' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              executeVerification(token);
            }}
            className="mt-6 space-y-4"
          >
            <p className="text-xs text-slate-500">
              Collez le jeton reçu par e-mail ci-dessous si la validation n'a pas été automatique :
            </p>
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Collez le jeton de confirmation ici..."
              className="w-full px-4 py-3 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-mono"
            />
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-colors"
            >
              Confirmer l'adresse e-mail
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
