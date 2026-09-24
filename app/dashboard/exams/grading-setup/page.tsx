// File: app/dashboard/exams/grading-setup/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { GradingScale } from "../../../../types/exam";
import { 
  ArrowLeft, Save, Loader2, Settings2, PlusCircle, Trash2, CheckCircle2, ListOrdered
} from "lucide-react";

export default function GradingSetupPage() {
  const [scales, setScales] = useState<GradingScale[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম স্টেট
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState<"gpa" | "average">("gpa");
  
  // গ্রেডিং রুলসের ডায়নামিক স্টেট (ডিফল্ট কিছু রুলস দেওয়া হলো যাতে সহজে শুরু করা যায়)
  const [rules, setRules] = useState([
    { minMarks: 80, maxMarks: 100, grade: "A+", point: 5.0 },
    { minMarks: 70, maxMarks: 79, grade: "A", point: 4.0 },
    { minMarks: 60, maxMarks: 69, grade: "A-", point: 3.5 },
    { minMarks: 50, maxMarks: 59, grade: "B", point: 3.0 },
    { minMarks: 40, maxMarks: 49, grade: "C", point: 2.0 },
    { minMarks: 33, maxMarks: 39, grade: "D", point: 1.0 },
    { minMarks: 0, maxMarks: 32, grade: "F", point: 0.0 },
  ]);

  // ডেটাবেস থেকে বিদ্যমান গ্রেডিং স্কেলগুলো ফেচ করা
  const fetchScales = async () => {
    try {
      const q = query(collection(db, "grading_scales"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const scaleList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as GradingScale[];
      setScales(scaleList);
    } catch (error) {
      console.error("Error fetching scales:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScales();
  }, []);

  // ডায়নামিক রুলস (Rules) পরিচালনার ফাংশনসমূহ
  const addRule = () => {
    setRules([...rules, { minMarks: 0, maxMarks: 0, grade: "", point: 0 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: string | number) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  // ফায়ারবেসে নতুন গ্রেডিং স্কেল সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "grading_scales"), {
        name,
        type,
        rules,
        createdAt: serverTimestamp(),
      });
      
      setSuccessMsg("নতুন গ্রেডিং স্কেল সফলভাবে সংরক্ষিত হয়েছে!");
      
      // ফর্ম রিসেট ও ডাটা রিফ্রেশ
      setName(""); 
      setType("gpa");
      setIsCreating(false);
      fetchScales();
      
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("ডেটা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // স্কেল ডিলিট করা
  const handleDelete = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই গ্রেডিং স্কেলটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "grading_scales", id));
      fetchScales();
    } catch (error) {
      alert("স্কেলটি মুছতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Settings2 size={24} className="text-blue-600" />
            গ্রেডিং স্কেল সেটআপ
          </h1>
          <p className="text-gray-500 text-sm mt-1">পরীক্ষার ফলাফলের জন্য জিপিএ বা গড় নম্বর-ভিত্তিক স্কেল তৈরি করুন</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard/exams"
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
          >
            <ArrowLeft size={18} /> ফিরে যান
          </Link>
          {!isCreating && (
            <button 
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition"
            >
              <PlusCircle size={18} /> নতুন স্কেল
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* নতুন স্কেল তৈরি করার ফর্ম */}
      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="text-lg font-bold text-gray-800">নতুন স্কেল তৈরি করুন</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-gray-500 hover:text-red-500 text-sm font-medium">বাতিল করুন</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">স্কেলের নাম *</label>
              <input 
                required type="text" placeholder="উদাঃ সাধারণ গ্রেডিং (GPA 5.0) / হিফজ গ্রেডিং"
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">স্কেলের ধরন *</label>
              <select 
                required className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={type} onChange={(e) => setType(e.target.value as "gpa" | "average")}
              >
                <option value="gpa">জিপিএ-ভিত্তিক (GPA/Grade Point)</option>
                <option value="average">গড় নম্বর-ভিত্তিক (Average Marks)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3 mt-4">
              <label className="block text-sm font-bold text-gray-700">মার্কস ও পয়েন্ট রুলস</label>
              <button type="button" onClick={addRule} className="flex items-center gap-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg font-medium transition">
                <PlusCircle size={16} /> রুল যোগ করুন
              </button>
            </div>
            
            <div className="space-y-3">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex flex-wrap md:flex-nowrap gap-3 items-end p-3 bg-slate-50 border border-slate-100 rounded-lg">
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">সর্বনিম্ন নম্বর (Min)</label>
                    <input type="number" required min="0" className="w-full border rounded-lg px-3 py-2 text-sm" value={rule.minMarks} onChange={(e) => updateRule(idx, 'minMarks', Number(e.target.value))} />
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">সর্বোচ্চ নম্বর (Max)</label>
                    <input type="number" required min="0" className="w-full border rounded-lg px-3 py-2 text-sm" value={rule.maxMarks} onChange={(e) => updateRule(idx, 'maxMarks', Number(e.target.value))} />
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">লেটার গ্রেড (Grade)</label>
                    <input type="text" required placeholder="A+" className="w-full border rounded-lg px-3 py-2 text-sm font-bold" value={rule.grade} onChange={(e) => updateRule(idx, 'grade', e.target.value)} />
                  </div>
                  <div className="w-full md:w-1/4">
                    <label className="block text-xs text-gray-500 mb-1">গ্রেড পয়েন্ট (Point)</label>
                    <input type="number" step="0.01" required placeholder="5.0" className="w-full border rounded-lg px-3 py-2 text-sm font-bold text-blue-700" value={rule.point} onChange={(e) => updateRule(idx, 'point', Number(e.target.value))} />
                  </div>
                  
                  {rules.length > 1 && (
                    <button type="button" onClick={() => removeRule(idx)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-lg border hover:bg-red-50 transition mb-0.5">
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t">
            <button type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:bg-slate-500 font-bold shadow-md">
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "স্কেল সেভ করুন"}
            </button>
          </div>
        </form>
      )}

      {/* বিদ্যমান গ্রেডিং স্কেলের তালিকা */}
      {!isCreating && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full py-12 text-center text-gray-500">স্কেল লোড হচ্ছে...</div>
          ) : scales.length === 0 ? (
            <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl border-gray-200">
              <ListOrdered className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-500 font-medium">কোনো গ্রেডিং স্কেল তৈরি করা নেই</p>
            </div>
          ) : (
            scales.map(scale => (
              <div key={scale.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg">{scale.name}</h3>
                    <p className="text-xs font-medium text-blue-600 mt-0.5 bg-blue-50 px-2 py-0.5 rounded inline-block border border-blue-100">
                      {scale.type === 'gpa' ? "জিপিএ-ভিত্তিক" : "গড় নম্বর-ভিত্তিক"}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(scale.id!)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="স্কেলটি মুছুন">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-4 flex-1">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="text-gray-500 border-b">
                        <th className="pb-2 font-medium">নম্বর (Marks)</th>
                        <th className="pb-2 font-medium text-center">গ্রেড</th>
                        <th className="pb-2 font-medium text-right">পয়েন্ট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scale.rules.map((r, i) => (
                        <tr key={i} className="border-b last:border-0 border-gray-100">
                          <td className="py-2 text-gray-700">{r.minMarks} - {r.maxMarks}</td>
                          <td className="py-2 text-center font-bold text-gray-900">{r.grade}</td>
                          <td className="py-2 text-right font-bold text-blue-700">{r.point.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}