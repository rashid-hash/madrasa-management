// File: app/dashboard/classes/add/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../lib/firebase/config"; // ৪ ধাপ পেছনে
import { Section, Subject } from "../../../../types/class";
import { Staff } from "../../../../types/staff";
import { 
  Loader2, Save, ArrowLeft, PlusCircle, Trash2, 
  BookOpen, Users, GraduationCap, LayoutList 
} from "lucide-react";

export default function AddClassPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // ড্রপডাউনের জন্য ডেটাবেস থেকে আনা ডেটা
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [existingClasses, setExistingClasses] = useState<{id: string, name: string}[]>([]);

  // ফর্মের স্টেট
  const [className, setClassName] = useState("");
  const [department, setDepartment] = useState("");
  const [nextClassId, setNextClassId] = useState("");
  const [orderIndex, setOrderIndex] = useState<number>(0);

  // ডায়নামিক শাখা (Sections) স্টেট
  const [sections, setSections] = useState<Omit<Section, 'id'>[]>([
    { name: "শাখা ক", classTeacherId: "", classTeacherName: "", capacity: 40 }
  ]);

  // ডায়নামিক পাঠ্যবই (Subjects) স্টেট[cite: 1]
  const [subjects, setSubjects] = useState<Omit<Subject, 'id'>[]>([
    { name: "", author: "", subjectCode: "", isOptional: false }
  ]);

  // পেজ লোড হলে শিক্ষক এবং বিদ্যমান ক্লাসগুলোর তালিকা নিয়ে আসা
  useEffect(() => {
    const fetchData = async () => {
      try {
        // শিক্ষকদের ডেটা
        const staffQuery = query(collection(db, "staffs"), orderBy("createdAt", "desc"));
        const staffSnap = await getDocs(staffQuery);
        const staffList = staffSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Staff[];
        setTeachers(staffList);

        // বিদ্যমান ক্লাসের ডেটা (পরবর্তী ক্লাস নির্বাচনের জন্য)[cite: 1]
        const classQuery = query(collection(db, "classes"), orderBy("orderIndex", "asc"));
        const classSnap = await getDocs(classQuery);
        const classList = classSnap.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setExistingClasses(classList);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    fetchData();
  }, []);

  // --- শাখা (Section) পরিচালনার ফাংশনসমূহ ---
  const addSection = () => {
    setSections([...sections, { name: "", classTeacherId: "", classTeacherName: "", capacity: 40 }]);
  };
  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };
  const updateSection = (index: number, field: keyof Section, value: any) => {
    const updated = [...sections];
    if (field === "classTeacherId") {
      // শিক্ষকের আইডি সিলেক্ট করলে নামটাও স্বয়ংক্রিয়ভাবে আপডেট করে দেওয়া
      const selectedTeacher = teachers.find(t => t.id === value);
      updated[index].classTeacherId = value;
      updated[index].classTeacherName = selectedTeacher ? selectedTeacher.personalInfo.fullName : "";
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSections(updated);
  };

  // --- পাঠ্যবই (Subject) পরিচালনার ফাংশনসমূহ ---
  const addSubject = () => {
    setSubjects([...subjects, { name: "", author: "", subjectCode: "", isOptional: false }]);
  };
  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };
  const updateSubject = (index: number, field: keyof Subject, value: any) => {
    const updated = [...subjects];
    updated[index] = { ...updated[index], [field]: value };
    setSubjects(updated);
  };

  // ফায়ারবেসে সম্পূর্ণ ক্লাস ডেটা সেভ করা
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");

    try {
      // ডায়নামিক অ্যারেগুলোতে ইউনিক আইডি বসিয়ে দেওয়া
      const finalSections = sections.map((sec, idx) => ({ ...sec, id: `sec-${Date.now()}-${idx}` }));
      const finalSubjects = subjects.map((sub, idx) => ({ ...sub, id: `sub-${Date.now()}-${idx}` }));

      const classData = {
        name: className,
        department,
        nextClassId: nextClassId || null,
        orderIndex,
        sections: finalSections,
        subjects: finalSubjects,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "classes"), classData);
      
      setSuccessMsg("নতুন ক্লাস সফলভাবে তৈরি হয়েছে!");
      
      // ফর্ম রিসেট
      setClassName(""); setDepartment(""); setNextClassId(""); setOrderIndex(0);
      setSections([{ name: "শাখা ক", classTeacherId: "", classTeacherName: "", capacity: 40 }]);
      setSubjects([{ name: "", author: "", subjectCode: "", isOptional: false }]);
      
    } catch (error) {
      alert("ডেটা সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">নতুন ক্লাস/জামাত তৈরি</h1>
          <p className="text-gray-500 text-sm mt-1">ক্লাসের মৌলিক তথ্য, শাখা এবং পাঠ্যবই নির্ধারণ করুন</p>
        </div>
        <Link 
          href="/dashboard/classes"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 bg-white px-4 py-2 rounded-lg border shadow-sm transition"
        >
          <ArrowLeft size={18} />
          তালিকায় ফিরে যান
        </Link>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-xl flex items-center gap-2 font-medium shadow-sm">
          <GraduationCap size={20} />
          {successMsg}
        </div>
      )}

      {/* মূল ফর্ম */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* ১. মৌলিক তথ্য */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800 border-b pb-3 mb-5">
            <LayoutList className="text-blue-600" size={20} />
            ক্লাসের মৌলিক তথ্য
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ক্লাস/জামাতের নাম *</label>
              <input 
                required type="text" placeholder="উদাঃ কিতাব বিভাগ (১ম বর্ষ)"
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={className} onChange={(e) => setClassName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">বিভাগ (Department) *</label>
              <select 
                required className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={department} onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">নির্বাচন করুন</option>
                <option value="মক্তব">মক্তব / সাধারণ</option>
                <option value="হিফজ">হিফজুল কুরআন</option>
                <option value="কিতাব">কিতাব বিভাগ</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পরবর্তী ক্লাস (প্রমোশনের জন্য)[cite: 1]</label>
              <select 
                className="w-full border rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                value={nextClassId} onChange={(e) => setNextClassId(e.target.value)}
              >
                <option value="">-- প্রযোজ্য নয় / শেষ ক্লাস --</option>
                {existingClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">বছর শেষে প্রমোশন দিলে শিক্ষার্থীরা স্বয়ংক্রিয়ভাবে এই ক্লাসে যাবে।</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">প্রদর্শনের ক্রম (Sort Order)[cite: 1]</label>
              <input 
                required type="number" min="0"
                className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                value={orderIndex} onChange={(e) => setOrderIndex(Number(e.target.value))}
              />
              <p className="text-xs text-gray-500 mt-1">তালিকায় কত নম্বরে দেখাবে (যেমন: 1, 2, 3)।</p>
            </div>
          </div>
        </div>

        {/* ২. সেকশন / শাখা তৈরি */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Users className="text-purple-600" size={20} />
              শাখা ও আসনসংখ্যা[cite: 1]
            </h3>
            <button type="button" onClick={addSection} className="flex items-center gap-1.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg font-medium transition">
              <PlusCircle size={16} /> নতুন শাখা
            </button>
          </div>
          
          <div className="space-y-4">
            {sections.map((section, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-slate-50 border border-slate-100 rounded-lg relative group">
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">শাখার নাম *</label>
                  <input required type="text" placeholder="উদাঃ শাখা ক / আবু বকর (রাঃ)" className="w-full border rounded-lg px-3 py-2 text-sm" value={section.name} onChange={(e) => updateSection(idx, 'name', e.target.value)} />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">দায়িত্বপ্রাপ্ত শিক্ষক (ঐচ্ছিক)[cite: 1]</label>
                  <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white" value={section.classTeacherId} onChange={(e) => updateSection(idx, 'classTeacherId', e.target.value)}>
                    <option value="">-- নির্বাচন করুন --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.personalInfo.fullName}</option>
                    ))}
                  </select>
                </div>
                <div className="w-full md:w-1/4">
                  <label className="block text-xs font-medium text-gray-600 mb-1">আসনসংখ্যা *</label>
                  <input required type="number" min="1" className="w-full border rounded-lg px-3 py-2 text-sm" value={section.capacity || ""} onChange={(e) => updateSection(idx, 'capacity', Number(e.target.value))} />
                </div>
                
                {sections.length > 1 && (
                  <button type="button" onClick={() => removeSection(idx)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-lg border hover:bg-red-50 transition" title="শাখা মুছুন">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ৩. পাঠ্যবইয়ের তালিকা */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between border-b pb-3 mb-5">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <BookOpen className="text-green-600" size={20} />
              নির্ধারিত পাঠ্যবই[cite: 1]
            </h3>
            <button type="button" onClick={addSubject} className="flex items-center gap-1.5 text-sm text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg font-medium transition">
              <PlusCircle size={16} /> নতুন বই
            </button>
          </div>
          
          <div className="space-y-4">
            {subjects.map((subject, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-4 items-end p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div className="w-full md:w-2/5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">বই বা বিষয়ের নাম *</label>
                  <input required type="text" placeholder="উদাঃ কুরআন মাজিদ / বাংলা ১ম পত্র" className="w-full border rounded-lg px-3 py-2 text-sm" value={subject.name} onChange={(e) => updateSubject(idx, 'name', e.target.value)} />
                </div>
                <div className="w-full md:w-2/5">
                  <label className="block text-xs font-medium text-gray-600 mb-1">লেখকের নাম (ঐচ্ছিক)[cite: 1]</label>
                  <input type="text" placeholder="উদাঃ এনসিটিবি / অন্যান্য" className="w-full border rounded-lg px-3 py-2 text-sm" value={subject.author} onChange={(e) => updateSubject(idx, 'author', e.target.value)} />
                </div>
                <div className="w-full md:w-1/5 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={subject.isOptional} onChange={(e) => updateSubject(idx, 'isOptional', e.target.checked)} />
                    <span className="text-sm font-medium text-gray-700">ঐচ্ছিক বিষয়?</span>
                  </label>
                </div>
                
                {subjects.length > 1 && (
                  <button type="button" onClick={() => removeSubject(idx)} className="text-red-400 hover:text-red-600 p-2 bg-white rounded-lg border hover:bg-red-50 transition" title="বই মুছুন">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* সাবমিট বাটন */}
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-blue-400 font-bold shadow-md hover:shadow-lg"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {isSubmitting ? "সংরক্ষণ হচ্ছে..." : "ক্লাস ও শাখা তৈরি করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}