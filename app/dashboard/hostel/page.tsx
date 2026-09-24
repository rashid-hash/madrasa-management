// File: app/dashboard/hostel/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, serverTimestamp, getDocs, where } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { Student } from "../../../types/student";
import { 
  Home, Users, ShoppingCart, Plus, Save, Trash2, Loader2, 
  CheckCircle2, BedDouble, Calendar, Building, MapPin
} from "lucide-react";

interface Allocation {
  id?: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  building: string;
  room: string;
  seat: string;
  allocatedAt: any;
}

interface Expense {
  id?: string;
  date: string;
  item: string;
  amount: number;
}

export default function HostelManagementPage() {
  const [activeTab, setActiveTab] = useState<"residents" | "expenses">("residents");
  
  // ডেটা স্টেট
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // ফর্ম স্টেট
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [allocationData, setAllocationData] = useState({
    studentId: "", building: "", room: "", seat: ""
  });

  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split('T')[0], item: "", amount: ""
  });

  // রিয়েল-টাইম ডেটা ফেচিং
  useEffect(() => {
    // এক্টিভ শিক্ষার্থীদের তালিকা আনা (যাদের সিট দেওয়া হবে)
    const fetchStudents = async () => {
      const snap = await getDocs(query(collection(db, "students"), where("status", "==", "active")));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Student[]);
    };
    fetchStudents();

    // সিট বরাদ্দের তালিকা
    const unsubAllocations = onSnapshot(query(collection(db, "hostel_allocations"), orderBy("building", "asc")), (snap) => {
      setAllocations(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Allocation[]);
    });

    // খরচের তালিকা
    const unsubExpenses = onSnapshot(query(collection(db, "hostel_expenses"), orderBy("date", "desc")), (snap) => {
      setExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
      setLoading(false);
    });

    return () => { unsubAllocations(); unsubExpenses(); };
  }, []);

  // ১. নতুন সিট বরাদ্দ করা[cite: 5]
  const handleAllocateSeat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocationData.studentId || !allocationData.building || !allocationData.room || !allocationData.seat) return;

    // চেক করা যে স্টুডেন্টটি আগে থেকেই সিট পেয়েছে কিনা
    if (allocations.some(a => a.studentId === allocationData.studentId)) {
      alert("এই শিক্ষার্থীকে আগেই সিট বরাদ্দ দেওয়া হয়েছে!");
      return;
    }

    const student = students.find(s => s.id === allocationData.studentId);
    if (!student) return;

    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "hostel_allocations"), {
        studentId: student.id,
        studentName: student.basicInfo.fullName,
        admissionNumber: student.admissionNumber,
        building: allocationData.building,
        room: allocationData.room,
        seat: allocationData.seat,
        allocatedAt: serverTimestamp()
      });
      
      setSuccessMsg("সিট সফলভাবে বরাদ্দ করা হয়েছে!");
      setAllocationData({ studentId: "", building: "", room: "", seat: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("সিট বরাদ্দ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ২. বাজার খরচ সেভ করা[cite: 5]
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseData.item || !expenseData.amount) return;

    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "hostel_expenses"), {
        date: expenseData.date,
        item: expenseData.item,
        amount: Number(expenseData.amount)
      });
      
      setSuccessMsg("বাজার খরচ সফলভাবে যুক্ত হয়েছে!");
      setExpenseData({ ...expenseData, item: "", amount: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("খরচ যুক্ত করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ৩. ডেটা ডিলিট করা
  const handleDelete = async (collectionName: string, id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      alert("মুছতে সমস্যা হয়েছে।");
    }
  };

  // মোট খরচ হিসাব
  const totalExpense = expenses.reduce((sum, current) => sum + current.amount, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Home size={26} className="text-rose-600" />
          আবাসিক (হোস্টেল) ব্যবস্থাপনা
        </h1>
        <p className="text-gray-500 text-sm mt-1">শিক্ষার্থীদের সিট বরাদ্দ এবং হোস্টেলের বাজার-খরচ পরিচালনা করুন</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* ট্যাব নেভিগেশন */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden shadow-sm">
        <button 
          onClick={() => setActiveTab("residents")}
          className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "residents" ? "bg-rose-50 text-rose-700 border-b-2 border-rose-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <BedDouble size={18} /> সিট বরাদ্দ ও আবাসিক তালিকা[cite: 5]
        </button>
        <button 
          onClick={() => setActiveTab("expenses")}
          className={`flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "expenses" ? "bg-rose-50 text-rose-700 border-b-2 border-rose-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ShoppingCart size={18} /> দৈনিক বাজার খরচ[cite: 5]
        </button>
      </div>

      {/* ট্যাব ১: সিট বরাদ্দ */}
      {activeTab === "residents" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <form onSubmit={handleAllocateSeat} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-5 border-b bg-slate-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Plus size={18} className="text-rose-600"/> নতুন সিট বরাদ্দ করুন
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">শিক্ষার্থী নির্বাচন করুন *</label>
                  <select required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none" value={allocationData.studentId} onChange={e => setAllocationData({...allocationData, studentId: e.target.value})}>
                    <option value="">-- শিক্ষার্থী খুঁজুন --</option>
                    {students.map(s => <option key={s.id} value={s.id!}>{s.basicInfo.fullName} (আইডি: {s.admissionNumber})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ভবনের নাম/নম্বর[cite: 5] *</label>
                  <input required type="text" placeholder="যেমন: মেইন বিল্ডিং / উত্তর ভবন" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none" value={allocationData.building} onChange={e => setAllocationData({...allocationData, building: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">রুম নম্বর[cite: 5] *</label>
                    <input required type="text" placeholder="যেমন: 101" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none" value={allocationData.room} onChange={e => setAllocationData({...allocationData, room: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">সিট নম্বর[cite: 5] *</label>
                    <input required type="text" placeholder="যেমন: A" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none" value={allocationData.seat} onChange={e => setAllocationData({...allocationData, seat: e.target.value})} />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-sm disabled:bg-rose-400">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} সিট বরাদ্দ নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Users size={18} className="text-gray-500"/> আবাসিক শিক্ষার্থীদের তালিকা</h3>
                <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">মোট আবাসিক: {allocations.length} জন</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white border-b text-gray-600">
                      <th className="p-4 font-bold">শিক্ষার্থীর নাম ও আইডি</th>
                      <th className="p-4 font-bold">ভবন ও রুম</th>
                      <th className="p-4 font-bold text-center">সিট</th>
                      <th className="p-4 font-bold text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline" size={24}/></td></tr>
                    ) : allocations.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">কোনো সিট বরাদ্দ করা হয়নি</td></tr>
                    ) : (
                      allocations.map(alloc => (
                        <tr key={alloc.id} className="border-b border-gray-100 hover:bg-slate-50 transition">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{alloc.studentName}</p>
                            <p className="text-xs font-mono font-bold text-gray-500">{alloc.admissionNumber}</p>
                          </td>
                          <td className="p-4">
                            <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><Building size={14} className="text-rose-500"/> {alloc.building}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><MapPin size={14}/> রুম: {alloc.room}</p>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-block px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-sm font-black border border-rose-200">
                              {alloc.seat}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete("hostel_allocations", alloc.id!)} className="text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 rounded-lg" title="সিট বাতিল করুন">
                              <Trash2 size={18} />
                            </button>
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
      )}

      {/* ট্যাব ২: দৈনিক বাজার খরচ */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-1">
            <form onSubmit={handleAddExpense} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-5 border-b bg-slate-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <ShoppingCart size={18} className="text-rose-600"/> নতুন বাজার খরচ এন্ট্রি
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">তারিখ *</label>
                  <input required type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none" value={expenseData.date} onChange={e => setExpenseData({...expenseData, date: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বাজারের বিবরণ/আইটেম[cite: 5] *</label>
                  <textarea required rows={3} placeholder="যেমন: চাল, ডাল, সবজি ও মাছ" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none resize-none" value={expenseData.item} onChange={e => setExpenseData({...expenseData, item: e.target.value})}></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">মোট পরিমাণ/খরচ (৳)[cite: 5] *</label>
                  <input required type="number" min="1" placeholder="যেমন: 500" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none font-bold" value={expenseData.amount} onChange={e => setExpenseData({...expenseData, amount: e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-sm disabled:bg-slate-500">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} খরচ সেভ করুন
                </button>
              </div>
            </form>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
              <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 text-sm">বাজার খরচের তালিকা</h3>
                <div className="text-sm font-bold bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 border border-gray-200">
                  সর্বমোট খরচ: <span className="text-rose-600">৳ {totalExpense.toLocaleString('bn-BD')}</span>[cite: 5]
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white border-b text-gray-600">
                      <th className="p-4 font-bold w-32">তারিখ</th>
                      <th className="p-4 font-bold">বাজারের বিবরণ</th>
                      <th className="p-4 font-bold text-right">খরচ (৳)</th>
                      <th className="p-4 font-bold text-right w-16">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline" size={24}/></td></tr>
                    ) : expenses.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">কোনো খরচের হিসাব নেই</td></tr>
                    ) : (
                      expenses.map(expense => (
                        <tr key={expense.id} className="border-b border-gray-100 hover:bg-slate-50 transition">
                          <td className="p-4 text-gray-600 font-medium flex items-center gap-1.5"><Calendar size={14}/> {expense.date}</td>
                          <td className="p-4 font-medium text-gray-800">{expense.item}</td>
                          <td className="p-4 text-right font-black text-rose-600">৳ {expense.amount.toLocaleString('bn-BD')}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDelete("hostel_expenses", expense.id!)} className="text-gray-400 hover:text-red-500 transition hover:bg-red-50 p-1.5 rounded" title="حذف">
                              <Trash2 size={16} />
                            </button>
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
      )}

    </div>
  );
}