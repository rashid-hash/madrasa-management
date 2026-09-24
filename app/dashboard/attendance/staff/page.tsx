// File: app/dashboard/attendance/staff/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config";
import { 
  Briefcase, Calendar as CalendarIcon, CheckCircle, Clock, Save, 
  Loader2, CheckCircle2, Search, LogIn, LogOut
} from "lucide-react";

type StaffStatus = "present" | "absent" | "leave" | "late";

interface StaffAttendance {
  staffId: string;
  name: string;
  designation: string;
  status: StaffStatus;
  timeIn: string;
  timeOut: string;
}

export default function StaffAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [staffList, setStaffList] = useState<StaffAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ডিফল্ট অফিস শুরুর সময় (এর পর আসলে বিলম্ব)
  const officeStartTime = "09:00"; 

  const handleSearch = async () => {
    if (!selectedDate) return;
    setIsLoading(true);
    setSuccessMsg("");

    try {
      // ১. সক্রিয় স্টাফদের তালিকা আনা
      const staffSnap = await getDocs(query(collection(db, "staffs"), where("status", "==", "active")));
      const staffs = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // ২. ঐ দিনের আগের হাজিরা আনা (যদি থাকে)
      const attendanceSnap = await getDocs(query(collection(db, "staff_attendance"), where("date", "==", selectedDate)));
      const existingRecords = new Map();
      attendanceSnap.docs.forEach(doc => {
        existingRecords.set(doc.data().staffId, doc.data());
      });

      // ৩. ডেটা মার্জ করা
      const records: StaffAttendance[] = staffs.map(staff => {
        const existing = existingRecords.get(staff.id);
        return {
          staffId: staff.id,
          name: (staff as any).basicInfo?.fullName || "নাম নেই",
          designation: (staff as any).employmentInfo?.designation || "পদবি নেই",
          status: existing?.status || "present", // ডিফল্ট উপস্থিত
          timeIn: existing?.timeIn || "",
          timeOut: existing?.timeOut || ""
        };
      });

      // নামের ক্রমানুসারে সাজানো
      records.sort((a, b) => a.name.localeCompare(b.name));
      setStaffList(records);
    } catch (error) {
      alert("স্টাফদের ডেটা আনতে সমস্যা হয়েছে।");
    } finally {
      setIsLoading(false);
    }
  };

  // ইনপুট হ্যান্ডলার (Time In / Time Out / Status)
  const handleChange = (staffId: string, field: keyof StaffAttendance, value: string) => {
    setStaffList(prev => prev.map(staff => {
      if (staff.staffId !== staffId) return staff;
      
      const updatedStaff = { ...staff, [field]: value };

      // যদি Time In পরিবর্তন হয়, তবে লেট (Late) কিনা চেক করা[cite: 5]
      if (field === "timeIn" && value) {
        updatedStaff.status = value > officeStartTime ? "late" : "present";
      }

      return updatedStaff;
    }));
  };

  // স্ট্যাটাস ম্যানুয়ালি পরিবর্তন
  const handleStatusChange = (staffId: string, status: StaffStatus) => {
    setStaffList(prev => prev.map(staff => {
      if (staff.staffId !== staffId) return staff;
      
      // যদি অনুপস্থিত বা ছুটি হয়, তবে সময় ফাঁকা করে দেওয়া
      const updatedStaff = { ...staff, status };
      if (status === "absent" || status === "leave") {
        updatedStaff.timeIn = "";
        updatedStaff.timeOut = "";
      }
      return updatedStaff;
    }));
  };

  // ডেটাবেসে সেভ করা
  const handleSaveAttendance = async () => {
    if (staffList.length === 0) return;
    setIsSaving(true);
    setSuccessMsg("");

    try {
      const batch = writeBatch(db);

      staffList.forEach(record => {
        const docId = `${selectedDate}_${record.staffId}`;
        const ref = doc(db, "staff_attendance", docId);
        
        batch.set(ref, {
          staffId: record.staffId,
          date: selectedDate,
          status: record.status,
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      });

      await batch.commit();
      setSuccessMsg(`${selectedDate} তারিখের স্টাফ হাজিরা সফলভাবে সংরক্ষিত হয়েছে!`);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("হাজিরা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Briefcase size={24} className="text-teal-600" />
            স্টাফ ও শিক্ষক হাজিরা
          </h1>
          <p className="text-gray-500 text-sm mt-1">প্রবেশ ও প্রস্থানের সময়সহ স্টাফদের দৈনিক উপস্থিতি রেকর্ড করুন</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* ফিল্টার */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-end gap-4">
        <div className="flex-1 max-w-xs">
          <label className="block text-xs font-bold text-gray-600 mb-1">তারিখ নির্বাচন করুন</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <CalendarIcon size={16} className="text-gray-400" />
            </div>
            <input 
              type="date" 
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-teal-500 outline-none font-medium"
              value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
        
        <button 
          onClick={handleSearch} disabled={isLoading}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-bold transition shadow-sm h-[46px]"
        >
          {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
          স্টাফ তালিকা আনুন
        </button>

        <div className="ml-auto text-sm font-bold text-teal-700 bg-teal-50 px-4 py-2.5 rounded-lg border border-teal-200 flex items-center gap-2">
          <Clock size={16} /> ডিফল্ট প্রবেশ সময়: 09:00 AM
        </div>
      </div>

      {/* হাজিরা টেবিল */}
      {staffList.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm border-b border-gray-200">
                  <th className="p-4 font-bold">নাম ও পদবি</th>
                  <th className="p-4 font-bold w-40 text-center bg-teal-50/50">প্রবেশের সময় (In)</th>
                  <th className="p-4 font-bold w-40 text-center bg-teal-50/50">প্রস্থানের সময় (Out)</th>
                  <th className="p-4 font-bold w-[350px] text-center">স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr key={staff.staffId} className="border-b border-gray-100 hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-gray-900">{staff.name}</p>
                      <p className="text-xs text-gray-500 font-medium">{staff.designation}</p>
                    </td>
                    
                    {/* Time In */}
                    <td className="p-4 bg-teal-50/20">
                      <div className="relative flex items-center justify-center">
                        <LogIn size={14} className="absolute left-3 text-gray-400" />
                        <input 
                          type="time" 
                          disabled={staff.status === "absent" || staff.status === "leave"}
                          value={staff.timeIn} onChange={(e) => handleChange(staff.staffId, "timeIn", e.target.value)}
                          className="w-full border rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-400 font-mono"
                        />
                      </div>
                    </td>

                    {/* Time Out */}
                    <td className="p-4 bg-teal-50/20">
                      <div className="relative flex items-center justify-center">
                        <LogOut size={14} className="absolute left-3 text-gray-400" />
                        <input 
                          type="time" 
                          disabled={staff.status === "absent" || staff.status === "leave"}
                          value={staff.timeOut} onChange={(e) => handleChange(staff.staffId, "timeOut", e.target.value)}
                          className="w-full border rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none focus:border-teal-500 disabled:bg-gray-100 disabled:text-gray-400 font-mono"
                        />
                      </div>
                    </td>
                    
                    {/* Status */}
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <span className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer transition ${staff.status === 'present' ? 'bg-green-100 text-green-700 border-green-500' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`} onClick={() => handleStatusChange(staff.staffId, "present")}>উপস্থিত</span>
                        <span className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer transition ${staff.status === 'late' ? 'bg-orange-100 text-orange-700 border-orange-500' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`} onClick={() => handleStatusChange(staff.staffId, "late")}>বিলম্ব</span>
                        <span className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer transition ${staff.status === 'absent' ? 'bg-red-100 text-red-700 border-red-500' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`} onClick={() => handleStatusChange(staff.staffId, "absent")}>অনুপস্থিত</span>
                        <span className={`px-3 py-1.5 rounded text-xs font-bold border cursor-pointer transition ${staff.status === 'leave' ? 'bg-purple-100 text-purple-700 border-purple-500' : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'}`} onClick={() => handleStatusChange(staff.staffId, "leave")}>ছুটি</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 bg-slate-50 border-t flex justify-end">
            <button 
              onClick={handleSaveAttendance} disabled={isSaving}
              className="flex items-center gap-2 bg-teal-600 text-white px-8 py-2.5 rounded-lg font-bold shadow-md hover:bg-teal-700 transition disabled:bg-teal-400"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              {isSaving ? "সংরক্ষণ হচ্ছে..." : "স্টাফ হাজিরা সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}