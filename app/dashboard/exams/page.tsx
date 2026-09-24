"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { Exam } from "../../../types/exam";
import { 
  FileSignature, 
  Settings2, 
  LayoutGrid, 
  Users, 
  ClipboardList, 
  Award,
  PlusCircle,
  CalendarDays,
  FileCheck2,
  Printer,
  FileSpreadsheet
} from "lucide-react";

export default function ExamDashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  // ফায়ারবেস থেকে পরীক্ষার তালিকা ফেচ করা
  useEffect(() => {
    const q = query(collection(db, "exams"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const examData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Exam[];
      
      setExams(examData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">পরীক্ষা ও ফলাফল</h1>
          <p className="text-gray-500 text-sm mt-1">পরীক্ষার রুটিন, সিট প্ল্যান, নম্বর এন্ট্রি এবং মার্কশিট পরিচালনা</p>
        </div>
        <Link 
          href="/dashboard/exams/create"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-bold transition shadow-md"
        >
          <PlusCircle size={20} />
          নতুন পরীক্ষা তৈরি
        </Link>
      </div>

      {/* কুইক অ্যাকশন মেনু (ক্যাটালগ অনুযায়ী) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/dashboard/exams/grading-setup" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-400 hover:shadow-md transition flex items-center gap-3 group">
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition"><Settings2 size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">গ্রেডিং স্কেল</h3>
            <p className="text-xs text-gray-500">মার্কস ও জিপিএ সেটআপ</p>
          </div>
        </Link>
        
        <Link href="/dashboard/exams/rooms" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-purple-400 hover:shadow-md transition flex items-center gap-3 group">
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition"><LayoutGrid size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">পরীক্ষার কক্ষ</h3>
            <p className="text-xs text-gray-500">হলরুম ও আসনসংখ্যা</p>
          </div>
        </Link>

        <Link href="/dashboard/exams/seat-plan" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-orange-400 hover:shadow-md transition flex items-center gap-3 group">
          <div className="bg-orange-50 text-orange-600 p-2.5 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition"><Users size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">সিট প্ল্যান তৈরি</h3>
            <p className="text-xs text-gray-500">আসন বণ্টন ও প্রিন্ট</p>
          </div>
        </Link>

        <Link href="/dashboard/exams/marks-entry" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-green-400 hover:shadow-md transition flex items-center gap-3 group">
          <div className="bg-green-50 text-green-600 p-2.5 rounded-lg group-hover:bg-green-600 group-hover:text-white transition"><FileSignature size={24} /></div>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">নম্বর এন্ট্রি</h3>
            <p className="text-xs text-gray-500">বিষয়ভিত্তিক রেজাল্ট</p>
          </div>
        </Link>

        <Link href="/dashboard/exams/results" className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-red-400 hover:shadow-md transition flex items-center gap-3 group">
  <div className="bg-red-50 text-red-600 p-2.5 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">
    <FileSpreadsheet size={24} />
  </div>
  <div>
    <h3 className="font-bold text-gray-800 text-sm">ফলাফল ও শিট</h3>
    <p className="text-xs text-gray-500">ট্যাবুলেশন ও প্রকাশ</p>
  </div>
</Link>
      </div>

      {/* সাম্প্রতিক পরীক্ষার তালিকা */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b bg-slate-50 flex items-center gap-2">
          <ClipboardList className="text-slate-600" size={20} />
          <h2 className="text-lg font-bold text-gray-800">চলমান ও সাম্প্রতিক পরীক্ষাসমূহ</h2>
        </div>
        
        <div className="p-5">
          {loading ? (
            <div className="text-center text-gray-500 py-8">ডেটা লোড হচ্ছে...</div>
          ) : exams.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <FileCheck2 size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-lg font-medium text-gray-700">কোনো পরীক্ষা পাওয়া যায়নি</p>
              <p className="text-sm mt-1">ডানপাশের বাটন থেকে নতুন পরীক্ষা তৈরি করুন</p>
            </div>
          ) : (
            <div className="space-y-4">
              {exams.map((exam) => (
                <div key={exam.id} className="flex flex-col md:flex-row items-center justify-between p-4 border rounded-xl hover:border-blue-300 transition gap-4 group">
                  <div className="flex items-start gap-4 w-full md:w-auto">
                    <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
                      <CalendarDays size={28} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{exam.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-medium">{exam.term}</span>
                        <span>•</span>
                        <span>শুরুর তারিখ: {new Date(exam.examDate).toLocaleDateString("bn-BD")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold mr-2 ${
                      exam.status === 'ongoing' ? 'bg-amber-100 text-amber-700' : 
                      exam.status === 'completed' ? 'bg-green-100 text-green-700' : 
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {exam.status === 'ongoing' ? 'চলমান' : exam.status === 'completed' ? 'সম্পন্ন' : 'আসন্ন'}
                    </span>
                    
                    {/* ফলাফল প্রকাশের স্ট্যাটাস[cite: 1] */}
                    <span className={`px-3 py-1 rounded-full text-xs font-bold mr-2 border ${
                      exam.isResultPublished ? 'border-green-200 text-green-700' : 'border-gray-200 text-gray-500'
                    }`}>
                      {exam.isResultPublished ? 'ফলাফল প্রকাশিত' : 'ফলাফল অপ্রকাশিত'}
                    </span>

                    <button className="p-2 text-gray-500 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition" title="অ্যাডমিট কার্ড প্রিন্ট করুন">
                      <Printer size={18} />
                    </button>
                    <Link href={`/dashboard/exams/${exam.id}`} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition">
                      ম্যানেজ করুন
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}