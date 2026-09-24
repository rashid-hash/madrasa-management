// File: app/dashboard/exams/marks-entry/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { Exam, GradingScale } from "../../../../types/exam";
import { ClassInfo, Section, Subject } from "../../../../types/class";
import { Student } from "../../../../types/student";
import { 
  ArrowLeft, Save, Loader2, FileSignature, CheckCircle2, Search, Calculator, AlertCircle
} from "lucide-react";

// নম্বর এন্ট্রির জন্য লোকাল স্টেট টাইপ
interface MarkEntry {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  writtenMark: number;
  mcqMark: number;
  attendanceMark: number;
  totalSubjectMark: number;
  grade: string;
  point: number;
}

export default function MarksEntryPage() {
  // ফিল্টার ডেটা স্টেট
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [gradingScales, setGradingScales] = useState<GradingScale[]>([]);
  
  // নির্বাচিত ফিল্টার স্টেট
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedScaleId, setSelectedScaleId] = useState("");

  // ডায়নামিক অপশনস
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  // শিক্ষার্থী ও নম্বরের স্টেট
  const [marksData, setMarksData] = useState<MarkEntry[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ১. প্রাথমিক ডেটা ফেচ করা (পরীক্ষা, ক্লাস এবং গ্রেডিং স্কেল)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const examSnap = await getDocs(query(collection(db, "exams"), orderBy("createdAt", "desc")));
        setExams(examSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Exam[]);

        const classSnap = await getDocs(query(collection(db, "classes"), orderBy("orderIndex", "asc")));
        const classList = classSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ClassInfo[];
        setClasses(classList);

        const scaleSnap = await getDocs(query(collection(db, "grading_scales"), orderBy("createdAt", "desc")));
        const scales = scaleSnap.docs.map(d => ({ id: d.id, ...d.data() })) as GradingScale[];
        setGradingScales(scales);
        if(scales.length > 0) setSelectedScaleId(scales[0].id!); // ডিফল্ট স্কেল সিলেক্ট
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchInitialData();
  }, []);

  // ২. ক্লাস পরিবর্তন হলে সেকশন ও বিষয় আপডেট করা
  useEffect(() => {
    if (!selectedClassId) {
      setAvailableSections([]);
      setAvailableSubjects([]);
      setSelectedSectionId("");
      setSelectedSubjectId("");
      return;
    }
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      setAvailableSections(selectedClass.sections || []);
      setAvailableSubjects(selectedClass.subjects || []);
      setSelectedSectionId(selectedClass.sections?.[0]?.id || "");
      setSelectedSubjectId(selectedClass.subjects?.[0]?.id || "");
    }
  }, [selectedClassId, classes]);

  // ৩. শিক্ষার্থী ও আগের নম্বর খোঁজার ফাংশন
  const handleSearch = async () => {
    if (!selectedExamId || !selectedClassId || !selectedSectionId || !selectedSubjectId || !selectedScaleId) {
      alert("দয়া করে উপরের সবগুলো তথ্য সঠিকভাবে নির্বাচন করুন।");
      return;
    }

    setIsLoadingStudents(true);
    setSuccessMsg("");

    try {
      // নির্দিষ্ট ক্লাস ও সেকশনের শিক্ষার্থী আনা
      const studentQ = query(
        collection(db, "students"),
        where("academicInfo.classId", "==", classes.find(c => c.id === selectedClassId)?.name),
        where("status", "==", "active")
      );
      const studentSnap = await getDocs(studentQ);
      let students = studentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[];
      
      // সেকশন ফিল্টার (নাম অনুযায়ী, যেহেতু student মডেলে সেকশন নাম সেভ থাকে)
      const sectionName = availableSections.find(s => s.id === selectedSectionId)?.name;
      if (sectionName) {
        students = students.filter(s => s.academicInfo.sectionId === sectionName);
      }
      
      students.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber));

      // যদি আগে থেকে নম্বর এন্ট্রি করা থাকে, সেগুলোও আনা
      const existingMarksSnap = await getDocs(query(
        collection(db, "exam_marks"),
        where("examId", "==", selectedExamId),
        where("classId", "==", selectedClassId),
        where("sectionId", "==", selectedSectionId),
        where("subjectId", "==", selectedSubjectId)
      ));
      
      const existingMarksMap = new Map();
      existingMarksSnap.docs.forEach(doc => {
        existingMarksMap.set(doc.data().studentId, doc.data());
      });

      // মার্কস ডেটা স্টেট তৈরি
      const newMarksData: MarkEntry[] = students.map(student => {
        const existing = existingMarksMap.get(student.id);
        return {
          studentId: student.id!,
          studentName: student.basicInfo.fullName,
          admissionNumber: student.admissionNumber,
          writtenMark: existing?.writtenMark || 0,
          mcqMark: existing?.mcqMark || 0,
          attendanceMark: existing?.attendanceMark || 0,
          totalSubjectMark: existing?.totalSubjectMark || 0,
          grade: existing?.grade || "-",
          point: existing?.point || 0
        };
      });

      setMarksData(newMarksData);
    } catch (error) {
      console.error(error);
      alert("শিক্ষার্থীদের ডেটা আনতে সমস্যা হয়েছে।");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  // ৪. গ্রেড ক্যালকুলেশন লজিক
  const calculateGrade = (total: number) => {
    const scale = gradingScales.find(s => s.id === selectedScaleId);
    if (!scale) return { grade: "-", point: 0 };

    for (const rule of scale.rules) {
      if (total >= rule.minMarks && total <= rule.maxMarks) {
        return { grade: rule.grade, point: rule.point };
      }
    }
    return { grade: "F", point: 0 };
  };

  // ৫. নম্বর ইনপুট হ্যান্ডলার (রিয়েলটাইম গ্রেড আপডেট)
  const handleMarkChange = (index: number, field: keyof MarkEntry, value: string) => {
    const numValue = value === "" ? 0 : Number(value);
    if (numValue < 0) return; // নেগেটিভ নম্বর বাদ

    const updatedData = [...marksData];
    updatedData[index] = { ...updatedData[index], [field]: numValue };

    // টোটাল এবং গ্রেড স্বয়ংক্রিয় হিসাব[cite: 1]
    const total = updatedData[index].writtenMark + updatedData[index].mcqMark + updatedData[index].attendanceMark;
    updatedData[index].totalSubjectMark = total;
    
    const { grade, point } = calculateGrade(total);
    updatedData[index].grade = grade;
    updatedData[index].point = point;

    setMarksData(updatedData);
  };

  // ৬. ব্যাচ রাইট (ডেটাবেসে সেভ করা)
  const handleSaveMarks = async () => {
    if (marksData.length === 0) return;
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const batch = writeBatch(db);

      marksData.forEach(mark => {
        // ইউনিক ডকুমেন্ট আইডি তৈরি (examId_studentId_subjectId)
        const docId = `${selectedExamId}_${mark.studentId}_${selectedSubjectId}`;
        const markRef = doc(db, "exam_marks", docId);
        
        batch.set(markRef, {
          examId: selectedExamId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          subjectId: selectedSubjectId,
          studentId: mark.studentId,
          writtenMark: mark.writtenMark,
          mcqMark: mark.mcqMark,
          attendanceMark: mark.attendanceMark,
          totalSubjectMark: mark.totalSubjectMark,
          grade: mark.grade,
          point: mark.point,
          updatedAt: new Date().toISOString()
        }, { merge: true }); // আগে থাকলে আপডেট হবে, না থাকলে তৈরি হবে
      });

      await batch.commit();
      setSuccessMsg("সকল শিক্ষার্থীর নম্বর সফলভাবে সংরক্ষিত হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      console.error(error);
      alert("নম্বর সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileSignature size={24} className="text-green-600" />
            বিষয়ভিত্তিক নম্বর এন্ট্রি
          </h1>
          <p className="text-gray-500 text-sm mt-1">শিক্ষার্থীদের লিখিত, এমসিকিউ ও উপস্থিতির নম্বর যুক্ত করুন</p>
        </div>
        <Link 
          href="/dashboard/exams"
          className="flex items-center gap-2 text-gray-600 hover:text-green-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">পরীক্ষা নির্বাচন করুন</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={selectedExamId} onChange={e => setSelectedExamId(e.target.value)}>
              <option value="">-- পরীক্ষা --</option>
              {exams.map(exam => <option key={exam.id} value={exam.id}>{exam.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">ক্লাস/জামাত</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">-- ক্লাস --</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">সেকশন/শাখা</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId}>
              <option value="">-- শাখা --</option>
              {availableSections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">বিষয় (Subject)</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" value={selectedSubjectId} onChange={e => setSelectedSubjectId(e.target.value)} disabled={!selectedClassId}>
              <option value="">-- বিষয় --</option>
              {availableSubjects.map(sub => <option key={sub.id} value={sub.id}>{sub.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">গ্রেডিং স্কেল[cite: 1]</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none bg-green-50 text-green-700 font-medium border-green-200" value={selectedScaleId} onChange={e => setSelectedScaleId(e.target.value)}>
              {gradingScales.map(scale => <option key={scale.id} value={scale.id}>{scale.name}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <button 
            onClick={handleSearch} disabled={isLoadingStudents}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition shadow-sm"
          >
            {isLoadingStudents ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
            শিক্ষার্থী খুঁজুন
          </button>
        </div>
      </div>

      {/* নম্বর এন্ট্রি টেবিল */}
      {marksData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calculator size={18} /> নম্বর এন্ট্রি প্যানেল</h3>
              <p className="text-sm text-gray-500 mt-0.5">মোট পরীক্ষার্থী: <span className="font-bold text-gray-800">{marksData.length} জন</span></p>
            </div>
            
            {/* অটো-গ্রেড অ্যালার্ট */}
            <div className="bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5">
              <AlertCircle size={14} /> গ্রেড স্বয়ংক্রিয়ভাবে হিসাব হচ্ছে
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm border-b border-gray-200">
                  <th className="p-3 w-16 text-center">রোল/আইডি</th>
                  <th className="p-3">শিক্ষার্থীর নাম</th>
                  <th className="p-3 w-28 text-center">লিখিত</th>
                  <th className="p-3 w-28 text-center">এমসিকিউ (MCQ)</th>
                  <th className="p-3 w-28 text-center">উপস্থিতি[cite: 1]</th>
                  <th className="p-3 w-24 text-center font-bold bg-green-50 border-l border-white">মোট</th>
                  <th className="p-3 w-24 text-center font-bold bg-green-50">গ্রেড</th>
                </tr>
              </thead>
              <tbody>
                {marksData.map((student, index) => (
                  <tr key={student.studentId} className="border-b border-gray-100 hover:bg-slate-50 transition">
                    <td className="p-3 text-center font-mono text-sm font-bold text-gray-600">{student.admissionNumber}</td>
                    <td className="p-3 text-sm font-medium text-gray-900">{student.studentName}</td>
                    <td className="p-3">
                      <input type="number" min="0" className="w-full border rounded p-1.5 text-center text-sm focus:ring-2 focus:ring-green-400 outline-none" value={student.writtenMark || ""} onChange={(e) => handleMarkChange(index, "writtenMark", e.target.value)} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" className="w-full border rounded p-1.5 text-center text-sm focus:ring-2 focus:ring-green-400 outline-none" value={student.mcqMark || ""} onChange={(e) => handleMarkChange(index, "mcqMark", e.target.value)} />
                    </td>
                    <td className="p-3">
                      <input type="number" min="0" className="w-full border rounded p-1.5 text-center text-sm focus:ring-2 focus:ring-green-400 outline-none" value={student.attendanceMark || ""} onChange={(e) => handleMarkChange(index, "attendanceMark", e.target.value)} />
                    </td>
                    
                    {/* স্বয়ংক্রিয় হিসাবের ফলাফল[cite: 1] */}
                    <td className="p-3 text-center font-bold text-lg text-green-700 bg-green-50/30 border-l border-white">
                      {student.totalSubjectMark}
                    </td>
                    <td className="p-3 text-center bg-green-50/30">
                      <span className={`inline-block px-2 py-0.5 rounded text-sm font-bold ${student.grade === 'F' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button 
              onClick={handleSaveMarks} disabled={isSaving}
              className="flex items-center gap-2 bg-green-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-green-700 transition disabled:bg-green-400"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "ফলাফল সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}