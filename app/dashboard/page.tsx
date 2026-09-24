// File: app/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "../../lib/firebase/config";
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  TrendingUp, 
  UserPlus, 
  CreditCard, 
  FileSignature, 
  ArrowRight,
  Loader2,
  CalendarDays
} from "lucide-react";

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  todaysIncome: number;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalStaff: 0,
    todaysIncome: 0,
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // ১. মোট সক্রিয় শিক্ষার্থী গণনা
        const studentsSnap = await getDocs(query(collection(db, "students"), where("status", "==", "active")));
        const totalStudents = studentsSnap.size;

        // ২. মোট সক্রিয় স্টাফ গণনা
        const staffSnap = await getDocs(query(collection(db, "staffs"), where("status", "==", "active")));
        const totalStaff = staffSnap.size;

        // ৩. আজকের মোট আয় হিসাব করা
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const transSnap = await getDocs(collection(db, "transactions"));
        let todaysIncome = 0;
        transSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.date && data.date.startsWith(today) && data.status === "completed") {
            todaysIncome += data.netAmount || 0;
          }
        });

        setStats({ totalStudents, totalStaff, todaysIncome });

        // ৪. সর্বশেষ ভর্তি হওয়া ৫ জন শিক্ষার্থীর তালিকা
        const recentSnap = await getDocs(query(collection(db, "students"), orderBy("createdAt", "desc"), limit(5)));
        setRecentStudents(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-blue-600">
        <Loader2 className="animate-spin mb-4" size={40} />
        <p className="font-medium text-gray-500">ড্যাশবোর্ড প্রস্তুত হচ্ছে...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      
      {/* ওয়েলকাম হেডার */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ড্যাশবোর্ড ওভারভিউ</h1>
        <p className="text-gray-500 mt-1">প্রতিষ্ঠানের সার্বিক অবস্থার এক-নজর সারসংক্ষেপ</p>
      </div>

      {/* স্ট্যাটাস কার্ডস (Statistics Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* মোট শিক্ষার্থী */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">মোট শিক্ষার্থী</p>
            <h2 className="text-3xl font-black text-gray-800">{stats.totalStudents} <span className="text-lg font-medium text-gray-500">জন</span></h2>
          </div>
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Users size={28} />
          </div>
        </div>

        {/* মোট স্টাফ */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-purple-200 transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">শিক্ষক ও স্টাফ</p>
            <h2 className="text-3xl font-black text-gray-800">{stats.totalStaff} <span className="text-lg font-medium text-gray-500">জন</span></h2>
          </div>
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <GraduationCap size={28} />
          </div>
        </div>

        {/* আজকের আয় */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-green-200 transition">
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">আজকের আয় (ফি)</p>
            <h2 className="text-3xl font-black text-gray-800">৳ {stats.todaysIncome.toLocaleString('bn-BD')}</h2>
          </div>
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet size={28} />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* দ্রুত কাজের শর্টকাট (Quick Actions) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            দ্রুত অ্যাকশন
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            <Link href="/dashboard/students/add" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-blue-300 transition group">
              <div className="bg-blue-50 text-blue-600 p-2 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition"><UserPlus size={20} /></div>
              <div className="font-bold text-gray-700">নতুন ভর্তি</div>
            </Link>
            
            <Link href="/dashboard/accounting/fees" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-green-300 transition group">
              <div className="bg-green-50 text-green-600 p-2 rounded-lg group-hover:bg-green-600 group-hover:text-white transition"><CreditCard size={20} /></div>
              <div className="font-bold text-gray-700">ফি গ্রহণ করুন</div>
            </Link>

            <Link href="/dashboard/exams/marks-entry" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-orange-300 transition group">
              <div className="bg-orange-50 text-orange-600 p-2 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition"><FileSignature size={20} /></div>
              <div className="font-bold text-gray-700">নম্বর এন্ট্রি করুন</div>
            </Link>

            <Link href="/dashboard/classes/routine-settings" className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-purple-300 transition group">
              <div className="bg-purple-50 text-purple-600 p-2 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition"><CalendarDays size={20} /></div>
              <div className="font-bold text-gray-700">রুটিন ম্যানেজ</div>
            </Link>
          </div>
        </div>

        {/* সাম্প্রতিক ভর্তি হওয়া শিক্ষার্থীদের তালিকা */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Users size={20} className="text-blue-600" />
              সাম্প্রতিক ভর্তি
            </h3>
            <Link href="/dashboard/students" className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1">
              সব দেখুন <ArrowRight size={16} />
            </Link>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-4 font-medium text-gray-600">শিক্ষার্থীর নাম</th>
                  <th className="p-4 font-medium text-gray-600">আইডি/রোল</th>
                  <th className="p-4 font-medium text-gray-600">ক্লাস</th>
                  <th className="p-4 font-medium text-gray-600">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-500">এখনো কোনো শিক্ষার্থী ভর্তি হয়নি</td>
                  </tr>
                ) : (
                  recentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-gray-800">{student.basicInfo?.fullName}</td>
                      <td className="p-4 font-mono text-gray-600">{student.admissionNumber}</td>
                      <td className="p-4 text-gray-700">{student.academicInfo?.classId}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {student.status === 'active' ? 'সক্রিয়' : 'অসম্পূর্ণ'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}