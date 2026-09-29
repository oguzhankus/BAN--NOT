'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Upload } from 'lucide-react';
import NoteCard from '@/components/NoteCard';

export default function MyNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (session?.user) loadNotes();
  }, [session, status]);

  async function loadNotes() {
    try {
      const res = await fetch('/api/profile');
      const data = await res.json();
      if (data.success) setNotes(data.data.notes);
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="container-app py-6 sm:py-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <FileText className="w-6 h-6" /> Notlarım
        </h1>
        <Link href="/yukle" className="btn btn-teal btn-sm"><Upload className="w-4 h-4" /> Yeni Not</Link>
      </div>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-5 w-3/4 mb-2" /><div className="skeleton h-4 w-1/2" /></div>)}</div>
      ) : notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id}>
              <NoteCard note={note} />
              <div className="flex gap-2 mt-1 ml-13 px-4">
                <span className={`badge text-xs ${note.status === 'published' ? 'badge-success' : note.status === 'pending_review' ? 'badge-warning' : 'badge-danger'}`}>
                  {note.status === 'published' ? 'Yayında' : note.status === 'pending_review' ? 'İncelemede' : note.status === 'rejected' ? 'Reddedildi' : note.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state"><FileText className="w-12 h-12" /><h3 className="text-lg font-semibold text-navy-800 mt-2">Henüz not paylaşmadınız</h3><p className="text-navy-500 mt-1">İlk notunuzu yükleyerek topluluğa katkıda bulunun!</p><Link href="/yukle" className="btn btn-teal mt-4"><Upload className="w-4 h-4" /> Not Paylaş</Link></div>
      )}
    </div>
  );
}
