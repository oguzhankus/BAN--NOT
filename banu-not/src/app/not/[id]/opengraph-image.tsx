import { ImageResponse } from 'next/og';
import { getPublicNoteSocialData } from '@/lib/note-social';

export const alt = 'BANÜ NOT üzerinde paylaşılan ders notu';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = getPublicNoteSocialData(id);

  const title = note?.status === 'published' ? note.title : 'Ders notlarını keşfet';
  const course = note?.status === 'published'
    ? [note.course_name, note.faculty_name].filter(Boolean).join(' · ')
    : 'BANÜ NOT öğrenci topluluğu';
  const rating = note?.status === 'published' && note.rating_count > 0
    ? `${note.avg_rating.toFixed(1)} / 5 · ${note.rating_count} değerlendirme`
    : 'Ders notlarını keşfet ve paylaş';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: '100%',
          padding: '58px',
          background: 'linear-gradient(135deg, #081827 0%, #102a43 58%, #123b4b 100%)',
          color: '#102a43',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.45)',
            borderRadius: '30px',
            padding: '48px 54px',
            background: 'linear-gradient(145deg, #ffffff 0%, #f0fdfa 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                width: '48px',
                height: '48px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '15px',
                background: '#ccfbf1',
                color: '#0f766e',
                fontSize: '25px',
                fontWeight: 800,
              }}
            >
              B
            </div>
            <div style={{ display: 'flex', fontSize: '23px', fontWeight: 800 }}>BANÜ NOT</div>
            <div
              style={{
                display: 'flex',
                marginLeft: 'auto',
                borderRadius: '999px',
                padding: '10px 16px',
                background: '#ccfbf1',
                color: '#0f766e',
                fontSize: '17px',
                fontWeight: 700,
              }}
            >
              DERS NOTU
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div
              style={{
                display: 'flex',
                color: '#0f766e',
                fontSize: '21px',
                fontWeight: 700,
              }}
            >
              {course || 'Üniversite ders notu'}
            </div>
            <div
              style={{
                display: 'flex',
                maxHeight: '190px',
                overflow: 'hidden',
                fontSize: '52px',
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: '-1.5px',
              }}
            >
              {title}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: '1px solid #d9e2ec',
              paddingTop: '20px',
              color: '#486581',
              fontSize: '19px',
            }}
          >
            <div style={{ display: 'flex' }}>{rating}</div>
            <div style={{ display: 'flex', color: '#0f766e', fontWeight: 700 }}>Paylaş · Keşfet · Öğren</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
