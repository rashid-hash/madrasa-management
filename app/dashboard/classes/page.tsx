"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { ClassInfo } from "../../../types/class";
import { 
  BookOpen, 
  Users, 
  Plus, 
  Settings, 
  CalendarClock,
  GripVertical,
  GraduationCap
} from "lucide-react";

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // ফায়ারবেস থেকে রিয়েল-টাইম ক্লাস ডেটা ফেচ করা (orderIndex অনুযায়ী সাজানো)[cite: 1]
  useEffect(() => {
    const q = query(collection(db, "classes"), orderBy("orderIndex", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const classData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as ClassInfo[];
      
      setClasses(classData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-6">
      
      {/* হেডার ও অ্যাকশন বোতাম */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ক্লাস ও রুটিন ব্যবস্থাপনা</h1>
          <p className="text-gray-500 text-sm mt-0.5">প্রতিষ্ঠানের সকল ক্লাস, শাখা, পাঠ্যবই এবং রুটিন পরিচালনা করুন</p>
        </div>
        <div className="flex gap-3">
          <Link 
            href="/dashboard/classes/routine-settings"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            <Settings size={18} />
            রুটিন সেটিংস
          </Link>
          <Link 
            href="/dashboard/classes/add"
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-sm"
          >
            <Plus size={18} />
            নতুন ক্লাস তৈরি
          </Link>
        </div>
      </div>

      {/* ক্লাস তালিকা (গ্রিড ভিউ) */}
      {loading ? (
        <div className="p-12 text-center text-gray-500 font-medium">ক্লাসের তথ্য লোড হচ্ছে...</div>
      ) : classes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <GraduationCap className="mx-auto text-gray-400 mb-3" size={48} />
          <h3 className="text-lg font-bold text-gray-800 mb-1">কোনো ক্লাস পাওয়া যায়নি</h3>
          <p className="text-gray-500 mb-4">আপনার প্রতিষ্ঠানে এখনো কোনো ক্লাস বা জামাত তৈরি করা হয়নি।</p>
          <Link href="/dashboard/classes/add" className="inline-flex items-center gap-2 bg-blue-60 text-blue-700 font-medium bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition">
            <Plus size={18} /> প্রথম ক্লাসটি তৈরি করুন
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {classes.map((cls) => {
            // মোট আসনসংখ্যা হিসাব করা
            const totalCapacity = cls.sections?.reduce((sum, sec) => sum + sec.capacity, 0) || 0;
            const booksCount = cls.subjects?.length || 0;
            const sectionsCount = cls.sections?.length || 0;

            return (
              <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition group overflow-hidden flex flex-col">
                
                {/* কার্ড হেডার */}
                <div className="p-5 border-b border-gray-100 flex items-start justify-between bg-slate-50/50">
                  <div className="flex items-start gap-3">
                    <div className="cursor-move text-gray-400 hover:text-gray-600 p-1 -ml-2 transition" title="ক্রম পরিবর্তন করতে ড্র্যাগ করুন">
                      <GripVertical size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 leading-tight">{cls.name}</h3>
                      <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100">
                        {cls.department} বিভাগ
                      </span>
                    </div>
                  </div>
                  {/* বইয়ের সংখ্যার ব্যাজ[cite: 1] */}
                  <div className="flex flex-col items-end">
                    <span className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-bold border border-purple-100" title="নির্ধারিত পাঠ্যবই">
                      <BookOpen size={14} /> {booksCount} টি বই
                    </span>
                  </div>
                </div>

                {/* কার্ড বডি (সেকশন ও আসন) */}
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-4">
                    <span className="flex items-center gap-1.5">
                      <Users size={16} className="text-gray-400"/> 
                      মোট শাখা: <strong className="text-gray-900">{sectionsCount}</strong>
                    </span>
                    <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                      মোট আসন: {totalCapacity}
                    </span>
                  </div>

                  {/* শাখাগুলোর সংক্ষিপ্ত তালিকা */}
                  {sectionsCount > 0 && (
                    <div className="space-y-2 mt-2">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">শাখা ও দায়িত্বপ্রাপ্ত শিক্ষক</p>
                      {cls.sections.slice(0, 3).map((sec, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm p-2 rounded-lg border border-gray-100 bg-gray-50/50">
                          <span className="font-medium text-gray-800">{sec.name}</span>
                          <span className="text-gray-600 text-xs truncate max-w-[120px]">{sec.classTeacherName}</span>
                        </div>
                      ))}
                      {sectionsCount > 3 && (
                        <div className="text-center text-xs text-blue-600 font-medium pt-1">
                          + আরও {sectionsCount - 3} টি শাখা
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* কার্ড ফুটার (অ্যাকশন বাটন) */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-2">
                  <Link 
                    href={`/dashboard/classes/${cls.id}`}
                    className="flex-1 flex justify-center items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 hover:text-blue-600 transition"
                  >
                    <Settings size={16} /> ক্লাস ম্যানেজ
                  </Link>
                  <Link 
                    href={`/dashboard/classes/${cls.id}/routine`}
                    className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
                  >
                    <CalendarClock size={16} /> রুটিন তৈরি
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}