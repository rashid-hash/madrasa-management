// File: app/page.tsx
"use client";

import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 text-center border border-gray-100">
        
        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
          <Building2 size={48} />
        </div>
        
        <h1 className="text-3xl font-black text-gray-900 mb-2">ডিজিটাল মাদ্রাসা</h1>
        <p className="text-gray-500 mb-8 font-medium">অ্যাডভান্সড ম্যানেজমেন্ট সফটওয়্যার</p>
        
        <Link 
          href="/dashboard" 
          className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-blue-200"
        >
          ড্যাশবোর্ডে প্রবেশ করুন <ArrowRight size={20} />
        </Link>
        
      </div>
      
      <p className="mt-8 text-sm text-gray-400 font-medium">
        Developed with Next.js & Firebase
      </p>
    </div>
  );
}