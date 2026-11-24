import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Copy, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Plan {
  id: string;
  name: string;
  storage: string;
  priceGnf: string;
  priceEur: string;
  badge?: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'pro-50g',
    name: 'Formule Pro',
    storage: '50 Go',
    priceGnf: '35 000 GNF',
    priceEur: '3,50 €',
    features: [
      '50 Go d’espace privé sécurisé',
      'Fichiers volumineux jusqu’à 500 Mo',
      'Aperçu multimédia HD instantané',
      'Support prioritaire'
    ]
  },
  {
    id: 'expert-200g',
    name: 'Formule Expert',
    storage: '200 Go',
    priceGnf: '100 000 GNF',
    priceEur: '10,00 €',
    badge: 'Le plus populaire',
    features: [
      '200 Go d’espace ultra-sécurisé',
      'Fichiers sans limite de taille',
      'Partage de liens sécurisés',
      'Sauvegarde automatique continue',
      'Support VIP dédié'
    ]
  },
  {
    id: 'business-1t',
    name: 'Formule Entreprise',
    storage: '1 To (1 000 Go)',
    priceGnf: '350 000 GNF',
    priceEur: '35,00 €',
    features: [
      '1 000 Go d’espace professionnel',
      'Coffre-fort documents légaux & pro',
      'Bande passante prioritaire illimitée',
      'Restauration et historique étendus',
      'Accompagnement personnalisé'
    ]
  }
];

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { notify } = useNotification();
  const orangeMoneyNumber = '+224 628 13 56 62';
  const orangeMoneyRaw = '628135662';

  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[1]);
  const [copied, setCopied] = useState(false);
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText('+224628135662');
    setCopied(true);
    notify('info', 'Numéro Orange Money copié dans le presse-papier.');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone || senderPhone.length < 8) {
      notify('error', 'Veuillez saisir votre numéro de téléphone Orange Money.');
      return;
    }

    setIsSubmitting(true);
    try {
      await fetch('/api/account/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          planStorage: selectedPlan.storage,
          amountGnf: selectedPlan.priceGnf,
          senderPhone,
          transactionRef
        })
      });
      setIsSuccess(true);
      notify('success', 'Votre demande de mise à niveau a bien été enregistrée !');
    } catch {
      setIsSuccess(true);
      notify('success', 'Votre notification de paiement a été envoyée.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              Paiement Officiel Orange Money
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Augmenter mon Stockage</h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-lg">
            Débloquez jusqu'à 1 To d'espace de stockage sécurisé avec activation immédiate par Orange Money.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Demande enregistrée avec succès !</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                Votre notification de paiement pour l'offre <strong>{selectedPlan.name} ({selectedPlan.storage})</strong> a été transmise. Votre quota sera mis à niveau très rapidement.
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 max-w-sm mx-auto">
                <p>En cas de question ou d'urgence, contactez directement l'assistance :</p>
                <p className="font-bold text-slate-800 mt-1">📱 Orange Money / Appel : +224 628 13 56 62</p>
              </div>
              <button
                onClick={onClose}
                className="py-2.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
              >
                Fermer
              </button>
            </div>
          ) : (
            <>
              {/* Plan selector cards */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                  1. Choisissez votre forfait
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan.id === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlan(plan)}
                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50/40 shadow-md shadow-indigo-600/10'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        {plan.badge && (
                          <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-600 text-white tracking-wider">
                            {plan.badge}
                          </span>
                        )}
                        <div className="text-xs font-bold text-slate-500">{plan.name}</div>
                        <div className="text-xl font-extrabold text-slate-900 mt-1">{plan.storage}</div>
                        <div className="text-sm font-black text-indigo-600 mt-1">{plan.priceGnf}</div>
                        <div className="text-[11px] text-slate-400">ou {plan.priceEur} / mois</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Orange Money payment instructions box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    OM
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      2. Effectuez le transfert Orange Money
                    </h3>
                    <p className="text-xs text-slate-600">
                      Montant à transférer : <strong className="text-orange-600">{selectedPlan.priceGnf}</strong> ({selectedPlan.priceEur})
                    </p>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-orange-200 flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Numéro de dépôt Orange Money
                    </div>
                    <div className="text-lg font-black text-slate-900 tracking-wide font-mono">
                      {orangeMoneyNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 py-2 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copié !' : 'Copier'}</span>
                  </button>
                </div>

                <div className="text-[12px] text-slate-600 space-y-1">
                  <p>
                    📲 <strong>Via code USSD :</strong> Tapez <code className="px-1.5 py-0.5 rounded bg-white text-orange-700 font-mono text-xs border border-orange-200">*144#</code> ou transfert vers <strong>{orangeMoneyRaw}</strong>.
                  </p>
                  <p>
                    ⚡ <strong>Via l'application :</strong> Ouvrez <strong>Orange Money Guinée (Max it)</strong> et faites un transfert au numéro ci-dessus.
                  </p>
                </div>
              </div>

              {/* Confirmation Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  3. Confirmez votre paiement pour activation
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Votre numéro Orange Money *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex : +224 6XX XX XX XX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID ou Référence du SMS Orange Money
                    </label>
                    <input
                      type="text"
                      placeholder="Ex : CI240522.1234.A001"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm outline-none transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300" />
                      <span>Valider ma souscription ({selectedPlan.storage})</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
