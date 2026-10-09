'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { Mail, Send } from 'lucide-react';

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'İstek gönderilemedi.');
      }
      setMessage(result.data.message);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'İstek gönderilemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-app flex min-h-[70vh] items-center justify-center py-12">
      <section className="card w-full max-w-lg p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-center text-2xl font-bold text-navy-900">Doğrulama e-postasını yeniden gönder</h1>
        <p className="mt-2 text-center text-sm text-navy-600">
          Üniversite e-posta adresini gir; yeni bir doğrulama bağlantısı gönderelim.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-navy-700">Üniversite e-postası</span>
            <input
              className="input w-full"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="ogrenci@ogr.bandirma.edu.tr"
            />
          </label>
          {message && <p role="status" className="text-sm text-teal-800">{message}</p>}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button className="btn btn-teal w-full" type="submit" disabled={loading}>
            <Send className="h-4 w-4" />
            {loading ? 'Gönderiliyor…' : 'Yeni bağlantı gönder'}
          </button>
        </form>
        <div className="mt-5 text-center">
          <Link href="/giris" className="text-sm font-medium text-teal-700 hover:text-teal-800">
            Giriş sayfasına dön
          </Link>
        </div>
      </section>
    </main>
  );
}
