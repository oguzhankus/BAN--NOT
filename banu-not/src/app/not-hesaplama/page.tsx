'use client';

import { useState } from 'react';
import { Calculator, Plus, Trash2, GraduationCap, AlertCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

const GRADES = [
  { letter: 'AA', point: 4.0 },
  { letter: 'BA', point: 3.5 },
  { letter: 'BB', point: 3.0 },
  { letter: 'CB', point: 2.5 },
  { letter: 'CC', point: 2.0 },
  { letter: 'DC', point: 1.5 },
  { letter: 'DD', point: 1.0 },
  { letter: 'FD', point: 0.5 },
  { letter: 'FF', point: 0.0 },
];

export default function GPACalculatorPage() {
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', credits: 3, grade: 'AA' },
    { id: '2', name: '', credits: 3, grade: 'BB' },
    { id: '3', name: '', credits: 4, grade: 'CC' }
  ]);
  
  const [currentGPA, setCurrentGPA] = useState<number | ''>('');
  const [currentCredits, setCurrentCredits] = useState<number | ''>('');

  const addCourse = () => {
    setCourses([...courses, { id: Math.random().toString(), name: '', credits: 3, grade: 'AA' }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: any) => {
    setCourses(courses.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const resetCalculator = () => {
    setCourses([
      { id: '1', name: '', credits: 3, grade: 'AA' },
      { id: '2', name: '', credits: 3, grade: 'BB' },
      { id: '3', name: '', credits: 4, grade: 'CC' }
    ]);
    setCurrentGPA('');
    setCurrentCredits('');
  };

  // Calculate Semester GPA
  let totalSemesterCredits = 0;
  let totalSemesterPoints = 0;

  courses.forEach(c => {
    if (c.credits > 0) {
      const gradeInfo = GRADES.find(g => g.letter === c.grade);
      if (gradeInfo) {
        totalSemesterCredits += c.credits;
        totalSemesterPoints += c.credits * gradeInfo.point;
      }
    }
  });

  const semesterGPA = totalSemesterCredits > 0 ? (totalSemesterPoints / totalSemesterCredits) : 0;

  // Calculate Cumulative GPA
  let cumulativeGPA = 0;
  if (currentGPA !== '' && currentCredits !== '' && Number(currentCredits) > 0) {
    const pastCredits = Number(currentCredits);
    const pastGPA = Number(currentGPA);
    
    const overallPoints = (pastCredits * pastGPA) + totalSemesterPoints;
    const overallCredits = pastCredits + totalSemesterCredits;
    cumulativeGPA = overallPoints / overallCredits;
  }

  return (
    <div className="container-app py-8 sm:py-12 max-w-4xl mx-auto">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-200">
          <Calculator className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">BANÜ Not Hesaplama</h1>
        <p className="text-lg text-navy-600">
          Dönem ortalamanızı ve genel not ortalamanızı kolayca hesaplayın.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6 border-t-4 border-t-teal-500">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-teal-600" />
                Dersleriniz
              </h2>
              <button onClick={resetCalculator} className="text-sm text-navy-500 hover:text-red-500 flex items-center gap-1 transition-colors">
                <RefreshCw className="w-4 h-4" /> Sıfırla
              </button>
            </div>
            
            {/* Table Header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 mb-3 text-sm font-semibold text-navy-600 px-2">
              <div className="col-span-6">Ders Adı (İsteğe Bağlı)</div>
              <div className="col-span-2 text-center">Kredi/AKTS</div>
              <div className="col-span-3 text-center">Harf Notu</div>
              <div className="col-span-1"></div>
            </div>

            <div className="space-y-3">
              {courses.map((course, index) => (
                <div key={course.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center bg-navy-50/50 p-3 sm:p-2 sm:bg-transparent rounded-lg">
                  <div className="sm:col-span-6">
                    <label className="sm:hidden text-xs font-semibold text-navy-500 mb-1 block">Ders Adı</label>
                    <input 
                      type="text" 
                      value={course.name}
                      onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                      placeholder={`Ders ${index + 1}`}
                      className="input py-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 sm:col-span-5">
                    <div className="sm:col-span-2">
                      <label className="sm:hidden text-xs font-semibold text-navy-500 mb-1 block">Kredi</label>
                      <input 
                        type="number" 
                        min="0" max="20"
                        value={course.credits}
                        onChange={(e) => updateCourse(course.id, 'credits', Number(e.target.value) || 0)}
                        className="input py-2 text-center"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="sm:hidden text-xs font-semibold text-navy-500 mb-1 block">Harf Notu</label>
                      <select 
                        value={course.grade}
                        onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                        className="input py-2"
                      >
                        {GRADES.map(g => (
                          <option key={g.letter} value={g.letter}>{g.letter} ({g.point.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="sm:col-span-1 flex justify-end sm:justify-center mt-2 sm:mt-0">
                    <button 
                      onClick={() => removeCourse(course.id)}
                      disabled={courses.length <= 1}
                      className="p-2 text-navy-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button 
              onClick={addCourse}
              className="mt-6 w-full py-3 border-2 border-dashed border-navy-200 rounded-xl text-navy-600 font-medium hover:border-teal-400 hover:text-teal-700 hover:bg-teal-50 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Ders Ekle
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Semester Result */}
          <div className="card p-6 bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-xl shadow-teal-900/10">
            <h2 className="text-lg font-medium text-teal-100 mb-1">Dönem Ortalaması</h2>
            <div className="text-5xl font-black mb-4">
              {semesterGPA.toFixed(2)}
            </div>
            <div className="flex items-center justify-between text-sm text-teal-100 border-t border-teal-400/30 pt-4 mt-2">
              <span>Toplam Kredi: <strong>{totalSemesterCredits}</strong></span>
              <span>Puan: <strong>{totalSemesterPoints.toFixed(1)}</strong></span>
            </div>
          </div>

          {/* Cumulative Section */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Genel Not Ortalaması (GNO)</h2>
            <p className="text-sm text-navy-500 mb-5">
              Geçmiş dönemlerdeki GNO'nuzu hesaplamaya dahil etmek istiyorsanız doldurun.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="label">Şu anki GNO'nuz</label>
                <input 
                  type="number" 
                  step="0.01" min="0" max="4"
                  placeholder="Örn: 3.20"
                  value={currentGPA}
                  onChange={(e) => setCurrentGPA(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Tamamlanan Toplam Kredi</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="Örn: 90"
                  value={currentCredits}
                  onChange={(e) => setCurrentCredits(e.target.value)}
                  className="input"
                />
              </div>
            </div>

            {currentGPA !== '' && currentCredits !== '' && (
              <div className="mt-6 pt-5 border-t border-navy-100">
                <div className="text-sm text-navy-500 mb-1">Yeni Genel Not Ortalamanız</div>
                <div className="text-3xl font-bold text-accent-600">
                  {cumulativeGPA.toFixed(2)}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start gap-3 border border-blue-100">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Üniversitenizin sistemindeki hesaplama yöntemine göre çok ufak küsurat farkları oluşabilir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
