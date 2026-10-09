'use client';

import Link from 'next/link';
import {
  FileText, Download, Heart, Star, Eye, ArrowUpRight,
  Calendar, User as UserIcon, MessageSquare, Presentation, Image as ImageIcon, File, BadgeCheck, FolderPlus
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { getNoteTypeLabel, getSemesterLabel, formatFileSize, timeAgo } from '@/lib/constants';
import { useToast } from '@/components/Toast';

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    description?: string;
    note_type: string;
    university_name?: string;
    faculty_name?: string;
    department_name?: string;
    course_name?: string;
    course_code?: string;
    semester?: string;
    academic_year?: string;
    topic?: string;
    user_display_name?: string;
    user_is_email_verified?: number;
    is_handwritten?: number;
    user_id?: string;
    download_count: number;
    view_count: number;
    created_at: string;
    file_size?: number;
    mime_type?: string;
    avg_rating?: number;
    rating_count?: number;
    comment_count?: number;
    bookmark_count?: number;
    tags?: string[];
  };
  compact?: boolean;
}

function getFileTypeIcon(mimeType?: string) {
  if (!mimeType) return <FileText className="w-5 h-5" />;
  if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return <Presentation className="w-5 h-5 text-orange-500" />;
  if (mimeType.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
  return <File className="w-5 h-5 text-navy-400" />;
}

export default function NoteCard({ note, compact = false }: NoteCardProps) {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<{ id: string; name: string }[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const categoryPath = [note.faculty_name, note.department_name, note.course_name]
    .filter(Boolean)
    .join(' › ');

  async function toggleCollectionPicker() {
    if (!showCollectionPicker && !collectionsLoaded) {
      try {
        const response = await fetch('/api/collections');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Koleksiyonlar yüklenemedi.');
        setCollections(result.data.map((collection: { id: string; name: string }) => collection));
        setCollectionsLoaded(true);
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Koleksiyonlar yüklenemedi.', 'error');
      }
    }
    setShowCollectionPicker(open => !open);
  }

  async function addToCollection(collectionId: string) {
    const response = await fetch(`/api/collections/${collectionId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noteId: note.id }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
      showToast(result.error || 'Koleksiyona eklenemedi.', 'error');
      return;
    }
    setCollectionIds(current => current.includes(collectionId) ? current : [...current, collectionId]);
    showToast(result.data.message);
  }

  return (
    <article className="note-card card card-interactive group relative cursor-pointer">
      <div className="flex gap-3.5 p-4 sm:gap-4 sm:p-5">
        <div className="note-card-file mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600 transition-colors group-hover:bg-teal-50 group-hover:text-teal-700 sm:h-12 sm:w-12">
          {getFileTypeIcon(note.mime_type)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                <span className="badge badge-teal">{getNoteTypeLabel(note.note_type)}</span>
                {note.course_code && <span className="badge badge-navy">{note.course_code}</span>}
                {note.semester && <span className="note-card-semester badge badge-accent">{getSemesterLabel(note.semester)}</span>}
                {note.is_handwritten === 1 && <span className="badge badge-navy">El yazısı</span>}
              </div>
              <h3 className="text-base font-bold leading-snug text-navy-900 transition-colors group-hover:text-teal-800 sm:text-[17px]">
                <Link href={`/not/${note.id}`} className="note-card-title focus-visible:rounded-sm" aria-label={`${note.title} notunu görüntüle`}>
                  {note.title}
                </Link>
              </h3>
              {categoryPath && <p className="mt-1.5 truncate text-xs font-medium text-navy-500">{categoryPath}</p>}
            </div>
            <ArrowUpRight className="note-card-arrow mt-1 h-4 w-4 shrink-0 text-navy-300 transition-[color,transform] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-700" />
          </div>

          {!compact && note.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-navy-600">{note.description}</p>
          )}

          {(note.tags?.length || note.file_size) ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {note.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="badge badge-accent">#{tag}</span>
              ))}
              {note.file_size && <span className="ml-1 text-[11px] font-medium text-navy-400">{formatFileSize(note.file_size)}</span>}
            </div>
          ) : null}

          <div className="note-card-footer mt-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-t border-navy-100 pt-3">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-navy-500">
              {note.user_id ? (
                <Link href={`/kullanici/${note.user_id}`} className="relative z-10 inline-flex items-center gap-1.5 font-semibold text-navy-700 transition-colors hover:text-teal-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-50 text-[10px] font-bold text-teal-800">
                    {(note.user_display_name || 'A').charAt(0).toUpperCase()}
                  </span>
                  {note.user_display_name || 'Anonim'}
                  {note.user_is_email_verified === 1 && (
                    <BadgeCheck className="h-3.5 w-3.5 text-teal-600" aria-label="Üniversite e-postası doğrulanmış" />
                  )}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1"><UserIcon className="h-3.5 w-3.5" /> {note.user_display_name || 'Anonim'}</span>
              )}
              <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {timeAgo(note.created_at)}</span>
              {session?.user && (
                <span className="relative">
                  <button
                    type="button"
                    className="relative z-10 inline-flex items-center gap-1 rounded-full px-2 py-1 font-semibold text-teal-700 hover:bg-teal-50"
                    aria-label={`Kaydet ${note.title} koleksiyona`}
                    aria-expanded={showCollectionPicker}
                    onClick={() => { void toggleCollectionPicker(); }}
                  >
                    <FolderPlus className="h-3.5 w-3.5" />
                    Koleksiyona ekle
                  </button>
                  {showCollectionPicker && (
                    <span className="absolute left-0 top-full z-30 mt-1 flex min-w-48 flex-col rounded-xl border border-navy-100 bg-white p-1.5 shadow-lg">
                      {collections.map(collection => (
                        <button
                          key={collection.id}
                          type="button"
                          className="rounded-lg px-3 py-2 text-left text-xs font-medium text-navy-700 hover:bg-teal-50"
                          onClick={() => {
                            void addToCollection(collection.id);
                            setShowCollectionPicker(false);
                          }}
                        >
                          {collection.name}{collectionIds.includes(collection.id) ? ' · eklendi' : ''}
                        </button>
                      ))}
                      <Link href="/kaydedilenler" className="rounded-lg px-3 py-2 text-left text-xs font-semibold text-teal-700 hover:bg-teal-50">
                        Koleksiyon yönetimi
                      </Link>
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs font-medium text-navy-500">
              {(note.rating_count ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-amber-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" /> {(note.avg_rating || 0).toFixed(1)}</span>
              )}
              <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {note.download_count}</span>
              {(note.bookmark_count ?? 0) > 0 && <span className="inline-flex items-center gap-1 text-rose-500"><Heart className="h-3.5 w-3.5 fill-rose-500" /> {note.bookmark_count}</span>}
              {(note.comment_count ?? 0) > 0 && <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" /> {note.comment_count}</span>}
              {note.view_count > 0 && <span className="hidden items-center gap-1 sm:inline-flex"><Eye className="h-3.5 w-3.5" /> {note.view_count}</span>}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
