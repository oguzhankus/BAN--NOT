'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search, Upload, BookOpen, TrendingUp, Clock,
  ArrowRight, GraduationCap, Users, Download, Star, ChevronRight
} from 'lucide-react';
import NoteCard from '@/components/NoteCard';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [popularNotes, setPopularNotes] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [universityId, setUniversityId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Get university
      const uniRes = await fetch('/api/categories?type=universities');
      const uniData = await uniRes.json();
      if (uniData.success && uniData.data.length > 0) {
        setUniversityId(uniData.data[0].id);
        // Get faculties
        const facRes = await fetch(`/api/categories?type=faculties&parentId=${uniData.data[0].id}`);
        const facData = await facRes.json();
        if (facData.success) setFaculties(facData.data);
      }

      // Get recent notes
      const recentRes = await fetch('/api/notes?sort=newest&limit=4');
      const recentData = await recentRes.json();
      if (recentData.success) setRecentNotes(recentData.data.notes);

      // Get popular notes
      const popRes = await fetch('/api/notes?sort=popular&limit=4');
      const popData = await popRes.json();
      if (popData.success) setPopularNotes(popData.data.notes);
    } catch (error) {
      console.error('Data load error:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/kesfet?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Not Paylaşıldı', value: recentNotes.length > 0 ? '10+' : '0' },
    { icon: Users, label: 'Aktif Öğrenci', value: '4' },
    { icon: GraduationCap, label: 'Ders Kapsamı', value: '19+' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-teal-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-accent-400 rounded-full blur-3xl" />
        </div>
        
        <div className="container-app relative py-16 sm:py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-sm text-teal-300 mb-6 backdrop-blur-sm border border-white/10">
              <GraduationCap className="w-4 h-4" />
              Balıkesir Üniversitesi Öğrenci Platformu
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Aradığın ders notu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-teal-400">
                burada.
              </span>
            </h1>
            
            <p className="mt-5 text-lg sm:text-xl text-navy-300 max-w-xl mx-auto leading-relaxed">
              Notlarını paylaş, keşfet ve arkadaşlarınla birlikte daha iyi öğren. 
              Tüm ders notları tek bir yerde.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400 group-focus-within:text-teal-500 transition-colors" />
                <input
                  type="search"
                  placeholder="Ders, konu veya not ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-28 py-4 text-navy-900 bg-white rounded-xl text-base shadow-lg focus:ring-2 focus:ring-teal-400 focus:outline-none transition-shadow"
                  aria-label="Not veya ders arama"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-teal px-5 py-2.5"
                >
                  Ara
                </button>
              </div>
            </form>

            {/* Quick actions */}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/kesfet" className="btn btn-sm bg-white/10 text-white border border-white/20 hover:bg-white/20">
                <BookOpen className="w-4 h-4" /> Keşfet
              </Link>
              <Link href="/yukle" className="btn btn-sm bg-teal-600 text-white hover:bg-teal-700">
                <Upload className="w-4 h-4" /> Not Paylaş
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-navy-100">
        <div className="container-app py-6">
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 bg-teal-50 rounded-lg mb-2">
                  <stat.icon className="w-5 h-5 text-teal-600" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-navy-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-navy-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Faculties */}
      <section className="container-app py-10 sm:py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900">
            Fakülteler
          </h2>
          <Link href="/kesfet" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
            Tümünü gör <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {faculties.slice(0, 10).map((faculty) => (
            <Link
              key={faculty.id}
              href={`/kesfet?faculty=${faculty.id}`}
              className="card p-4 hover:border-teal-300 transition-colors group text-center"
            >
              <div className="w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-teal-50 transition-colors">
                <GraduationCap className="w-5 h-5 text-navy-600 group-hover:text-teal-600 transition-colors" />
              </div>
              <h3 className="text-sm font-medium text-navy-800 leading-snug line-clamp-2">
                {faculty.short_name || faculty.name}
              </h3>
              <p className="text-xs text-navy-500 mt-1">{faculty.type === 'institute' ? 'Enstitü' : faculty.type === 'vocational_school' ? 'Yüksekokul' : 'Fakülte'}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Notes */}
      <section className="bg-white border-y border-navy-100">
        <div className="container-app py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Yeni Eklenenler</h2>
            </div>
            <Link href="/kesfet?sort=newest" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : recentNotes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recentNotes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen className="w-12 h-12" />
              <h3 className="text-lg font-semibold text-navy-800 mt-2">Henüz not eklenmemiş</h3>
              <p className="text-navy-500 mt-1">İlk notu paylaşan sen ol!</p>
              <Link href="/yukle" className="btn btn-teal mt-4">
                <Upload className="w-4 h-4" /> Not Paylaş
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Popular Notes */}
      {popularNotes.length > 0 && (
        <section className="container-app py-10 sm:py-14">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent-600" />
              <h2 className="text-xl sm:text-2xl font-bold text-navy-900">Popüler Notlar</h2>
            </div>
            <Link href="/kesfet?sort=popular" className="text-sm font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1">
              Tümü <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {popularNotes.map(note => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-navy-50 border-y border-navy-100">
        <div className="container-app py-10 sm:py-14">
          <h2 className="text-xl sm:text-2xl font-bold text-navy-900 text-center mb-8">
            Nasıl Çalışır?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Keşfet', desc: 'Ders veya fakülte seçerek ilgili notları bul.' },
              { step: '2', title: 'İndir', desc: 'İstediğin notu ücretsiz olarak indir.' },
              { step: '3', title: 'Paylaş', desc: 'Kendi notlarını yükleyerek topluluğa katkıda bulun.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-navy-900 mb-1">{item.title}</h3>
                <p className="text-sm text-navy-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-app py-12 sm:py-16">
        <div className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">Notlarını paylaşmaya başla</h2>
          <p className="text-navy-300 mb-6 max-w-md mx-auto">
            Binlerce öğrenciye yardımcı ol. Ders notlarını yükle ve topluluğun bir parçası ol.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/kayit" className="btn btn-teal btn-lg">
              Hemen Başla <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/nasil-calisir" className="btn btn-lg bg-white/10 text-white border border-white/20 hover:bg-white/20">
              Daha fazla bilgi
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
