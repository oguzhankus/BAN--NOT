'use client';

import { useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/Toast';
import {
  Search, Filter, X, ChevronDown, SlidersHorizontal,
  BookOpen, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import NoteCard from '@/components/NoteCard';
import { NOTE_TYPES, SEMESTERS } from '@/lib/constants';

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { showToast } = useToast();
  const toast = useMemo(
    () => ({
      success: (message: string) => showToast(message, 'success'),
      error: (message: string) => showToast(message, 'error'),
    }),
    [showToast]
  );

  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedCourses, setTrackedCourses] = useState<string[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  const [selectedUni, setSelectedUni] = useState(searchParams.get('university') || '');
  const [selectedFaculty, setSelectedFaculty] = useState(searchParams.get('faculty') || '');
  const [selectedDept, setSelectedDept] = useState(searchParams.get('department') || '');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');
  const [selectedType, setSelectedType] = useState(searchParams.get('type') || '');
  const [selectedSemester, setSelectedSemester] = useState(searchParams.get('semester') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1'));
  const [showFilters, setShowFilters] = useState(false);

  // Load universities
  useEffect(() => {
    fetch('/api/categories?type=universities')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUniversities(d.data);
          if (d.data.length === 1 && !selectedUni) {
            setSelectedUni(d.data[0].id);
          }
        }
      });
      
    if (session?.user) {
      fetch('/api/profile/courses')
        .then(r => r.json())
        .then(d => { if (d.success) setTrackedCourses(d.data.map((c: any) => c.id)); });
    }
  }, [session]);

  // Load faculties when university changes
  useEffect(() => {
    if (selectedUni) {
      fetch(`/api/categories?type=faculties&parentId=${selectedUni}`)
        .then(r => r.json())
        .then(d => { if (d.success) setFaculties(d.data); });
    } else {
      setFaculties([]);
    }
    if (!searchParams.get('faculty')) {
      setSelectedFaculty('');
      setSelectedDept('');
      setSelectedCourse('');
    }
  }, [selectedUni]);

  // Load departments when faculty changes
  useEffect(() => {
    if (selectedFaculty) {
      fetch(`/api/categories?type=departments&parentId=${selectedFaculty}`)
        .then(r => r.json())
        .then(d => { if (d.success) setDepartments(d.data); });
    } else {
      setDepartments([]);
    }
    setSelectedDept('');
    setSelectedCourse('');
  }, [selectedFaculty]);

  // Load courses when department changes
  useEffect(() => {
    if (selectedDept) {
      fetch(`/api/categories?type=courses&parentId=${selectedDept}`)
        .then(r => r.json())
        .then(d => { if (d.success) setCourses(d.data); });
    } else {
      setCourses([]);
    }
    setSelectedCourse('');
  }, [selectedDept]);

  // Search notes
  const searchNotes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (selectedUni) params.set('university', selectedUni);
    if (selectedFaculty) params.set('faculty', selectedFaculty);
    if (selectedDept) params.set('department', selectedDept);
    if (selectedCourse) params.set('course', selectedCourse);
    if (selectedType) params.set('type', selectedType);
    if (selectedSemester) params.set('semester', selectedSemester);
    params.set('sort', sort);
    params.set('page', page.toString());

    // Update URL
    router.replace(`/kesfet?${params.toString()}`, { scroll: false });

    try {
      const res = await fetch(`/api/notes?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setNotes(data.data.notes);
        setTotalResults(data.data.pagination.total);
        setTotalPages(data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [query, selectedUni, selectedFaculty, selectedDept, selectedCourse, selectedType, selectedSemester, sort, page]);

  useEffect(() => {
    searchNotes();
  }, [searchNotes]);

  const clearFilters = () => {
    setQuery('');
    setSelectedFaculty('');
    setSelectedDept('');
    setSelectedCourse('');
    setSelectedType('');
    setSelectedSemester('');
    setSort('newest');
    setPage(1);
  };

  const hasActiveFilters = selectedFaculty || selectedDept || selectedCourse || selectedType || selectedSemester;

  const toggleTrackCourse = async () => {
    if (!session) {
      toast.error('Ders takip etmek için giriş yapmalısınız.');
      return;
    }
    const isTracking = trackedCourses.includes(selectedCourse);
    const prev = [...trackedCourses];
    if (isTracking) {
      setTrackedCourses(prev.filter(id => id !== selectedCourse));
    } else {
      setTrackedCourses([...prev, selectedCourse]);
    }
    
    try {
      if (isTracking) {
        await fetch(`/api/profile/courses?courseId=${selectedCourse}`, { method: 'DELETE' });
        toast.success('Ders takipten çıkarıldı.');
      } else {
        await fetch('/api/profile/courses', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId: selectedCourse })
        });
        toast.success('Ders takip ediliyor! Yeni notlarda bildirim alacaksınız.');
      }
    } catch (e) {
      setTrackedCourses(prev);
      toast.error('İşlem başarısız oldu.');
    }
  };

  return (
    <div className="container-app py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Keşfet</h1>
        <p className="text-navy-500 mt-1">Ders notlarını ara, filtrele ve keşfet.</p>
      </div>

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); setPage(1); searchNotes(); }} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
            <input
              type="search"
              placeholder="Ders, konu veya not ara..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input pl-10"
              aria-label="Arama"
            />
          </div>
          <button type="submit" className="btn btn-primary">Ara</button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`btn ${showFilters ? 'btn-teal' : 'btn-secondary'} md:hidden`}
            aria-label="Filtreleri göster"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className={`md:w-64 shrink-0 ${showFilters ? 'block' : 'hidden md:block'}`}>
          <div className="card p-4 space-y-4 sticky top-20">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-navy-900 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filtreler
              </h2>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-teal-600 hover:text-teal-700 font-medium">
                  Temizle
                </button>
              )}
            </div>

            {/* Faculty */}
            <div>
              <label className="label" htmlFor="filter-faculty">Fakülte</label>
              <select
                id="filter-faculty"
                value={selectedFaculty}
                onChange={(e) => { setSelectedFaculty(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="">Tüm Fakülteler</option>
                {faculties.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {/* Department */}
            {departments.length > 0 && (
              <div>
                <label className="label" htmlFor="filter-dept">Bölüm</label>
                <select
                  id="filter-dept"
                  value={selectedDept}
                  onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
                  className="input"
                >
                  <option value="">Tüm Bölümler</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Course */}
            {courses.length > 0 && (
              <div>
                <label className="label" htmlFor="filter-course">Ders</label>
                <select
                  id="filter-course"
                  value={selectedCourse}
                  onChange={(e) => { setSelectedCourse(e.target.value); setPage(1); }}
                  className="input"
                >
                  <option value="">Tüm Dersler</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Note Type */}
            <div>
              <label className="label" htmlFor="filter-type">Not Türü</label>
              <select
                id="filter-type"
                value={selectedType}
                onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="">Tümü</option>
                {NOTE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="label" htmlFor="filter-semester">Dönem</label>
              <select
                id="filter-semester"
                value={selectedSemester}
                onChange={(e) => { setSelectedSemester(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="">Tümü</option>
                {SEMESTERS.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="label" htmlFor="filter-sort">Sıralama</label>
              <select
                id="filter-sort"
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="input"
              >
                <option value="newest">En Yeni</option>
                <option value="popular">En Çok İndirilen</option>
                <option value="rating">En Yüksek Puan</option>
                <option value="oldest">En Eski</option>
              </select>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Active filters & result count */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-navy-600">
              {loading ? 'Aranıyor...' : `${totalResults} sonuç bulundu`}
            </p>
            <div className="hidden md:flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-navy-400" />
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="text-sm border-none bg-transparent text-navy-600 focus:outline-none cursor-pointer"
                aria-label="Sıralama"
              >
                <option value="newest">En Yeni</option>
                <option value="popular">En Çok İndirilen</option>
                <option value="rating">En Yüksek Puan</option>
                <option value="oldest">En Eski</option>
              </select>
            </div>
          </div>

          {/* Active filter chips */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedFaculty && (
                  <button onClick={() => setSelectedFaculty('')} className="badge badge-teal flex items-center gap-1 cursor-pointer hover:opacity-80">
                    {faculties.find(f => f.id === selectedFaculty)?.short_name || 'Fakülte'} <X className="w-3 h-3" />
                  </button>
                )}
                {selectedDept && (
                  <button onClick={() => setSelectedDept('')} className="badge badge-teal flex items-center gap-1 cursor-pointer hover:opacity-80">
                    {departments.find(d => d.id === selectedDept)?.name || 'Bölüm'} <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCourse && (
                  <button onClick={() => setSelectedCourse('')} className="badge badge-teal flex items-center gap-1 cursor-pointer hover:opacity-80">
                    {courses.find(c => c.id === selectedCourse)?.name || 'Ders'} <X className="w-3 h-3" />
                  </button>
                )}
                {selectedType && (
                  <button onClick={() => setSelectedType('')} className="badge badge-navy flex items-center gap-1 cursor-pointer hover:opacity-80">
                    {NOTE_TYPES.find(t => t.value === selectedType)?.label} <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              {selectedCourse && session && (
                <button 
                  onClick={toggleTrackCourse}
                  className={`btn btn-sm shrink-0 ${trackedCourses.includes(selectedCourse) ? 'bg-navy-100 text-navy-700 hover:bg-navy-200' : 'btn-teal'}`}
                >
                  <BookOpen className="w-4 h-4" /> 
                  {trackedCourses.includes(selectedCourse) ? 'Takipten Çık' : 'Dersi Takip Et'}
                </button>
              )}
            </div>

          {/* Notes grid */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="card p-5 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-4 w-full" />
                </div>
              ))}
            </div>
          ) : notes.length > 0 ? (
            <div className="space-y-4">
              {notes.map(note => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <div className="empty-state py-12">
              <BookOpen className="w-16 h-16" />
              <h3 className="text-lg font-semibold text-navy-800 mt-3">Sonuç bulunamadı</h3>
              <p className="text-navy-500 mt-1 max-w-xs mx-auto">
                Arama terimlerini veya filtreleri değiştirerek tekrar deneyin.
              </p>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="btn btn-secondary mt-4">
                  Filtreleri Temizle
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8" role="navigation" aria-label="Sayfalama">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn btn-secondary btn-sm"
                aria-label="Önceki sayfa"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-navy-600 px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn btn-secondary btn-sm"
                aria-label="Sonraki sayfa"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container-app py-8"><div className="skeleton h-8 w-32 mb-4" /><div className="skeleton h-12 w-full" /></div>}>
      <ExploreContent />
    </Suspense>
  );
}
