import React, { useState } from 'react';
import { Search, X, AlertCircle, ArrowRight, CheckCircle2, Clock } from 'lucide-react';
import { SwapOrder } from '../types';
import { getOrderById } from '../services/orderStorage';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: SwapOrder) => void;
}

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const [searchId, setSearchId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = searchId.trim();
    if (!clean) return;

    const found = getOrderById(clean);
    if (found) {
      onSelectOrder(found);
      onClose();
    } else {
      setError(`No active order found with ID or Hash: "${clean}". Please verify and try again.`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121722] border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Track Swap Order</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Enter your Swap Order ID (e.g. <span className="font-mono text-emerald-400 font-bold">DEX-8924-X9</span>) or Deposit Tx Hash to inspect real-time blockchain settlement status.
        </p>

        <form onSubmit={handleLookup} className="space-y-3">
          <div className="relative">
            <input
              type="text"
              value={searchId}
              onChange={(e) => {
                setSearchId(e.target.value);
                setError(null);
              }}
              placeholder="e.g. DEX-4891-B7 or 0x..."
              className="w-full bg-[#0a0d14] border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-xs text-rose-400 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-md"
          >
            <span>Track Live Status</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
