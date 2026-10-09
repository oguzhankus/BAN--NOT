'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bookmark, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import { useToast } from '@/components/Toast';

type SavedNote = {
  id: string;
  title: string;
  note_type: string;
  user_id: string;
  download_count: number;
  view_count: number;
  created_at: string;
  user_display_name?: string;
  user_is_email_verified?: number;
  course_name?: string;
  faculty_name?: string;
  department_name?: string;
  file_size?: number;
  mime_type?: string;
};

type Collection = { id: string; name: string; notes: SavedNote[] };

export default function SavedNotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [loading, setLoading] = useState(true);

  const loadSaved = useCallback(async () => {
    try {
      const [notesResponse, collectionsResponse] = await Promise.all([
        fetch('/api/bookmarks'),
        fetch('/api/collections'),
      ]);
      const [notesResult, collectionsResult] = await Promise.all([
        notesResponse.json(),
        collectionsResponse.json(),
      ]);
      if (!notesResponse.ok || !notesResult.success) {
        throw new Error(notesResult.error || 'Kaydedilen notlar yüklenemedi.');
      }
      if (!collectionsResponse.ok || !collectionsResult.success) {
        throw new Error(collectionsResult.error || 'Koleksiyonlar yüklenemedi.');
      }
      setNotes(notesResult.data as SavedNote[]);
      setCollections(collectionsResult.data as Collection[]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Kaydedilenler yüklenemedi.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (session?.user) void Promise.resolve().then(loadSaved);
  }, [session, status, router, loadSaved]);

  async function createCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCollectionName }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast(result.error || 'Koleksiyon oluşturulamadı.', 'error');
        return;
      }
      setNewCollectionName('');
      await loadSaved();
      setSelectedCollectionId(result.data.id);
      showToast('Koleksiyon oluşturuldu.');
    } catch {
      showToast('Koleksiyon oluşturulurken bağlantı hatası oluştu.', 'error');
    }
  }

  async function renameCollection(collection: Collection) {
    const name = window.prompt('Koleksiyonun yeni adı:', collection.name);
    if (name === null || name.trim() === collection.name) return;
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast(result.error || 'Koleksiyon yeniden adlandırılamadı.', 'error');
        return;
      }
      await loadSaved();
      showToast('Koleksiyon adı güncellendi.');
    } catch {
      showToast('Koleksiyon güncellenirken bağlantı hatası oluştu.', 'error');
    }
  }

  async function deleteCollection(collection: Collection) {
    if (!window.confirm(`"${collection.name}" koleksiyonunu silmek istiyor musun? Notlar kaydedilenlerden silinmez.`)) return;
    try {
      const response = await fetch(`/api/collections/${collection.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast(result.error || 'Koleksiyon silinemedi.', 'error');
        return;
      }
      if (selectedCollectionId === collection.id) setSelectedCollectionId('');
      await loadSaved();
      showToast('Koleksiyon silindi.');
    } catch {
      showToast('Koleksiyon silinirken bağlantı hatası oluştu.', 'error');
    }
  }

  async function removeFromCollection(collection: Collection, note: SavedNote) {
    try {
      const response = await fetch(`/api/collections/${collection.id}/notes?noteId=${encodeURIComponent(note.id)}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        showToast(result.error || 'Not koleksiyondan çıkarılamadı.', 'error');
        return;
      }
      await loadSaved();
      showToast('Not koleksiyondan çıkarıldı.');
    } catch {
      showToast('Not koleksiyondan çıkarılırken bağlantı hatası oluştu.', 'error');
    }
  }

  const selectedCollection = collections.find(collection => collection.id === selectedCollectionId);

  return (
    <div className="container-app py-6 sm:py-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
        <Bookmark className="w-6 h-6" /> Kaydedilen Notlar
      </h1>
      <section className="card mb-6 p-5">
        <h2 className="text-lg font-bold text-navy-900">Koleksiyonların</h2>
        <p className="mt-1 text-sm text-navy-500">Kaydettiğin notları ders veya sınav hazırlığına göre klasörle.</p>
        <form onSubmit={createCollection} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            className="input min-w-0 flex-1"
            value={newCollectionName}
            onChange={event => setNewCollectionName(event.target.value)}
            placeholder="Örn. Fizik-1 Final Hazırlık"
            minLength={2}
            maxLength={60}
            required
          />
          <button className="btn btn-teal shrink-0" type="submit">
            <FolderPlus className="h-4 w-4" /> Klasör oluştur
          </button>
        </form>
        {collections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCollectionId('')}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${!selectedCollectionId ? 'bg-teal-700 text-white' : 'bg-navy-50 text-navy-700'}`}
            >
              Tümü
            </button>
            {collections.map(collection => (
              <div key={collection.id} className="flex items-center gap-1 rounded-full border border-navy-100 pl-3">
                <button
                  type="button"
                  onClick={() => setSelectedCollectionId(collection.id)}
                  className={`py-1.5 text-sm font-semibold ${selectedCollectionId === collection.id ? 'text-teal-800' : 'text-navy-700'}`}
                >
                  {collection.name} <span className="text-xs text-navy-400">({collection.notes.length})</span>
                </button>
                <button type="button" aria-label={`Rename ${collection.name}`} onClick={() => void renameCollection(collection)} className="rounded-full p-1.5 text-navy-400 hover:bg-teal-50 hover:text-teal-700">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label={`Delete ${collection.name}`} onClick={() => void deleteCollection(collection)} className="rounded-full p-1.5 text-navy-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="card p-5"><div className="skeleton h-5 w-3/4 mb-2" /><div className="skeleton h-4 w-1/2" /></div>)}</div>
      ) : selectedCollection ? (
        selectedCollection.notes.length > 0
          ? <div className="space-y-4">{selectedCollection.notes.map(note => (
            <div key={note.id}>
              <NoteCard note={note} />
              <button
                type="button"
                onClick={() => void removeFromCollection(selectedCollection, note)}
                className="relative z-10 -mt-2 ml-4 inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-navy-500 hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" /> Koleksiyondan çıkar
              </button>
            </div>
          ))}</div>
          : <div className="empty-state"><Bookmark className="w-12 h-12" /><h3 className="text-lg font-semibold text-navy-800 mt-2">Bu koleksiyon boş</h3><p className="text-navy-500 mt-1">Not kartlarındaki “Koleksiyona ekle” düğmesini kullan.</p></div>
      ) : notes.length > 0 ? (
        <div className="space-y-4">{notes.map(note => <NoteCard key={note.id} note={note} />)}</div>
      ) : (
        <div className="empty-state"><Bookmark className="w-12 h-12" /><h3 className="text-lg font-semibold text-navy-800 mt-2">Kaydedilen not yok</h3><p className="text-navy-500 mt-1">Beğendiğiniz notları kaydedin, buradan kolay erişin.</p></div>
      )}
    </div>
  );
}
