// File: app/dashboard/accounting/fees/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { doc, getDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config";
import { Student } from "../../../../types/student";
import { Search, Receipt as ReceiptIcon, CheckCircle, Loader2, Printer } from "lucide-react";
import Receipt from "../../../../components/Receipt";

// সংখ্যাকে বাংলায় কথায় রূপান্তর করার একটি সিম্পল হেল্পার ফাংশন[cite: 1]
const numberToBengaliWords = (num: number): string => {
  const banglaNumbers = ["শূন্য", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়"];
  if (num === 0) return "শূন্য টাকা মাত্র";
  return num.toString().split('').map(digit => banglaNumbers[parseInt(digit)] || digit).join(' ') + " টাকা মাত্র";
};

function FeeCollectionForm() {
  const searchParams = useSearchParams();
  const initialStudentId = searchParams.get("studentId") || "";

  const [searchId, setSearchId] = useState(initialStudentId);
  const [student, setStudent] = useState<Student | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);
  
  // ফি এর স্টেট
  const [feeType, setFeeType] = useState("admission");
  const [amount, setAmount] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  
  // নতুন স্টেট: ট্রানজেকশন সফল হলে ডেটা এখানে সেভ হবে রসিদের জন্য
  const [lastTransaction, setLastTransaction] = useState<any>(null);

  const netAmount = amount - discount;
  const amountInWords = numberToBengaliWords(netAmount);

  // শিক্ষার্থীর তথ্য খোঁজার ফাংশন
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchId) return;

    setLoadingStudent(true);
    setSuccessMsg("");
    setStudent(null);
    setLastTransaction(null); // নতুন সার্চ করলে আগের রসিদ মুছে যাবে
    
    try {
      const docRef = doc(db, "students", searchId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setStudent({ id: docSnap.id, ...docSnap.data() } as Student);
      } else {
        alert("এই আইডির কোনো শিক্ষার্থী পাওয়া যায়নি।");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingStudent(false);
    }
  };

  useEffect(() => {
    if (initialStudentId) handleSearch();
  }, [initialStudentId]);

  // ফি গ্রহণ ও ব্যাচ রাইট (Double-entry protection)[cite: 1]
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student || netAmount <= 0) return;
    setIsProcessing(true);

    try {
      const batch = writeBatch(db);
      const transactionRef = doc(collection(db, "transactions"));
      
      const transactionData = {
        studentId: student.id,
        studentName: student.basicInfo.fullName,
        feeType,
        amount,
        discount,
        netAmount,
        amountInWords,
        date: new Date().toISOString(),
        receiptNo: transactionRef.id.slice(-6).toUpperCase(),
        status: "completed"
      };

      batch.set(transactionRef, transactionData);

      // অসম্পূর্ণ ভর্তিকে সম্পূর্ণ (active) করা[cite: 1]
      if (feeType === "admission" && student.status === "incomplete") {
        const studentRef = doc(db, "students", student.id!);
        batch.update(studentRef, { status: "active" });
        setStudent({ ...student, status: "active" }); 
      }

      await batch.commit(); 
      setSuccessMsg(`৳ ${netAmount} সফলভাবে গ্রহণ করা হয়েছে!`);
      
      // রসিদের ডেটা স্টেটে সেভ করা
      setLastTransaction(transactionData);
      
      setAmount(0);
      setDiscount(0);
    } catch (error) {
      alert("ফি গ্রহণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* স্ক্রিনে দেখানোর জন্য মূল কন্টেন্ট (প্রিন্টের সময় এটি hidden থাকবে) */}
      <div className="max-w-4xl mx-auto space-y-6 print:hidden">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">ফি গ্রহণ প্যানেল</h1>
            <p className="text-gray-500 text-sm mt-1">শিক্ষার্থীর ফি, বকেয়া এবং অগ্রিম জমার হিসাব</p>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <input 
              type="text"
              placeholder="শিক্ষার্থীর আইডি দিন..."
              className="border rounded-lg px-4 py-2 w-full md:w-64"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
            />
            <button type="submit" disabled={loadingStudent} className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800">
              {loadingStudent ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            </button>
          </form>
        </div>

        {successMsg && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center justify-between gap-2 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              {successMsg}
            </div>
            {lastTransaction && (
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 bg-white border border-green-300 text-green-700 px-4 py-1.5 rounded-lg hover:bg-green-100 transition shadow-sm"
              >
                <Printer size={18} />
                রসিদ প্রিন্ট করুন
              </button>
            )}
          </div>
        )}

        {student && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-1 bg-slate-50 border border-slate-200 p-6 rounded-xl h-fit">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                {student.basicInfo.fullName.charAt(0)}
              </div>
              <h3 className="font-bold text-lg text-gray-800">{student.basicInfo.fullName}</h3>
              <p className="text-gray-500 text-sm mb-4">আইডি: {student.admissionNumber}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">শ্রেণি</span>
                  <span className="font-medium">{student.academicInfo.classId}</span>
                </div>
                <div className="flex justify-between border-b pb-1">
                  <span className="text-gray-500">স্ট্যাটাস</span>
                  <span className={`font-medium ${student.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                    {student.status === 'active' ? 'সক্রিয়' : 'অসম্পূর্ণ ভর্তি'}
                  </span>
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 bg-white border border-gray-200 p-6 rounded-xl shadow-sm">
              <h3 className="font-bold text-lg text-gray-800 border-b pb-3 mb-5 flex items-center gap-2">
                <ReceiptIcon size={20} className="text-blue-600" />
                নতুন ফি এন্ট্রি
              </h3>
              
              <form onSubmit={handlePayment} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ফি-এর ধরন</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2 bg-white"
                      value={feeType}
                      onChange={(e) => setFeeType(e.target.value)}
                    >
                      <option value="admission">ভর্তি ফি (Admission Fee)</option>
                      <option value="monthly">মাসিক বেতন (Monthly Tuition)</option>
                      <option value="exam">পরীক্ষার ফি (Exam Fee)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">মূল ফি (টাকা)</label>
                    <input 
                      type="number" required min="0"
                      className="w-full border rounded-lg px-3 py-2"
                      value={amount || ""}
                      onChange={(e) => setAmount(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ডিসকাউন্ট বা মওকুফ (টাকা)</label>
                    <input 
                      type="number" min="0" max={amount}
                      className="w-full border rounded-lg px-3 py-2"
                      value={discount || ""}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                    />
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col justify-center">
                    <span className="text-sm text-blue-600 font-medium mb-0.5">সর্বমোট জমা (Net Amount)</span>
                    <span className="text-2xl font-bold text-blue-700">৳ {netAmount}</span>
                  </div>
                </div>

                {netAmount > 0 && (
                  <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 border border-slate-200">
                    <strong>কথায়: </strong> {amountInWords}
                  </div>
                )}

                <div className="pt-4 border-t flex justify-end">
                  <button 
                    type="submit" 
                    disabled={isProcessing || netAmount <= 0}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2 disabled:bg-blue-400"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                    {isProcessing ? "প্রসেসিং..." : "ফি গ্রহণ করুন"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* রসিদ কম্পোনেন্ট - এটি শুধু প্রিন্ট কমান্ড দিলে দৃশ্যমান হবে */}
      {student && lastTransaction && (
        <Receipt student={student} transactionData={lastTransaction} />
      )}
    </>
  );
}

export default function FeeCollectionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">লোড হচ্ছে...</div>}>
      <FeeCollectionForm />
    </Suspense>
  );
}