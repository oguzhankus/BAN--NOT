'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, BookOpen, Building2, ChevronRight, GraduationCap, Search, X,
} from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  short_name?: string | null;
  type?: string | null;
}

interface Department {
  id: string;
  faculty_id: string;
  name: string;
}

interface CatalogData {
  faculties: Faculty[];
  departments: Department[];
}

export default function CoursesPage() {
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch('/api/catalog');
        const json = await response.json();
        if (!response.ok || !json.success) {
          throw new Error(json.error || 'Ders kataloğu şu anda yüklenemiyor.');
        }
        setData(json.data);
      } catch (loadError) {
        console.error('Catalog loading error:', loadError);
        setError('Ders kataloğu yüklenemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase('tr-TR');
  const faculties = useMemo(() => {
    if (!data) return [];
    return data.faculties.filter((faculty) =>
      faculty.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery) ||
      data.departments.some((department) =>
        department.faculty_id === faculty.id &&
        department.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
      )
    );
  }, [data, normalizedQuery]);

  if (loading) {
    return (
      <div className="container-app py-8 sm:py-12">
        <div className="skeleton mb-6 h-10 w-64" />
        <div className="skeleton mb-8 h-12 w-full max-w-xl rounded-xl" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="skeleton h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="catalog-page min-h-screen pb-12">
      <section className="catalog-hero relative isolate overflow-hidden text-white">
        <div aria-hidden="true" className="catalog-hero-glow absolute inset-0 -z-10" />
        <div className="container-app py-9 sm:py-12 lg:py-14">
          <div className="mx-auto max-w-5xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200">
              <GraduationCap className="h-3.5 w-3.5" /> Akademik rehber
            </div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Üniversiteni bul, <span className="catalog-hero-accent">dersine ulaş.</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-navy-200 sm:text-base">
              Fakülte ve bölümlere göre dersleri incele, ilgili çalışma notlarına doğrudan geç.
            </p>
            <label className="catalog-search mt-6 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/15 bg-white px-4 shadow-[0_18px_50px_rgba(1,13,26,0.25)] transition-[border-color,box-shadow] focus-within:border-teal-300/70 focus-within:shadow-[0_0_0_4px_rgba(79,209,197,0.12),0_18px_50px_rgba(1,13,26,0.25)]">
              <Search className="h-5 w-5 shrink-0 text-navy-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Fakülte veya bölüm ara..."
                className="min-w-0 flex-1 border-0 bg-transparent py-4 text-sm text-navy-900 outline-none placeholder:text-navy-400 focus:ring-0 sm:text-base"
                aria-label="Fakülte veya bölüm ara"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="rounded-lg p-1.5 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
                  aria-label="Aramayı temizle"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>
          </div>
        </div>
      </section>

      <section className="container-app py-7 sm:py-9" aria-label="Fakülte ve bölümler">
        {error ? (
          <div className="catalog-empty card mx-auto max-w-2xl p-8 text-center">
            <BookOpen className="mx-auto mb-4 h-10 w-10 text-navy-300" />
            <h2 className="text-lg font-bold text-navy-900">Kataloğa ulaşılamadı</h2>
            <p className="mt-2 text-sm text-navy-500">{error}</p>
          </div>
        ) : !data || faculties.length === 0 ? (
          <div className="catalog-empty card mx-auto max-w-2xl p-8 text-center sm:p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-navy-900">Eşleşen bölüm bulamadık</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-navy-500">
              Arama kelimeni kontrol et veya tüm fakülte ve bölümlere geri dön.
            </p>
            {normalizedQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="btn btn-teal mt-5">
                Aramayı temizle <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">Akademik katalog</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">
                  {normalizedQuery ? 'Arama sonuçları' : 'Fakülte ve bölümler'}
                </h2>
              </div>
              <span className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-xs font-semibold text-navy-600">
                {faculties.length} fakülte
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-3">
              {faculties.map((faculty) => {
                const facultyMatches = faculty.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery);
                const facultyDepartments = data.departments
                  .filter((department) => department.faculty_id === faculty.id)
                  .filter((department) =>
                    !normalizedQuery ||
                    facultyMatches ||
                    department.name.toLocaleLowerCase('tr-TR').includes(normalizedQuery)
                  );

                return (
                  <article key={faculty.id} className="catalog-card card group flex min-w-0 flex-col p-5 sm:p-6">
                    <div className="flex items-start gap-3.5">
                      <div className="catalog-faculty-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition-colors group-hover:bg-teal-100">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal-700">
                          {faculty.type === 'institute'
                            ? 'Enstitü'
                            : faculty.type === 'vocational_school'
                              ? 'Yüksekokul'
                              : 'Fakülte'}
                        </p>
                        <h3 className="mt-1 text-base font-bold leading-snug text-navy-900 sm:text-lg">{faculty.name}</h3>
                        <p className="mt-1 text-xs text-navy-500">
                          {facultyDepartments.length} bölüm
                        </p>
                      </div>
                    </div>

                    <div className="my-4 h-px bg-navy-100" />
                    <div className="flex-1 space-y-1">
                      {facultyDepartments.length > 0 ? (
                        facultyDepartments.map((department) => (
                          <Link
                            key={department.id}
                            href={`/kesfet?department=${encodeURIComponent(department.id)}`}
                            className="group/dept flex min-w-0 items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 text-sm font-medium text-navy-700 transition-colors hover:bg-teal-50 hover:text-teal-800"
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <GraduationCap className="h-4 w-4 shrink-0 text-navy-400 group-hover/dept:text-teal-600" />
                              <span className="line-clamp-2">{department.name}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-navy-300 transition-transform group-hover/dept:translate-x-0.5 group-hover/dept:text-teal-600" />
                          </Link>
                        ))
                      ) : (
                        <p className="px-2.5 py-3 text-sm text-navy-400">Henüz bölüm eklenmemiş.</p>
                      )}
                    </div>

                    <Link
                      href={`/kesfet?faculty=${encodeURIComponent(faculty.id)}`}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl border border-navy-100 bg-navy-50/70 px-3 py-2.5 text-sm font-semibold text-navy-700 transition-colors hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800"
                    >
                      Fakülte notlarını gör <ChevronRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
