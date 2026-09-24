// File: components/PayrollReceipt.tsx
import { Staff } from "../types/staff";

interface PayrollReceiptProps {
  staff: Staff;
  payrollData: {
    month: string;
    basicSalary: number;
    bonusAmount: number;
    deductionAmount: number;
    netPayable: number;
    paidAmount: number;
    dueAmount: number;
    paymentDate: string;
    receiptNo: string;
  } | null;
}

export default function PayrollReceipt({ staff, payrollData }: PayrollReceiptProps) {
  if (!payrollData) return null;

  // মাসের নাম সুন্দর করে দেখানোর জন্য
  const monthNames: Record<string, string> = {
    "01": "জানুয়ারি", "02": "ফেব্রুয়ারি", "03": "মার্চ", "04": "এপ্রিল",
    "05": "মে", "06": "জুন", "07": "জুলাই", "08": "আগস্ট",
    "09": "সেপ্টেম্বর", "10": "অক্টোবর", "11": "নভেম্বর", "12": "ডিসেম্বর"
  };
  const [year, monthNum] = payrollData.month.split("-");
  const displayMonth = `${monthNames[monthNum] || monthNum} ${year}`;

  return (
    <div className="hidden print:block w-full bg-white text-black font-sans">
      <div className="text-center border-b-2 border-black pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">মাদ্রাসাতুল উলুম আল-ইসলামিয়া</h1>
        <p className="text-sm mt-1 text-gray-700">১২৩, ইসলামপুর রোড, ঢাকা-১১০০</p>
        <div className="mt-4">
          <span className="text-lg font-bold border-2 border-black px-6 py-1.5 rounded-full uppercase tracking-wider">
            বেতন প্রদানের রসিদ
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 text-sm font-medium">
        <p>ভাউচার নং: <span className="font-mono">{payrollData.receiptNo}</span></p>
        <p>তারিখ: {new Date(payrollData.paymentDate).toLocaleDateString("bn-BD")}</p>
      </div>

      <div className="border border-black rounded-lg p-4 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="mb-1"><strong>স্টাফের নাম:</strong> {staff.personalInfo.fullName}</p>
          <p className="mb-1"><strong>আইডি:</strong> {staff.employeeId}</p>
        </div>
        <div>
          <p className="mb-1"><strong>পদবি:</strong> {staff.personalInfo.designation}</p>
          <p className="mb-1"><strong>বেতনের মাস:</strong> {displayMonth}</p>
        </div>
      </div>

      <table className="w-full border-collapse border border-black mb-12 text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-4 py-2 text-left">বিবরণ</th>
            <th className="border border-black px-4 py-2 text-right">পরিমাণ (টাকা)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black px-4 py-2">নির্ধারিত মূল বেতন (Basic Salary)</td>
            <td className="border border-black px-4 py-2 text-right">{payrollData.basicSalary}</td>
          </tr>
          {payrollData.bonusAmount > 0 && (
            <tr>
              <td className="border border-black px-4 py-2">ভাতা / বোনাস (+)</td>
              <td className="border border-black px-4 py-2 text-right">{payrollData.bonusAmount}</td>
            </tr>
          )}
          {payrollData.deductionAmount > 0 && (
            <tr>
              <td className="border border-black px-4 py-2">কর্তন / জরিমানা (-)</td>
              <td className="border border-black px-4 py-2 text-right">{payrollData.deductionAmount}</td>
            </tr>
          )}
          <tr className="font-bold">
            <td className="border border-black px-4 py-2 text-right">সর্বমোট প্রদেয় (Net Payable)</td>
            <td className="border border-black px-4 py-2 text-right">৳ {payrollData.netPayable}</td>
          </tr>
          <tr className="font-bold bg-green-50">
            <td className="border border-black px-4 py-2 text-right text-green-800">পরিশোধিত অংক (Paid Amount)</td>
            <td className="border border-black px-4 py-2 text-right text-green-800">৳ {payrollData.paidAmount}</td>
          </tr>
          {payrollData.dueAmount > 0 && (
            <tr className="font-bold bg-red-50">
              <td className="border border-black px-4 py-2 text-right text-red-800">বকেয়া (Due)</td>
              <td className="border border-black px-4 py-2 text-right text-red-800">৳ {payrollData.dueAmount}</td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between items-end mt-16 pt-4 text-sm">
        <div className="text-center">
          <div className="border-t border-black w-40 mb-1"></div>
          <p>হিসাবরক্ষক / ক্যাশিয়ার</p>
        </div>
        <div className="text-center">
          <div className="border-t border-black w-40 mb-1"></div>
          <p>গ্রহণকারীর স্বাক্ষর</p>
        </div>
      </div>
    </div>
  );
}