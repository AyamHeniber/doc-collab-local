'use client';

import { useState } from 'react';
import * as Y from 'yjs';
import { Icon } from '../ui/icon';

interface AIAssistantProps {
  ydoc: Y.Doc;
  user: {
    role: 'owner' | 'editor' | 'viewer';
  };
}

export default function AIAssistant({ ydoc, user }: AIAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [tone, setTone] = useState('professional');
  const [error, setError] = useState('');

  const isViewer = user.role === 'viewer';

  const getDocText = (): string => {
    const fragment = ydoc.getXmlFragment('default');
    const xml = fragment.toString();
    // Strip XML/HTML tags (like <paragraph>, </paragraph>) to get plain text
    return xml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  };

  const handleAIAction = async (action: 'autocomplete' | 'summarize' | 'tone' | 'fix-grammar') => {
    if (isViewer && action !== 'summarize') return;

    const content = getDocText();
    if (!content) {
      setError('Document is empty. Write some text first!');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          content,
          prompt: action === 'tone' ? tone : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('AI request failed');
      }

      const data = await response.json();

      if (action === 'autocomplete' || action === 'fix-grammar') {
        // For editor modifications, we write back to the Yjs document inside a transaction
        ydoc.transact(() => {
          const fragment = ydoc.getXmlFragment('default');
          if (action === 'autocomplete') {
            const p = new Y.XmlElement('paragraph');
            p.insert(0, [new Y.XmlText(data.result)]);
            fragment.insert(fragment.length, [p]);
          } else {
            // Delete all children
            fragment.delete(0, fragment.length);
            
            // Split by newlines and insert as paragraphs
            const paragraphs = data.result.split(/\r?\n/);
            const elements = paragraphs.map((text: string) => {
              const p = new Y.XmlElement('paragraph');
              if (text.trim()) {
                p.insert(0, [new Y.XmlText(text)]);
              }
              return p;
            });
            fragment.insert(0, elements);
          }
        });
        setResult(action === 'autocomplete' ? 'Completion added to editor!' : 'Grammar corrected!');
      } else {
        // Display summary or tone rewrite in the panel itself
        setResult(data.result);
      }
    } catch (err) {
      console.error(err);
      setError('Gemini API call failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl relative overflow-hidden">
      {/* Sparkles background effect */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <Icon name="sparkles" size={20} className="text-purple-400 animate-pulse" />
        <h3 className="font-bold text-sm text-white">Gemini Writing Assistant</h3>
      </div>

      {error && (
        <div className="mb-3 p-2.5 bg-red-950/40 border border-red-800/60 rounded-lg text-red-300 text-xs flex items-center gap-2">
          <Icon name="info" size={16} className="text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={() => handleAIAction('summarize')}
          className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition text-center"
        >
          Summarize Text
        </button>

        {!isViewer && (
          <>
            <button
              onClick={() => handleAIAction('autocomplete')}
              className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition text-center"
            >
              Autocomplete Next
            </button>
            <button
              onClick={() => handleAIAction('fix-grammar')}
              className="py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-xs font-semibold transition text-center col-span-2"
            >
              Fix Spelling & Grammar
            </button>
          </>
        )}
      </div>

      {/* Tone Changer Option */}
      {!isViewer && (
        <div className="border-t border-slate-800/80 pt-3 mb-4 space-y-2">
          <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Rewrite Style
          </label>
          <div className="flex gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="flex-1 px-2.5 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="professional">💼 Professional</option>
              <option value="casual">👋 Casual & Friendly</option>
              <option value="academic">🎓 Academic & Detailed</option>
              <option value="creative">🎨 Creative & Narrative</option>
            </select>
            <button
              onClick={() => handleAIAction('tone')}
              className="py-1.5 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              Rewrite
            </button>
          </div>
        </div>
      )}

      {/* Result Panel */}
      {(loading || result) && (
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 relative min-h-24 max-h-48 overflow-y-auto">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 gap-2">
              <Icon name="spinner" size={20} className="text-purple-500" />
              <span className="text-[10px] text-slate-400 font-medium">Gemini thinking...</span>
            </div>
          ) : (
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export { AIAssistant };
