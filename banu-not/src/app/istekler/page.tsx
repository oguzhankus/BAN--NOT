'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MessageSquare, Plus, CheckCircle, Search, User, Clock, Check } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function RequestsPage() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return showToast('Lütfen bir başlık girin.', 'error');

    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('İsteğiniz paylaşıldı!', 'success');
        setIsModalOpen(false);
        setNewTitle('');
        setNewDesc('');
        fetchRequests();
      } else {
        showToast(data.error || 'Bir hata oluştu.', 'error');
      }
    } catch (err) {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-app py-8 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-navy-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-teal-600" /> 
            Not İstekleri
          </h1>
          <p className="text-navy-600 mt-2">Aradığın notu bulamadın mı? Buradan istek aç, diğer öğrenciler sana yardım etsin!</p>
        </div>
        <button 
          onClick={() => {
            if (!session) {
              showToast('İstek açmak için giriş yapmalısınız.', 'error');
              return;
            }
            setIsModalOpen(true);
          }}
          className="btn btn-primary whitespace-nowrap"
        >
          <Plus className="w-4 h-4 mr-1" /> İstek Aç
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      ) : requests.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {requests.map(req => (
            <div key={req.id} className="card p-5 border hover:border-teal-300 transition-colors flex flex-col sm:flex-row gap-4 justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy-900">{req.title}</h3>
                {req.description && <p className="text-sm text-navy-600 mt-1">{req.description}</p>}
                
                <div className="flex items-center gap-4 mt-4 text-xs text-navy-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {req.user_display_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(req.created_at).toLocaleDateString('tr-TR')}
                  </span>
                  {(session?.user as any)?.id === req.user_id && (
                    <button 
                      onClick={async () => {
                        if(confirm('İsteğinizi silmek istediğinize emin misiniz?')) {
                          try {
                            const res = await fetch(`/api/requests/${req.id}`, { method: 'DELETE' });
                            if (res.ok) {
                              showToast('İsteğiniz silindi.', 'success');
                              fetchRequests();
                            }
                          } catch (err) {}
                        }
                      }}
                      className="flex items-center gap-1 text-red-500 hover:text-red-700 ml-auto"
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-[140px] shrink-0 justify-center">
                {req.status === 'open' ? (
                  <Link href={`/yukle?requestId=${req.id}`} className="btn btn-outline btn-sm w-full">
                    <CheckCircle className="w-4 h-4 mr-1" /> Notu Yükle
                  </Link>
                ) : (
                  <Link href={`/not/${req.fulfilled_note_id}`} className="btn btn-teal btn-sm w-full">
                    <Check className="w-4 h-4 mr-1" /> Bulundu
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-navy-100 rounded-2xl">
          <MessageSquare className="w-16 h-16 text-navy-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-navy-800">Henüz İstek Yok</h3>
          <p className="text-navy-500">İlk not isteğini sen oluştur!</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-navy-100 flex justify-between items-center bg-navy-50">
              <h3 className="font-bold text-navy-900 text-lg">Yeni Not İsteği</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-navy-400 hover:text-navy-900 transition-colors">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="label">Aradığınız Not / Ders (Örn: Mat1 Vize Soruları)</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="input" 
                  placeholder="Kısa ve açıklayıcı başlık"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Detay (İsteğe bağlı)</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="input min-h-[100px] py-3" 
                  placeholder="Hangi hocanın, hangi yıla ait notlarını arıyorsunuz? Detay verin..."
                />
              </div>
              <div className="pt-2">
                <button type="submit" disabled={submitting} className="btn btn-primary w-full py-3">
                  {submitting ? 'Gönderiliyor...' : 'İsteği Paylaş'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
