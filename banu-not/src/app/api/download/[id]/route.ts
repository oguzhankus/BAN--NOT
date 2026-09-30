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

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return errorResponse('Dosya indirmek için giriş yapmalısınız veya kayıt olmalısınız.', 401);
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

    // Increment download count (only once per request)
    db.prepare('UPDATE notes SET download_count = download_count + 1 WHERE id = ?').run(id);

    const fileBuffer = fs.readFileSync(filePath);
    
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': noteFile.mime_type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(noteFile.original_name)}"`,
        'Content-Length': noteFile.file_size.toString(),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return errorResponse('Dosya indirilirken bir hata oluştu.', 500);
  }
}
