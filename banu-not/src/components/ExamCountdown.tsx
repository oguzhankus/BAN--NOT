'use client';

import { useState, useEffect } from 'react';
import { CalendarClock, AlertCircle, ArrowRight } from 'lucide-react';

// 2026-2027 BANÜ Akademik Takvimi
const ACADEMIC_EVENTS = [
  { id: 'guz_vize', title: 'Güz Dönemi Vize Sınavlarına', date: '2026-11-09T09:00:00' },
  { id: 'guz_final', title: 'Güz Dönemi Final Sınavlarına', date: '2027-01-07T09:00:00' },
  { id: 'bahar_baslangic', title: 'Bahar Dönemi Başlangıcına', date: '2027-02-15T09:00:00' },
  { id: 'bahar_vize', title: 'Bahar Dönemi Vize Sınavlarına', date: '2027-04-18T09:00:00' },
  { id: 'bahar_final', title: 'Bahar Dönemi Final Sınavlarına', date: '2027-06-12T09:00:00' },
];

export default function ExamCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [currentEvent, setCurrentEvent] = useState<typeof ACADEMIC_EVENTS[0] | null>(null);
  
  useEffect(() => {
    // Find the next upcoming event
    const now = new Date().getTime();
    const upcoming = ACADEMIC_EVENTS.find(event => new Date(event.date).getTime() > now);
    
    if (upcoming) {
      setCurrentEvent(upcoming);
    }
  }, []);

  useEffect(() => {
    if (!currentEvent) return;
    
    const targetDate = new Date(currentEvent.date).getTime();

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        // Event passed, find the next one
        const nextEvent = ACADEMIC_EVENTS.find(event => new Date(event.date).getTime() > new Date().getTime());
        setCurrentEvent(nextEvent || null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [currentEvent]);

  if (!timeLeft || !currentEvent) return null;

  return (
    <div className="bg-gradient-to-r from-teal-600 to-navy-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative mb-12 group">
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 transition-transform duration-700 group-hover:scale-110"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 transition-transform duration-700 group-hover:scale-110"></div>

      <div className="relative z-10 flex items-center gap-4 text-center md:text-left">
        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shrink-0 mx-auto md:mx-0 shadow-inner">
          <CalendarClock className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">{currentEvent.title} Geri Sayım</h2>
          <p className="text-teal-100 text-sm mt-1 flex items-center justify-center md:justify-start gap-1">
            <AlertCircle className="w-4 h-4" /> 
            {currentEvent.id.includes('baslangic') 
              ? 'Yeni döneme hazır mısın?' 
              : 'Çalışmaya başlamanın tam zamanı!'}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex gap-2 sm:gap-4 shrink-0">
        <div className="flex flex-col items-center justify-center w-16 sm:w-20 py-2 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
          <span className="text-2xl sm:text-3xl font-black tabular-nums">{timeLeft.days}</span>
          <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1">Gün</span>
        </div>
        <div className="flex flex-col items-center justify-center w-16 sm:w-20 py-2 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
          <span className="text-2xl sm:text-3xl font-black tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1">Saat</span>
        </div>
        <div className="flex flex-col items-center justify-center w-16 sm:w-20 py-2 bg-black/20 backdrop-blur-md rounded-xl border border-white/10 shadow-inner">
          <span className="text-2xl sm:text-3xl font-black tabular-nums">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest mt-1">Dakika</span>
        </div>
        <div className="flex flex-col items-center justify-center w-16 sm:w-20 py-2 bg-teal-500/40 backdrop-blur-md rounded-xl border border-teal-300/30 shadow-[0_0_15px_rgba(20,184,166,0.3)]">
          <span className="text-2xl sm:text-3xl font-black tabular-nums text-teal-50">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-[10px] sm:text-xs text-teal-100 uppercase tracking-widest mt-1">Saniye</span>
        </div>
      </div>
    </div>
  );
}
