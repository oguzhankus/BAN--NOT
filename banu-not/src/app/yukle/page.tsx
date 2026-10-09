'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, FileText, ArrowLeft, ArrowRight, Check,
  X, AlertCircle, Info, ChevronRight, Sparkles, ShieldCheck
} from 'lucide-react';
import { NOTE_TYPES, SEMESTERS, ALLOWED_EXTENSIONS } from '@/lib/constants';
import { useToast } from '@/components/Toast';

const STEPS = ['Dosya', 'Bilgiler', 'Kategori', 'Detaylar', 'Önizleme'];
const STEP_DESCRIPTIONS = [
  'Paylaşacağın dosyayı seç.',
  'Notuna anlaşılır bir başlık ve tür ekle.',
  'Notu doğru ders ve bölüme bağla.',
  'Dönem ve konu bilgileriyle keşfedilmeyi kolaylaştır.',
  'Bilgileri kontrol et ve güvenle yayınla.',
];

function UploadPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get('requestId');
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
  const [isHandwritten, setIsHandwritten] = useState(false);

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

  const selectFile = (f?: File) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    selectFile(e.target.files?.[0]);
    e.currentTarget.value = '';
  };

  const handleFileDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    selectFile(e.dataTransfer.files[0]);
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
      formData.append('isHandwritten', String(isHandwritten));
      if (requestId) {
        formData.append('requestId', requestId);
      }
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
    <div className="upload-page container-app mx-auto max-w-3xl py-6 sm:py-10">
      <section className="upload-hero relative isolate mb-6 overflow-hidden rounded-3xl p-5 text-white shadow-lg sm:mb-8 sm:p-8">
        <div aria-hidden="true" className="upload-hero-glow absolute inset-0 -z-10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-teal-200">
              <Sparkles className="h-3.5 w-3.5" /> Topluluğa katkı
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Notunu paylaş</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-navy-200">
              Küçük bir paylaşım, başka bir öğrencinin büyük ilerlemesi olabilir.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 sm:self-auto">
            <ShieldCheck className="h-4 w-4 text-teal-200" /> Güvenli ve kontrollü paylaşım
          </div>
        </div>
      </section>

      {/* Step indicator */}
      <div className="upload-progress card mb-5 p-4 sm:mb-6 sm:p-5" role="navigation" aria-label="Yükleme adımları">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-teal-700">Adım {step + 1} / {STEPS.length}</p>
            <p className="mt-1 text-sm font-semibold text-navy-900">{STEP_DESCRIPTIONS[step]}</p>
          </div>
          <span className="shrink-0 rounded-full bg-navy-50 px-2.5 py-1 text-xs font-semibold text-navy-600">{Math.round(((step + 1) / STEPS.length) * 100)}%</span>
        </div>
        <div className="upload-progress-track mb-4 h-1.5 overflow-hidden rounded-full bg-navy-100" aria-hidden="true">
          <div className="upload-progress-value h-full rounded-full bg-teal-500 transition-[width] duration-200 ease-out" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => i < step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? 'step' : undefined}
              aria-label={`Adım ${i + 1}: ${s}${i < step ? ', tamamlandı' : i === step ? ', geçerli adım' : ''}`}
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
      </div>

      <div className="upload-form-card card p-5 sm:p-7">
        {/* Step 0: File */}
        {step === 0 && (
          <div>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-navy-900">Dosyanı ekle</h2>
              <p className="mt-1 text-sm text-navy-500">Dosyan yalnızca desteklenen biçim ve boyut sınırları içinde kabul edilir.</p>
            </div>
            <input
              ref={fileInputRef}
              id="upload-file"
              type="file"
              accept={ALLOWED_EXTENSIONS.join(',')}
              onChange={handleFileChange}
              className="sr-only"
              aria-describedby={errors.file ? 'upload-file-hint upload-file-error' : 'upload-file-hint'}
            />
            <label
              htmlFor="upload-file"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className={`upload-dropzone flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-[border-color,background-color,box-shadow] sm:p-10 ${
                file ? 'border-teal-300 bg-teal-50' : errors.file ? 'border-red-300 bg-red-50' : 'border-navy-200 bg-navy-50/50 hover:border-teal-400 hover:bg-teal-50/50'
              }`}
            >
              {file ? (
                <div className="flex flex-col items-center">
                  <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                    <FileText className="h-7 w-7" />
                  </span>
                  <p className="max-w-full break-all font-semibold text-navy-900">{file.name}</p>
                  <p className="mt-1 text-sm text-navy-500">{formatFileSize(file.size)} · Dosya seçildi</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                    <Check className="h-3.5 w-3.5" /> Değiştirmek için tıkla veya başka dosyayı bırak
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm">
                    <Upload className="h-6 w-6" />
                  </span>
                  <p className="font-semibold text-navy-800">Dosyayı buraya bırak</p>
                  <p className="mt-1 text-sm text-navy-500">veya cihazından seç</p>
                  <span className="mt-4 rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11px] font-medium text-navy-500">
                    {ALLOWED_EXTENSIONS.map(extension => extension.replace('.', '').toUpperCase()).join(' · ')} · Maks. 50 MB
                  </span>
                </div>
              )}
            </label>
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
              >
                <X className="h-3.5 w-3.5" /> Dosyayı kaldır
              </button>
            )}
            {errors.file && <p id="upload-file-error" className="mt-2 flex items-center gap-1.5 text-sm text-red-600"><AlertCircle className="h-4 w-4" /> {errors.file}</p>}
            <p id="upload-file-hint" className="mt-3 text-xs leading-5 text-navy-500">Yalnızca paylaşma hakkına sahip olduğun içerikleri yükle. Yükleme öncesi kişisel bilgileri kaldırmayı unutma.</p>
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
            <label className="flex items-start gap-2.5 rounded-xl border border-navy-100 bg-navy-50/60 p-3 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={isHandwritten}
                onChange={event => setIsHandwritten(event.target.checked)}
                className="mt-0.5"
              />
              <span><span className="font-semibold">El yazısı not</span><br /><span className="text-xs text-navy-500">Bu bilgiyi belirtmek notunun ilgili filtrelerde bulunmasına yardımcı olur.</span></span>
            </label>
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
            
            <div className="upload-preview rounded-2xl border border-navy-100 bg-navy-50/70 p-4 sm:p-5">
              <div className="mb-3 flex items-center gap-3 border-b border-navy-100 pb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm"><FileText className="h-5 w-5" /></span>
                <div className="min-w-0">
                  <p className="break-all text-sm font-semibold text-navy-900">{form.title}</p>
                  <p className="mt-0.5 text-xs text-navy-500">{file?.name} · {file ? formatFileSize(file.size) : ''}</p>
                </div>
              </div>
              <dl className="grid grid-cols-1 gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <div><dt className="text-xs font-medium text-navy-500">Not türü</dt><dd className="mt-0.5 font-semibold text-navy-800">{NOTE_TYPES.find(t => t.value === form.noteType)?.label || '—'}</dd></div>
                {form.facultyId && <div><dt className="text-xs font-medium text-navy-500">Fakülte</dt><dd className="mt-0.5 font-semibold text-navy-800">{faculties.find(f => f.id === form.facultyId)?.name}</dd></div>}
                {form.departmentId && <div><dt className="text-xs font-medium text-navy-500">Bölüm</dt><dd className="mt-0.5 font-semibold text-navy-800">{departments.find(d => d.id === form.departmentId)?.name}</dd></div>}
                {form.courseId && <div><dt className="text-xs font-medium text-navy-500">Ders</dt><dd className="mt-0.5 font-semibold text-navy-800">{courses.find(c => c.id === form.courseId)?.name}</dd></div>}
                {form.semester && <div><dt className="text-xs font-medium text-navy-500">Dönem</dt><dd className="mt-0.5 font-semibold text-navy-800">{SEMESTERS.find(s => s.value === form.semester)?.label}</dd></div>}
                {form.tags && <div><dt className="text-xs font-medium text-navy-500">Etiketler</dt><dd className="mt-0.5 break-words font-semibold text-navy-800">{form.tags}</dd></div>}
                {form.description && <div className="sm:col-span-2"><dt className="text-xs font-medium text-navy-500">Açıklama</dt><dd className="mt-0.5 whitespace-pre-line text-navy-700">{form.description}</dd></div>}
              </dl>
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

            <div className="upload-notice flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              Notunuz yayınlandıktan sonra profilinizden düzenleyebilir veya kaldırabilirsiniz.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3 border-t border-navy-100 pt-4">
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
              {submitting ? <span className="upload-spinner h-4 w-4 rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" /> : <Upload className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<div className="container-app py-8">Yükleniyor...</div>}>
      <UploadPageContent />
    </Suspense>
  );
}
