'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Star, Download, FileText, Medal, Award } from 'lucide-react';

export default function LeaderboardPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        const json = await res.json();
        if (json.success) {
          setUsers(json.data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadLeaderboard();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if (index === 1) return <Medal className="w-8 h-8 text-gray-400" />;
    if (index === 2) return <Medal className="w-8 h-8 text-amber-700" />;
    return <div className="w-8 h-8 flex items-center justify-center font-bold text-navy-400 text-lg">{index + 1}</div>;
  };

  const getRankStyle = (index: number) => {
    if (index === 0) return 'border-yellow-300 bg-yellow-50 shadow-yellow-100 shadow-lg scale-[1.02] z-10';
    if (index === 1) return 'border-gray-300 bg-gray-50 shadow-gray-100 shadow-md';
    if (index === 2) return 'border-amber-200 bg-orange-50 shadow-amber-100 shadow-md';
    return 'border-navy-100 bg-white hover:border-teal-300 hover:shadow-md';
  };

  return (
    <div className="container-app py-8 sm:py-12 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-200">
          <Award className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">Liderlik Tablosu</h1>
        <p className="text-lg text-navy-600">
          Topluluğa en çok katkıda bulunan, notları en çok indirilen kahraman öğrencilerimiz.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : users.length > 0 ? (
        <div className="flex flex-col gap-4">
          {users.map((user, index) => (
            <div 
              key={user.id} 
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all duration-300 ${getRankStyle(index)}`}
            >
              <div className="flex-shrink-0 w-12 flex justify-center">
                {getRankIcon(index)}
              </div>
              
              <div className="w-14 h-14 bg-gradient-to-tr from-teal-500 to-blue-500 rounded-full flex items-center justify-center shrink-0 shadow-inner text-white font-bold text-xl">
                {user.display_name?.charAt(0)?.toUpperCase()}
              </div>
              
              <div className="flex-1 min-w-0">
                <Link href={`/kullanici/${user.id}`} className="group block">
                  <h2 className="text-lg font-bold text-navy-900 group-hover:text-teal-600 transition-colors truncate flex items-center gap-2">
                    {user.display_name}
                    {index === 0 && <span className="badge badge-accent text-[10px] px-2 py-0.5">Efsane</span>}
                  </h2>
                  {user.bio ? (
                    <p className="text-sm text-navy-500 truncate group-hover:text-teal-600/70 transition-colors">{user.bio}</p>
                  ) : (
                    <p className="text-xs text-navy-400 italic">Biyografi eklenmemiş</p>
                  )}
                </Link>
              </div>
              
              <div className="flex items-center gap-6 shrink-0 text-right pr-4">
                <div className="hidden sm:block">
                  <div className="text-2xl font-black text-navy-900 leading-none">{user.note_count}</div>
                  <div className="text-xs font-medium text-navy-500 uppercase tracking-wider flex items-center gap-1 justify-end mt-1">
                    <FileText className="w-3 h-3" /> Not
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-black text-teal-600 leading-none">{user.total_downloads}</div>
                  <div className="text-xs font-medium text-teal-600/80 uppercase tracking-wider flex items-center gap-1 justify-end mt-1">
                    <Download className="w-3 h-3" /> İndirme
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-navy-100">
          <Trophy className="w-16 h-16 text-navy-200 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-navy-800 mb-2">Henüz Kimse Yok</h3>
          <p className="text-navy-500 mb-6">İlk notu paylaşarak liderlik tablosunda yerini al!</p>
          <Link href="/yukle" className="btn btn-teal">Hemen Not Paylaş</Link>
        </div>
      )}
    </div>
  );
}
