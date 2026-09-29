'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: '', email: '', password: '', passwordConfirm: '', universityId: '' });
  const [universities, setUniversities] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!agreed) {
      setError('Kullanım koşullarını kabul etmelisiniz.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(data.data.message);
        setTimeout(() => router.push('/giris'), 2000);
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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-navy-800 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-navy-900">BANÜ <span className="text-teal-600">NOT</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-navy-900">Kayıt Ol</h1>
          <p className="text-navy-500 mt-1">Ücretsiz hesap oluşturun</p>
        </div>

        <div className="card p-6 sm:p-8">
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6 text-sm text-red-700" role="alert">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-6 text-sm text-green-700" role="status">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> {success}
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
                  maxLength={50}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="label">E-posta</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="input pl-10"
                  placeholder="ornek@mail.com"
                  required
                  autoComplete="email"
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
              >
                <option value="">Üniversite seçin (isteğe bağlı)</option>
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="password" className="label">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="En az 6 karakter"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600"
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="passwordConfirm" className="label">Şifre Tekrar</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  id="passwordConfirm"
                  type="password"
                  value={form.passwordConfirm}
                  onChange={(e) => updateForm('passwordConfirm', e.target.value)}
                  className="input pl-10"
                  placeholder="Şifrenizi tekrar girin"
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="flex items-start gap-2">
              <input
                id="agree"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-navy-300 text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="agree" className="text-sm text-navy-600">
                <Link href="/kullanim-kosullari" className="text-teal-600 hover:underline">Kullanım Koşulları</Link>{' '}
                ve{' '}
                <Link href="/gizlilik" className="text-teal-600 hover:underline">Gizlilik Politikası</Link>
                &apos;nı okudum ve kabul ediyorum.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg"
            >
              {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-navy-600">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="text-teal-600 hover:text-teal-700 font-medium">
              Giriş Yap
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
