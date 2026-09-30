'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { User, BookOpen, Download, Eye, Calendar, MessageSquare } from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import Link from 'next/link';

export default function PublicProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`/api/users/${id}`);
        const data = await res.json();
        if (data.success) {
          setProfile(data.data.user);
          setNotes(data.data.notes);
          setStats(data.data.stats);
        } else {
          setError(data.error || 'Kullanıcı bulunamadı.');
        }
      } catch (err) {
        setError('Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
    
    if (id) loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="skeleton h-32 w-full mb-6 rounded-xl" />
        <div className="skeleton h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container-app py-16 text-center">
        <User className="w-16 h-16 text-navy-300 mx-auto" />
        <h1 className="text-xl font-bold text-navy-800 mt-4">{error || 'Kullanıcı Bulunamadı'}</h1>
        <p className="text-navy-500 mt-2">Bu kullanıcı mevcut değil veya profili gizli olabilir.</p>
        <Link href="/kesfet" className="btn btn-primary mt-4">Keşfete Git</Link>
      </div>
    );
  }

  return (
    <div className="container-app py-6 sm:py-8 max-w-4xl mx-auto">
      <div className="card p-6 mb-8 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-teal-50 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-accent-50 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center shrink-0 border-4 border-white shadow-sm">
              <span className="text-3xl font-bold text-teal-700">
                {profile.display_name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-navy-900">{profile.display_name}</h1>
                {profile.role === 'admin' && (
                  <span className="badge badge-teal">Yönetici</span>
                )}
                {/* Gamification Badges */}
                {notes.length >= 15 ? (
                  <span className="badge bg-amber-100 text-amber-700 border border-amber-200">👑 Efsanevi</span>
                ) : notes.length >= 5 ? (
                  <span className="badge bg-blue-100 text-blue-700 border border-blue-200">⭐ Çalışkan</span>
                ) : notes.length >= 1 ? (
                  <span className="badge bg-green-100 text-green-700 border border-green-200">🤝 Katkıda Bulunan</span>
                ) : (
                  <span className="badge bg-gray-100 text-gray-600 border border-gray-200">🌱 Yeni Öğrenci</span>
                )}
              </div>
              {profile.bio && <p className="text-sm text-navy-600 max-w-md">{profile.bio}</p>}
              <div className="flex items-center gap-1 mt-2 text-xs text-navy-500 font-medium">
                <Calendar className="w-3.5 h-3.5" />
                Katılım: {new Date(profile.created_at).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:ml-auto items-center">
            <div className="flex gap-4 bg-navy-50 p-4 rounded-xl">
              <div className="text-center">
                <div className="text-lg font-bold text-navy-900">{notes.length}</div>
                <div className="text-xs text-navy-500 uppercase tracking-wide">Not</div>
              </div>
              <div className="w-px bg-navy-200"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-navy-900">{stats?.totalDownloads || 0}</div>
                <div className="text-xs text-navy-500 uppercase tracking-wide">İndirme</div>
              </div>
            </div>
            
            <Link 
              href={`/mesajlar?userId=${profile.id}`} 
              className="btn bg-teal-600 hover:bg-teal-700 text-white w-full sm:w-auto"
            >
              <MessageSquare className="w-4 h-4" />
              Mesaj Gönder
            </Link>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-teal-600" /> 
        Paylaşılan Notlar
      </h2>
      
      {notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notes.map(note => <NoteCard key={note.id} note={note} />)}
        </div>
      ) : (
        <div className="empty-state bg-white border border-navy-100 rounded-xl">
          <BookOpen className="w-12 h-12 text-navy-200" />
          <p className="text-navy-500 mt-2 font-medium">Bu kullanıcı henüz hiç not paylaşmamış.</p>
        </div>
      )}
    </div>
  );
}
