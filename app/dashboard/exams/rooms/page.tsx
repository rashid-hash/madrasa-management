// File: app/dashboard/exams/rooms/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { ExamRoom } from "../../../../types/exam";
import { Staff } from "../../../../types/staff";
import { 
  ArrowLeft, Save, Loader2, LayoutGrid, Trash2, Users, CheckCircle2, Building, ShieldCheck
} from "lucide-react";

export default function ExamRoomsPage() {
  const [rooms, setRooms] = useState<ExamRoom[]>([]);
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম স্টেট
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [roomName, setRoomName] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [invigilatorId, setInvigilatorId] = useState("");

  // ডেটাবেস থেকে বিদ্যমান কক্ষ ও স্টাফদের তালিকা ফেচ করা
  useEffect(() => {
    // স্টাফদের (শিক্ষকদের) তালিকা আনা (গার্ড/কক্ষ পরিদর্শকের জন্য)
    const fetchStaffs = async () => {
      const q = query(collection(db, "staffs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const staffList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
      setStaffs(staffList);
    };
    fetchStaffs();

    // রিয়েল-টাইম কক্ষের তালিকা আনা
    const roomQuery = query(collection(db, "exam_rooms"), orderBy("roomName", "asc"));
    const unsubscribe = onSnapshot(roomQuery, (snapshot) => {
      const roomList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ExamRoom[];
      setRooms(roomList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ফায়ারবেসে নতুন কক্ষ সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName || !capacity) return;
    
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "exam_rooms"), {
        roomName,
        capacity: Number(capacity),
        invigilatorId: invigilatorId || null,
        status: "active",
        createdAt: new Date().toISOString(),
      });
      
      setSuccessMsg("নতুন কক্ষ সফলভাবে যোগ করা হয়েছে!");
      
      // ফর্ম রিসেট
      setRoomName(""); 
      setCapacity(""); 
      setInvigilatorId("");
      
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("কক্ষ সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // কক্ষ ডিলিট করা
  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই কক্ষটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "exam_rooms", id));
    } catch (error) {
      alert("কক্ষটি মুছতে সমস্যা হয়েছে।");
    }
  };

  // স্টাফের আইডি থেকে নাম বের করার হেল্পার
  const getStaffName = (id?: string) => {
    if (!id) return "নির্ধারিত নেই";
    const staff = staffs.find(s => s.id === id);
    return staff ? staff.personalInfo.fullName : "অজানা শিক্ষক";
  };

  // মোট আসনসংখ্যা হিসাব করা
  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutGrid size={24} className="text-purple-600" />
            পরীক্ষার কক্ষ ও হলরুম
          </h1>
          <p className="text-gray-500 text-sm mt-1">স্থায়ী কক্ষ তৈরি করুন, যা সকল পরীক্ষায় সিট প্ল্যানের জন্য ব্যবহৃত হবে</p>
        </div>
        <Link 
          href="/dashboard/exams"
          className="flex items-center gap-2 text-gray-600 hover:text-purple-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
          <ArrowLeft size={18} /> ফিরে যান
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ১. নতুন কক্ষ যুক্ত করার ফর্ম */}
        <div className="col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-5">নতুন কক্ষ যুক্ত করুন</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">কক্ষের নাম বা নম্বর *</label>
                <input 
                  required type="text" placeholder="উদাঃ হলরুম-১ / কক্ষ-২০১"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none"
                  value={roomName} onChange={(e) => setRoomName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">আসনসংখ্যা (Capacity) *[cite: 1]</label>
                <input 
                  required type="number" min="1" placeholder="উদাঃ ৫০"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 outline-none font-bold"
                  value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || "")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ডিফল্ট পরিদর্শক (ঐচ্ছিক)[cite: 1]</label>
                <select 
                  className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-purple-500 outline-none"
                  value={invigilatorId} onChange={(e) => setInvigilatorId(e.target.value)}
                >
                  <option value="">-- নির্বাচন করুন --</option>
                  {staffs.map(staff => (
                    <option key={staff.id} value={staff.id}>{staff.personalInfo.fullName}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">যে শিক্ষক সাধারণত এই কক্ষে দায়িত্ব পালন করেন।</p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:bg-purple-400 font-bold shadow-md"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "কক্ষ সেভ করুন"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ২. বিদ্যমান কক্ষের তালিকা */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 text-lg">বিদ্যমান কক্ষসমূহ</h3>
              <div className="bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                <Users size={16} /> মোট আসন: {totalCapacity}
              </div>
            </div>
            
            <div className="p-5">
              {loading ? (
                <div className="text-center py-12 text-gray-500">ডেটা লোড হচ্ছে...</div>
              ) : rooms.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl border-gray-200">
                  <Building className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 font-medium text-lg">কোনো কক্ষ তৈরি করা নেই</p>
                  <p className="text-sm text-gray-400 mt-1">বাম পাশের ফর্ম থেকে নতুন কক্ষ যুক্ত করুন</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rooms.map(room => (
                    <div key={room.id} className="border rounded-xl p-4 hover:border-purple-300 hover:shadow-md transition group bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-lg">
                            <Building size={24} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{room.roomName}</h4>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${room.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {room.status === 'active' ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDelete(room.id!)}
                          className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition" title="কক্ষটি মুছুন"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-1.5"><Users size={16}/> আসনসংখ্যা:</span>
                          <span className="font-bold text-gray-900">{room.capacity} জন</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                          <span className="text-gray-500 flex items-center gap-1.5"><ShieldCheck size={16}/> পরিদর্শক:</span>
                          <span className="font-medium text-gray-700 truncate max-w-[120px]" title={getStaffName(room.invigilatorId)}>
                            {getStaffName(room.invigilatorId)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}