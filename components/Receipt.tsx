import { Student } from "../types/student";

interface ReceiptProps {
  student: Student;
  transactionData: {
    feeType: string;
    amount: number;
    discount: number;
    netAmount: number;
    amountInWords: string;
    date: string;
    receiptNo: string;
  } | null;
}

export default function Receipt({ student, transactionData }: ReceiptProps) {
  if (!transactionData) return null;

  // ফি এর ধরন বাংলায় দেখানোর জন্য হেল্পার
  const feeTypeLabels: Record<string, string> = {
    admission: "ভর্তি ফি",
    monthly: "মাসিক বেতন",
    exam: "পরীক্ষার ফি",
    other: "অন্যান্য",
  };

  return (
    // 'print:block' এর মাধ্যমে এটি শুধু প্রিন্টের সময় দৃশ্যমান হবে
    <div className="hidden print:block w-full bg-white text-black font-sans">
      
      {/* প্রতিষ্ঠানের হেডার */}
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">মাদ্রাসাতুল উলুম আল-ইসলামিয়া</h1>
        <p className="text-sm mt-1 text-gray-700">১২৩, ইসলামপুর রোড, ঢাকা-১১০০ | মোবাইল: ০১৭১২-৩৪৫৬৭৮</p>
        <div className="mt-4">
          <span className="text-lg font-bold border-2 border-black px-6 py-1.5 rounded-full uppercase tracking-wider">
            মানি রসিদ
          </span>
        </div>
      </div>

      {/* রসিদ ও তারিখের তথ্য */}
      <div className="flex justify-between items-center mb-6 text-sm font-medium">
        <p>রসিদ নং: <span className="font-mono">{transactionData.receiptNo}</span></p>
        <p>তারিখ: {new Date(transactionData.date).toLocaleDateString("bn-BD")}</p>
      </div>

      {/* শিক্ষার্থীর তথ্য */}
      <div className="border border-black rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-1"><strong>শিক্ষার্থীর নাম:</strong> {student.basicInfo.fullName}</p>
          <p className="mb-1"><strong>আইডি/রোল:</strong> {student.admissionNumber}</p>
        </div>
        <div>
          <p className="mb-1"><strong>শ্রেণি/বিভাগ:</strong> {student.academicInfo.classId}</p>
          <p className="mb-1"><strong>পিতার নাম:</strong> {student.familyInfo.fatherName}</p>
        </div>
      </div>

      {/* পেমেন্টের বিস্তারিত টেবিল */}
      <table className="w-full border-collapse border border-black mb-6 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-4 py-2 text-left">বিবরণ</th>
            <th className="border border-black px-4 py-2 text-right">পরিমাণ (টাকা)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-4 py-3">{feeTypeLabels[transactionData.feeType] || "ফি"}</td>
            <td className="border border-black px-4 py-3 text-right">{transactionData.amount}</td>
          </tr>
          {transactionData.discount > 0 && (
            <tr>
              <td className="border border-black px-4 py-3 text-right">ডিসকাউন্ট/মওকুফ (-)</td>
              <td className="border border-black px-4 py-3 text-right">{transactionData.discount}</td>
            </tr>
          )}
          <tr>
            <td className="border border-black px-4 py-3 text-right font-bold">সর্বমোট জমা</td>
            <td className="border border-black px-4 py-3 text-right font-bold">৳ {transactionData.netAmount}</td>
          </tr>
        </tbody>
      </table>

      {/* কথায় লেখা টাকা[cite: 1] */}
      <div className="mb-12 text-sm">
        <p className="font-medium bg-gray-50 inline-block px-4 py-2 border border-gray-200 rounded">
          <strong>কথায়:</strong> {transactionData.amountInWords}
        </p>
      </div>

      {/* স্বাক্ষর সেকশন */}
      <div className="flex justify-between items-end mt-16 pt-4 text-sm">
        <div className="text-center">
          <div className="border-t border-black w-40 mb-1"></div>
          <p>শিক্ষার্থীর স্বাক্ষর</p>
        </div>
        <div className="text-center">
          <div className="border-t border-black w-40 mb-1"></div>
          <p>আদায়কারীর স্বাক্ষর</p>
        </div>
      </div>
    </div>
  );
}