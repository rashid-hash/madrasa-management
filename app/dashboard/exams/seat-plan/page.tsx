// File: app/dashboard/exams/seat-plan/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy, where } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { Exam, ExamRoom } from "../../../../types/exam";
import { Student } from "../../../../types/student";
import { 
  ArrowLeft, Printer, Loader2, Users, LayoutGrid, CalendarDays, AlertTriangle, CheckCircle2
} from "lucide-react";

// সিট প্ল্যান অ্যালোকেশনের টাইপ
interface RoomAllocation {
  room: ExamRoom;
  allocatedStudents: Student[];
}

export default function SeatPlanPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedExamId, setSelectedExamId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [allocations, setAllocations] = useState<RoomAllocation[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ১. পেজ লোড হলে পরীক্ষা এবং কক্ষের ডেটা আনা
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // আসন্ন ও চলমান পরীক্ষাসমূহ
        const examQ = query(collection(db, "exams"), orderBy("createdAt", "desc"));
        const examSnap = await getDocs(examQ);
        const examList = examSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Exam[];
        setExams(examList.filter(e => e.status !== "completed"));

        // সক্রিয় কক্ষসমূহ
        const roomQ = query(collection(db, "exam_rooms"), where("status", "==", "active"));
        const roomSnap = await getDocs(roomQ);
        const roomList = roomSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExamRoom[];
        setRooms(roomList);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  // ২. পরীক্ষা সিলেক্ট করলে সংশ্লিষ্ট ক্লাসের শিক্ষার্থীদের ডেটা আনা
  useEffect(() => {
    const fetchStudentsForExam = async () => {
      if (!selectedExamId) {
        setStudents([]);
        setAllocations([]);
        return;
      }
      
      const exam = exams.find(e => e.id === selectedExamId);
      if (!exam || !exam.participatingClasses || exam.participatingClasses.length === 0) return;

      setIsGenerating(true);
      setErrorMsg("");
      setAllocations([]);

      try {
        // ফায়ারবেস থেকে সব সক্রিয় শিক্ষার্থী আনা এবং লোকালি ফিল্টার করা
        const studentQ = query(collection(db, "students"), where("status", "==", "active"));
        const studentSnap = await getDocs(studentQ);
        const allStudents = studentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
        
        // যে ক্লাসগুলো পরীক্ষায় অংশ নিচ্ছে, শুধু তাদের ফিল্টার করা
        const eligibleStudents = allStudents.filter(s => 
          exam.participatingClasses.includes(s.academicInfo.classId)
        );
        
        // রোল/আইডি অনুযায়ী সর্ট করা
        eligibleStudents.sort((a, b) => 
          a.admissionNumber.localeCompare(b.admissionNumber)
        );

        setStudents(eligibleStudents);
      } catch (error) {
        setErrorMsg("শিক্ষার্থীদের ডেটা আনতে সমস্যা হয়েছে।");
      } finally {
        setIsGenerating(false);
      }
    };

    fetchStudentsForExam();
  }, [selectedExamId, exams]);

  // ৩. সিট প্ল্যান জেনারেট করার লজিক (Auto Allocation)
  const generateSeatPlan = () => {
    if (students.length === 0) {
      setErrorMsg("এই পরীক্ষায় অংশগ্রহণের জন্য কোনো শিক্ষার্থী পাওয়া যায়নি!");
      return;
    }

    const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
    
    if (students.length > totalCapacity) {
      setErrorMsg(`আসন সংকট! মোট শিক্ষার্থী ${students.length} জন, কিন্তু কক্ষগুলোতে মোট আসন আছে ${totalCapacity} টি। দয়া করে আরও কক্ষ যুক্ত করুন।`);
      return;
    }

    setErrorMsg("");
    let currentStudentIndex = 0;
    const newAllocations: RoomAllocation[] = [];

    // প্রতিটি রুমে ক্যাপাসিটি অনুযায়ী শিক্ষার্থী বসানো
    rooms.forEach(room => {
      if (currentStudentIndex >= students.length) return; // সব শিক্ষার্থী বসানো হয়ে গেলে থামবে
      
      const allocatedStudents = students.slice(currentStudentIndex, currentStudentIndex + room.capacity);
      currentStudentIndex += room.capacity;
      
      newAllocations.push({ room, allocatedStudents });
    });

    setAllocations(newAllocations);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedExam = exams.find(e => e.id === selectedExamId);
  const totalCapacity = rooms.reduce((sum, r) => sum + r.capacity, 0);

  if (loading) return <div className="p-12 text-center text-gray-500">ডেটা লোড হচ্ছে...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* --- স্ক্রিন ভিউ (প্রিন্টের সময় লুকানো থাকবে) --- */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Users size={24} className="text-orange-600" />
              সিট প্ল্যান ও আসন বণ্টন
            </h1>
            <p className="text-gray-500 text-sm mt-1">পরীক্ষা নির্বাচন করে স্বয়ংক্রিয় সিট প্ল্যান তৈরি এবং প্রিন্ট করুন</p>
          </div>
          <Link 
            href="/dashboard/exams"
            className="flex items-center gap-2 text-gray-600 hover:text-orange-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
          >
            <ArrowLeft size={18} /> ফিরে যান
          </Link>
        </div>

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
            <AlertTriangle size={20} /> {errorMsg}
          </div>
        )}

        {/* সিট প্ল্যান কন্ট্রোল প্যানেল */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">পরীক্ষা নির্বাচন করুন *</label>
              <select 
                className="w-full border rounded-lg px-4 py-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none font-medium"
                value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)}
              >
                <option value="">-- চলমান বা আসন্ন পরীক্ষা বেছে নিন --</option>
                {exams.map(exam => (
                  <option key={exam.id} value={exam.id}>{exam.name} ({exam.term})</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button 
                onClick={generateSeatPlan}
                disabled={!selectedExamId || isGenerating || students.length === 0}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:bg-orange-300 font-bold shadow-md"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <LayoutGrid size={20} />}
                সিট প্ল্যান তৈরি করুন
              </button>
            </div>
          </div>
        </div>

        {/* সামারি কার্ড */}
        {selectedExamId && !isGenerating && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
              <p className="text-sm text-blue-600 font-bold mb-1">মোট পরীক্ষার্থী</p>
              <p className="text-3xl font-black text-blue-800">{students.length} <span className="text-lg font-medium">জন</span></p>
            </div>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
              <p className="text-sm text-purple-600 font-bold mb-1">প্রস্তুতকৃত কক্ষ</p>
              <p className="text-3xl font-black text-purple-800">{rooms.length} <span className="text-lg font-medium">টি</span></p>
            </div>
            <div className="bg-green-50 border border-green-100 p-4 rounded-xl">
              <p className="text-sm text-green-600 font-bold mb-1">সর্বমোট আসন</p>
              <p className="text-3xl font-black text-green-800">{totalCapacity} <span className="text-lg font-medium">টি</span></p>
            </div>
          </div>
        )}

        {/* জেনারেটেড সিট প্ল্যান প্রিভিউ */}
        {allocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <CheckCircle2 size={20} /> সফলভাবে সিট প্ল্যান তৈরি হয়েছে
              </div>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg font-medium shadow hover:bg-slate-800 transition"
              >
                <Printer size={18} /> রুটিন ও সিট প্ল্যান প্রিন্ট করুন
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-500 mb-4">নিচে কক্ষ অনুযায়ী শিক্ষার্থীদের তালিকা প্রিভিউ হিসেবে দেখানো হচ্ছে। প্রিন্ট বাটনে ক্লিক করলে এটি সুন্দরভাবে কাগজে প্রিন্ট হওয়ার জন্য প্রস্তুত হবে।</p>
              
              <div className="space-y-6">
                {allocations.map((allocation, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">{allocation.room.roomName}</h3>
                    <p className="text-sm text-gray-500 mb-3">বরাদ্দকৃত শিক্ষার্থী: {allocation.allocatedStudents.length} জন (আসন: {allocation.room.capacity})</p>
                    
                    <div className="flex flex-wrap gap-2">
                      {allocation.allocatedStudents.map(student => (
                        <span key={student.id} className="bg-white border border-gray-200 px-3 py-1.5 rounded text-sm font-medium text-gray-700 shadow-sm">
                          ID: {student.admissionNumber}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- প্রিন্ট ভিউ (শুধুমাত্র প্রিন্ট করার সময় দৃশ্যমান হবে) --- */}
      <div className="hidden print:block w-full bg-white text-black font-sans">
        {allocations.map((allocation, index) => (
          <div key={index} className="mb-8" style={{ pageBreakAfter: "always" }}>
            
            {/* প্রিন্ট হেডার */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-3xl font-bold text-gray-900">মাদ্রাসাতুল উলুম আল-ইসলামিয়া</h1>
              <p className="text-sm mt-1 text-gray-700">পরীক্ষার সিট প্ল্যান (Seat Plan)</p>
              <h2 className="text-xl font-bold mt-2">{selectedExam?.name}</h2>
            </div>

            {/* কক্ষের তথ্য */}
            <div className="flex justify-between items-end border-b border-gray-400 pb-2 mb-6">
              <div>
                <p className="text-2xl font-bold">কক্ষ: {allocation.room.roomName}</p>
                <p className="text-sm text-gray-700 mt-1">কক্ষ পরিদর্শক: _________________________</p>
              </div>
              <div className="text-right">
                <p className="font-medium">মোট পরীক্ষার্থী: {allocation.allocatedStudents.length} জন</p>
              </div>
            </div>

            {/* শিক্ষার্থীদের তালিকা (গ্রিড) */}
            <div className="grid grid-cols-4 gap-4">
              {allocation.allocatedStudents.map((student, i) => (
                <div key={student.id} className="border-2 border-black p-3 text-center rounded">
                  <p className="text-xs text-gray-600 mb-1">{student.academicInfo.classId}</p>
                  <p className="text-lg font-bold">{student.admissionNumber}</p>
                  <p className="text-sm mt-1 truncate">{student.basicInfo.fullName}</p>
                </div>
              ))}
            </div>

            {/* ফাঁকা সিট যদি থাকে */}
            {allocation.allocatedStudents.length < allocation.room.capacity && (
              <div className="mt-4 text-sm text-gray-500 italic">
                * এই কক্ষে আরও {allocation.room.capacity - allocation.allocatedStudents.length} টি আসন ফাঁকা রয়েছে।
              </div>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}