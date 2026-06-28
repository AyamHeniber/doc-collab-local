import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { documents, documentCollaborators } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const createDocumentSchema = z.object({
  title: z.string().min(1).max(200).default('Untitled Document'),
});

// GET /api/documents - fetch all documents that the current user has access to
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Select documents through the collaboration table (tenant isolation)
    const userCollabs = await db.query.documentCollaborators.findMany({
      where: eq(documentCollaborators.userId, session.user.id),
    });

    const docIds = userCollabs.map((c) => c.documentId);
    if (docIds.length === 0) {
      return NextResponse.json([]);
    }

    // Load documents
    const docList = await db.query.documents.findMany({
      where: (docs, { inArray }) => inArray(docs.id, docIds),
    });

    // Enforce role formatting
    const docListWithRoles = docList.map((doc) => {
      const collab = userCollabs.find((c) => c.documentId === doc.id);
      return {
        ...doc,
        role: collab?.role || 'viewer',
      };
    });

    return NextResponse.json(docListWithRoles);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/documents - create a new document
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const json = await req.json();
    const payload = createDocumentSchema.parse(json);

    // Create document and link current user as Owner
    const [newDoc] = await db.insert(documents).values({
      title: payload.title,
    }).returning();

    await db.insert(documentCollaborators).values({
      documentId: newDoc.id,
      userId: session.user.id,
      role: 'owner', // Creator is always the owner
    });

    return NextResponse.json({ ...newDoc, role: 'owner' }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid fields', details: error.issues }, { status: 400 });
    }
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
