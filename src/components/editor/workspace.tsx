'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useCollaboration } from '@/hooks/use-collaboration';
import { CollaborativeEditor } from './editor';
import { ConnectionStatus } from '../ui/connection-status';
import { HistoryPanel } from './history-panel';
import { AIAssistant } from './ai-assistant';
import { Icon } from '../ui/icon';

interface DocumentInfo {
  id: string;
  title: string;
  role: 'owner' | 'editor' | 'viewer';
  createdAt: string;
}

interface WorkspaceProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
  };
}

export default function Workspace({ user }: WorkspaceProps) {
  const [documentsList, setDocumentsList] = useState<DocumentInfo[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  // Hook up active document synchronization state
  const activeDoc = documentsList.find((d) => d.id === activeDocId);
  const { ydoc, localSynced, wsStatus, provider, syncedDocId } = useCollaboration(
    activeDocId || 'sandbox-room',
    user
  );

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocumentsList(data);
        if (data.length > 0 && !activeDocId) {
          setActiveDocId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        const doc = await res.json();
        setDocumentsList((prev) => [doc, ...prev]);
        setActiveDocId(doc.id);
        setNewTitle('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative font-sans overflow-hidden">
      {/* Dynamic light glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-950/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-950/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Sidebar - List of documents and user controls */}
      <aside className="w-full md:w-80 bg-slate-900/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-slate-800 flex flex-col relative z-10 shrink-0">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-600/20">
              <Icon name="file" size={16} className="text-white" />
            </div>
            <span className="font-extrabold text-sm text-white tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              DocSync Board
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-purple-900/50 border border-purple-500/30 flex items-center justify-center">
              <Icon name="user" size={16} className="text-purple-300" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">{user.name}</p>
              <span className="text-[9px] bg-purple-950/60 border border-purple-800/40 text-purple-300 px-1.5 py-0.5 rounded-full uppercase font-medium">
                {user.role}
              </span>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800/40 rounded-lg transition"
            title="Log Out"
          >
            <Icon name="logout" size={16} />
          </button>
        </div>

        {/* Create Document */}
        <form onSubmit={handleCreateDocument} className="p-4 border-b border-slate-800 space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Create Document
          </label>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="e.g. Project Plan"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              required
              className="flex-1 px-3 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="p-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <Icon name="plus" size={16} />
            </button>
          </div>
        </form>

        {/* Documents list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            My Documents
          </p>

          {loadingDocs ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-500" />
            </div>
          ) : documentsList.length === 0 ? (
            <p className="text-xs text-slate-500 italic text-center py-4">No documents yet.</p>
          ) : (
            documentsList.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                  activeDocId === doc.id
                    ? 'bg-purple-600/10 border-purple-500/50 text-white shadow-md'
                    : 'bg-slate-950/30 border-slate-800/60 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <Icon name="file" size={16} className="text-purple-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold truncate">{doc.title}</p>
                    <span className="text-[9px] text-slate-500 block mt-0.5 capitalize">
                      Role: {doc.role}
                    </span>
                  </div>
                </div>
                <Icon name="chevron-right" size={14} className="opacity-60" />
              </button>
            ))
          )}
        </div>

        {/* Developer Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-[10px] text-slate-500 space-y-1 mt-auto">
          <p className="font-semibold text-slate-400">Developer Profile:</p>
          <p>Name: Ayam Heniber Meitei </p>
          <p>Phone: +91 7005766068 </p>
          {/* <p>
            GitHub: <a href="https://github.com" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">github.com</a>
          </p>
          <p>
            LinkedIn: <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">linkedin.com</a>
          </p> */}
        </div>
      </aside>

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col relative z-10 overflow-y-auto">
        {activeDocId && activeDoc && ydoc && provider && syncedDocId === activeDocId ? (
          <div className="flex-1 flex flex-col lg:flex-row h-full">
            {/* Left Content Area */}
            <div className="flex-1 flex flex-col p-6 space-y-5">
              {/* Header section */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeDoc.title}
                  </h2>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Document ID: {activeDoc.id}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <ConnectionStatus status={wsStatus} localSynced={localSynced} />
                  <HistoryPanel documentId={activeDoc.id} ydoc={ydoc} user={user} />
                </div>
              </div>

              {/* Collaborative Rich Editor */}
              <div className="flex-1">
                <CollaborativeEditor key={activeDocId} ydoc={ydoc} provider={provider} user={user} />
              </div>
            </div>

            {/* Right Panel: Gemini AI Panel */}
            <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/20 backdrop-blur-sm p-6 shrink-0 space-y-4">
              <AIAssistant key={activeDocId} ydoc={ydoc} user={user} />

              {/* Offline Sandbox Guide card */}
              <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Icon name="help" size={16} className="text-purple-400" />
                  <h4 className="text-xs font-bold">Offline Sync Sandbox Guide</h4>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  To test offline behavior, disable your WiFi or use Chrome Developer Tools (Network Tab &gt; Offline).
                  Type text while disconnected. Once you go back online, the status turns green and syncs automatically without conflicts!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-gradient-to-tr from-purple-600/20 to-blue-600/20 border border-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <Icon name="sparkles" size={32} className="text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Welcome to your DocSync Hub</h2>
            <p className="text-sm text-slate-400 mb-6">
              A local-first document collaboration workspace featuring Yjs CRDT synchronization, offline IndexedDB backups, and Google Gemini writing assistant.
            </p>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl w-full text-left space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Getting Started</h4>
              <ol className="list-decimal pl-4 text-xs text-slate-400 space-y-2">
                <li>Create a new document using the sidebar.</li>
                <li>Write content, save snapshots, or use the Gemini AI writing assistant.</li>
                <li>Simulate connection failures to verify local-first offline capabilities.</li>
              </ol>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
