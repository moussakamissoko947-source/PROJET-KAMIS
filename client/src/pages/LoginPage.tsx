import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onResendVerification: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onResendVerification
}) => {
  const { login } = useAuth();
  const { notify } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isUnverified, setIsUnverified] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);

  const handleDirectVerify = async () => {
    if (!email) return;
    setIsVerifying(true);
    try {
      await api.auth.devVerify(email);
      notify('success', 'Adresse e-mail validée avec succès !');
      setIsUnverified(false);
      setErrorMessage('');
      if (password) {
        const res = await api.auth.login({ email, password });
        login(res.user, res.storage);
      }
    } catch (err: any) {
      notify('error', err.message || 'Impossible de valider le compte');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsUnverified(false);
    setIsLoading(true);

    try {
      const res = await api.auth.login({ email, password });
      login(res.user, res.storage);
      notify('success', 'Connexion réussie. Bienvenue sur votre espace.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Échec de la connexion');
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message?.includes('vérifiée')) {
        setIsUnverified(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-100 animate-scale-up">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Kamis Docs</h1>
          <p className="text-xs text-slate-500 mt-1">
            Votre coffre-fort de documents et fichiers privé et sécurisé
          </p>
        </div>

        {/* Error alert */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <div className="flex-1">
              <p className="font-semibold leading-relaxed">{errorMessage}</p>
              {isUnverified && (
                <div className="mt-3 pt-3 border-t border-rose-200/60 space-y-2">
                  <p className="text-[11px] text-rose-800">
                    Pour activer directement votre compte et accéder à votre espace :
                  </p>
                  <button
                    type="button"
                    onClick={handleDirectVerify}
                    disabled={isVerifying}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isVerifying ? 'Activation en cours...' : '⚡ Activer mon compte immédiatement'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onResendVerification(email)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline block text-center w-full"
                  >
                    Renvoyer un nouveau courriel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Switch to Register */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Vous n'avez pas encore de compte ?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Créer un compte
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
