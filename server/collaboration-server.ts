import { WebSocket, WebSocketServer } from 'ws';
import http from 'http';
import * as Y from 'yjs';
// @ts-ignore
import { setupWSConnection } from 'y-websocket/bin/utils';
import { db } from '../src/db';
import { documents, documentCollaborators, documentVersions } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

const PORT = process.env.PORT || process.env.WS_PORT || 1234;

const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Collaboration server is running\n');
});

const wss = new WebSocketServer({ noServer: true });

// Map of documentId to active Yjs document
const activeDocs = new Map<string, Y.Doc>();
// Map of documentId to NodeJS Timeout for saving debounced state
const saveDebounceTimeouts = new Map<string, NodeJS.Timeout>();

// Helper to save Yjs state to database
async function saveDocumentStateToDb(documentId: string, ydoc: Y.Doc) {
  try {
    const stateUpdateBinary = Y.encodeStateAsUpdate(ydoc);
    const base64State = Buffer.from(stateUpdateBinary).toString('base64');

    console.log(`[DB SAVE] Debounced save triggered for ${documentId} (size: ${base64State.length} chars)`);

    // Verify document exists in the DB first
    const existingDoc = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
    });

    if (!existingDoc) {
      console.warn(`[DB SAVE WARNING] Document ${documentId} not found in DB. Skipping save.`);
      return;
    }

    // Find the first collaborator or owner to attribute this live-state save to
    const collaborator = await db.query.documentCollaborators.findFirst({
      where: eq(documentCollaborators.documentId, documentId),
    });

    if (!collaborator) {
      console.error(`[DB SAVE ERROR] No collaborator found for document ${documentId}. Cannot save without created_by.`);
      return;
    }

    const createdBy = collaborator.userId;

    // Save/Update the "Latest Live State" version
    const existingVersion = await db.query.documentVersions.findFirst({
      where: and(
        eq(documentVersions.documentId, documentId),
        eq(documentVersions.name, 'Latest Live State')
      ),
    });

    if (existingVersion) {
      await db.update(documentVersions)
        .set({ snapshot: base64State, createdAt: new Date() })
        .where(eq(documentVersions.id, existingVersion.id));
      console.log(`[DB SAVE SUCCESS] Updated "Latest Live State" for document ${documentId}`);
    } else {
      await db.insert(documentVersions).values({
        documentId,
        name: 'Latest Live State',
        snapshot: base64State,
        createdBy,
      });
      console.log(`[DB SAVE SUCCESS] Created new "Latest Live State" for document ${documentId}`);
    }
  } catch (error) {
    console.error(`[DB SAVE ERROR] Failed to save document ${documentId}:`, error);
  }
}

wss.on('connection', async (ws: WebSocket, req: http.IncomingMessage) => {
  const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
  const documentId = url.searchParams.get('documentId') || 'default-room';
  const role = url.searchParams.get('role') || 'viewer';
  const email = url.searchParams.get('email') || 'anonymous@example.com';

  console.log(`[WS CONNECT] User ${email} (Role: ${role}) joined room: ${documentId}`);

  // Payload Validation: intercept raw messages to prevent memory exhaustion (OOM)
  ws.on('message', (message: WebSocket.RawData) => {
    const bytes = message instanceof ArrayBuffer ? message.byteLength : (message as Buffer).length;

    // Limit payload size to 2MB to prevent OOM DOS attacks
    if (bytes > 2 * 1024 * 1024) {
      console.warn(`[SECURITY WARNING] Rejection: Payload size limit exceeded (${bytes} bytes) from ${email}. Disconnecting socket.`);
      ws.close(1009, 'Payload limit exceeded');
      return;
    }

    // Role-Based Access Control check: Viewers cannot send sync changes (type 0 update)
    if (role === 'viewer') {
      try {
        const data = new Uint8Array(message as Buffer);
        const messageType = data[0];

        if (messageType === 0 && data.length > 1) {
          const syncType = data[1];
          if (syncType === 2 || syncType === 1) {
            console.warn(`[SECURITY BLOCKED] Blocked unauthorized write attempt from viewer: ${email}`);
            return;
          }
        }
      } catch (err) {
        console.error('[SECURITY ERROR] Error checking message permission:', err);
      }
    }
  });

  // Track the doc in-memory
  let ydoc = activeDocs.get(documentId);
  if (!ydoc) {
    ydoc = new Y.Doc();
    activeDocs.set(documentId, ydoc);

    // Initial database load: retrieve latest live state before client initializes sync
    try {
      const latestVersion = await db.query.documentVersions.findFirst({
        where: and(
          eq(documentVersions.documentId, documentId),
          eq(documentVersions.name, 'Latest Live State')
        ),
      });

      if (latestVersion) {
        const binaryUpdate = Buffer.from(latestVersion.snapshot, 'base64');
        Y.applyUpdate(ydoc, binaryUpdate);
        console.log(`[DOC LOAD SUCCESS] Initialized Yjs Doc ${documentId} with live DB snapshot.`);
      } else {
        console.log(`[DOC LOAD] No initial database snapshot found for ${documentId}. Starting fresh room.`);
      }
    } catch (err) {
      console.error(`[DOC LOAD ERROR] Failed loading ${documentId} snapshot:`, err);
    }

    // Listen to updates to trigger debounced saves
    ydoc.on('update', () => {
      const existingTimeout = saveDebounceTimeouts.get(documentId);
      if (existingTimeout) clearTimeout(existingTimeout);

      const timeout = setTimeout(() => {
        if (ydoc) {
          saveDocumentStateToDb(documentId, ydoc);
        }
        saveDebounceTimeouts.delete(documentId);
      }, 5000);

      saveDebounceTimeouts.set(documentId, timeout);
    });
  }

  // Setup WS connection using y-websocket utilities
  setupWSConnection(ws, req, {
    docName: documentId,
    gc: true,
  });

  ws.on('close', () => {
    console.log(`[WS DISCONNECT] User ${email} left room: ${documentId}`);
  });
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws: any) => {
    wss.emit('connection', ws, request);
  });
});

server.listen(PORT, () => {
  console.log(`[SERVER STATUS] WebSocket Collaboration Server running on port ${PORT}`);
});
export { wss };
