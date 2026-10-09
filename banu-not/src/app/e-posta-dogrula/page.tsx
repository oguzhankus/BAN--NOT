'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, LoaderCircle, MailCheck } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const visibleError = error || (!token ? 'Doğrulama bağlantısı bulunamadı.' : '');

  async function handleVerify() {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'E-posta doğrulanamadı.');
      }
      setMessage(result.data.message);
    } catch (verificationError) {
      setError(verificationError instanceof Error
        ? verificationError.message
        : 'E-posta doğrulanamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <section className="card w-full max-w-lg p-8 text-center">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${visibleError ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}>
          {loading ? <LoaderCircle className="h-7 w-7 animate-spin" /> : visibleError ? <MailCheck className="h-7 w-7" /> : <CheckCircle className="h-7 w-7" />}
        </div>
        <h1 className="mt-5 text-2xl font-bold text-navy-900">E-posta doğrulama</h1>
        {!message && !visibleError && <p className="mt-2 text-sm text-navy-600">Hesabını doğrulamak için aşağıdaki düğmeye bas.</p>}
        {message && <p role="status" className="mt-2 text-sm text-teal-800">{message}</p>}
        {visibleError && (
          <>
            <p role="alert" className="mt-2 text-sm text-red-700">{visibleError}</p>
            <Link href="/dogrulama-e-postasi" className="mt-4 inline-flex text-sm font-semibold text-teal-700 hover:text-teal-800">
              Yeni doğrulama bağlantısı iste
            </Link>
          </>
        )}
        {!message && (
          <button type="button" onClick={handleVerify} disabled={!token || loading} className="btn btn-teal mt-6 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Doğrulanıyor…' : 'E-posta adresimi doğrula'}
          </button>
        )}
        {message && (
          <Link href="/giris" className="btn btn-teal mt-6">
            Giriş yap
          </Link>
        )}
      </section>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<main className="container-app min-h-[70vh] py-16" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
