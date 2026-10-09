'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Download, FileQuestion, GraduationCap } from 'lucide-react';
import NoteCard from '@/components/NoteCard';

type CourseNote = {
  id: string;
  title: string;
  description?: string;
  note_type: string;
  is_handwritten?: number;
  course_name?: string;
  course_code?: string;
  department_name?: string;
  faculty_name?: string;
  user_display_name?: string;
  user_is_email_verified?: number;
  user_id?: string;
  download_count: number;
  view_count: number;
  created_at: string;
  file_size?: number;
  mime_type?: string;
  avg_rating?: number;
  rating_count?: number;
};

type CourseResponse = {
  course: {
    id: string;
    name: string;
    code: string | null;
    semester: string | null;
    year: number | null;
    university_name: string | null;
    department_names: string | null;
  };
  stats: { noteCount: number; examQuestionCount: number; downloads: number };
  bestNotes: CourseNote[];
  examQuestions: CourseNote[];
};

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<CourseResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadCourse() {
      try {
        const response = await fetch(`/api/courses/${params.id}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Ders bilgileri yüklenemedi.');
        }
        if (active) setData(result.data as CourseResponse);
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Ders bilgileri yüklenemedi.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadCourse();
    return () => { active = false; };
  }, [params.id]);

  if (loading) {
    return <main className="container-app py-10"><div className="skeleton h-40 rounded-2xl" /><div className="skeleton mt-6 h-72 rounded-2xl" /></main>;
  }

  if (error || !data) {
    return (
      <main className="container-app py-16 text-center">
        <h1 className="text-xl font-bold text-navy-900">{error || 'Ders bulunamadı.'}</h1>
        <Link href="/dersler" className="btn btn-teal mt-5">Ders kataloğuna dön</Link>
      </main>
    );
  }

  return (
    <main className="container-app max-w-5xl py-7 sm:py-10">
      <Link href="/dersler" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-navy-600 hover:text-teal-700">
        <ArrowLeft className="h-4 w-4" /> Ders kataloğu
      </Link>
      <section className="card mb-8 overflow-hidden p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">{data.course.code || 'Ders sayfası'}</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900 sm:text-3xl">{data.course.name}</h1>
            <p className="mt-2 text-sm text-navy-500">
              {[data.course.university_name, data.course.department_names].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-navy-50 p-4">
            <BookOpen className="h-4 w-4 text-teal-700" />
            <p className="mt-2 text-xl font-bold text-navy-900">{data.stats.noteCount}</p>
            <p className="text-xs text-navy-500">Yayınlanmış kaynak</p>
          </div>
          <div className="rounded-xl bg-navy-50 p-4">
            <FileQuestion className="h-4 w-4 text-teal-700" />
            <p className="mt-2 text-xl font-bold text-navy-900">{data.stats.examQuestionCount}</p>
            <p className="text-xs text-navy-500">Çıkmış soru kaydı</p>
          </div>
          <div className="rounded-xl bg-navy-50 p-4">
            <Download className="h-4 w-4 text-teal-700" />
            <p className="mt-2 text-xl font-bold text-navy-900">{data.stats.downloads}</p>
            <p className="text-xs text-navy-500">Toplam indirme</p>
          </div>
        </div>
      </section>

      <section className="mb-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Topluluk seçkisi</p>
            <h2 className="mt-1 text-xl font-bold text-navy-900">En iyi notlar</h2>
          </div>
          <Link href={`/kesfet?course=${encodeURIComponent(data.course.id)}`} className="text-sm font-semibold text-teal-700 hover:text-teal-800">Tümünü gör</Link>
        </div>
        {data.bestNotes.length
          ? <div className="grid gap-4 md:grid-cols-2">{data.bestNotes.map(note => <NoteCard key={note.id} note={note} />)}</div>
          : <p className="card p-5 text-sm text-navy-500">Bu ders için henüz yayınlanmış not yok.</p>}
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Sınav hazırlığı</p>
          <h2 className="mt-1 text-xl font-bold text-navy-900">Çıkmış sorular</h2>
        </div>
        {data.examQuestions.length
          ? <div className="grid gap-4 md:grid-cols-2">{data.examQuestions.map(note => <NoteCard key={note.id} note={note} />)}</div>
          : <p className="card p-5 text-sm text-navy-500">Bu ders için henüz çıkmış soru arşivi oluşturulmamış.</p>}
      </section>
    </main>
  );
}
