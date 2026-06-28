'use client';

import { Icon } from './icon';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected';
  localSynced: boolean;
}

export default function ConnectionStatus({ status, localSynced }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm shadow-md">
      <div className="flex items-center gap-2">
        {status === 'connected' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Icon name="wifi" size={16} className="text-emerald-400" />
            <span className="font-semibold text-emerald-400 text-xs uppercase tracking-wide">
              Online
            </span>
          </>
        )}

        {status === 'connecting' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <Icon name="refresh" size={16} className="text-amber-400 animate-spin" />
            <span className="font-semibold text-amber-400 text-xs uppercase tracking-wide">
              Reconnecting
            </span>
          </>
        )}

        {status === 'disconnected' && (
          <>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
            <Icon name="wifi-off" size={16} className="text-rose-400" />
            <span className="font-semibold text-rose-400 text-xs uppercase tracking-wide">
              Offline
            </span>
          </>
        )}
      </div>

      <div className="h-4 w-[1px] bg-slate-800" />

      <div className="text-xs text-slate-400">
        {localSynced ? (
          <span className="text-slate-500">Local changes saved</span>
        ) : (
          <span className="text-amber-400 animate-pulse">Syncing local edits...</span>
        )}
      </div>
    </div>
  );
}
export { ConnectionStatus };

