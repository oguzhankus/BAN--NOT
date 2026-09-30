'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Send, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function AskQuestionPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', courseId: '', facultyId: '', departmentId: '' });
  
  const [courses, setCourses] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/categories?type=courses').then(r => r.json()).then(d => { if (d.success) setCourses(d.data); });
    fetch('/api/categories?type=faculties').then(r => r.json()).then(d => { if (d.success) setFaculties(d.data); });
  }, []);

  useEffect(() => {
    if (form.facultyId) {
      fetch(`/api/categories?type=departments&parentId=${form.facultyId}`).then(r => r.json()).then(d => { if (d.success) setDepartments(d.data); });
    } else {
      setDepartments([]);
    }
  }, [form.facultyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/forum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (data.success) {
        showToast('Sorunuz paylaşıldı!');
        router.push(`/soru-cevap/${data.data.id}`);
      } else {
        showToast(data.error || 'Hata oluştu', 'error');
      }
    } catch {
      showToast('Bir hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-app py-8 max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-navy-100 overflow-hidden">
        <div className="bg-navy-900 p-6 text-white text-center sm:text-left">
          <h1 className="text-2xl font-bold mb-2">Yeni Soru Sor</h1>
          <p className="text-navy-200 text-sm">Problemini detaylıca anlat, topluluğun sana yardımcı olmasına izin ver.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div>
            <label className="label">Soru Başlığı</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="input font-medium text-lg placeholder:font-normal"
              placeholder="Örn: MAT101 Vize Konuları Nelerdir?"
              required
              minLength={5}
            />
            <p className="text-xs text-navy-400 mt-1">Sorunuzu en iyi özetleyen kısa bir başlık girin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">İlgili Ders (İsteğe Bağlı)</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="input text-sm"
              >
                <option value="">Seçiniz...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">İlgili Fakülte (İsteğe Bağlı)</label>
              <select
                value={form.facultyId}
                onChange={(e) => setForm({ ...form, facultyId: e.target.value, departmentId: '' })}
                className="input text-sm"
              >
                <option value="">Seçiniz...</option>
                {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            {form.facultyId && (
              <div className="md:col-span-2">
                <label className="label">İlgili Bölüm (İsteğe Bağlı)</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                  className="input text-sm"
                >
                  <option value="">Seçiniz...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="label">Soru Detayı</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="input min-h-[200px]"
              placeholder="Sorunuzu, neyi yapamadığınızı veya neyi merak ettiğinizi detaylıca açıklayın..."
              required
              minLength={10}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-navy-50">
            <button type="button" onClick={() => router.back()} className="btn btn-ghost">İptal</button>
            <button type="submit" disabled={loading} className="btn btn-teal">
              <Send className="w-4 h-4" />
              {loading ? 'Paylaşılıyor...' : 'Soruyu Paylaş'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
