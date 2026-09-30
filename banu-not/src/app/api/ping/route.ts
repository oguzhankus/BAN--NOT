import { NextRequest } from 'next/server';
import { ensureDb, successResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return successResponse({ status: 'ok' });

    const db = await ensureDb();
    const userId = (session.user as any).id;

    db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(userId);
    return successResponse({ status: 'updated' });
  } catch (error) {
    return successResponse({ status: 'error' });
  }
}
