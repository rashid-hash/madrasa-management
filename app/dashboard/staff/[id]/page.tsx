// File: app/dashboard/staff/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { Staff } from "../../../../types/staff";
import { 
  User, 
  Phone, 
  Mail, 
  Briefcase, 
  WalletCards, 
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft
} from "lucide-react";

export default function StaffProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ফায়ারবেস থেকে নির্দিষ্ট স্টাফের ডেটা ফেচ করা
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const docRef = doc(db, "staffs", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStaff({ id: docSnap.id, ...docSnap.data() } as Staff);
        } else {
          setError("স্টাফের কোনো তথ্য পাওয়া যায়নি!");
        }
      } catch (err) {
        setError("ডেটা লোড করতে সমস্যা হচ্ছে।");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStaff();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">প্রোফাইল লোড হচ্ছে...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  if (!staff) return null;

  // বেতনের ব্যাজ জেনারেট করার ফাংশন
  const getSalaryBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            <CheckCircle2 size={16} /> চলতি মাস পরিশোধিত
          </span>
        );
      case "due":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700 border border-red-200">
            <AlertCircle size={16} /> বকেয়া আছে
          </span>
        );
      case "advance":
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Clock size={16} /> অগ্রিম পরিশোধিত
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* ব্যাক বাটন */}
      <div>
        <Link 
          href="/dashboard/staff"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition font-medium"
        >
          <ArrowLeft size={18} />
          তালিকায় ফিরে যান
        </Link>
      </div>

      {/* প্রোফাইল হেডার ও এক-ক্লিক শর্টকাট */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-slate-800 text-white rounded-xl flex items-center justify-center text-3xl font-bold shadow-sm">
            {staff.personalInfo.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{staff.personalInfo.fullName}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded border">ID: {staff.employeeId}</span>
              <span>•</span>
              <span className="font-medium text-gray-700">{staff.personalInfo.designation}</span>
            </div>
          </div>
        </div>

        {/* ক্যাটালগ অনুযায়ী এক ক্লিকে শর্টকাট */}
        <div className="flex flex-wrap gap-3">
          <Link 
            href={`/dashboard/staff/payroll?staffId=${staff.id}`}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition font-bold border border-green-200"
          >
            <WalletCards size={18} />
            বেতন প্রদান
          </Link>
        </div>
      </div>

      {/* বিস্তারিত তথ্যের গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* ব্যক্তিগত তথ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <User className="text-gray-400" size={20} />
            ব্যক্তিগত ও যোগাযোগের তথ্য
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 flex items-center gap-2"><Phone size={16}/> ফোন নম্বর</span>
              <span className="font-medium text-gray-900">{staff.personalInfo.phone}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 flex items-center gap-2"><Mail size={16}/> ইমেইল</span>
              <span className="font-medium text-gray-900">{staff.personalInfo.email || "দেওয়া হয়নি"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 flex items-center gap-2"><CheckCircle2 size={16}/> প্রোফাইল স্ট্যাটাস</span>
              <span className={`font-medium ${staff.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                {staff.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
              </span>
            </div>
          </div>
        </div>

        {/* চাকরি ও বেতনের তথ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <Briefcase className="text-gray-400" size={20} />
            চাকরি ও বেতনের তথ্য
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 flex items-center gap-2"><CalendarCheck size={16}/> যোগদানের তারিখ</span>
              <span className="font-medium text-gray-900">
                {new Date(staff.personalInfo.joinDate).toLocaleDateString("bn-BD", { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500 flex items-center gap-2"><WalletCards size={16}/> নির্ধারিত মূল বেতন</span>
              <span className="font-bold text-gray-900 text-base">৳ {staff.salaryInfo.basicSalary.toLocaleString('bn-BD')}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-gray-500">বেতনের বর্তমান অবস্থা</span>
              {getSalaryBadge(staff.salaryInfo.currentStatus)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}