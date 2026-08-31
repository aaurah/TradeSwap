import React from 'react';
import { Clock, X, ArrowRight, CheckCircle2, RefreshCw, AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { SwapOrder } from '../types';
import { getSavedOrders } from '../services/orderStorage';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder: (order: SwapOrder) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectOrder,
}) => {
  const orders = getSavedOrders();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#121722] border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Your Swap Orders History</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 p-1 divide-y divide-slate-800/40">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No swap orders in this session</p>
              <p className="text-xs text-slate-500 mt-1">Initiate a swap to see your live order status here</p>
            </div>
          ) : (
            orders.map((order) => {
              const isDone = order.status === 'completed';
              return (
                <div
                  key={order.id}
                  onClick={() => {
                    onSelectOrder(order);
                    onClose();
                  }}
                  className="pt-3 first:pt-0 p-3 rounded-2xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shrink-0">
                      {order.provider.logo}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-emerald-400 transition-colors font-mono">
                          {order.fromAmount} {order.fromToken.symbol} ➔ {order.toAmount} {order.toToken.symbol}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {order.mode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 font-mono">
                        <span>ID: {order.id}</span>
                        <span>•</span>
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 animate-pulse'
                      }`}
                    >
                      {isDone ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> In Progress
                        </>
                      )}
                    </span>

                    <button className="text-xs text-emerald-400 font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Non-custodial: Records stored securely in your browser</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
