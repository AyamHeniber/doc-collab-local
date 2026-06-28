import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { WebsocketProvider } from 'y-websocket';

export interface CollaborationState {
  ydoc: Y.Doc | null;
  localSynced: boolean;
  wsStatus: 'connecting' | 'connected' | 'disconnected';
  provider: WebsocketProvider | null;
  syncedDocId: string | null;
}

export function useCollaboration(
  documentId: string,
  user: { name: string; email: string; role: 'owner' | 'editor' | 'viewer' }
): CollaborationState {
  const [state, setState] = useState<CollaborationState>({
    ydoc: null,
    localSynced: false,
    wsStatus: 'disconnected',
    provider: null,
    syncedDocId: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create a new Yjs document instance for this room
    const doc = new Y.Doc();

    // 1. Setup IndexedDB local persistence (Client-First storage)
    const localProvider = new IndexeddbPersistence(documentId, doc);
    localProvider.on('synced', () => {
      console.log(`[LOCAL SYNCED] Loaded document "${documentId}" from local IndexedDB.`);
      setState((s) => (s.ydoc === doc ? { ...s, localSynced: true } : s));
    });

    // 2. Setup WebSocket connection (Background replication)
    const wsServerUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:1234';
    const wsUrl = `${wsServerUrl}?documentId=${documentId}&role=${user.role}&email=${encodeURIComponent(
      user.email
    )}`;

    const wsProvider = new WebsocketProvider(wsUrl, documentId, doc, { connect: true });

    // Track WebSocket sync status
    wsProvider.on('status', (event: { status: 'connecting' | 'connected' | 'disconnected' }) => {
      console.log(`[WS SYNC STATUS] WebSocket room "${documentId}" is ${event.status}`);
      setState((s) => (s.ydoc === doc ? { ...s, wsStatus: event.status } : s));
    });

    const handleOnline = () => {
      console.log('[NETWORK] Browser went online. Reconnecting WebSocket...');
      wsProvider.connect();
    };

    const handleOffline = () => {
      console.log('[NETWORK] Browser went offline. Disconnecting WebSocket...');
      wsProvider.disconnect();
      setState((s) => (s.ydoc === doc ? { ...s, wsStatus: 'disconnected' } : s));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Resilient 500ms network status polling loop (ensures headless browser testing compatibility)
    const checkOnlineStatus = () => {
      if (navigator.onLine) {
        if (!wsProvider.shouldConnect) {
          handleOnline();
        }
      } else {
        if (wsProvider.shouldConnect) {
          handleOffline();
        }
      }
    };
    const networkInterval = setInterval(checkOnlineStatus, 500);

    // Initial state synchronization
    if (!navigator.onLine) {
      handleOffline();
    }

    // Commit all references to state at once
    setState({
      ydoc: doc,
      localSynced: false,
      wsStatus: navigator.onLine ? 'connecting' : 'disconnected',
      provider: wsProvider,
      syncedDocId: documentId,
    });

    // Clean up connections on unmount/re-run
    return () => {
      console.log(`[COLLAB CLEANUP] Destroying sync providers for room: ${documentId}`);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(networkInterval);
      
      // Clear state synchronously to prevent render cycles from using destroyed objects
      setState({
        ydoc: null,
        localSynced: false,
        wsStatus: 'disconnected',
        provider: null,
        syncedDocId: null,
      });

      localProvider.destroy();
      wsProvider.destroy();
      doc.destroy();
    };
  }, [documentId, user.email, user.role]);

  return state;
}

