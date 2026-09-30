'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageCircle, Search, Edit3, ChevronRight, BookOpen, Clock, Users } from 'lucide-react';
import { useToast } from '@/components/Toast';

export default function ForumPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts(query: string = '') {
    setLoading(true);
    try {
      const res = await fetch(`/api/forum?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.data.posts);
      }
    } catch {
      showToast('Sorular yüklenirken hata oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts(searchQuery);
  };

  return (
    <div className="container-app py-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gradient-to-r from-navy-900 to-navy-800 p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold mb-2">Soru - Cevap (Forum)</h1>
          <p className="text-navy-100 max-w-lg">
            Derslerle ilgili sorular sorun, diğer öğrencilere yardım edin ve kampüs topluluğunun bir parçası olun.
          </p>
        </div>
        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <Link href="/soru-cevap/sor" className="btn bg-teal-500 hover:bg-teal-600 text-white border-0 shadow-lg whitespace-nowrap px-6">
            <Edit3 className="w-5 h-5 mr-2" /> Soru Sor
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="hidden lg:block lg:col-span-1 space-y-6">
          <div className="card p-5 sticky top-24">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-600" /> Kategoriler
            </h3>
            <ul className="space-y-2 text-sm font-medium">
              <li>
                <button onClick={() => fetchPosts('')} className="flex items-center justify-between w-full p-2 rounded-lg bg-teal-50 text-teal-700">
                  <span>Tüm Sorular</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors">
                  <span>Sınavlara Hazırlık</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors">
                  <span>Ders Kayıt Süreci</span>
                </button>
              </li>
              <li>
                <button className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-navy-50 text-navy-600 transition-colors">
                  <span>Staj ve İş İlanları</span>
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          
          <form onSubmit={handleSearch} className="mb-6">
            <div className="relative shadow-sm rounded-xl overflow-hidden border border-navy-100">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" />
              <input
                type="text"
                placeholder="Forumda ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-navy-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy-800 transition-colors">
                Ara
              </button>
            </div>
          </form>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="card p-5 flex gap-4 h-32 skeleton" />
              ))}
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map(post => (
                <Link key={post.id} href={`/soru-cevap/${post.id}`} className="card p-5 flex flex-col sm:flex-row gap-4 hover:border-teal-400 transition-all group">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-navy-100 text-navy-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        {post.course_code || post.faculty_name || 'Genel'}
                      </span>
                      {post.is_resolved === 1 && (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                          Çözüldü
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg font-bold text-navy-900 mb-1 group-hover:text-teal-600 transition-colors line-clamp-1">{post.title}</h2>
                    <p className="text-sm text-navy-600 line-clamp-2 mb-3">{post.content}</p>
                    <div className="flex items-center gap-4 text-xs text-navy-400 font-medium">
                      <span className="flex items-center gap-1.5"><img src={post.avatar_url || `https://ui-avatars.com/api/?name=${post.user_name}&background=e2e8f0`} className="w-5 h-5 rounded-full" alt="avatar" /> {post.user_name}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                    </div>
                  </div>
                  <div className="flex sm:flex-col justify-end gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 sm:border-l border-navy-100 sm:pl-4 text-center">
                    <div className="flex sm:flex-col items-center gap-1 sm:gap-0">
                      <span className="text-lg font-bold text-navy-900">{post.reply_count}</span>
                      <span className="text-[10px] uppercase font-bold text-navy-400">Cevap</span>
                    </div>
                    <div className="flex sm:flex-col items-center gap-1 sm:gap-0">
                      <span className="text-lg font-bold text-navy-900">{post.view_count}</span>
                      <span className="text-[10px] uppercase font-bold text-navy-400">Görüntülenme</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-12 text-center">
              <MessageCircle className="w-12 h-12 text-navy-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-navy-900 mb-2">Soru Bulunamadı</h3>
              <p className="text-navy-500 mb-6">Aramanıza uygun soru bulunamadı. İlk soran siz olun!</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
