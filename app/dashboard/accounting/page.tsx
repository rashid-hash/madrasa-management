import Link from "next/link";
import { 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Receipt,
  FileSpreadsheet,
  AlertCircle
} from "lucide-react";

export default function AccountingDashboard() {
  return (
    <div className="space-y-6">
      
      {/* হেডার */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">একাউন্টিং ও অর্থ ব্যবস্থাপনা</h1>
        <p className="text-gray-500 text-sm mt-1">প্রতিষ্ঠানের আয়, ব্যয় এবং বকেয়া হিসাবের সারাংশ</p>
      </div>

      {/* ক্যাটালগ অনুযায়ী আয়-ব্যয়ের সারাংশ কার্ড[cite: 1] */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">আজকের আয়</h3>
            <span className="p-2 bg-green-50 text-green-600 rounded-lg"><TrendingUp size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">৳ ৫,৪০০</p>
          <p className="text-sm text-green-600 mt-2 font-medium">গতকালের চেয়ে ১২% বেশি</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">আজকের ব্যয়</h3>
            <span className="p-2 bg-red-50 text-red-600 rounded-lg"><TrendingDown size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">৳ ১,২০০</p>
          <p className="text-sm text-gray-500 mt-2">বিদ্যুৎ ও আনুষঙ্গিক</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">চলতি মাসের আয়</h3>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Wallet size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">৳ ১,৪৫,০০০</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 text-sm font-medium">মোট বকেয়া</h3>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg"><AlertCircle size={20} /></span>
          </div>
          <p className="text-3xl font-bold text-gray-800">৳ ২৮,৫০০</p>
        </div>
      </div>

      {/* দ্রুত কাজের শর্টকাট (Quick Actions)[cite: 1] */}
      <h2 className="text-lg font-bold text-gray-800 mt-8 mb-4">দ্রুত অ্যাকশন</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* এই লিংকটি আমাদের বানানো ফি পেজে নিয়ে যাবে */}
        <Link 
          href="/dashboard/accounting/fees"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition group"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition">
            <CreditCard size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">ফি গ্রহণ করুন</h3>
            <p className="text-sm text-gray-500 mt-1">শিক্ষার্থীর ভর্তি, মাসিক ও পরীক্ষার ফি সংগ্রহ</p>
          </div>
        </Link>

        {/* ভবিষ্যতের মডিউল লিংক */}
        <Link 
          href="/dashboard/accounting/expenses"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-red-300 hover:shadow-md transition group"
        >
          <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition">
            <Receipt size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">ব্যয় এন্ট্রি (ভাউচার)</h3>
            <p className="text-sm text-gray-500 mt-1">প্রতিষ্ঠানের দৈনন্দিন খরচের হিসাব রাখুন</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/accounting/reports"
          className="flex items-start gap-4 p-5 bg-white border border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition group"
        >
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">আর্থিক রিপোর্ট</h3>
            <p className="text-sm text-gray-500 mt-1">দেনাদার/পাওনাদার ও খাতভিত্তিক রিপোর্ট</p>
          </div>
        </Link>

      </div>
    </div>
  );
}