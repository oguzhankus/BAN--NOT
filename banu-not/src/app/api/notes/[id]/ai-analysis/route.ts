import { NextRequest } from 'next/server';
import { ensureDb, successResponse, errorResponse } from '@/lib/api-utils';
import { v4 as uuid } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import path from 'path';
import fs from 'fs';
const pdfParse = require('pdf-parse');

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

      // Try to find the PDF file for this note
      const file = db.prepare('SELECT storage_path FROM note_files WHERE note_id = ? AND mime_type = ?').get(id, 'application/pdf') as any;
      
      let noteText = '';
      if (file && file.storage_path) {
        try {
          const filePath = path.resolve(process.cwd(), file.storage_path);
          if (fs.existsSync(filePath)) {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdfParse(dataBuffer);
            // Sadece ilk ~10000 karakteri al (Hızlı yanıt ve token tasarrufu için)
            noteText = pdfData.text.substring(0, 10000);
          }
        } catch (e) {
          console.error("PDF okuma hatası:", e);
          // PDF okunamasa da başlıktan ve açıklamadan analiz yapmaya devam et
        }
      }

      const prompt = `
Aşağıda bir üniversite ders notuna ait bilgiler ve varsa metin içeriği verilmiştir. 
Bu notu analiz ederek öğrencilere faydalı olacak bir özet, anahtar kavramlar, sınavda çıkabilecek potansiyel sorular, flashcard'lar (bilgi kartları) ve çoktan seçmeli bir mini quiz oluştur.
LÜTFEN YANITINI SADECE AŞAĞIDAKİ JSON FORMATINDA VER (markdown backtick kullanma, sadece saf JSON string'i olsun):

{
  "summary": "Notun kapsamlı ama anlaşılır özeti (3-4 cümle)",
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
PDF İçeriğinden Kesit:
${noteText || '(İçerik okunamadı veya yüklenmedi)'}
`;

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
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

      db.prepare(`
        INSERT INTO note_ai_analysis (id, note_id, summary, key_concepts, potential_questions, flashcards, quiz)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(analysisId, id, aiData.summary || '', keyConcepts, potentialQuestions, flashcards, quiz);

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
