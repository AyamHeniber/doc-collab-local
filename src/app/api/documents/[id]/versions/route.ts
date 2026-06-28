import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/db';
import { documentVersions, documentCollaborators } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const createVersionSchema = z.object({
  name: z.string().min(1).max(100),
  snapshot: z.string().min(1), // Base64 encoded update state
});

// GET /api/documents/[id]/versions - retrieve history timeline
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Next.js params is a Promise in newer versions of Next.js, so we await it
  const { id: documentId } = await (params as any);

  try {
    // 1. Check permissions (must be collaborator)
    const collab = await db.query.documentCollaborators.findFirst({
      where: and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, session.user.id)
      ),
    });

    if (!collab) {
      return NextResponse.json({ error: 'Forbidden. Not a collaborator.' }, { status: 403 });
    }

    // 2. Fetch versions ordered by creation time
    const versions = await db.query.documentVersions.findMany({
      where: eq(documentVersions.documentId, documentId),
      orderBy: [desc(documentVersions.createdAt)],
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/documents/[id]/versions - snapshot a new version
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId } = await (params as any);

  try {
    // 1. Check permissions (must be owner or editor to create versions)
    const collab = await db.query.documentCollaborators.findFirst({
      where: and(
        eq(documentCollaborators.documentId, documentId),
        eq(documentCollaborators.userId, session.user.id)
      ),
    });

    if (!collab || collab.role === 'viewer') {
      return NextResponse.json({ error: 'Forbidden. Viewers cannot create snapshots.' }, { status: 403 });
    }

    // 2. Validate payload size and inputs
    const json = await req.json();
    
    // Safety check on raw input size (rejecting huge updates)
    if (JSON.stringify(json).length > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Payload size limit exceeded' }, { status: 413 });
    }

    const payload = createVersionSchema.parse(json);

    // 3. Insert version entry
    const [newVersion] = await db.insert(documentVersions).values({
      documentId,
      name: payload.name,
      snapshot: payload.snapshot,
      createdBy: session.user.id,
    }).returning();

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid fields', details: error.issues }, { status: 400 });
    }
    console.error('Error creating version snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
