"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { Student } from "../../../types/student";
import { 
  Search, 
  UserPlus, 
  Eye, 
  CreditCard, 
  CalendarCheck, 
  AlertCircle, 
  CheckCircle2,
  Filter
} from "lucide-react";

export default function StudentsListPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফিল্টার স্টেটসমূহ
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "incomplete">("all");

  // রিয়েল-টাইম ডেটা সিঙ্কিং (Firebase onSnapshot)
  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      
      setStudents(studentData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // সার্চ ও ফিল্টারিং লজিক (নাম, আইডি, ফোন নম্বর ও শ্রেণি দিয়ে তাৎক্ষণিক খোঁজা)
  const filteredStudents = students.filter((student) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      student.basicInfo?.fullName?.toLowerCase().includes(term) ||
      student.admissionNumber?.toLowerCase().includes(term) ||
      student.familyInfo?.guardianPhone?.includes(term);

    const matchesClass = 
      selectedClass === "all" || student.academicInfo?.classId === selectedClass;

    const matchesStatus = 
      statusFilter === "all" || student.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* হেডার ও অ্যাকশন বোতাম */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">শিক্ষার্থী তালিকা</h1>
          <p className="text-gray-500 text-sm mt-0.5">প্রতিষ্ঠানের সকল শিক্ষার্থীর তথ্য ও দ্রুত একশন প্যানেল</p>
        </div>
        <Link 
          href="/dashboard/students/admission"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <UserPlus size={18} />
          নতুন ভর্তি
        </Link>
      </div>

      {/* সার্চ ও ফিল্টার বার */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        {/* সার্চ ইনপুট */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="নাম, আইডি বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* শ্রেণি ফিল্টার */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-400 hidden sm:block" />
          <select 
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">সব শ্রেণি/বিভাগ</option>
            <option value="class-1">মক্তব / নার্সারি</option>
            <option value="class-2">হিফজুল কুরআন</option>
            <option value="class-3">কিতাব বিভাগ (১ম বর্ষ)</option>
          </select>
        </div>

        {/* ভর্তি স্ট্যাটাস ফিল্টার (অসম্পূর্ণ ভর্তি আলাদা করার সুবিধা) */}
        <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50 text-sm">
          <button 
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-md transition ${statusFilter === "all" ? "bg-white shadow text-blue-600 font-medium" : "text-gray-600"}`}
          >
            সকল
          </button>
          <button 
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1 rounded-md transition ${statusFilter === "active" ? "bg-white shadow text-green-600 font-medium" : "text-gray-600"}`}
          >
            সক্রিয়
          </button>
          <button 
            onClick={() => setStatusFilter("incomplete")}
            className={`px-3 py-1 rounded-md transition ${statusFilter === "incomplete" ? "bg-white shadow text-amber-600 font-medium" : "text-gray-600"}`}
          >
            অসম্পূর্ণ
          </button>
        </div>
      </div>

      {/* শিক্ষার্থী টেবিল ভিউ */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="p-4">আইডি/রোল</th>
                <th className="p-4">শিক্ষার্থীর নাম</th>
                <th className="p-4">শ্রেণি/বিভাগ</th>
                <th className="p-4">অভিভাবক ও ফোন</th>
                <th className="p-4">ভর্তি স্ট্যাটাস</th>
                <th className="p-4 text-center">দ্রুত অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    শিক্ষার্থীদের তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    কোনো শিক্ষার্থীর তথ্য পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-medium text-slate-800">
                      #{student.admissionNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{student.basicInfo?.fullName}</div>
                      <div className="text-xs text-gray-500">{student.basicInfo?.gender === "male" ? "ছাত্র" : "ছাত্রী"}</div>
                    </td>
                    <td className="p-4 text-gray-600">
                      {student.academicInfo?.classId}
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{student.familyInfo?.fatherName}</div>
                      <div className="text-xs text-gray-500">{student.familyInfo?.guardianPhone}</div>
                    </td>
                    <td className="p-4">
                      {student.status === "active" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 size={12} />
                          সক্রিয়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle size={12} />
                          অসম্পূর্ণ ভর্তি
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      {/* এক ক্লিকে শর্টকাট বোতামসমূহ */}
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/dashboard/students/${student.id}`}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition" 
                          title="প্রোফাইল দেখুন"
                        >
                          <Eye size={17} />
                        </Link>
                        <Link 
                          href={`/dashboard/accounting/fees?studentId=${student.id}`}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition" 
                          title="ফি গ্রহণ করুন"
                        >
                          <CreditCard size={17} />
                        </Link>
                        <Link 
                          href={`/dashboard/attendance?studentId=${student.id}`}
                          className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition" 
                          title="উপস্থিতি দেখুন"
                        >
                          <CalendarCheck size={17} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}