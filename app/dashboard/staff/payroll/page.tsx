// File: app/dashboard/staff/payroll/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config";
import { Staff } from "../../../../types/staff";
import { Search, CheckCircle, Loader2, Printer, WalletCards, ArrowRight } from "lucide-react";
import PayrollReceipt from "../../../../components/PayrollReceipt";

function PayrollForm() {
  const searchParams = useSearchParams();
  const initialStaffId = searchParams.get("staffId") || "";

  const [searchId, setSearchId] = useState(initialStaffId);
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loadingStaff, setLoadingStaff] = useState(false);
  
  // বেতন হিসাবের স্টেট
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // ডিফল্ট বর্তমান মাস
  });
  
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [deductionAmount, setDeductionAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [lastPayroll, setLastPayroll] = useState<any>(null);

  // হিসাব নিকাশ (ক্যাটালগ অনুযায়ী আংশিক পরিশোধ ও কর্তন)[cite: 1]
  const basicSalary = staff?.salaryInfo?.basicSalary || 0;
  const netPayable = basicSalary + bonusAmount - deductionAmount;
  const dueAmount = netPayable - paidAmount;

  // স্টাফের তথ্য খোঁজার ফাংশন
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId) return;

    setLoadingStaff(true);
    setSuccessMsg("");
    setStaff(null);
    setLastPayroll(null);
    
    try {
      const docRef = doc(db, "staffs", searchId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const staffData = { id: docSnap.id, ...docSnap.data() } as Staff;
        setStaff(staffData);
        setPaidAmount(staffData.salaryInfo.basicSalary); // ডিফল্টভাবে ফুল পেমেন্ট বসে থাকবে
      } else {
        alert("এই আইডির কোনো স্টাফ পাওয়া যায়নি।");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStaff(false);
    }
  };

  useEffect(() => {
    if (initialStaffId) handleSearch();
  }, [initialStaffId]);

  // বেতন প্রদান ও ডেটাবেস আপডেট (Batch Write)
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staff || paidAmount <= 0 || paidAmount > netPayable) {
      alert("পরিশোধিত অংক সঠিক নয়।");
      return;
    }
    
    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const payrollRef = doc(collection(db, "payrolls"));
      
      const payrollData = {
        staffId: staff.id,
        staffName: staff.personalInfo.fullName,
        month,
        basicSalary,
        bonusAmount,
        deductionAmount,
        netPayable,
        paidAmount,
        dueAmount,
        paymentDate: new Date().toISOString(),
        receiptNo: payrollRef.id.slice(-6).toUpperCase(),
        status: dueAmount > 0 ? "partial" : "paid"
      };

      // ১. Payroll কালেকশনে হিসেব সেভ করা
      batch.set(payrollRef, payrollData);

      // ২. Staff কালেকশনে স্ট্যাটাস আপডেট করা (বকেয়া থাকলে due, নইলে paid)[cite: 1]
      const staffRef = doc(db, "staffs", staff.id!);
      const newStatus = dueAmount > 0 ? "due" : "paid";
      batch.update(staffRef, { 
        "salaryInfo.currentStatus": newStatus,
        "salaryInfo.lastPaidMonth": month
      });

      await batch.commit(); 
      setSuccessMsg(`৳ ${paidAmount} বেতন সফলভাবে প্রদান করা হয়েছে!`);
      setLastPayroll(payrollData);
      
      // ফর্ম রিসেট
      setBonusAmount(0);
      setDeductionAmount(0);
      setStaff({
        ...staff,
        salaryInfo: { ...staff.salaryInfo, currentStatus: newStatus }
      });
      
    } catch (error) {
      alert("বেতন প্রদান করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6 print:hidden">
        
        {/* হেডার ও সার্চ */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">বেতন প্রদান (Payroll)</h1>
            <p className="text-gray-500 text-sm mt-1">শিক্ষক ও স্টাফদের মাসিক বেতন ও ভাতার হিসাব</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <input 
              type="text" placeholder="স্টাফের ফায়ারবেস আইডি দিন..."
              className="border rounded-lg px-4 py-2 w-full md:w-64"
              value={searchId} onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" disabled={loadingStaff} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
              {loadingStaff ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
          </form>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} /> {successMsg}
            </div>
            {lastPayroll && (
              <button onClick={() => window.print()} className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-100 transition shadow-sm">
                <Printer size={18} /> রসিদ প্রিন্ট করুন
              </button>
            )}
          </div>
        )}

        {staff && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* স্টাফের ইনফো কার্ড */}
            <div className="col-span-1 bg-white border border-gray-200 p-6 rounded-xl shadow-sm h-fit">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {staff.personalInfo.fullName.charAt(0)}
              </div>
              <h3 className="font-bold text-lg text-gray-800">{staff.personalInfo.fullName}</h3>
              <p className="text-gray-500 text-sm mb-4">{staff.personalInfo.designation} • ID: {staff.employeeId}</p>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">নির্ধারিত মূল বেতন</span>
                  <span className="font-bold text-gray-900">৳ {basicSalary.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">বর্তমান স্ট্যাটাস</span>
                  <span className={`font-medium ${staff.salaryInfo.currentStatus === 'paid' ? 'text-green-600' : 'text-red-600'}`}>
                    {staff.salaryInfo.currentStatus === 'paid' ? 'পরিশোধিত' : 'বকেয়া আছে'}
                  </span>
                </div>
              </div>
            </div>

            {/* হিসাব ও প্রদান ফর্ম[cite: 1] */}
            <div className="col-span-1 lg:col-span-2 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3 mb-5 flex items-center gap-2">
                <WalletCards size={20} className="text-blue-600" /> বেতনের হিসাব ও প্রদান
              </h3>
              
              <form onSubmit={handlePayment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">বেতনের মাস *</label>
                    <input type="month" required className="w-full border rounded-lg px-3 py-2" value={month} onChange={(e) => setMonth(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ভাতা / বোনাস (+) (টাকা)</label>
                    <input type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-green-700 font-medium bg-green-50/30" value={bonusAmount || ""} onChange={(e) => setBonusAmount(Number(e.target.value))} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">কর্তন (-) (টাকা)</label>
                    <input type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-red-700 font-medium bg-red-50/30" value={deductionAmount || ""} onChange={(e) => setDeductionAmount(Number(e.target.value))} />
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-slate-900 text-white p-4 rounded-xl">
                  <div className="flex-1">
                    <p className="text-slate-400 text-sm">সর্বমোট প্রদেয় (Net Payable)</p>
                    <p className="text-2xl font-bold">৳ {netPayable.toLocaleString()}</p>
                  </div>
                  <ArrowRight className="text-slate-500" />
                  <div className="flex-1">
                    <label className="block text-sm text-slate-300 mb-1">পরিশোধ করা হচ্ছে *</label>
                    <input 
                      type="number" required min="1" max={netPayable}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                      value={paidAmount || ""}
                      onChange={(e) => setPaidAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                {dueAmount > 0 && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 text-sm font-medium flex justify-between">
                    <span>হিসাব অনুযায়ী বকেয়া থাকবে:</span>
                    <span>৳ {dueAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="submit" disabled={isProcessing || netPayable <= 0} className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:bg-blue-400">
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                    {isProcessing ? "প্রসেসিং..." : "বেতন প্রদান করুন"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* রসিদ (শুধুমাত্র প্রিন্টের সময় দেখা যাবে) */}
      {staff && lastPayroll && (
        <PayrollReceipt staff={staff} payrollData={lastPayroll} />
      )}
    </>
  );
}

export default function PayrollPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">লোড হচ্ছে...</div>}>
      <PayrollForm />
    </Suspense>
  );
}