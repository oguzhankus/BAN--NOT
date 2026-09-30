'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, ChevronRight, Search, Building2 } from 'lucide-react';

export default function CoursesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalog');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  if (loading) {
    return (
      <div className="container-app py-8">
        <div className="skeleton h-10 w-64 mb-6" />
        <div className="skeleton h-12 w-full max-w-md mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="skeleton h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Filter faculties and departments based on search
  const query = searchQuery.toLowerCase();
  
  return (
    <div className="container-app py-8 sm:py-12">
      <div className="max-w-3xl mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-teal-600" /> Ders Kataloğu
        </h1>
        <p className="text-lg text-navy-600 mb-6">
          Fakülte ve bölümlere göre ayrılmış dersleri inceleyin ve ilgili notlara hızlıca ulaşın.
        </p>

        <div className="relative max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
          <input
            type="text"
            placeholder="Fakülte, bölüm veya ders ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-navy-900 bg-white border border-navy-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.faculties
          .filter((f: any) => 
            f.name.toLowerCase().includes(query) || 
            data.departments.some((d: any) => d.faculty_id === f.id && d.name.toLowerCase().includes(query))
          )
          .map((faculty: any) => {
            const facultyDepts = data.departments.filter((d: any) => d.faculty_id === faculty.id);
            
            return (
              <div key={faculty.id} className="card p-6 flex flex-col h-full border-t-4 border-t-teal-500 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-teal-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-navy-900 leading-tight">{faculty.name}</h2>
                    <p className="text-xs text-navy-500 mt-1 uppercase tracking-wider font-semibold">
                      {faculty.type === 'institute' ? 'Enstitü' : faculty.type === 'vocational_school' ? 'Yüksekokul' : 'Fakülte'}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-2 mt-2">
                  {facultyDepts.length > 0 ? (
                    facultyDepts
                      .filter((d: any) => !query || d.name.toLowerCase().includes(query) || faculty.name.toLowerCase().includes(query))
                      .map((dept: any) => (
                        <Link
                          key={dept.id}
                          href={`/kesfet?department=${dept.id}`}
                          className="group flex items-center justify-between p-2.5 rounded-lg hover:bg-navy-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-navy-700 group-hover:text-teal-700 transition-colors flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-navy-400 group-hover:text-teal-500" />
                            {dept.name}
                          </span>
                          <ChevronRight className="w-4 h-4 text-navy-300 group-hover:text-teal-500 transition-transform group-hover:translate-x-1" />
                        </Link>
                      ))
                  ) : (
                    <p className="text-sm text-navy-400 italic p-2">Henüz bölüm eklenmemiş.</p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-navy-100">
                  <Link
                    href={`/kesfet?faculty=${faculty.id}`}
                    className="text-sm font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 justify-center w-full"
                  >
                    Tüm {faculty.short_name || 'Fakülte'} Notlarını Gör <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
        })}
      </div>
      
      {data.faculties.length > 0 && data.faculties.filter((f: any) => f.name.toLowerCase().includes(query)).length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-navy-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-navy-800">Sonuç bulunamadı</h3>
          <p className="text-navy-500">Arama kriterlerinize uyan bir fakülte veya bölüm yok.</p>
        </div>
      )}
    </div>
  );
}
