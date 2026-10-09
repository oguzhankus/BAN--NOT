import { getDb } from '@/lib/db';

export interface NoteSocialData {
  id: string;
  title: string;
  description: string | null;
  course_name: string | null;
  faculty_name: string | null;
  avg_rating: number;
  rating_count: number;
  status: string;
}

export function getPublicNoteSocialData(id: string): NoteSocialData | undefined {
  return getDb()
    .prepare(`
      SELECT
        n.id,
        n.title,
        n.description,
        c.name AS course_name,
        f.name AS faculty_name,
        COALESCE(AVG(r.score), 0) AS avg_rating,
        COUNT(r.id) AS rating_count,
        n.status
      FROM notes n
      LEFT JOIN courses c ON c.id = n.course_id
      LEFT JOIN faculties f ON f.id = n.faculty_id
      LEFT JOIN ratings r ON r.note_id = n.id
      WHERE n.id = ?
      GROUP BY n.id
    `)
    .get(id) as NoteSocialData | undefined;
}

export function getNoteSocialDescription(note: NoteSocialData): string {
  const context = [note.course_name, note.faculty_name].filter(Boolean).join(' · ');
  const description = note.description?.trim();
  const summary = description
    ? description.slice(0, 150)
    : 'BANÜ NOT topluluğunda ders notlarını keşfet ve paylaş.';
  return [context, summary].filter(Boolean).join(' — ').slice(0, 200);
}
