import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PDFParse } from 'pdf-parse';
import path from 'path';
import fs from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await ensureDb();
    const { id } = await params;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return errorResponse('Sistemde Gemini API anahtarı (GEMINI_API_KEY) bulunamadı. Lütfen .env dosyasına ekleyip sunucuyu yeniden başlatın.', 500);
    }

    // Check if analysis already exists
    let analysis = db.prepare('SELECT * FROM note_ai_analysis WHERE note_id = ?').get(id) as any;

    if (!analysis) {
      const note = db.prepare('SELECT title, description, topic FROM notes WHERE id = ?').get(id) as any;
      if (!note) return errorResponse('Not bulunamadı.', 404);

      // Extract searchable text from the current PDF or ask Gemini to read a small image.
      const file = db.prepare(`
        SELECT storage_path, mime_type, file_size FROM note_files
        WHERE note_id = ?
        ORDER BY created_at DESC, rowid DESC
        LIMIT 1
      `).get(id) as any;
      
      let noteText = '';
      let imagePart: { inlineData: { data: string; mimeType: string } } | null = null;
      if (file && file.storage_path) {
        try {
          const filePath = path.resolve(process.cwd(), file.storage_path);
          if (fs.existsSync(filePath) && file.mime_type === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: dataBuffer });
            const pdfData = await parser.getText();
            noteText = pdfData.text.substring(0, 10000);
          } else if (
            fs.existsSync(filePath) &&
            ['image/jpeg', 'image/png', 'image/webp'].includes(file.mime_type) &&
            file.file_size <= 8 * 1024 * 1024
          ) {
            imagePart = {
              inlineData: {
                data: fs.readFileSync(filePath).toString('base64'),
                mimeType: file.mime_type,
              },
            };
          }
        } catch (e) {
          console.error('Not dosyası metin/OCR okuma hatası:', e);
        }
      }

      const prompt = `
Aşağıda bir üniversite ders notuna ait bilgiler ve varsa metin içeriği verilmiştir. 
Bu notu analiz ederek öğrencilere faydalı olacak bir özet, anahtar kavramlar, sınavda çıkabilecek potansiyel sorular, flashcard'lar (bilgi kartları) ve çoktan seçmeli bir mini quiz oluştur.
LÜTFEN YANITINI SADECE AŞAĞIDAKİ JSON FORMATINDA VER (markdown backtick kullanma, sadece saf JSON string'i olsun):

{
  "summary": "Notun kapsamlı ama anlaşılır özeti (3-4 cümle)",
  "ocrText": "Görselde veya PDF'te okunabilen not metni (en fazla 10000 karakter; okunabilir metin yoksa boş string)",
  "keyConcepts": ["Kavram 1", "Kavram 2", "Kavram 3", "Kavram 4"],
  "potentialQuestions": ["Soru 1", "Soru 2", "Soru 3"],
  "flashcards": [
    { "front": "Kavram/Soru", "back": "Açıklaması/Cevabı" }
  ],
  "quiz": [
    { "question": "Soru metni", "options": ["A Seçeneği", "B Seçeneği", "C Seçeneği", "D Seçeneği"], "answer": "Doğru Seçenek Metni (Seçeneklerden biriyle birebir aynı)" }
  ]
}

Ders Notu Başlığı: ${note.title}
Konu: ${note.topic || 'Belirtilmemiş'}
Açıklama: ${note.description || 'Belirtilmemiş'}
Dosyadan çıkarılan metin:
${noteText || (imagePart ? 'Ekli görseldeki metni oku; ocrText alanına aktar.' : '(İçerik okunamadı veya yüklenmedi)')}
`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(imagePart ? [prompt, imagePart] : prompt);
      let responseText = result.response.text();
      
      // Clean up markdown json blocks if present
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let aiData;
      try {
        aiData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON parse hatası:", responseText);
        return errorResponse('Yapay zeka yanıtı formatlanamadı.', 500);
      }

      const analysisId = uuid();
      const keyConcepts = JSON.stringify(aiData.keyConcepts || []);
      const potentialQuestions = JSON.stringify(aiData.potentialQuestions || []);
      const flashcards = JSON.stringify(aiData.flashcards || []);
      const quiz = JSON.stringify(aiData.quiz || []);
      const ocrText = typeof aiData.ocrText === 'string' ? aiData.ocrText.slice(0, 10000) : noteText;

      db.prepare(`
        INSERT INTO note_ai_analysis (id, note_id, summary, key_concepts, potential_questions, flashcards, quiz)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(analysisId, id, aiData.summary || '', keyConcepts, potentialQuestions, flashcards, quiz);
      if (ocrText) db.prepare('UPDATE notes SET ocr_text = ? WHERE id = ?').run(ocrText, id);

      analysis = {
        summary: aiData.summary,
        key_concepts: keyConcepts,
        potential_questions: potentialQuestions,
        flashcards: flashcards,
        quiz: quiz
      };
    }

    return successResponse({
      summary: analysis.summary,
      keyConcepts: JSON.parse(analysis.key_concepts || '[]'),
      potentialQuestions: JSON.parse(analysis.potential_questions || '[]'),
      flashcards: analysis.flashcards ? JSON.parse(analysis.flashcards) : [],
      quiz: analysis.quiz ? JSON.parse(analysis.quiz) : []
    });
  } catch (error) {
    console.error('AI Analysis error:', error);
    return errorResponse('Yapay zeka analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.', 500);
  }
}
