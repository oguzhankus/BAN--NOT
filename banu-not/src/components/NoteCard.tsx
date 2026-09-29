'use client';

import Link from 'next/link';
import {
  FileText, Download, Bookmark, Star, Eye,
  Calendar, User as UserIcon, MessageSquare, Presentation, Image, File
} from 'lucide-react';
import { getNoteTypeLabel, formatFileSize, timeAgo } from '@/lib/constants';

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
  if (mimeType.includes('image')) return <Image className="w-5 h-5 text-blue-500" />;
  if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className="w-5 h-5 text-blue-600" />;
  return <File className="w-5 h-5 text-navy-400" />;
}

function StarRating({ rating, count }: { rating?: number; count?: number }) {
  const r = rating || 0;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${i <= Math.round(r) ? 'text-accent-500 fill-accent-500' : 'text-navy-200'}`}
        />
      ))}
      {count !== undefined && count > 0 && (
        <span className="text-xs text-navy-500 ml-0.5">({count})</span>
      )}
    </div>
  );
}

export default function NoteCard({ note, compact = false }: NoteCardProps) {
  const categoryPath = [note.faculty_name, note.department_name, note.course_name]
    .filter(Boolean)
    .join(' › ');

  return (
    <article className="card card-interactive group">
      <Link href={`/not/${note.id}`} className="block p-4 sm:p-5">
        <div className="flex gap-3">
          {/* File type icon */}
          <div className="shrink-0 w-10 h-10 bg-navy-50 rounded-lg flex items-center justify-center mt-0.5">
            {getFileTypeIcon(note.mime_type)}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-base font-semibold text-navy-900 group-hover:text-teal-700 transition-colors line-clamp-2 leading-snug">
              {note.title}
            </h3>

            {/* Category path */}
            {categoryPath && (
              <p className="text-xs text-navy-500 mt-1 truncate">
                {categoryPath}
              </p>
            )}

            {/* Description */}
            {!compact && note.description && (
              <p className="text-sm text-navy-600 mt-2 line-clamp-2 leading-relaxed">
                {note.description}
              </p>
            )}

            {/* Tags & Type */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
              <span className="badge badge-teal">
                {getNoteTypeLabel(note.note_type)}
              </span>
              {note.course_code && (
                <span className="badge badge-navy">{note.course_code}</span>
              )}
              {note.tags?.slice(0, 3).map((tag) => (
                <span key={tag} className="badge badge-accent">#{tag}</span>
              ))}
              {note.file_size && (
                <span className="text-xs text-navy-400">
                  {formatFileSize(note.file_size)}
                </span>
              )}
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-navy-500">
              <span className="flex items-center gap-1">
                <UserIcon className="w-3.5 h-3.5" />
                {note.user_display_name || 'Anonim'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {timeAgo(note.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5" />
                {note.download_count}
              </span>
              {(note.comment_count ?? 0) > 0 && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  {note.comment_count}
                </span>
              )}
            </div>

            {/* Rating */}
            {(note.rating_count ?? 0) > 0 && (
              <div className="mt-2">
                <StarRating rating={note.avg_rating} count={note.rating_count} />
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
