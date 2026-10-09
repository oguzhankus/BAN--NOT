import type { Metadata } from 'next';
import { getNoteSocialDescription, getPublicNoteSocialData } from '@/lib/note-social';

interface NoteRouteProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NoteRouteProps): Promise<Metadata> {
  const { id } = await params;
  const note = getPublicNoteSocialData(id);

  if (!note || note.status !== 'published') {
    return {
      title: 'Not bulunamadı | BANÜ NOT',
      description: 'Bu not yayında değil veya bulunamadı.',
      robots: { index: false, follow: false },
    };
  }

  const title = `${note.title} | BANÜ NOT`;
  const description = getNoteSocialDescription(note);
  const image = `/not/${encodeURIComponent(id)}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: `/not/${encodeURIComponent(id)}` },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'tr_TR',
      siteName: 'BANÜ NOT',
      images: [{ url: image, width: 1200, height: 630, alt: note.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function NoteRouteLayout({ children }: NoteRouteProps) {
  return children;
}
