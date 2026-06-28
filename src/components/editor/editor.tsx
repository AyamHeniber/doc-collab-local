'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import { CustomCollaborationCursor as CollaborationCursor } from './extensions/collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { Icon } from '../ui/icon';

interface EditorProps {
  ydoc: Y.Doc;
  provider: WebsocketProvider;
  user: {
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer';
  };
}

// Curated selection of vibrant colors for participant cursors
const cursorColors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#06b6d4'];

function getCursorColor(email: string) {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return cursorColors[Math.abs(hash) % cursorColors.length];
}

export default function CollaborativeEditor({ ydoc, provider, user }: EditorProps) {
  const isViewer = user.role === 'viewer';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable history because Collaboration has its own history provider
        history: false,
      } as any),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        user: {
          name: user.name,
          color: getCursorColor(user.email),
        },
      }),
    ],
    editable: !isViewer,
  }, [ydoc, provider]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    );
  }

  // Helper helper to generate button classes with no layout shifts
  const getButtonClass = (isActive: boolean) => {
    return `p-2 rounded-lg transition hover:bg-slate-800 text-slate-300 border ${
      isActive
        ? 'bg-purple-900/40 text-purple-300 border-purple-800/40 shadow-sm shadow-purple-950/20'
        : 'border-transparent hover:text-slate-100'
    }`;
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl relative">
      {/* Banner for View-only Mode */}
      {isViewer && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 px-4 py-2 flex items-center gap-2 text-amber-300 text-xs">
          <Icon name="eye" size={16} className="text-amber-400" />
          <span>You are viewing this document in <strong>Read-Only</strong> mode. You cannot make edits.</span>
        </div>
      )}

      {/* Rich Text Toolbar */}
      {!isViewer && (
        <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-950/60 border-b border-slate-800/80">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={getButtonClass(editor.isActive('bold'))}
            title="Bold"
          >
            <Icon name="bold" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={getButtonClass(editor.isActive('italic'))}
            title="Italic"
          >
            <Icon name="italic" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={getButtonClass(editor.isActive('strike'))}
            title="Strikethrough"
          >
            <Icon name="strike" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={getButtonClass(editor.isActive('code'))}
            title="Inline Code"
          >
            <Icon name="code" size={16} />
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={getButtonClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            <span className="text-[10px] font-extrabold select-none leading-none w-4 h-4 flex items-center justify-center">H1</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={getButtonClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            <span className="text-[10px] font-extrabold select-none leading-none w-4 h-4 flex items-center justify-center">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={getButtonClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
          >
            <span className="text-[10px] font-extrabold select-none leading-none w-4 h-4 flex items-center justify-center">H3</span>
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={getButtonClass(editor.isActive('bulletList'))}
            title="Bullet List"
          >
            <Icon name="list-bullet" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={getButtonClass(editor.isActive('orderedList'))}
            title="Ordered List"
          >
            <Icon name="list-ordered" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={getButtonClass(editor.isActive('blockquote'))}
            title="Blockquote"
          >
            <Icon name="quote" size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={getButtonClass(editor.isActive('codeBlock'))}
            title="Code Block"
          >
            <Icon name="terminal" size={16} />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <div className="bg-slate-900/40 text-slate-200">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
export { CollaborativeEditor };
