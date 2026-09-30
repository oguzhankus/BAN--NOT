'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, BookOpen, Edit, Save, X, Download, Eye, Bookmark, TrendingUp, Award, Calendar, GraduationCap, Clock } from 'lucide-react';
import { useToast } from '@/components/Toast';
import NoteCard from '@/components/NoteCard';
import Link from 'next/link';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const user = session?.user as any;

  const [profile, setProfile] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [trackedCourses, setTrackedCourses] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', bio: '', universityId: '', facultyId: '', departmentId: '', classYear: '' });
  const [activeTab, setActiveTab] = useState<'notes' | 'courses'>('notes');

  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories?type=universities')
      .then(r => r.json())
      .then(d => { if (d.success) setUniversities(d.data); });
  }, []);

  useEffect(() => {
    if (editForm.universityId) {
      fetch(`/api/categories?type=faculties&parentId=${editForm.universityId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setFaculties(d.data); });
    } else {
      setFaculties([]);
    }
  }, [editForm.universityId]);

  useEffect(() => {
    if (editForm.facultyId) {
      fetch(`/api/categories?type=departments&parentId=${editForm.facultyId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setDepartments(d.data); });
    } else {
      setDepartments([]);
    }
  }, [editForm.facultyId]);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
    if (user?.id) loadProfile();
  }, [user?.id, status]);

  async function loadProfile() {
    try {
      const [profRes, coursesRes] = await Promise.all([
        fetch(`/api/profile`),
        fetch(`/api/profile/courses`)
      ]);
      
      const profData = await profRes.json();
      const coursesData = await coursesRes.json();

      if (profData.success) {
        setProfile(profData.data.user);
        setNotes(profData.data.notes);
        setStats(profData.data.stats);
        setEditForm({ 
          displayName: profData.data.user.display_name, 
          bio: profData.data.user.bio || '',
          universityId: profData.data.user.university_id || '',
          facultyId: profData.data.user.faculty_id || '',
          departmentId: profData.data.user.department_id || '',
          classYear: profData.data.user.class_year || ''
        });
      }
      
      if (coursesData.success) {
        setTrackedCourses(coursesData.data);
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

  // Calculate Badges
  const badges = [];
  if (profile) {
    const daysSinceJoined = (new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 3600 * 24);
    if (daysSinceJoined < 30) badges.push({ name: 'Yeni Üye', icon: '🌱', color: 'bg-emerald-100 text-emerald-700' });
    else badges.push({ name: 'Eski Toprak', icon: '🌳', color: 'bg-amber-100 text-amber-700' });

    if (notes.length >= 1) badges.push({ name: 'Katkıda Bulunan', icon: '✍️', color: 'bg-blue-100 text-blue-700' });
    if (notes.length >= 5) badges.push({ name: 'Süper Paylaşımcı', icon: '🚀', color: 'bg-purple-100 text-purple-700' });
    if (stats?.totalDownloads >= 10) badges.push({ name: 'Popüler Yazar', icon: '🔥', color: 'bg-orange-100 text-orange-700' });
    if (stats?.bookmarkedNotes >= 5) badges.push({ name: 'Favori Kaynak', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' });
  }

  if (loading) return <div className="container-app py-8"><div className="skeleton h-48 w-full mb-8 rounded-2xl" /><div className="skeleton h-32 w-full" /></div>;
  if (!profile) return null;

  return (
    <div className="container-app py-6 sm:py-10 max-w-5xl mx-auto">
      {/* Banner & Header */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-navy-100 mb-8">
        <div className="h-40 sm:h-56 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-400 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
          {/* Decorative shapes */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-1/4 w-40 h-40 bg-navy-900/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row gap-6 sm:items-end -mt-16 sm:-mt-20 mb-6">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-white rounded-full p-2 shrink-0 shadow-lg relative z-10 mx-auto sm:mx-0">
              <div className="w-full h-full bg-gradient-to-br from-teal-50 to-teal-100 rounded-full flex items-center justify-center border-4 border-white overflow-hidden shadow-inner">
                <span className="text-4xl sm:text-6xl font-black text-teal-700 drop-shadow-sm">
                  {profile.display_name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left z-10 pt-2 sm:pt-0">
              {editing ? (
                <div className="max-w-md mx-auto sm:mx-0 space-y-3 bg-white p-4 rounded-xl shadow-lg border border-navy-100">
                  <input type="text" value={editForm.displayName}
                    onChange={(e) => setEditForm(f => ({ ...f, displayName: e.target.value }))}
                    className="input font-bold" placeholder="Görünen ad" />
                  
                  <select value={editForm.universityId} onChange={(e) => setEditForm(f => ({ ...f, universityId: e.target.value, facultyId: '', departmentId: '' }))} className="input text-sm">
                    <option value="">Üniversite seçin</option>
                    {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>

                  {editForm.universityId && (
                    <select value={editForm.facultyId} onChange={(e) => setEditForm(f => ({ ...f, facultyId: e.target.value, departmentId: '' }))} className="input text-sm">
                      <option value="">Fakülte seçin (isteğe bağlı)</option>
                      {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                  )}

                  {editForm.facultyId && (
                    <select value={editForm.departmentId} onChange={(e) => setEditForm(f => ({ ...f, departmentId: e.target.value }))} className="input text-sm">
                      <option value="">Bölüm seçin (isteğe bağlı)</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}

                  {editForm.departmentId && (
                    <select value={editForm.classYear} onChange={(e) => setEditForm(f => ({ ...f, classYear: e.target.value }))} className="input text-sm">
                      <option value="">Sınıf seçin (isteğe bağlı)</option>
                      <option value="1">1. Sınıf</option>
                      <option value="2">2. Sınıf</option>
                      <option value="3">3. Sınıf</option>
                      <option value="4">4. Sınıf</option>
                      <option value="5">5. Sınıf</option>
                      <option value="6">6. Sınıf</option>
                      <option value="Hazırlık">Hazırlık</option>
                    </select>
                  )}

                  <textarea value={editForm.bio}
                    onChange={(e) => setEditForm(f => ({ ...f, bio: e.target.value }))}
                    className="input min-h-[80px] resize-none text-sm" placeholder="Kısa biyografi yaz..." maxLength={200} />
                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSaveProfile} className="btn btn-teal btn-sm flex-1"><Save className="w-4 h-4" /> Kaydet</button>
                    <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm flex-1"><X className="w-4 h-4" /> İptal</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 mb-1">{profile.display_name}</h1>
                    <p className="text-navy-500 font-medium flex items-center justify-center sm:justify-start gap-2">
                      <GraduationCap className="w-4 h-4" /> {profile.email}
                    </p>
                    {profile.bio && <p className="text-navy-700 mt-3 max-w-2xl leading-relaxed">{profile.bio}</p>}
                  </div>
                  <button onClick={() => setEditing(true)} className="btn btn-outline btn-sm mx-auto sm:mx-0 shrink-0">
                    <Edit className="w-4 h-4" /> Profili Düzenle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Badges */}
          {!editing && badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 pt-6 border-t border-navy-100">
              <span className="text-xs font-bold text-navy-400 uppercase tracking-wider mr-2">Başarılar</span>
              {badges.map((badge, i) => (
                <span key={i} className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border border-black/5 ${badge.color}`}>
                  <span className="text-base">{badge.icon}</span> {badge.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />
              İstatistikler
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600"><Download className="w-5 h-5" /></div>
                  <span className="font-medium text-navy-700">Toplam İndirme</span>
                </div>
                <span className="font-bold text-navy-900 text-lg">{stats.totalDownloads}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600"><Eye className="w-5 h-5" /></div>
                  <span className="font-medium text-navy-700">Görüntülenme</span>
                </div>
                <span className="font-bold text-navy-900 text-lg">{stats.totalViews}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-navy-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600"><Bookmark className="w-5 h-5" /></div>
                  <span className="font-medium text-navy-700">Kaydedilme</span>
                </div>
                <span className="font-bold text-navy-900 text-lg">{stats.bookmarkedNotes}</span>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-teal-600" />
              Hakkında
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-navy-500">Katılım Tarihi</span>
                <span className="font-medium text-navy-900 flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-navy-400" />
                  {new Date(profile.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">Rol</span>
                <span className="font-medium text-navy-900 capitalize">{profile.role === 'user' ? 'Öğrenci' : profile.role}</span>
              </li>
              {profile.faculty_name && (
                <li className="flex items-start justify-between gap-4">
                  <span className="text-navy-500 shrink-0">Fakülte</span>
                  <span className="font-medium text-navy-900 text-right line-clamp-2">{profile.faculty_name}</span>
                </li>
              )}
              {profile.department_name && (
                <li className="flex items-start justify-between gap-4">
                  <span className="text-navy-500 shrink-0">Bölüm</span>
                  <span className="font-medium text-navy-900 text-right line-clamp-2">{profile.department_name}</span>
                </li>
              )}
              {profile.class_year && (
                <li className="flex items-center justify-between">
                  <span className="text-navy-500">Sınıf</span>
                  <span className="font-medium text-navy-900">{profile.class_year}. Sınıf</span>
                </li>
              )}
              <li className="flex items-center justify-between">
                <span className="text-navy-500">Not Sayısı</span>
                <span className="font-medium text-navy-900">{notes.length}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-navy-500">Takip Edilen Ders</span>
                <span className="font-medium text-navy-900">{trackedCourses.length}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-8">
          
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-navy-100 pb-2">
            <button 
              onClick={() => setActiveTab('notes')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'notes' ? 'bg-navy-900 text-white shadow-md' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              }`}
            >
              Paylaştığım Notlar ({notes.length})
            </button>
            <button 
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'courses' ? 'bg-navy-900 text-white shadow-md' : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              }`}
            >
              Takip Ettiğim Dersler ({trackedCourses.length})
            </button>
          </div>

          {activeTab === 'notes' && (
            <div>
              {notes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {notes.map(note => <NoteCard key={note.id} note={note} />)}
                </div>
              ) : (
                <div className="card p-12 text-center border-dashed border-2 border-navy-200">
                  <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-8 h-8 text-navy-300" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2">Henüz Not Paylaşmadınız</h3>
                  <p className="text-navy-500 mb-6 max-w-sm mx-auto">
                    Kendi ders notlarınızı paylaşarak diğer öğrencilere yardımcı olabilir ve başarı rozetleri kazanabilirsiniz.
                  </p>
                  <Link href="/yukle" className="btn btn-teal mx-auto shadow-lg shadow-teal-500/20">
                    İlk Notunu Paylaş
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              {trackedCourses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trackedCourses.map(course => (
                    <Link href={`/kesfet?course=${course.id}`} key={course.id} className="card p-5 hover:border-teal-400 group transition-all hover:shadow-md">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-teal-500 group-hover:scale-110 transition-all duration-300">
                          <BookOpen className="w-6 h-6 text-teal-600 group-hover:text-white transition-colors" />
                        </div>
                        <div>
                          <h4 className="font-bold text-navy-900 group-hover:text-teal-700 transition-colors line-clamp-2">
                            {course.name}
                          </h4>
                          {course.code && <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded mt-2 inline-block">{course.code}</span>}
                          {course.semester && <span className="text-xs text-navy-500 ml-2">{course.semester}. Yarıyıl</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center border-dashed border-2 border-navy-200">
                  <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-navy-300" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2">Ders Takip Etmiyorsunuz</h3>
                  <p className="text-navy-500 mb-6 max-w-sm mx-auto">
                    İlgilendiğiniz dersleri takip ederek yeni not eklendiğinde hemen haberdar olabilirsiniz.
                  </p>
                  <Link href="/dersler" className="btn btn-outline mx-auto">
                    Dersleri Keşfet
                  </Link>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
