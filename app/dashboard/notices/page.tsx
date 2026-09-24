// File: app/dashboard/notices/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { 
  Bell, AlertCircle, Trash2, Calendar, Loader2, CheckCircle2, Megaphone, Send
} from "lucide-react";

interface Notice {
  id?: string;
  title: string;
  description: string;
  isUrgent: boolean;
  createdAt: any;
}

export default function NoticeBoardPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম স্টেট
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // রিয়েল-টাইম নোটিশ ফেচ করা
  useEffect(() => {
    const q = query(collection(db, "notices"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noticeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notice[];
      setNotices(noticeList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // নতুন নোটিশ সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;
    
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "notices"), {
        title,
        description,
        isUrgent,
        createdAt: serverTimestamp(),
      });
      
      setSuccessMsg("নোটিশ সফলভাবে প্রকাশ করা হয়েছে!");
      setTitle(""); 
      setDescription(""); 
      setIsUrgent(false);
      
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("নোটিশ প্রকাশ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // নোটিশ ডিলিট করা
  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই নোটিশটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "notices", id));
    } catch (error) {
      alert("নোটিশ মুছতে সমস্যা হয়েছে।");
    }
  };

  // তারিখ ফরম্যাট করার হেল্পার ফাংশন
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "প্রকাশিত হচ্ছে...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('bn-BD', { 
      day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: 'numeric' 
    }).format(date);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Megaphone size={24} className="text-blue-600" />
          ডিজিটাল নোটিশ বোর্ড
        </h1>
        <p className="text-gray-500 text-sm mt-1">শিক্ষার্থী, শিক্ষক ও স্টাফদের জন্য নোটিশ প্রকাশ এবং পরিচালনা করুন</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ১. নতুন নোটিশ তৈরির ফর্ম */}
        <div className="col-span-1">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
            <div className="p-5 border-b bg-slate-50">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Send size={18} className="text-blue-600"/> নতুন নোটিশ প্রকাশ
              </h3>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">নোটিশের শিরোনাম *</label>
                <input 
                  required type="text" placeholder="যেমন: ঈদুল ফিতরের ছুটি প্রসঙ্গে"
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={title} onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">বিস্তারিত বিবরণ[cite: 5] *</label>
                <textarea 
                  required rows={5} placeholder="নোটিশের বিস্তারিত তথ্য লিখুন..."
                  className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none"
                  value={description} onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer" onClick={() => setIsUrgent(!isUrgent)}>
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-red-600 cursor-pointer"
                  checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)}
                />
                <label className="text-sm font-bold text-red-700 cursor-pointer select-none">এটি একটি জরুরি নোটিশ[cite: 5]</label>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 font-bold shadow-md"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Megaphone size={18} />}
                  {isSubmitting ? "প্রকাশ করা হচ্ছে..." : "নোটিশ প্রকাশ করুন"}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* ২. প্রকাশিত নোটিশের তালিকা */}
        <div className="col-span-1 lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
            <div className="p-5 border-b bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Bell size={18} className="text-gray-600"/> প্রকাশিত নোটিশসমূহ
              </h3>
              <div className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                মোট: {notices.length} টি
              </div>
            </div>
            
            <div className="p-5">
              {loading ? (
                <div className="flex justify-center items-center py-20 text-gray-400">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : notices.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed rounded-xl border-gray-200">
                  <Megaphone className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500 font-medium text-lg">কোনো নোটিশ পাওয়া যায়নি</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notices.map(notice => (
                    <div 
                      key={notice.id} 
                      className={`relative p-5 rounded-xl border transition hover:shadow-md ${
                        notice.isUrgent 
                        ? 'bg-red-50/30 border-red-200' 
                        : 'bg-white border-gray-200 hover:border-blue-200'
                      }`}
                    >
                      {/* জরুরি ব্যাজ[cite: 5] */}
                      {notice.isUrgent && (
                        <div className="absolute top-4 right-12 flex items-center gap-1 text-xs font-black bg-red-100 text-red-600 px-2.5 py-1 rounded">
                          <AlertCircle size={14} /> জরুরি
                        </div>
                      )}

                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 pr-16">
                          <h4 className={`text-lg font-bold mb-2 ${notice.isUrgent ? 'text-red-700' : 'text-gray-900'}`}>
                            {notice.title}
                          </h4>
                          <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                            {notice.description}
                          </p>
                          <div className="flex items-center gap-2 mt-4 text-xs font-medium text-gray-500">
                            <Calendar size={14} />
                            {formatDate(notice.createdAt)}
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleDelete(notice.id!)}
                          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition" 
                          title="নোটিশ মুছুন"
                        >
                          <Trash2 size={18} />
                        </button>
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