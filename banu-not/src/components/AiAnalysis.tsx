'use client';

import { useState } from 'react';
import { Sparkles, Brain, CheckCircle2, ChevronRight, ChevronLeft, RefreshCw, Layers } from 'lucide-react';

interface AiAnalysisProps {
  data: {
    summary: string;
    keyConcepts: string[];
    potentialQuestions: string[];
    flashcards?: { front: string; back: string }[];
    quiz?: { question: string; options: string[]; answer: string }[];
  };
}

export default function AiAnalysis({ data }: AiAnalysisProps) {
  const [tab, setTab] = useState<'summary' | 'flashcards' | 'quiz'>('summary');
  
  // Flashcard state
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex(prev => (prev + 1) % (data.flashcards?.length || 1));
    }, 150);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFlashcardIndex(prev => (prev - 1 + (data.flashcards?.length || 1)) % (data.flashcards?.length || 1));
    }, 150);
  };

  const calculateScore = () => {
    if (!data.quiz) return 0;
    let score = 0;
    data.quiz.forEach((q, i) => {
      if (quizAnswers[i] === q.answer) score++;
    });
    return score;
  };

  return (
    <div className="space-y-5">
      {/* AI Navigation */}
      <div className="flex gap-2 p-1 bg-indigo-100/50 rounded-lg overflow-x-auto">
        <button 
          onClick={() => setTab('summary')}
          className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-md transition-colors ${tab === 'summary' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}
        >
          <Sparkles className="w-4 h-4" /> Özet
        </button>
        {data.flashcards && data.flashcards.length > 0 && (
          <button 
            onClick={() => setTab('flashcards')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-md transition-colors ${tab === 'flashcards' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}
          >
            <Layers className="w-4 h-4" /> Flashcards
          </button>
        )}
        {data.quiz && data.quiz.length > 0 && (
          <button 
            onClick={() => setTab('quiz')}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 py-2 px-3 text-sm font-medium rounded-md transition-colors ${tab === 'quiz' ? 'bg-white text-indigo-700 shadow-sm' : 'text-indigo-600 hover:bg-indigo-100'}`}
          >
            <Brain className="w-4 h-4" /> Mini Quiz
          </button>
        )}
      </div>

      {/* Summary Tab */}
      {tab === 'summary' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          <div>
            <h3 className="text-sm font-bold text-indigo-800 mb-1">📝 Otomatik Özet</h3>
            <p className="text-sm text-indigo-900/80 leading-relaxed">{data.summary}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/60 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">🔑 Anahtar Kavramlar</h3>
              <ul className="list-disc list-inside text-sm text-indigo-900/80 space-y-1">
                {data.keyConcepts.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
            
            <div className="bg-white/60 p-4 rounded-xl border border-indigo-100/60 shadow-sm">
              <h3 className="text-sm font-bold text-indigo-800 mb-2">❓ Çıkabilecek Sorular</h3>
              <ul className="list-disc list-inside text-sm text-indigo-900/80 space-y-1">
                {data.potentialQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Flashcards Tab */}
      {tab === 'flashcards' && data.flashcards && data.flashcards.length > 0 && (
        <div className="flex flex-col items-center animate-in fade-in duration-300 py-4">
          <div className="mb-4 text-sm font-medium text-indigo-600">
            Kart {flashcardIndex + 1} / {data.flashcards.length}
          </div>
          
          <div 
            className="relative w-full max-w-md aspect-[3/2] cursor-pointer group perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div className={`w-full h-full absolute top-0 left-0 transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden bg-white border-2 border-indigo-200 rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center">
                <span className="text-xs uppercase tracking-wider text-indigo-400 font-bold mb-4 absolute top-4">Soru / Kavram</span>
                <h3 className="text-xl font-semibold text-indigo-900">{data.flashcards[flashcardIndex].front}</h3>
                <span className="text-xs text-indigo-300 absolute bottom-4">Cevabı görmek için tıkla</span>
              </div>
              
              {/* Back */}
              <div className="absolute w-full h-full backface-hidden bg-indigo-600 border-2 border-indigo-700 rounded-2xl shadow-md p-6 flex flex-col items-center justify-center text-center rotate-y-180">
                <span className="text-xs uppercase tracking-wider text-indigo-300 font-bold mb-4 absolute top-4">Cevap</span>
                <p className="text-lg font-medium text-white">{data.flashcards[flashcardIndex].back}</p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button onClick={handlePrevCard} className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={() => setIsFlipped(!isFlipped)} className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
              <RefreshCw className="w-6 h-6" />
            </button>
            <button onClick={handleNextCard} className="p-2 rounded-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* Quiz Tab */}
      {tab === 'quiz' && data.quiz && data.quiz.length > 0 && (
        <div className="animate-in fade-in duration-300">
          {!showQuizResults ? (
            <div className="space-y-6">
              {data.quiz.map((q, i) => (
                <div key={i} className="bg-white/80 p-5 rounded-xl border border-indigo-100">
                  <h4 className="font-semibold text-indigo-900 mb-4">{i + 1}. {q.question}</h4>
                  <div className="space-y-2">
                    {q.options.map((opt, j) => (
                      <label key={j} className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${quizAnswers[i] === opt ? 'bg-indigo-50 border-indigo-400' : 'border-indigo-100 hover:bg-indigo-50/50'}`}>
                        <input 
                          type="radio" 
                          name={`q-${i}`} 
                          value={opt}
                          checked={quizAnswers[i] === opt}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [i]: opt }))}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-indigo-300"
                        />
                        <span className="ml-3 text-sm text-indigo-800">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <button 
                  onClick={() => setShowQuizResults(true)} 
                  disabled={Object.keys(quizAnswers).length < data.quiz.length}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
                >
                  Sonuçları Gör
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-indigo-200 p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-indigo-900 mb-2">Quiz Tamamlandı!</h3>
              <p className="text-lg text-indigo-700 mb-6">
                Skorunuz: <span className="font-bold">{calculateScore()} / {data.quiz.length}</span>
              </p>
              
              <div className="text-left space-y-4 mb-6">
                {data.quiz.map((q, i) => {
                  const isCorrect = quizAnswers[i] === q.answer;
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      <p className="font-medium text-navy-900 text-sm mb-2">{q.question}</p>
                      <p className={`text-sm ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                        Sizin Cevabınız: <strong>{quizAnswers[i]}</strong>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm text-green-700 mt-1">
                          Doğru Cevap: <strong>{q.answer}</strong>
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <button 
                onClick={() => {
                  setQuizAnswers({});
                  setShowQuizResults(false);
                }} 
                className="btn bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              >
                Yeniden Çöz
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
