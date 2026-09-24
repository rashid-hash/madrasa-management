// File: app/dashboard/library/page.tsx
"use client";

import { useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/firebase/config";
import { 
  Library, BookOpen, Plus, ArrowRightLeft, Search, Loader2, 
  CheckCircle2, Trash2, Clock, CheckCircle, AlertCircle, Save
} from "lucide-react";

interface Book {
  id?: string;
  title: string;
  author: string;
  category: string;
  shelfCode: string;
  price: number;
  totalCopies: number;
  availableCopies: number;
}

interface IssueRecord {
  id?: string;
  bookId: string;
  bookTitle: string;
  userId: string; // স্টুডেন্ট বা স্টাফ আইডি
  issueDate: string;
  dueDate: string;
  status: "issued" | "returned";
  fineAmount?: number;
}

export default function LibraryManagementPage() {
  const [activeTab, setActiveTab] = useState<"books" | "issues">("books");
  
  // ডেটা স্টেট
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // নতুন বইয়ের ফর্ম স্টেট
  const [newBook, setNewBook] = useState({
    title: "", author: "", category: "", shelfCode: "", price: "", totalCopies: ""
  });

  // বই ইস্যুর ফর্ম স্টেট
  const [issueData, setIssueData] = useState({
    bookId: "", userId: "", dueDate: ""
  });

  // ১. রিয়েল-টাইম ডেটা ফেচিং
  useEffect(() => {
    // বইয়ের তালিকা ফেচ
    const qBooks = query(collection(db, "library_books"), orderBy("title", "asc"));
    const unsubBooks = onSnapshot(qBooks, (snap) => {
      setBooks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Book[]);
    });

    // ইস্যু রেকর্ড ফেচ
    const qIssues = query(collection(db, "library_issues"), orderBy("issueDate", "desc"));
    const unsubIssues = onSnapshot(qIssues, (snap) => {
      setIssues(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as IssueRecord[]);
      setLoading(false);
    });

    return () => { unsubBooks(); unsubIssues(); };
  }, []);

  // ২. নতুন বই যুক্ত করা
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      await addDoc(collection(db, "library_books"), {
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        shelfCode: newBook.shelfCode,
        price: Number(newBook.price),
        totalCopies: Number(newBook.totalCopies),
        availableCopies: Number(newBook.totalCopies), // শুরুতে সব কপি এভেইলেবল
        createdAt: serverTimestamp()
      });
      
      setSuccessMsg("লাইব্রেরীতে নতুন বই সফলভাবে যুক্ত হয়েছে!");
      setNewBook({ title: "", author: "", category: "", shelfCode: "", price: "", totalCopies: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("বই যুক্ত করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ৩. বই ইস্যু করা (ক্যাটালগ অনুযায়ী)
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueData.bookId || !issueData.userId || !issueData.dueDate) return;

    const book = books.find(b => b.id === issueData.bookId);
    if (!book || book.availableCopies <= 0) {
      alert("দুঃখিত, এই বইটি এই মুহূর্তে লাইব্রেরীতে নেই (সব কপি ইস্যু করা হয়েছে)!");
      return;
    }

    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      // ইস্যু রেকর্ড সেভ করা
      await addDoc(collection(db, "library_issues"), {
        bookId: book.id,
        bookTitle: book.title,
        userId: issueData.userId,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: issueData.dueDate,
        status: "issued"
      });

      // বইয়ের Available কপি ১টি কমিয়ে দেওয়া
      await updateDoc(doc(db, "library_books", book.id!), {
        availableCopies: book.availableCopies - 1
      });

      setSuccessMsg(`'${book.title}' বইটি সফলভাবে ইস্যু করা হয়েছে!`);
      setIssueData({ bookId: "", userId: "", dueDate: "" });
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("বই ইস্যু করতে সমস্যা হয়েছে।");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ৪. বই ফেরত নেওয়া (স্বয়ংক্রিয় আপডেট)
  const handleReturnBook = async (issueId: string, bookId: string) => {
    if (!confirm("বইটি কি ফেরত নেওয়া হয়েছে নিশ্চিত করতে চান?")) return;

    try {
      // ইস্যু স্ট্যাটাস 'returned' করা
      await updateDoc(doc(db, "library_issues", issueId), {
        status: "returned",
        returnDate: new Date().toISOString().split('T')[0]
      });

      // বইয়ের Available কপি আবার ১টি বাড়িয়ে দেওয়া
      const book = books.find(b => b.id === bookId);
      if (book) {
        await updateDoc(doc(db, "library_books", bookId), {
          availableCopies: book.availableCopies + 1
        });
      }
      
      alert("বই সফলভাবে ফেরত নেওয়া হয়েছে!");
    } catch (error) {
      alert("বই ফেরত নিতে সমস্যা হয়েছে।");
    }
  };

  // ৫. বই ডিলিট করা
  const handleDeleteBook = async (id: string) => {
    if (!confirm("আপনি কি নিশ্চিত যে এই বইটি মুছে ফেলতে চান?")) return;
    try {
      await deleteDoc(doc(db, "library_books", id));
    } catch (error) {
      alert("মুছতে সমস্যা হয়েছে।");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Library size={26} className="text-emerald-600" />
            লাইব্রেরী ব্যবস্থাপনা
          </h1>
          <p className="text-gray-500 text-sm mt-1">বইয়ের তালিকা, স্টক, ইস্যু এবং ফেরত পরিচালনা করুন</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <CheckCircle2 size={20} /> {successMsg}
        </div>
      )}

      {/* ট্যাব নেভিগেশন */}
      <div className="flex border-b border-gray-200 bg-white rounded-t-xl overflow-hidden">
        <button 
          onClick={() => setActiveTab("books")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "books" ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <BookOpen size={18} /> বইয়ের তালিকা ও স্টক
        </button>
        <button 
          onClick={() => setActiveTab("issues")}
          className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === "issues" ? "bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <ArrowRightLeft size={18} /> বই ইস্যু ও ফেরত[cite: 5]
        </button>
      </div>

      {/* ট্যাব ১: বইয়ের তালিকা */}
      {activeTab === "books" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* নতুন বই যুক্ত করার ফর্ম */}
          <div className="col-span-1">
            <form onSubmit={handleAddBook} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-5 border-b bg-slate-50">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Plus size={18} className="text-emerald-600"/> নতুন বই যুক্ত করুন
                </h3>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বইয়ের শিরোনাম *</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newBook.title} onChange={e => setNewBook({...newBook, title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">লেখকের নাম[cite: 5] *</label>
                  <input required type="text" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newBook.author} onChange={e => setNewBook({...newBook, author: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">ক্যাটাগরি/বিষয়[cite: 5]</label>
                    <input required type="text" placeholder="যেমন: ইতিহাস" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newBook.category} onChange={e => setNewBook({...newBook, category: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">শেলফ কোড[cite: 5]</label>
                    <input required type="text" placeholder="যেমন: A-12" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono" value={newBook.shelfCode} onChange={e => setNewBook({...newBook, shelfCode: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">মূল্য (৳)[cite: 5]</label>
                    <input required type="number" min="0" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newBook.price} onChange={e => setNewBook({...newBook, price: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">মোট কপি[cite: 5] *</label>
                    <input required type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={newBook.totalCopies} onChange={e => setNewBook({...newBook, totalCopies: e.target.value})} />
                  </div>
                </div>
                
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-sm disabled:bg-slate-500">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} 
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>

          {/* বইয়ের তালিকা */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b text-gray-600">
                      <th className="p-4 font-bold">বইয়ের তথ্য</th>
                      <th className="p-4 font-bold">ক্যাটাগরি ও শেলফ</th>
                      <th className="p-4 font-bold text-center">স্টক অবস্থা</th>
                      <th className="p-4 font-bold text-right">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400"><Loader2 className="animate-spin inline" size={24}/></td></tr>
                    ) : books.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">কোনো বই যুক্ত করা হয়নি</td></tr>
                    ) : (
                      books.map(book => (
                        <tr key={book.id} className="border-b border-gray-100 hover:bg-slate-50 transition">
                          <td className="p-4">
                            <p className="font-bold text-gray-900">{book.title}</p>
                            <p className="text-xs text-gray-500">লেখক: {book.author}</p>
                            <p className="text-xs text-emerald-600 font-medium">মূল্য: ৳{book.price}</p>
                          </td>
                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-bold mb-1">{book.category}</span>
                            <p className="text-xs font-mono font-bold text-gray-500 flex items-center gap-1 mt-1">শেলফ: {book.shelfCode}</p>
                          </td>
                          <td className="p-4 text-center">
                            <div className="flex flex-col items-center">
                              <span className={`text-lg font-black ${book.availableCopies === 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                {book.availableCopies}
                              </span>
                              <span className="text-[10px] text-gray-500 font-bold uppercase">এভেইলেবল (মোট {book.totalCopies})</span>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteBook(book.id!)} className="text-gray-400 hover:text-red-500 transition bg-white p-2 rounded-lg border shadow-sm hover:bg-red-50">
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

      {/* ট্যাব ২: ইস্যু ও ফেরত */}
      {activeTab === "issues" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ইস্যু ফর্ম */}
          <div className="col-span-1">
            <form onSubmit={handleIssueBook} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-5 border-b bg-emerald-50">
                <h3 className="font-bold text-emerald-800 flex items-center gap-2">
                  <ArrowRightLeft size={18} /> বই ইস্যু করুন
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">বই নির্বাচন করুন *</label>
                  <select required className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={issueData.bookId} onChange={e => setIssueData({...issueData, bookId: e.target.value})}>
                    <option value="">-- বই সিলেক্ট করুন --</option>
                    {books.map(b => (
                      <option key={b.id} value={b.id} disabled={b.availableCopies === 0}>
                        {b.title} {b.availableCopies === 0 ? "(স্টক নেই)" : `(${b.availableCopies} টি আছে)`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">গ্রহীতার আইডি (স্টুডেন্ট/স্টাফ)[cite: 5] *</label>
                  <input required type="text" placeholder="যেমন: ST-101" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-mono" value={issueData.userId} onChange={e => setIssueData({...issueData, userId: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">ফেরত দেওয়ার তারিখ (Due Date)[cite: 5] *</label>
                  <input required type="date" className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={issueData.dueDate} onChange={e => setIssueData({...issueData, dueDate: e.target.value})} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full mt-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition shadow-sm disabled:bg-emerald-400">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />} ইস্যু নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>

          {/* ইস্যুকৃত বইয়ের তালিকা */}
          <div className="col-span-1 lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px]">
              <div className="p-4 border-b bg-slate-50 flex items-center justify-between">
                <h3 className="font-bold text-gray-800 text-sm">সাম্প্রতিক ইস্যু রেকর্ড</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-white border-b text-gray-600">
                      <th className="p-4 font-bold">বইয়ের নাম</th>
                      <th className="p-4 font-bold">গ্রহীতার আইডি</th>
                      <th className="p-4 font-bold text-center">তারিখ</th>
                      <th className="p-4 font-bold text-center">স্ট্যাটাস</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium">কোনো বই ইস্যু করা হয়নি</td></tr>
                    ) : (
                      issues.map(issue => {
                        const isOverdue = issue.status === "issued" && new Date(issue.dueDate) < new Date();
                        return (
                          <tr key={issue.id} className="border-b border-gray-100 hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-gray-900">{issue.bookTitle}</td>
                            <td className="p-4 font-mono font-bold text-indigo-600">{issue.userId}</td>
                            <td className="p-4 text-center">
                              <div className="text-xs text-gray-500">ইস্যু: {issue.issueDate}</div>
                              <div className={`text-xs font-bold mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                ফেরত: {issue.dueDate}
                              </div>
                            </td>
                            <td className="p-4 text-center">
                              {issue.status === "issued" ? (
                                <button 
                                  onClick={() => handleReturnBook(issue.id!, issue.bookId)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition ${isOverdue ? 'bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 mx-auto' : 'bg-amber-100 hover:bg-amber-200 text-amber-800'}`}
                                >
                                  {isOverdue && <AlertCircle size={14}/>} {isOverdue ? "মেয়াদোত্তীর্ণ (ফেরত নিন)" : "ফেরত নিন"}
                                </button>
                              ) : (
                                <span className="inline-block px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                                  <CheckCircle2 size={14} className="inline mr-1"/> ফেরত এসেছে
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
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