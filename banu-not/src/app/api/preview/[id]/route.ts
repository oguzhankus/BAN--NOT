import { NextRequest, NextResponse } from 'next/server';
import { ensureDb, errorResponse } from '@/lib/api-utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;

    // Optional: We can allow preview without login, or require login. Let's require login for security.
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Önizleme yapmak için giriş yapmalısınız.', 401);
    }

    const noteFile = db.prepare(`
      SELECT nf.*, n.title, n.status FROM note_files nf
      JOIN notes n ON nf.note_id = n.id
      WHERE nf.note_id = ? AND n.status = 'published'
      LIMIT 1
    `).get(id) as any;

    if (!noteFile) {
      return errorResponse('Dosya bulunamadı.', 404);
    }

    const filePath = noteFile.storage_path;
    if (!fs.existsSync(filePath)) {
      return errorResponse('Dosya sunucuda bulunamadı.', 404);
    }

    const fileBuffer = fs.readFileSync(filePath);
    
    // Inline disposition allows the browser to preview the PDF instead of downloading
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': noteFile.mime_type,
        'Content-Disposition': `inline; filename="${encodeURIComponent(noteFile.original_name)}"`,
        'Content-Length': noteFile.file_size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Preview error:', error);
    return errorResponse('Önizleme yüklenirken bir hata oluştu.', 500);
  }
}
