// File: app/dashboard/attendance/students/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config";
import { ClassInfo, Section } from "../../../../types/class";
import { Student } from "../../../../types/student";
import { 
  Users, Calendar as CalendarIcon, CheckCircle, XCircle, Clock, Save, 
  Loader2, CheckCircle2, Search, AlertCircle, Coffee
} from "lucide-react";

// উপস্থিতির স্ট্যাটাস টাইপ
type AttendanceStatus = "present" | "absent" | "leave" | "late";

interface AttendanceRecord {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  status: AttendanceStatus;
}

export default function StudentAttendancePage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [availableSections, setAvailableSections] = useState<Section[]>([]);
  
  // ফিল্টার স্টেট
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // আজকের তারিখ ডিফল্ট

  // ডেটা স্টেট
  const [students, setStudents] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ১. ক্লাস ফেচ করা
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const classSnap = await getDocs(query(collection(db, "classes"), orderBy("orderIndex", "asc")));
        setClasses(classSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ClassInfo[]);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };
    fetchClasses();
  }, []);

  // ২. ক্লাস পরিবর্তন হলে সেকশন আপডেট
  useEffect(() => {
    if (!selectedClassId) {
      setAvailableSections([]);
      setSelectedSectionId("");
      return;
    }
    const selectedClass = classes.find(c => c.id === selectedClassId);
    if (selectedClass) {
      setAvailableSections(selectedClass.sections || []);
      setSelectedSectionId(selectedClass.sections?.[0]?.id || "");
    }
  }, [selectedClassId, classes]);

  // ৩. শিক্ষার্থী ও আগের উপস্থিতি খোঁজা
  const handleSearch = async () => {
    if (!selectedClassId || !selectedSectionId || !selectedDate) {
      alert("ক্লাস, শাখা এবং তারিখ নির্বাচন করুন।");
      return;
    }

    setIsLoading(true);
    setSuccessMsg("");

    try {
      // শিক্ষার্থী ফেচ করা
      const studentQ = query(
        collection(db, "students"),
        where("academicInfo.classId", "==", classes.find(c => c.id === selectedClassId)?.name),
        where("status", "==", "active")
      );
      const studentSnap = await getDocs(studentQ);
      let studentList = studentSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[];
      
      const sectionName = availableSections.find(s => s.id === selectedSectionId)?.name;
      if (sectionName) {
        studentList = studentList.filter(s => s.academicInfo.sectionId === sectionName);
      }
      studentList.sort((a, b) => a.admissionNumber.localeCompare(b.admissionNumber));

      // ঐ দিনের আগের উপস্থিতি ফেচ করা (যদি আগে সেভ করা থাকে)
      const attendanceSnap = await getDocs(query(
        collection(db, "student_attendance"),
        where("classId", "==", selectedClassId),
        where("sectionId", "==", selectedSectionId),
        where("date", "==", selectedDate)
      ));
      
      const existingRecords = new Map();
      attendanceSnap.docs.forEach(doc => {
        existingRecords.set(doc.data().studentId, doc.data().status);
      });

      // উপস্থিতির রেকর্ড তৈরি (ডিফল্ট: present)
      const records: AttendanceRecord[] = studentList.map(student => ({
        studentId: student.id!,
        studentName: student.basicInfo.fullName,
        admissionNumber: student.admissionNumber,
        status: existingRecords.get(student.id) || "present" // ক্যাটালগ অনুযায়ী ডিফল্ট 'present'
      }));

      setStudents(records);
    } catch (error) {
      alert("ডেটা আনতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  // ৪. স্ট্যাটাস পরিবর্তন হ্যান্ডলার
  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setStudents(students.map(s => s.studentId === studentId ? { ...s, status: newStatus } : s));
  };

  // ৫. বাল্ক অ্যাকশন (সবাই উপস্থিত / ছুটি)
  const handleBulkAction = (status: AttendanceStatus) => {
    setStudents(students.map(s => ({ ...s, status })));
  };

  // ৬. উপস্থিতি সেভ করা (Batch Write)
  const handleSaveAttendance = async () => {
    if (students.length === 0) return;
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const batch = writeBatch(db);

      students.forEach(record => {
        // ইউনিক আইডি: তারিখ_স্টুডেন্টআইডি
        const docId = `${selectedDate}_${record.studentId}`;
        const ref = doc(db, "student_attendance", docId);
        
        batch.set(ref, {
          studentId: record.studentId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          date: selectedDate,
          status: record.status,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      setSuccessMsg(`${selectedDate} তারিখের হাজিরা সফলভাবে সংরক্ষিত হয়েছে!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("হাজিরা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  };

  // স্ট্যাটাস অনুযায়ী রং নির্ধারণ
  const getStatusColor = (status: AttendanceStatus, isSelected: boolean) => {
    if (!isSelected) return "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100";
    switch (status) {
      case "present": return "bg-green-100 text-green-700 border-green-500 font-bold shadow-sm";
      case "absent": return "bg-red-100 text-red-700 border-red-500 font-bold shadow-sm";
      case "leave": return "bg-purple-100 text-purple-700 border-purple-500 font-bold shadow-sm";
      case "late": return "bg-orange-100 text-orange-700 border-orange-500 font-bold shadow-sm";
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users size={24} className="text-indigo-600" />
          শিক্ষার্থী হাজিরা (Attendance)
        </h1>
        <p className="text-gray-500 text-sm mt-1">প্রতিদিনের হাজিরা গ্রহণ এবং ছুটির রেকর্ড হালনাগাদ করুন</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* ফিল্টার প্যানেল */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">তারিখ</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarIcon size={16} className="text-gray-400" />
              </div>
              <input 
                type="date" 
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">ক্লাস/জামাত</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">-- ক্লাস নির্বাচন --</option>
              {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1">সেকশন/শাখা</label>
            <select className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)} disabled={!selectedClassId}>
              <option value="">-- শাখা নির্বাচন --</option>
              {availableSections.map(sec => <option key={sec.id} value={sec.id}>{sec.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={handleSearch} disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition shadow-sm h-[38px]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
              শিক্ষার্থী খুঁজুন
            </button>
          </div>
        </div>
      </div>

      {/* হাজিরা প্যানেল */}
      {students.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          
          <div className="p-4 border-b bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="font-bold text-gray-800">হাজিরা শীট: {students.length} জন</h3>
              <p className="text-xs text-gray-500 mt-0.5">ডিফল্টভাবে সবাইকে উপস্থিত দেখানো হয়েছে</p>
            </div>
            
            {/* বাল্ক অ্যাকশন বাটন */}
            <div className="flex gap-2">
              <button onClick={() => handleBulkAction("present")} className="text-xs font-bold px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition flex items-center gap-1.5">
                <CheckCircle size={14} /> সবাইকে উপস্থিত দিন
              </button>
              <button onClick={() => handleBulkAction("leave")} className="text-xs font-bold px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 transition flex items-center gap-1.5">
                <Coffee size={14} /> আজ সবার ছুটি
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm border-b border-gray-200">
                  <th className="p-4 w-24 text-center font-bold">রোল/আইডি</th>
                  <th className="p-4 font-bold">শিক্ষার্থীর নাম</th>
                  <th className="p-4 text-center font-bold w-[400px]">হাজিরার স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.studentId} className="border-b border-gray-100 hover:bg-slate-50 transition">
                    <td className="p-4 text-center font-mono text-sm font-bold text-gray-600">{student.admissionNumber}</td>
                    <td className="p-4 text-sm font-medium text-gray-900">{student.studentName}</td>
                    
                    {/* কাস্টম রেডিও বাটন ডিজাইন */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleStatusChange(student.studentId, "present")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1.5 transition-all ${getStatusColor("present", student.status === "present")}`}
                        >
                          <CheckCircle size={14} /> উপস্থিত
                        </button>
                        
                        <button 
                          onClick={() => handleStatusChange(student.studentId, "absent")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1.5 transition-all ${getStatusColor("absent", student.status === "absent")}`}
                        >
                          <XCircle size={14} /> অনুপস্থিত
                        </button>

                        <button 
                          onClick={() => handleStatusChange(student.studentId, "late")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1.5 transition-all ${getStatusColor("late", student.status === "late")}`}
                        >
                          <Clock size={14} /> বিলম্ব
                        </button>

                        <button 
                          onClick={() => handleStatusChange(student.studentId, "leave")}
                          className={`flex-1 py-1.5 px-2 rounded border text-xs flex items-center justify-center gap-1.5 transition-all ${getStatusColor("leave", student.status === "leave")}`}
                        >
                          <Coffee size={14} /> ছুটি
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* সেভ বাটন */}
          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button 
              onClick={handleSaveAttendance} disabled={isSaving}
              className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-indigo-700 transition disabled:bg-indigo-400"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "হাজিরা সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}