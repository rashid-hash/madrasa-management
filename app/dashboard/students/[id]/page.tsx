"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছাতে হবে
import { Student } from "../../../../types/student";
import { 
  User, 
  MapPin, 
  HeartPulse, 
  CreditCard, 
  CalendarCheck, 
  ArrowUpCircle,
  Phone,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

export default function StudentProfilePage() {
  const params = useParams();
  const id = params.id as string;

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ফায়ারবেস থেকে নির্দিষ্ট শিক্ষার্থীর ডেটা ফেচ করা
  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
        } else {
          setError("শিক্ষার্থীর কোনো তথ্য পাওয়া যায়নি!");
        }
      } catch (err) {
        setError("ডেটা লোড করতে সমস্যা হচ্ছে।");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchStudent();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-gray-500">প্রোফাইল লোড হচ্ছে...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  if (!student) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* প্রোফাইল হেডার ও এক-ক্লিক শর্টকাট */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {/* ডামি অ্যাভাটার */}
          <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-white shadow">
            {student.basicInfo.fullName.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{student.basicInfo.fullName}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">ID: #{student.admissionNumber}</span>
              <span>•</span>
              <span>{student.academicInfo.classId}</span>
              <span>•</span>
              {student.status === "active" ? (
                <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 size={14} /> সক্রিয়
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                  <AlertCircle size={14} /> অসম্পূর্ণ ভর্তি
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ক্যাটালগ অনুযায়ী এক ক্লিকে শর্টকাট */}
        <div className="flex flex-wrap gap-3">
          <Link 
            href={`/dashboard/accounting/fees?studentId=${student.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition font-medium"
          >
            <CreditCard size={18} />
            ফি গ্রহণ
          </Link>
          <Link 
            href={`/dashboard/attendance?studentId=${student.id}`}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition font-medium"
          >
            <CalendarCheck size={18} />
            উপস্থিতি
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition font-medium">
            <ArrowUpCircle size={18} />
            প্রোমোশন
          </button>
        </div>
      </div>

      {/* বিস্তারিত তথ্যের গ্রিড */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* মৌলিক তথ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <User className="text-gray-400" size={20} />
            মৌলিক তথ্য
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">জন্ম তারিখ</span>
              <span className="font-medium text-gray-800">{student.basicInfo.dob || "দেওয়া হয়নি"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">লিঙ্গ</span>
              <span className="font-medium text-gray-800">{student.basicInfo.gender === "male" ? "ছাত্র" : "ছাত্রী"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">রক্তের গ্রুপ</span>
              <span className="font-medium text-gray-800">{student.basicInfo.bloodGroup || "জানা নেই"}</span>
            </div>
          </div>
        </div>

        {/* পারিবারিক তথ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <Users className="text-gray-400" size={20} />
            পারিবারিক তথ্য
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">পিতার নাম</span>
              <span className="font-medium text-gray-800">{student.familyInfo.fatherName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">মাতার নাম</span>
              <span className="font-medium text-gray-800">{student.familyInfo.motherName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">যোগাযোগের নম্বর</span>
              <span className="flex items-center gap-1 font-medium text-blue-600">
                <Phone size={14} /> {student.familyInfo.guardianPhone}
              </span>
            </div>
          </div>
        </div>

        {/* একাডেমিক তথ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <GraduationCap className="text-gray-400" size={20} />
            একাডেমিক তথ্য
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">বর্তমান শ্রেণি</span>
              <span className="font-medium text-gray-800">{student.academicInfo.classId}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">সেকশন/শাখা</span>
              <span className="font-medium text-gray-800">{student.academicInfo.sectionId || "নেই"}</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span className="text-gray-500">পূর্ববর্তী প্রতিষ্ঠান</span>
              <span className="font-medium text-gray-800">{student.academicInfo.previousInstitute || "দেওয়া হয়নি"}</span>
            </div>
          </div>
        </div>

        {/* ঠিকানা ও স্বাস্থ্য */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b pb-3 mb-4">
            <MapPin className="text-gray-400" size={20} />
            ঠিকানা ও অন্যান্য
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-500 block mb-1">বর্তমান ঠিকানা</span>
              <span className="font-medium text-gray-800">{student.address.present || "দেওয়া হয়নি"}</span>
            </div>
            <div className="pt-2 border-t border-gray-50">
              <span className="text-gray-500 block mb-1">স্থায়ী ঠিকানা</span>
              <span className="font-medium text-gray-800">{student.address.permanent || "দেওয়া হয়নি"}</span>
            </div>
            <div className="pt-2 border-t border-gray-50 flex items-start gap-2">
              <HeartPulse className="text-red-400 mt-0.5" size={16} />
              <div>
                <span className="text-gray-500 block mb-0.5">স্বাস্থ্যগত তথ্য</span>
                <span className="font-medium text-gray-800">{student.healthDetails || "কোনো বিশেষ মেডিকেল রেকর্ড নেই"}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}