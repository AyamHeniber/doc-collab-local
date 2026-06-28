'use client';

import { useState, useEffect } from 'react';
import * as Y from 'yjs';
import { Icon } from '../ui/icon';

interface HistoryVersion {
  id: string;
  name: string;
  snapshot: string; // Base64 Yjs update
  createdBy: string;
  createdAt: string;
}

interface HistoryPanelProps {
  documentId: string;
  ydoc: Y.Doc;
  user: {
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
  };
}

export default function HistoryPanel({ documentId, ydoc, user }: HistoryPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<HistoryVersion[]>([]);
  const [newVersionName, setNewVersionName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [versionToRestore, setVersionToRestore] = useState<HistoryVersion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isViewer = user.role === 'viewer';

  // Fetch document versions
  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error('Failed to load version history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, documentId]);

  // Convert Uint8Array state update to Base64 (browser safe)
  const uint8ToBase64 = (uint8: Uint8Array): string => {
    let binary = '';
    const len = uint8.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8[i]);
    }
    return window.btoa(binary);
  };

  // Convert Base64 to Uint8Array (browser safe)
  const base64ToUint8 = (base64: string): Uint8Array => {
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  // Capture current state and post to database
  const handleSaveVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) return;

    setSaving(true);
    setMessage('');
    try {
      // 1. Encode Yjs doc state as update binary
      const updateState = Y.encodeStateAsUpdate(ydoc);
      const base64Snapshot = uint8ToBase64(updateState);

      // 2. Post to API
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newVersionName,
          snapshot: base64Snapshot,
        }),
      });

      if (res.ok) {
        setNewVersionName('');
        setMessage('Snapshot captured successfully.');
        fetchVersions();
      } else {
        const errData = await res.json();
        setMessage(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      setMessage('Failed to create snapshot.');
    } finally {
      setSaving(false);
    }
  };

  // Revert / Time Travel
  const handleRestoreVersion = (version: HistoryVersion) => {
    if (isViewer) return;
    setVersionToRestore(version);
  };

  const executeRestoreVersion = (version: HistoryVersion) => {
    try {
      // 1. Reconstruct old document representation
      const oldDoc = new Y.Doc();
      const binaryUpdate = base64ToUint8(version.snapshot);
      Y.applyUpdate(oldDoc, binaryUpdate);

      // 2. Apply content overwrite transaction on current live document
      ydoc.transact(() => {
        const currentFragment = ydoc.getXmlFragment('default');
        const oldFragment = oldDoc.getXmlFragment('default');

        // Delete current and write old content
        currentFragment.delete(0, currentFragment.length);
        const clones = oldFragment.toArray().map((node: any) => node.clone());
        currentFragment.insert(0, clones);
      });

      setMessage(`Reverted to: ${version.name}`);
      setIsOpen(false);
    } catch (err) {
      console.error(err);
      setErrorMessage('Error restoring version. Snapshot might be corrupted.');
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-350 rounded-xl transition text-xs font-semibold"
      >
        <Icon name="history" size={16} />
        <span>Version History</span>
      </button>

      {/* Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white">
                <Icon name="history" size={20} className="text-purple-400" />
                <h3 className="font-bold text-lg">Document History</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 text-slate-400 rounded-lg transition"
              >
                <Icon name="x" size={20} />
              </button>
            </div>

            {/* Notification message */}
            {message && (
              <div className="bg-purple-950/40 border-b border-purple-800/40 p-3 text-purple-300 text-xs flex justify-between items-center">
                <span>{message}</span>
                <button onClick={() => setMessage('')} className="hover:text-white">✕</button>
              </div>
            )}

            {/* Snapshot Creation Form */}
            {!isViewer && (
              <form onSubmit={handleSaveVersion} className="p-4 border-b border-slate-800 bg-slate-900/40 space-y-3">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Capture Snapshot
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Version name (e.g. V2.0 draft)"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                    required
                    className="flex-1 px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition disabled:opacity-50"
                  >
                    <Icon name="save" size={14} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            )}

            {/* Versions List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Timeline Snaps
              </p>

              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
                </div>
              ) : versions.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No snapshots captured yet.
                </p>
              ) : (
                versions.map((version) => (
                  <div
                    key={version.id}
                    className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{version.name}</h4>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1">
                          <span className="flex items-center gap-1">
                            <Icon name="calendar" size={12} className="text-slate-500" />
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon name="user" size={12} className="text-slate-500" />
                            {version.createdBy}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isViewer && (
                      <button
                        onClick={() => handleRestoreVersion(version)}
                        className="w-full py-1.5 bg-slate-950 hover:bg-purple-950/40 border border-slate-800 hover:border-purple-800/60 rounded-lg text-slate-300 hover:text-purple-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                      >
                        <Icon name="rotate-ccw" size={14} />
                        <span>Restore This Version</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Footer warning */}
            <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex items-start gap-2.5">
              <Icon name="alert-triangle" size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-normal">
                Restoring a snapshot overwrites the document live state for all active editors.
                This operation is distributed instantly and resolves conflict-free.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {versionToRestore && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setVersionToRestore(null)}
          />
          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 z-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full mb-2">
              <Icon name="alert-triangle" size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Restore Snapshot</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to restore the document to version <span className="text-purple-400 font-semibold">"{versionToRestore.name}"</span>? 
              This will overwrite the current content for all active editors.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setVersionToRestore(null)}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-350 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  executeRestoreVersion(versionToRestore);
                  setVersionToRestore(null);
                }}
                className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-purple-600/20"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Modal */}
      {errorMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setErrorMessage(null)}
          />
          {/* Modal Content */}
          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 z-10 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-500/10 text-red-500 rounded-full mb-2">
              <Icon name="x" size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Restore Failed</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {errorMessage}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setErrorMessage(null)}
                className="w-full py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export { HistoryPanel };
