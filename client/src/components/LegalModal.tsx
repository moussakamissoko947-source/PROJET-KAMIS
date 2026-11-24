import React, { useState } from 'react';
import { X, ShieldCheck, Lock, FileText, Server } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'retention'>('terms');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mentions légales & Sécurité</h2>
              <p className="text-xs text-slate-500">Engagements de confidentialité et de conformité</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pt-4 pb-2 border-b border-slate-100">
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'terms'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Conditions Générales (CGU)
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'privacy'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Politique de Confidentialité
          </button>
          <button
            onClick={() => setActiveTab('retention')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
              activeTab === 'retention'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Rétention & Sauvegarde
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 text-xs text-slate-600 space-y-4 leading-relaxed pr-2">
          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">1. Objet du service</h3>
              <p>
                Kamis Docs est un service web de sauvegarde et de gestion de documents personnels et professionnels. Chaque compte dispose d'un quota de stockage dédié (5 Go par défaut) et d'un espace strictement cloisonné.
              </p>
              <h3 className="font-bold text-sm text-slate-900">2. Règles d'utilisation acceptable</h3>
              <p>
                L'utilisateur s'engage à ne téléverser que des documents pour lesquels il détient les droits légaux nécessaires. L'hébergement de contenus illicites, de logiciels malveillants ou d'outils destinés à nuire au service ou à des tiers est formellement prohibé.
              </p>
              <h3 className="font-bold text-sm text-slate-900">3. Limites du service</h3>
              <p>
                La taille maximale par fichier est de 100 Mo. Kamis Docs est un coffre-fort de documents et n'est pas un système de synchronisation temps réel de disque local complet.
              </p>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">1. Cloisonnement strict et isolation (Multi-tenant)</h3>
              <p>
                Chaque fichier est rattaché de manière inviolable à son propriétaire. Aucune opération de lecture, téléchargement ou suppression ne peut être effectuée par un autre compte utilisateur.
              </p>
              <h3 className="font-bold text-sm text-slate-900">2. Données collectées</h3>
              <p>
                Nous appliquons le principe de minimisation des données : seule votre adresse e-mail est demandée pour la gestion du compte. Vos mots de passe sont hachés de manière adaptative avec sel (bcrypt) et ne sont jamais stockés en clair.
              </p>
              <h3 className="font-bold text-sm text-slate-900">3. URLs non publiques</h3>
              <p>
                Les fichiers téléversés ne disposent d'aucune URL publique permanente. Le téléchargement et l'aperçu nécessitent une session authentifiée valide.
              </p>
            </div>
          )}

          {activeTab === 'retention' && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-900">1. Suppression de fichiers</h3>
              <p>
                Lorsqu'un utilisateur supprime un fichier, l'enregistrement en base de données et l'objet binaire stocké sur le disque physique sont supprimés de façon définitive et irréversible, libérant immédiatement l'espace de quota.
              </p>
              <h3 className="font-bold text-sm text-slate-900">2. Suppression de compte (Droit à l'effacement)</h3>
              <p>
                L'utilisateur peut à tout moment demander la suppression intégrale de son compte depuis l'espace « Paramètres ». Cette action supprime immédiatement tous les fichiers, métadonnées, sessions et identifiants associés.
              </p>
              <h3 className="font-bold text-sm text-slate-900">3. Journalisation de sécurité</h3>
              <p>
                Les journaux d'audit enregistrent les événements d'authentification et les accès pour assurer la sécurité de l'infrastructure sans jamais conserver de mots de passe ou de contenus de fichiers.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
