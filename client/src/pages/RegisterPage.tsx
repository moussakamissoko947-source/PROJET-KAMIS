import React, { useState } from 'react';
import { Shield, Mail, Lock, CheckSquare, Square, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';

interface RegisterPageProps {
  onNavigateLogin: () => void;
  onOpenLegal: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateLogin, onOpenLegal }) => {
  const { notify } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [activationUrl, setActivationUrl] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Le mot de passe doit comporter au moins 8 caractères.');
      return;
    }

    if (!acceptTerms) {
      setErrorMessage('Vous devez accepter les conditions générales pour créer votre compte.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await api.auth.register({ email, password, acceptTerms });
      if (res.activationLink) {
        setActivationUrl(res.activationLink);
      }
      setIsSuccess(true);
      notify('success', 'Votre compte a été créé avec succès.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Impossible de créer le compte');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstantActivate = async () => {
    setIsActivating(true);
    try {
      await api.auth.devVerify(email);
      notify('success', 'Votre adresse e-mail est confirmée ! Vous pouvez maintenant vous connecter.');
      onNavigateLogin();
    } catch (err: any) {
      notify('error', err.message || 'Échec de la validation');
    } finally {
      setIsActivating(false);
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Créer un compte</h1>
          <p className="text-xs text-slate-500 mt-1">
            Bénéficiez de 5 Go d'espace privé offert sur Kamis Docs
          </p>
        </div>

        {isSuccess ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Compte créé avec succès !</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto mb-5">
              Votre compte pour <strong className="text-slate-800">{email}</strong> est prêt à être activé.
            </p>

            {/* Instant Activation Button */}
            <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 mb-4 text-left">
              <div className="text-xs font-bold text-indigo-900 mb-1 flex items-center gap-1.5">
                <span>⚡ Activation immédiate du compte</span>
              </div>
              <p className="text-[11px] text-indigo-700/80 leading-relaxed mb-3">
                Vous pouvez activer votre compte dès maintenant pour commencer à stocker vos documents :
              </p>
              <button
                type="button"
                onClick={handleInstantActivate}
                disabled={isActivating}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Activer mon compte en 1 clic</span>
                )}
              </button>
            </div>

            <button
              onClick={onNavigateLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Aller à la page de connexion
            </button>
          </div>
        ) : (
          <>
            {/* Error alert */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                <p className="font-semibold leading-relaxed flex-1">{errorMessage}</p>
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mot de passe (min. 8 caractères)
                </label>
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

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all"
                  />
                </div>
              </div>

              {/* CGU acceptance */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>
                    J'accepte les{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        onOpenLegal();
                      }}
                      className="text-indigo-600 font-bold underline hover:text-indigo-800"
                    >
                      conditions d'utilisation (CGU)
                    </button>{' '}
                    et la politique de confidentialité de Kamis Docs.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Créer mon espace privé</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Se connecter
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
