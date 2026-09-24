// File: app/dashboard/exams/results/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config";
import { Exam, GradingScale } from "../../../../types/exam";
import { ClassInfo, Section, Subject } from "../../../../types/class";
import { Student } from "../../../../types/student";
import { 
  ArrowLeft, Printer, Loader2, Award, FileSpreadsheet, CheckCircle2, Search, Trophy, Globe
} from "lucide-react";

// প্রসেস করা রেজাল্টের ইন্টারফেস
interface ProcessedResult {
  student: Student;
  subjectMarks: Record<string, any>; // { subjectId: { total, grade, point } }
  totalMarks: number;
  finalGpa: number;
  finalGrade: string;
  isFailed: boolean;
  meritPosition: number;
}

export default function ResultsTabulationPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [classSubjects, setClassSubjects] = useState<Subject[]>([]);

  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // প্রাথমিক ডেটা ফেচিং
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const examSnap = await getDocs(query(collection(db, "exams"), orderBy("createdAt", "desc")));
        setExams(examSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Exam[]);

        const classSnap = await getDocs(query(collection(db, "classes"), orderBy("orderIndex", "asc")));
        setClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ClassInfo[]);

        const scaleSnap = await getDocs(query(collection(db, "grading_scales"), orderBy("createdAt", "desc")));
        setGradingScales(scaleSnap.docs.map(d => ({ id: d.id, ...d.data() })) as GradingScale[]);
      } catch (error) {
        console.error(error);
      }
    };
    fetchInitialData();
  }, []);

  // ক্লাস পরিবর্তনের সাথে সাথে সেকশন ও সাবজেক্ট আপডেট
  useEffect(() => {
    if (!selectedClassId) {
      setAvailableSections([]);
      setClassSubjects([]);
      setSelectedSectionId("");
      return;
    }
    const cls = classes.find(c => c.id === selectedClassId);
    if (cls) {
      setAvailableSections(cls.sections || []);
      setClassSubjects(cls.subjects || []);
      setSelectedSectionId(cls.sections?.[0]?.id || "");
    }
  }, [selectedClassId, classes]);

  // জিপিএ থেকে গ্রেড বের করার হেল্পার (গড় জিপিএ এর ওপর ভিত্তি করে)
  const getFinalGrade = (gpa: number) => {
    if (gpa >= 5.0) return "A+";
    if (gpa >= 4.0) return "A";
    if (gpa >= 3.5) return "A-";
    if (gpa >= 3.0) return "B";
    if (gpa >= 2.0) return "C";
    if (gpa >= 1.0) return "D";
    return "F";
  };

  // রেজাল্ট জেনারেট ও মেধাক্রম প্রস্তুত করা
  const handleGenerateTabulation = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId) {
      alert("পরীক্ষা, ক্লাস এবং শাখা নির্বাচন করুন।");
      return;
    }

    setIsGenerating(true);
    setSuccessMsg("");
    setResults([]);

    try {
      // ১. শিক্ষার্থী ফেচ করা
      const studentQ = query(
        collection(db, "students"),
        where("academicInfo.classId", "==", classes.find(c => c.id === selectedClassId)?.name),
        where("status", "==", "active")
      );
      const studentSnap = await getDocs(studentQ);
      let students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[];
      
      const sectionName = availableSections.find(s => s.id === selectedSectionId)?.name;
      if (sectionName) students = students.filter(s => s.academicInfo.sectionId === sectionName);

      // ২. এই পরীক্ষা ও ক্লাসের সকল মার্কস ফেচ করা
      const marksSnap = await getDocs(query(
        collection(db, "exam_marks"),
        where("examId", "==", selectedExamId),
        where("classId", "==", selectedClassId),
        where("sectionId", "==", selectedSectionId)
      ));
      
      const allMarks = marksSnap.docs.map(d => d.data());

      // ৩. ডেটা প্রসেসিং ও ক্যালকুলেশন
      let processedResults: ProcessedResult[] = students.map(student => {
        const studentMarks = allMarks.filter(m => m.studentId === student.id);
        
        let totalMarks = 0;
        let totalPoints = 0;
        let isFailed = false;
        const subjectMarks: Record<string, any> = {};

        classSubjects.forEach(sub => {
          const mark = studentMarks.find(m => m.subjectId === sub.id);
          
          if (mark) {
            subjectMarks[sub.id] = { total: mark.totalSubjectMark, grade: mark.grade, point: mark.point };
            totalMarks += mark.totalSubjectMark;
            
            // ঐচ্ছিক বিষয় না হলে ফেইল চেক (F গ্রেড বা পয়েন্ট ০)
            if (!sub.isOptional && (mark.grade === 'F' || mark.point === 0)) {
              isFailed = true;
            } else {
              totalPoints += mark.point;
            }
          } else {
            // যদি কোনো বিষয়ের নম্বর এন্ট্রি না থাকে
            subjectMarks[sub.id] = { total: 0, grade: "N/A", point: 0 };
            if (!sub.isOptional) isFailed = true;
          }
        });

        // চূড়ান্ত জিপিএ হিসাব (মোট সাবজেক্ট দিয়ে ভাগ, ঐচ্ছিক বিষয়ের হিসাব মাদ্রাসার রুলস অনুযায়ী বদলানো যায়)
        const regularSubjectsCount = classSubjects.filter(s => !s.isOptional).length;
        let finalGpa = isFailed ? 0 : (totalPoints / regularSubjectsCount);
        if (finalGpa > 5.0) finalGpa = 5.0; // জিপিএ ৫ এর বেশি হতে পারবে না

        return {
          student,
          subjectMarks,
          totalMarks,
          finalGpa: Number(finalGpa.toFixed(2)),
          finalGrade: isFailed ? "F" : getFinalGrade(finalGpa),
          isFailed,
          meritPosition: 0 // পরে হিসাব হবে
        };
      });

      // ৪. মেধাক্রম নির্ধারণ (Sorting: জিপিএ বেশি -> মোট নম্বর বেশি)
      processedResults.sort((a, b) => {
        if (b.finalGpa !== a.finalGpa) return b.finalGpa - a.finalGpa;
        return b.totalMarks - a.totalMarks;
      });

      // পজিশন বসানো
      processedResults = processedResults.map((res, index) => ({
        ...res,
        meritPosition: res.isFailed ? 0 : index + 1
      }));

      setResults(processedResults);

    } catch (error) {
      alert("রেজাল্ট তৈরি করতে সমস্যা হয়েছে!");
    } finally {
      setIsGenerating(false);
    }
  };

  // ফলাফল পাবলিশ করা (স্ট্যাটাস আপডেট)
  const handlePublishResult = async () => {
    if (!selectedExamId || !confirm("আপনি কি নিশ্চিত যে এই ফলাফলটি প্রকাশ করতে চান? শিক্ষার্থীরা তাদের ড্যাশবোর্ড থেকে এটি দেখতে পারবে।")) return;
    
    setIsPublishing(true);
    try {
      await updateDoc(doc(db, "exams", selectedExamId), {
        isResultPublished: true
      });
      
      // লোকাল স্টেট আপডেট
      setExams(exams.map(e => e.id === selectedExamId ? { ...e, isResultPublished: true } : e));
      setSuccessMsg("ফলাফল সফলভাবে প্রকাশিত হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("ফলাফল প্রকাশে সমস্যা হয়েছে।");
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />

      {/* স্ক্রিন ভিউ */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FileSpreadsheet size={24} className="text-blue-600" />
              ট্যাবুলেশন শিট ও ফলাফল
            </h1>
            <p className="text-gray-500 text-sm mt-1">ফলাফল প্রসেস করুন, মেধাক্রম দেখুন এবং প্রিন্ট করুন</p>
          </div>
          <Link href="/dashboard/exams" className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition">
            <ArrowLeft size={18} /> ফিরে যান
          </Link>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
            <CheckCircle2 size={20} /> {successMsg}
          </div>
        )}

        {/* ফিল্টার প্যানেল */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">পরীক্ষা নির্বাচন করুন</label>
              <select className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
                <option value="">-- পরীক্ষা --</option>
                {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">ক্লাস/জামাত</label>
              <select className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                <option value="">-- ক্লাস --</option>
                {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">সেকশন/শাখা</label>
              <select className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId}>
                <option value="">-- শাখা --</option>
                {availableSections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button 
              onClick={handleGenerateTabulation} disabled={isGenerating}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-sm disabled:bg-slate-500"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              ট্যাবুলেশন জেনারেট করুন
            </button>
          </div>
        </div>

        {/* সামারি ও অ্যাকশন বাটন */}
        {results.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex gap-4">
              <div className="text-center px-4 border-r">
                <p className="text-xs text-gray-500 font-bold uppercase">মোট পরীক্ষার্থী</p>
                <p className="text-2xl font-black text-gray-800">{results.length}</p>
              </div>
              <div className="text-center px-4 border-r">
                <p className="text-xs text-green-600 font-bold uppercase">উত্তীর্ণ</p>
                <p className="text-2xl font-black text-green-700">{results.filter(r => !r.isFailed).length}</p>
              </div>
              <div className="text-center px-4">
                <p className="text-xs text-red-600 font-bold uppercase">অকৃতকার্য</p>
                <p className="text-2xl font-black text-red-700">{results.filter(r => r.isFailed).length}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition">
                <Printer size={18} /> প্রিন্ট শিট
              </button>
              
              {!selectedExam?.isResultPublished ? (
                <button onClick={handlePublishResult} disabled={isPublishing} className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-md disabled:bg-blue-400">
                  {isPublishing ? <Loader2 className="animate-spin" size={18} /> : <Globe size={18} />}
                  ফলাফল প্রকাশ করুন
                </button>
              ) : (
                <div className="flex items-center gap-2 px-5 py-2 bg-green-50 text-green-700 font-bold rounded-lg border border-green-200">
                  <CheckCircle2 size={18} /> ফলাফল প্রকাশিত
                </div>
              )}
            </div>
          </div>
        )}

        {/* স্ক্রিনে দেখার জন্য ট্যাবুলেশন প্রিভিউ */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-3 border-r border-slate-700 text-center">মেধাক্রম</th>
                    <th className="p-3 border-r border-slate-700">রোল/আইডি</th>
                    <th className="p-3 border-r border-slate-700 min-w-[150px]">নাম</th>
                    {/* সাবজেক্টের কলামগুলো */}
                    {classSubjects.map(sub => (
                      <th key={sub.id} className="p-3 border-r border-slate-700 text-center" title={sub.name}>
                        {sub.name.length > 10 ? sub.name.substring(0, 10) + ".." : sub.name}
                      </th>
                    ))}
                    <th className="p-3 border-r border-slate-700 text-center bg-slate-900">মোট নম্বর</th>
                    <th className="p-3 border-r border-slate-700 text-center bg-slate-900">জিপিএ</th>
                    <th className="p-3 text-center bg-slate-900">গ্রেড</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map(res => (
                    <tr key={res.student.id} className={`border-b border-gray-200 hover:bg-slate-50 ${res.isFailed ? 'bg-red-50/30' : ''}`}>
                      <td className="p-3 border-r text-center font-bold">
                        {res.isFailed ? "-" : <span className="flex items-center justify-center gap-1"><Trophy size={14} className="text-amber-500" /> {res.meritPosition}</span>}
                      </td>
                      <td className="p-3 border-r font-mono font-bold text-gray-600">{res.student.admissionNumber}</td>
                      <td className="p-3 border-r font-medium">{res.student.basicInfo.fullName}</td>
                      
                      {classSubjects.map(sub => (
                        <td key={sub.id} className="p-3 border-r text-center">
                          <div className="font-bold">{res.subjectMarks[sub.id]?.total || 0}</div>
                          <div className={`text-[10px] px-1 rounded inline-block mt-0.5 ${res.subjectMarks[sub.id]?.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>
                            {res.subjectMarks[sub.id]?.grade || "-"}
                          </div>
                        </td>
                      ))}
                      
                      <td className="p-3 border-r text-center font-bold text-blue-800 bg-blue-50/30">{res.totalMarks}</td>
                      <td className="p-3 border-r text-center font-bold bg-blue-50/30">{res.finalGpa.toFixed(2)}</td>
                      <td className="p-3 text-center font-bold bg-blue-50/30">
                        <span className={res.isFailed ? "text-red-600" : "text-green-600"}>{res.finalGrade}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* প্রিন্ট ভিউ (ট্যাবুলেশন শিট) */}
      <div className="hidden print:block w-full bg-white text-black text-[11px]">
        {results.length > 0 && (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 uppercase">মাদ্রাসাতুল উলুম আল-ইসলামিয়া</h1>
              <h2 className="text-lg font-bold mt-1">ফলাফল ও ট্যাবুলেশন শিট (Tabulation Sheet)</h2>
              <p className="mt-1 font-medium text-gray-700">
                পরীক্ষা: {selectedExam?.name} | ক্লাস: {classes.find(c => c.id === selectedClassId)?.name} | শাখা: {availableSections.find(s => s.id === selectedSectionId)?.name}
              </p>
            </div>

            <table className="w-full border-collapse border border-black text-center">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-black p-1">মেধা</th>
                  <th className="border border-black p-1">রোল</th>
                  <th className="border border-black p-1 text-left min-w-[120px]">নাম</th>
                  {classSubjects.map(sub => (
                    <th key={sub.id} className="border border-black p-1 leading-tight">{sub.name}</th>
                  ))}
                  <th className="border border-black p-1">মোট</th>
                  <th className="border border-black p-1">GPA</th>
                  <th className="border border-black p-1">গ্রেড</th>
                </tr>
              </thead>
              <tbody>
                {results.map(res => (
                  <tr key={res.student.id}>
                    <td className="border border-black p-1 font-bold">{res.isFailed ? "-" : res.meritPosition}</td>
                    <td className="border border-black p-1">{res.student.admissionNumber}</td>
                    <td className="border border-black p-1 text-left font-medium truncate max-w-[150px]">{res.student.basicInfo.fullName}</td>
                    
                    {classSubjects.map(sub => (
                      <td key={sub.id} className="border border-black p-1">
                        {res.subjectMarks[sub.id]?.total} <span className="text-[9px] text-gray-500">({res.subjectMarks[sub.id]?.grade})</span>
                      </td>
                    ))}
                    
                    <td className="border border-black p-1 font-bold">{res.totalMarks}</td>
                    <td className="border border-black p-1 font-bold">{res.finalGpa.toFixed(2)}</td>
                    <td className="border border-black p-1 font-bold">{res.finalGrade}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end mt-12 pt-4">
              <div className="text-center"><div className="border-t border-black w-32 mb-1"></div><p>শ্রেণি শিক্ষক</p></div>
              <div className="text-center"><div className="border-t border-black w-32 mb-1"></div><p>পরীক্ষা নিয়ন্ত্রক</p></div>
              <div className="text-center"><div className="border-t border-black w-32 mb-1"></div><p>অধ্যক্ষ / মুহতামিম</p></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}