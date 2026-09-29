'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, BookOpen, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import NoteCard from '@/components/NoteCard';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const user = session?.user as any;

  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '' });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (user?.id) loadProfile();
  }, [user?.id, status]);

  async function loadProfile() {
    try {
      const res = await fetch(`/api/profile`);
      const data = await res.json();
      if (data.success) {
        setProfile(data.data.user);
        setNotes(data.data.notes);
        setEditForm({ displayName: data.data.user.display_name, bio: data.data.user.bio || '' });
      }
    } catch { } finally { setLoading(false); }
  }

  async function handleSaveProfile() {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profil güncellendi.');
        setEditing(false);
        loadProfile();
      }
    } catch { showToast('Hata oluştu.', 'error'); }
  }

  if (loading) return <div className="container-app py-8"><div className="skeleton h-8 w-64 mb-4" /><div className="skeleton h-32 w-full" /></div>;
  if (!profile) return null;

  return (
    <div className="container-app py-6 sm:py-8 max-w-3xl mx-auto">
      <div className="card p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-teal-700">{profile.display_name?.charAt(0)?.toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <input type="text" value={editForm.displayName}
                  onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                  className="input" placeholder="Görünen ad" />
                <textarea value={editForm.bio}
                  onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                  className="input min-h-[60px]" placeholder="Kısa biyografi" maxLength={200} />
                <div className="flex gap-2">
                  <button onClick={handleSaveProfile} className="btn btn-primary btn-sm"><Save className="w-4 h-4" /> Kaydet</button>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm"><X className="w-4 h-4" /> İptal</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl font-bold text-navy-900">{profile.display_name}</h1>
                  <button onClick={() => setEditing(true)} className="text-navy-400 hover:text-navy-600">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                {profile.bio && <p className="text-sm text-navy-600 mb-2">{profile.bio}</p>}
                <div className="flex flex-wrap gap-3 text-xs text-navy-500">
                  <span>{profile.email}</span>
                  <span>Katılım: {new Date(profile.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5" /> Paylaştığım Notlar ({notes.length})
      </h2>
      {notes.length > 0 ? (
        <div className="space-y-4">
          {notes.map(note => <NoteCard key={note.id} note={note} />)}
        </div>
      ) : (
        <div className="empty-state">
          <BookOpen className="w-12 h-12" />
          <p className="text-navy-500 mt-2">Henüz not paylaşmadınız.</p>
        </div>
      )}
    </div>
  );
}
