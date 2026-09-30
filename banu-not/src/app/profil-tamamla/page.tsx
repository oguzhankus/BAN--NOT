'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { BookOpen, User, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function CompleteProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState({ displayName: '', universityId: '', facultyId: '', departmentId: '', classYear: '' });
  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Initial redirect checks
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/giris');
    } else if (status === 'authenticated') {
      if (session?.user?.name && !form.displayName) {
        setForm(f => ({ ...f, displayName: session.user?.name || '' }));
      }
    }
  }, [status, session]);

  useEffect(() => {
    fetch('/api/categories?type=universities')
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setUniversities(d.data);
          if (d.data.length === 1) setForm(f => ({ ...f, universityId: d.data[0].id }));
        }
      });
  }, []);

  useEffect(() => {
    if (form.universityId) {
      fetch(`/api/categories?type=faculties&parentId=${form.universityId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setFaculties(d.data); });
    } else {
      setFaculties([]);
      setForm(f => ({ ...f, facultyId: '', departmentId: '' }));
    }
  }, [form.universityId]);

  useEffect(() => {
    if (form.facultyId) {
      fetch(`/api/categories?type=departments&parentId=${form.facultyId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setDepartments(d.data); });
    } else {
      setDepartments([]);
      setForm(f => ({ ...f, departmentId: '' }));
    }
  }, [form.facultyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.universityId) {
      setError('Lütfen üniversitenizi seçin.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Profiliniz tamamlandı!', 'success');
        await update(); // refresh session
        router.push('/kesfet');
      } else {
        setError(data.error);
      }
    } catch {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key: string, value: string) => setForm(f => ({ ...f, [key]: value }));

  if (status === 'loading') return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-teal-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-navy-900">Hoş Geldiniz!</h1>
          <p className="text-navy-500 mt-2">Devam etmeden önce lütfen okul bilgilerinizi tamamlayın.</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="label">Görünen Ad</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="displayName"
                  type="text"
                  value={form.displayName}
                  onChange={(e) => updateForm('displayName', e.target.value)}
                  className="input pl-10"
                  placeholder="Adınız Soyadınız"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div>
              <label htmlFor="university" className="label">Üniversite</label>
              <select
                id="university"
                value={form.universityId}
                onChange={(e) => updateForm('universityId', e.target.value)}
                className="input"
                required
              >
                <option value="">Üniversite seçin (Zorunlu)</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {form.universityId && faculties.length > 0 && (
              <div>
                <label htmlFor="faculty" className="label">Fakülte</label>
                <select
                  id="faculty"
                  value={form.facultyId}
                  onChange={(e) => updateForm('facultyId', e.target.value)}
                  className="input"
                >
                  <option value="">Fakülte seçin (İsteğe bağlı)</option>
                  {faculties.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            {form.facultyId && departments.length > 0 && (
              <div>
                <label htmlFor="department" className="label">Bölüm</label>
                <select
                  id="department"
                  value={form.departmentId}
                  onChange={(e) => updateForm('departmentId', e.target.value)}
                  className="input"
                >
                  <option value="">Bölüm seçin (İsteğe bağlı)</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.departmentId && departments.length > 0 && (
              <div>
                <label htmlFor="classYear" className="label">Sınıf</label>
                <select
                  id="classYear"
                  value={form.classYear}
                  onChange={(e) => updateForm('classYear', e.target.value)}
                  className="input"
                >
                  <option value="">Sınıf seçin (İsteğe bağlı)</option>
                  <option value="1">1. Sınıf</option>
                  <option value="2">2. Sınıf</option>
                  <option value="3">3. Sınıf</option>
                  <option value="4">4. Sınıf</option>
                  <option value="5">5. Sınıf</option>
                  <option value="6">6. Sınıf</option>
                  <option value="Hazırlık">Hazırlık</option>
                </select>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg mt-6"
            >
              {loading ? 'Kaydediliyor...' : 'Kaydet ve Başla'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
