'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, FileText, ArrowLeft, ArrowRight, Check,
  X, AlertCircle, Info, ChevronRight
} from 'lucide-react';
import { NOTE_TYPES, SEMESTERS, ALLOWED_EXTENSIONS } from '@/lib/constants';
import { useToast } from '@/components/Toast';

const STEPS = ['Dosya', 'Bilgiler', 'Kategori', 'Detaylar', 'Önizleme'];

export default function UploadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', noteType: '', universityId: '', facultyId: '',
    departmentId: '', courseId: '', courseCode: '', semester: '', academicYear: '',
    topic: '', tags: '',
  });
  const [copyrightAgreed, setCopyrightAgreed] = useState(false);
  const [rulesAgreed, setRulesAgreed] = useState(false);

  const [universities, setUniversities] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/giris');
  }, [status]);

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
    }
  }, [form.universityId]);

  useEffect(() => {
    if (form.facultyId) {
      fetch(`/api/categories?type=departments&parentId=${form.facultyId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setDepartments(d.data); });
    } else {
      setDepartments([]);
      setForm(f => ({ ...f, departmentId: '', courseId: '' }));
    }
  }, [form.facultyId]);

  useEffect(() => {
    if (form.departmentId) {
      fetch(`/api/categories?type=courses&parentId=${form.departmentId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setCourses(d.data); });
    } else {
      setCourses([]);
      setForm(f => ({ ...f, courseId: '' }));
    }
  }, [form.departmentId]);

  const updateForm = (key: string, value: string) => {
    setForm(f => ({ ...f, [key]: value }));
    setErrors(e => ({ ...e, [key]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showToast(`Desteklenmeyen dosya biçimi. İzin verilenler: ${ALLOWED_EXTENSIONS.join(', ')}`, 'error');
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (f.size > maxSize) {
      showToast('Dosya çok büyük. Maksimum 50 MB.', 'error');
      return;
    }
    setFile(f);
    if (!form.title) {
      const name = f.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ');
      updateForm('title', name);
    }
    setErrors(e => ({ ...e, file: '' }));
  };

  const validateStep = (s: number): boolean => {
    const newErrors: Record<string, string> = {};
    if (s === 0 && !file) newErrors.file = 'Dosya seçmelisiniz.';
    if (s === 1) {
      if (!form.title || form.title.length < 3) newErrors.title = 'Başlık en az 3 karakter olmalıdır.';
      if (!form.noteType) newErrors.noteType = 'Not türü seçmelisiniz.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep(s => Math.min(s + 1, STEPS.length - 1));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (!file || !copyrightAgreed || !rulesAgreed) {
      showToast('Tüm onayları vermelisiniz.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key === 'noteType' ? 'noteType' : key, value);
      });

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success) {
        showToast(data.data.message);
        router.push(`/not/${data.data.id}`);
      } else {
        showToast(data.error, 'error');
      }
    } catch {
      showToast('Yükleme sırasında bir hata oluştu.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') return <div className="container-app py-8"><div className="skeleton h-8 w-64" /></div>;
  if (!session) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="container-app py-6 sm:py-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy-900 mb-2">Not Paylaş</h1>
      <p className="text-navy-500 mb-6">Ders notunu paylaşarak diğer öğrencilere yardım et.</p>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2" role="navigation" aria-label="Yükleme adımları">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? 'bg-teal-600 text-white' :
                i < step ? 'bg-teal-100 text-teal-700 cursor-pointer hover:bg-teal-200' :
                'bg-navy-100 text-navy-400'
              }`}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-navy-300" />}
          </div>
        ))}
      </div>

      <div className="card p-5 sm:p-6">
        {/* Step 0: File */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Dosya Yükle</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                file ? 'border-teal-300 bg-teal-50' : errors.file ? 'border-red-300 bg-red-50' : 'border-navy-200 hover:border-teal-400 hover:bg-navy-50'
              }`}
              role="button"
              tabIndex={0}
              aria-label="Dosya seç"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div>
                  <FileText className="w-12 h-12 text-teal-600 mx-auto mb-3" />
                  <p className="font-medium text-navy-900">{file.name}</p>
                  <p className="text-sm text-navy-500 mt-1">{formatFileSize(file.size)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    className="text-sm text-red-600 hover:text-red-700 mt-2 inline-flex items-center gap-1"
                  >
                    <X className="w-3 h-3" /> Dosyayı kaldır
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-12 h-12 text-navy-300 mx-auto mb-3" />
                  <p className="font-medium text-navy-700">Dosya seçmek için tıklayın</p>
                  <p className="text-sm text-navy-500 mt-1">
                    PDF, DOCX, PPTX, JPG, PNG • Maks. 50 MB
                  </p>
                </div>
              )}
            </div>
            {errors.file && <p className="text-sm text-red-600 mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {errors.file}</p>}
          </div>
        )}

        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Not Bilgileri</h2>
            <div>
              <label htmlFor="title" className="label">Başlık <span className="text-red-500">*</span></label>
              <input
                id="title" type="text" value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Ör: Veri Yapıları - Ağaçlar Ders Notu"
                maxLength={200}
                required
              />
              {errors.title && <p className="text-sm text-red-600 mt-1">{errors.title}</p>}
            </div>
            <div>
              <label htmlFor="description" className="label">Açıklama</label>
              <textarea
                id="description" value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                className="input min-h-[80px]"
                placeholder="Notun içeriğini kısaca açıklayın..."
                maxLength={500}
              />
            </div>
            <div>
              <label htmlFor="noteType" className="label">Not Türü <span className="text-red-500">*</span></label>
              <select
                id="noteType" value={form.noteType}
                onChange={(e) => updateForm('noteType', e.target.value)}
                className={`input ${errors.noteType ? 'input-error' : ''}`}
                required
              >
                <option value="">Seçin</option>
                {NOTE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {errors.noteType && <p className="text-sm text-red-600 mt-1">{errors.noteType}</p>}
            </div>
          </div>
        )}

        {/* Step 2: Category */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Kategori Seçimi</h2>
            <div>
              <label htmlFor="university" className="label">Üniversite</label>
              <select id="university" value={form.universityId}
                onChange={(e) => updateForm('universityId', e.target.value)} className="input">
                <option value="">Seçin</option>
                {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            {faculties.length > 0 && (
              <div>
                <label htmlFor="faculty" className="label">Fakülte</label>
                <select id="faculty" value={form.facultyId}
                  onChange={(e) => updateForm('facultyId', e.target.value)} className="input">
                  <option value="">Seçin</option>
                  {faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            )}
            {departments.length > 0 && (
              <div>
                <label htmlFor="department" className="label">Bölüm</label>
                <select id="department" value={form.departmentId}
                  onChange={(e) => updateForm('departmentId', e.target.value)} className="input">
                  <option value="">Seçin</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            )}
            {courses.length > 0 && (
              <div>
                <label htmlFor="course" className="label">Ders</label>
                <select id="course" value={form.courseId}
                  onChange={(e) => {
                    updateForm('courseId', e.target.value);
                    const course = courses.find((c: any) => c.id === e.target.value);
                    if (course?.code) updateForm('courseCode', course.code);
                  }} className="input">
                  <option value="">Seçin</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} - ` : ''}{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Details */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Ek Bilgiler</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="semester" className="label">Dönem</label>
                <select id="semester" value={form.semester}
                  onChange={(e) => updateForm('semester', e.target.value)} className="input">
                  <option value="">Seçin</option>
                  {SEMESTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="academicYear" className="label">Akademik Yıl</label>
                <input id="academicYear" type="text" value={form.academicYear}
                  onChange={(e) => updateForm('academicYear', e.target.value)}
                  className="input" placeholder="Ör: 2025-2026" />
              </div>
            </div>
            <div>
              <label htmlFor="topic" className="label">Konu / Ünite</label>
              <input id="topic" type="text" value={form.topic}
                onChange={(e) => updateForm('topic', e.target.value)}
                className="input" placeholder="Ör: Ağaçlar ve Graflar" />
            </div>
            <div>
              <label htmlFor="tags" className="label">Etiketler</label>
              <input id="tags" type="text" value={form.tags}
                onChange={(e) => updateForm('tags', e.target.value)}
                className="input" placeholder="virgülle ayırın: final, özet, çözümlü" />
              <p className="text-xs text-navy-500 mt-1">En fazla 10 etiket ekleyebilirsiniz.</p>
            </div>
          </div>
        )}

        {/* Step 4: Preview */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-navy-900 mb-4">Önizleme ve Yayınlama</h2>
            
            <div className="bg-navy-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-navy-500">Dosya:</span><span className="text-navy-800 font-medium">{file?.name}</span></div>
              <div className="flex justify-between"><span className="text-navy-500">Başlık:</span><span className="text-navy-800 font-medium">{form.title}</span></div>
              <div className="flex justify-between"><span className="text-navy-500">Tür:</span><span className="text-navy-800">{NOTE_TYPES.find(t => t.value === form.noteType)?.label}</span></div>
              {form.facultyId && <div className="flex justify-between"><span className="text-navy-500">Fakülte:</span><span className="text-navy-800">{faculties.find(f => f.id === form.facultyId)?.name}</span></div>}
              {form.departmentId && <div className="flex justify-between"><span className="text-navy-500">Bölüm:</span><span className="text-navy-800">{departments.find(d => d.id === form.departmentId)?.name}</span></div>}
              {form.courseId && <div className="flex justify-between"><span className="text-navy-500">Ders:</span><span className="text-navy-800">{courses.find(c => c.id === form.courseId)?.name}</span></div>}
              {form.semester && <div className="flex justify-between"><span className="text-navy-500">Dönem:</span><span className="text-navy-800">{SEMESTERS.find(s => s.value === form.semester)?.label}</span></div>}
              {form.tags && <div className="flex justify-between"><span className="text-navy-500">Etiketler:</span><span className="text-navy-800">{form.tags}</span></div>}
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <input id="copyright" type="checkbox" checked={copyrightAgreed}
                  onChange={(e) => setCopyrightAgreed(e.target.checked)}
                  className="mt-1 rounded border-navy-300" />
                <label htmlFor="copyright" className="text-sm text-navy-600">
                  Bu içerik tarafıma ait veya paylaşım iznim var. Başkasına ait telifli kitap, ücretli ders
                  materyali veya kişisel veri paylaşmıyorum.
                </label>
              </div>
              <div className="flex items-start gap-2">
                <input id="rules" type="checkbox" checked={rulesAgreed}
                  onChange={(e) => setRulesAgreed(e.target.checked)}
                  className="mt-1 rounded border-navy-300" />
                <label htmlFor="rules" className="text-sm text-navy-600">
                  <Link href="/icerik-kurallari" className="text-teal-600 hover:underline">İçerik kurallarını</Link>{' '}
                  okudum ve uyacağımı kabul ediyorum.
                </label>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-start gap-2">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              Notunuz yayınlandıktan sonra profilinizden düzenleyebilir veya kaldırabilirsiniz.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-navy-100">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="btn btn-ghost"
          >
            <ArrowLeft className="w-4 h-4" /> Geri
          </button>
          
          {step < STEPS.length - 1 ? (
            <button onClick={nextStep} className="btn btn-primary">
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !copyrightAgreed || !rulesAgreed}
              className="btn btn-teal"
            >
              {submitting ? 'Yükleniyor...' : 'Yayınla'}
              <Upload className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
