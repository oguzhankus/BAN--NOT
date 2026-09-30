'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import NoteCard from '@/components/NoteCard';

export default function SavedNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (session?.user) loadSaved();
  }, [session, status]);

  async function loadSaved() {
    try {
      const res = await fetch('/api/bookmarks');
      const data = await res.json();
      if (data.success) setNotes(data.data);
    } catch {} finally { setLoading(false); }
  }

  return (
    <div className="container-app py-6 sm:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <Bookmark className="w-6 h-6" /> Kaydedilen Notlar
      </h1>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-5 w-3/4 mb-2" /><div className="skeleton h-4 w-1/2" /></div>)}</div>
      ) : notes.length > 0 ? (
        <div className="space-y-4">{notes.map(note => <NoteCard key={note.id} note={note} />)}</div>
      ) : (
        <div className="empty-state"><Bookmark className="w-12 h-12" /><h3 className="text-lg font-semibold text-navy-800 mt-2">Kaydedilen not yok</h3><p className="text-navy-500 mt-1">Beğendiğiniz notları kaydedin, buradan kolay erişin.</p></div>
      )}
    </div>
  );
}
