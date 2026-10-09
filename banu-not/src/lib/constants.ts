export const UNIVERSITY = {
  name: 'Bandırma Onyedi Eylül Üniversitesi',
  shortName: 'BANÜ',
} as const;

export const DAILY_QUOTES = [
  { text: 'Başarı, her gün tekrarlanan küçük çabaların toplamıdır.', author: 'Robert Collier' },
  { text: 'Öğrenmek, aklın gıdasıdır; düşünmek ise onun sindirimidir.', author: 'Leonardo da Vinci' },
  { text: 'Bugünün acısı, yarının gücüdür.', author: 'Anonim' },
  { text: 'Bilgi paylaştıkça çoğalır.', author: 'Anonim' },
  { text: 'Disiplin, hedefler ile başarı arasındaki köprüdür.', author: 'Jim Rohn' },
  { text: 'Vize haftası geçer, notlar kalır — paylaş ki herkes kazansın.', author: 'BANÜ NOT' },
  { text: 'Yapabileceğinin en iyisini yap; kimse daha fazlasını yapamaz.', author: 'John Wooden' },
] as const;

export function getDailyQuote() {
  const dayIndex = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  return DAILY_QUOTES[dayIndex % DAILY_QUOTES.length];
}

export const NOTE_TYPES = [
  { value: 'ders_notu', label: 'Ders Notu' },
  { value: 'ozet', label: 'Özet' },
  { value: 'cikmis_soru', label: 'Çıkmış Soru' },
  { value: 'sunum', label: 'Sunum' },
  { value: 'lab', label: 'Laboratuvar / Uygulama' },
  { value: 'proje', label: 'Proje' },
  { value: 'calisma_rehberi', label: 'Çalışma Rehberi' },
  { value: 'diger', label: 'Diğer' },
] as const;

export const SEMESTERS = [
  { value: 'guz', label: 'Güz' },
  { value: 'bahar', label: 'Bahar' },
  { value: 'yaz', label: 'Yaz' },
] as const;

export const REPORT_REASONS = [
  { value: 'wrong_category', label: 'Hatalı Kategori' },
  { value: 'copyright', label: 'Telif / İzin Sorunu' },
  { value: 'harmful_content', label: 'Zararlı İçerik' },
  { value: 'personal_info', label: 'Kişisel Bilgi İçeriyor' },
  { value: 'spam', label: 'Spam / Reklam' },
  { value: 'other', label: 'Diğer' },
] as const;

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.pptx', '.jpg', '.jpeg', '.png', '.webp'];

export const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB || '50') || 50) * 1024 * 1024;

export const NOTE_STATUS = {
  DRAFT: 'draft',
  PENDING_REVIEW: 'pending_review',
  PUBLISHED: 'published',
  REJECTED: 'rejected',
  REMOVED: 'removed',
} as const;

export const FACULTY_TYPES = [
  { value: 'faculty', label: 'Fakülte' },
  { value: 'institute', label: 'Enstitü' },
  { value: 'vocational_school', label: 'Yüksekokul' },
  { value: 'conservatory', label: 'Konservatuar' },
] as const;

export function getNoteTypeLabel(value: string): string {
  return NOTE_TYPES.find(t => t.value === value)?.label || value;
}

export function getSemesterLabel(value: string): string {
  return SEMESTERS.find(s => s.value === value)?.label || value;
}

export function getReportReasonLabel(value: string): string {
  return REPORT_REASONS.find(r => r.value === value)?.label || value;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function parseDbDate(dateStr: string | Date): Date {
  if (dateStr instanceof Date) return dateStr;
  if (typeof dateStr === 'string' && !dateStr.includes('T')) {
    return new Date(dateStr.replace(' ', 'T') + 'Z');
  }
  return new Date(dateStr);
}

export function formatDate(date: string | Date): string {
  const d = parseDbDate(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date): string {
  const d = parseDbDate(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = parseDbDate(date);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);

  if (months > 0) return `${months} ay önce`;
  if (days > 0) return `${days} gün önce`;
  if (hours > 0) return `${hours} saat önce`;
  if (minutes > 0) return `${minutes} dakika önce`;
  return 'Az önce';
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'file-text';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-type';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'presentation';
  if (mimeType.includes('image')) return 'image';
  return 'file';
}
