import React from 'react';
import { formatBytes } from '../utils/formatters';
import { HardDrive, AlertTriangle } from 'lucide-react';

interface QuotaGaugeProps {
  usedBytes: number;
  quotaBytes: number;
  compact?: boolean;
}

export const QuotaGauge: React.FC<QuotaGaugeProps> = ({ usedBytes, quotaBytes, compact = false }) => {
  const percent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  const isWarning = percent >= 80 && percent < 95;
  const isDanger = percent >= 95;

  let barColor = 'bg-indigo-600';
  let badgeColor = 'text-indigo-700 bg-indigo-50 border-indigo-200';

  if (isDanger) {
    barColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (isWarning) {
    barColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2.5 text-xs">
        <div className="w-20 bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-medium text-slate-600 whitespace-nowrap">
          {formatBytes(usedBytes)} / {formatBytes(quotaBytes)}
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Espace de stockage</div>
            <div className="text-sm font-bold text-slate-800">
              {formatBytes(usedBytes)} <span className="text-slate-400 font-normal">/ {formatBytes(quotaBytes)}</span>
            </div>
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
          {percent} %
        </span>
      </div>

      {/* Progress track */}
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(2, percent)}%` }}
        />
      </div>

      {isDanger ? (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Quota presque saturé. Supprimez des fichiers pour continuer à téléverser.</span>
        </div>
      ) : isWarning ? (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 font-medium mt-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Attention : vous approchez de la limite de votre espace (5 Go).</span>
        </div>
      ) : (
        <div className="text-[11px] text-slate-400">
          {formatBytes(Math.max(0, quotaBytes - usedBytes))} disponibles
        </div>
      )}
    </div>
  );
};
