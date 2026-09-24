"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { Staff } from "../../../types/staff";
import { 
  Search, 
  UserPlus, 
  WalletCards, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock 
} from "lucide-react";

export default function StaffDirectoryPage() {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ফায়ারবেস থেকে রিয়েল-টাইম স্টাফ ডেটা ফেচ করা
  useEffect(() => {
    const q = query(collection(db, "staffs"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Staff[];
      
      setStaffList(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredStaff = staffList.filter((staff) =>
    staff.personalInfo.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    staff.personalInfo.phone.includes(searchTerm)
  );

  // তিন রঙের ব্যাজ তৈরি করার হেল্পার ফাংশন[cite: 1]
  const getSalaryBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={12} /> পরিশোধিত
          </span>
        );
      case "due":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={12} /> বকেয়া
          </span>
        );
      case "advance":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={12} /> অগ্রিম
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* হেডার */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">শিক্ষক ও স্টাফ তালিকা</h1>
          <p className="text-gray-500 text-sm mt-0.5">প্রতিষ্ঠানের সকল কর্মকর্তা ও কর্মচারীদের প্রোফাইল এবং বেতন অবস্থা</p>
        </div>
        <Link 
          href="/dashboard/staff/add"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition shadow-sm"
        >
          <UserPlus size={18} />
          নতুন স্টাফ যুক্ত করুন
        </Link>
      </div>

      {/* সার্চ বার */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="নাম, আইডি বা ফোন নম্বর দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* স্টাফ টেবিল */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-200 text-gray-600 font-medium">
                <th className="p-4">আইডি</th>
                <th className="p-4">নাম ও পদবি</th>
                <th className="p-4">যোগাযোগ</th>
                <th className="p-4">মূল বেতন</th>
                <th className="p-4">বেতন অবস্থা (বর্তমান মাস)</th>
                <th className="p-4 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">ডেটা লোড হচ্ছে...</td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">কোনো স্টাফের তথ্য পাওয়া যায়নি।</td>
                </tr>
              ) : (
                filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-medium text-slate-800">
                      #{staff.employeeId}
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-gray-900">{staff.personalInfo.fullName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{staff.personalInfo.designation}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-gray-900">{staff.personalInfo.phone}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-700">
                      ৳ {staff.salaryInfo.basicSalary.toLocaleString('bn-BD')}
                    </td>
                    <td className="p-4">
                      {/* ক্যাটালগের রিকোয়ারমেন্ট অনুযায়ী তিন রঙের ব্যাজ[cite: 1] */}
                      {getSalaryBadge(staff.salaryInfo.currentStatus)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link 
                          href={`/dashboard/staff/${staff.id}`}
                          className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition" 
                          title="প্রোফাইল দেখুন"
                        >
                          <Eye size={17} />
                        </Link>
                        {/* বেতন প্রদানের পেজে যাওয়ার শর্টকাট */}
                        <Link 
                          href={`/dashboard/staff/payroll?staffId=${staff.id}`}
                          className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition flex items-center gap-1" 
                          title="বেতন প্রদান করুন"
                        >
                          <WalletCards size={17} />
                          <span className="text-xs font-medium hidden md:block">বেতন দিন</span>
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