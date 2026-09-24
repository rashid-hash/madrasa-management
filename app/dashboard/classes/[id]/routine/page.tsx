"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { doc, getDoc, updateDoc, collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../../../../../lib/firebase/config"; // ৫ ধাপ পেছনে
import { ClassInfo, Section, Subject } from "../../../../../types/class";
import { Staff } from "../../../../../types/staff";
import { 
  CalendarClock, ArrowLeft, Plus, Save, Loader2, X, CheckCircle2 
} from "lucide-react";

// রুটিনের দিন ও পিরিয়ডের কাঠামো
const DAYS = ["শনিবার", "রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার"];
const PERIODS = [1, 2, 3, 4, 5, 6]; 

export default function RoutineBuilderPage() {
  const params = useParams();
  const classId = params.id as string;

  // ডেটাবেসের স্টেট
  const [classData, setClassData] = useState<ClassInfo | null>(null);
  const [teachers, setTeachers] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  
  // রুটিন ও সেকশন ম্যানেজমেন্ট স্টেট
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [routines, setRoutines] = useState<Record<string, Record<string, any>>>({}); // { sectionId: { "শনিবার-1": {subject, teacher} } }
  
  // সেভ স্টেট
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // মডাল (Modal) স্টেট
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ day: string, period: number } | null>(null);
  
  // মডাল ফর্মের স্টেট
  const [cellSubjectId, setCellSubjectId] = useState("");
  const [cellTeacherId, setCellTeacherId] = useState("");
  const [isDoublePeriod, setIsDoublePeriod] = useState(false);

  // পেজ লোড হলে ক্লাস ও শিক্ষকদের ডেটা আনা
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ক্লাস ডেটা
        const classRef = doc(db, "classes", classId);
        const classSnap = await getDoc(classRef);
        
        if (classSnap.exists()) {
          const data = { id: classSnap.id, ...classSnap.data() } as ClassInfo;
          setClassData(data);
          
          if (data.sections?.length > 0) {
            setSelectedSection(data.sections[0].id); // ডিফল্ট প্রথম সেকশন সিলেক্ট
          }
          
          // যদি আগে থেকে রুটিন সেভ করা থাকে (Firestore-এ routines ফিল্ড হিসেবে)
          if (classSnap.data().routines) {
            setRoutines(classSnap.data().routines);
          }
        }

        // শিক্ষকদের ডেটা
        const staffQ = query(collection(db, "staffs"), orderBy("createdAt", "desc"));
        const staffSnap = await getDocs(staffQ);
        setTeachers(staffSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Staff[]);
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (classId) fetchData();
  }, [classId]);

  // সেলে (Cell) ক্লিক করলে মডাল ওপেন করা
  const handleCellClick = (day: string, period: number) => {
    if (!selectedSection) return alert("প্রথমে শাখা নির্বাচন করুন!");
    
    setEditingCell({ day, period });
    
    // সেলে আগে থেকে ডেটা থাকলে তা মডালে বসানো
    const cellKey = `${day}-${period}`;
    const existingData = routines[selectedSection]?.[cellKey];
    
    if (existingData) {
      setCellSubjectId(existingData.subjectId || "");
      setCellTeacherId(existingData.teacherId || "");
      setIsDoublePeriod(existingData.isDoublePeriod || false);
    } else {
      setCellSubjectId("");
      setCellTeacherId("");
      setIsDoublePeriod(false);
    }
    
    setModalOpen(true);
  };

  // মডাল থেকে সেলে ডেটা সেট করা (লোকাল স্টেট আপডেট)
  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell || !selectedSection) return;

    const cellKey = `${editingCell.day}-${editingCell.period}`;
    
    setRoutines(prev => ({
      ...prev,
      [selectedSection]: {
        ...prev[selectedSection],
        [cellKey]: {
          subjectId: cellSubjectId,
          teacherId: cellTeacherId,
          isDoublePeriod: isDoublePeriod // ডাবল পিরিয়ড যুক্ত করা হলো
        }
      }
    }));
    
    setModalOpen(false);
  };

  // সেলের ডেটা মুছে ফেলা (Clear period)
  const handleClearCell = () => {
    if (!editingCell || !selectedSection) return;
    const cellKey = `${editingCell.day}-${editingCell.period}`;
    
    setRoutines(prev => {
      const updatedSectionRoutine = { ...prev[selectedSection] };
      delete updatedSectionRoutine[cellKey];
      return { ...prev, [selectedSection]: updatedSectionRoutine };
    });
    
    setModalOpen(false);
  };

  // ফায়ারবেসে রুটিন সেভ করা
  const saveRoutineToDB = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const classRef = doc(db, "classes", classId);
      await updateDoc(classRef, { routines });
      setSuccessMsg("রুটিন সফলভাবে সেভ হয়েছে!");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (error) {
      alert("রুটিন সেভ করতে সমস্যা হয়েছে।");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-12 text-center text-gray-500">ডেটা লোড হচ্ছে...</div>;
  if (!classData) return <div className="p-12 text-center text-red-500">ক্লাসের তথ্য পাওয়া যায়নি।</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      
      {/* হেডার ও ব্যাক বাটন */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarClock size={24} className="text-blue-600" />
            রুটিন তৈরি: {classData.name}
          </h1>
          <p className="text-gray-500 text-sm mt-1">শাখা নির্বাচন করুন এবং গ্রিডে ক্লিক করে বিষয় ও শিক্ষক বসান</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/classes" className="flex items-center gap-2 text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm hover:text-blue-600 transition">
            <ArrowLeft size={18} /> তালিকায় ফিরে যান
          </Link>
          <button 
            onClick={saveRoutineToDB} disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:bg-blue-700 transition disabled:bg-blue-400"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            রুটিন সেভ করুন
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center gap-2 font-medium">
          <CheckCircle2 size={18} /> {successMsg}
        </div>
      )}

      {/* শাখা ফিল্টার ট্যাব */}
      <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex flex-wrap gap-2">
        {classData.sections?.map(sec => (
          <button
            key={sec.id}
            onClick={() => setSelectedSection(sec.id)}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition ${
              selectedSection === sec.id 
              ? "bg-blue-50 text-blue-700 border border-blue-200" 
              : "text-gray-600 hover:bg-gray-100 border border-transparent"
            }`}
          >
            {sec.name}
          </button>
        ))}
      </div>

      {/* রুটিন গ্রিড (Table) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="p-4 border-r border-slate-700 w-32 font-medium text-center">দিন / পিরিয়ড</th>
                {PERIODS.map(period => (
                  <th key={period} className="p-4 border-r border-slate-700 text-center font-medium">
                    {period}ম পিরিয়ড
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map(day => (
                <tr key={day} className="border-b border-gray-200 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4 border-r border-gray-200 bg-slate-50 font-bold text-gray-700 text-center">
                    {day}
                  </td>
                  
                  {PERIODS.map(period => {
                    const cellKey = `${day}-${period}`;
                    const cellData = routines[selectedSection]?.[cellKey];
                    const subject = classData.subjects?.find(s => s.id === cellData?.subjectId);
                    const teacher = teachers.find(t => t.id === cellData?.teacherId);

                    return (
                      <td 
                        key={period} 
                        onClick={() => handleCellClick(day, period)}
                        className={`p-2 border-r border-gray-200 cursor-pointer transition h-24 align-top relative group
                          ${cellData ? "bg-blue-50/30 hover:bg-blue-50" : "hover:bg-gray-50"}
                        `}
                      >
                        {cellData ? (
                          <div className="flex flex-col justify-between h-full p-1">
                            <div>
                              <div className="text-sm font-bold text-gray-800 leading-tight">
                                {subject ? subject.name : "বিষয় নেই"}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">
                                {teacher ? teacher.personalInfo.fullName : "শিক্ষক নেই"}
                              </div>
                            </div>
                            {cellData.isDoublePeriod && (
                              <div className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded uppercase font-bold w-fit mt-2">
                                ডাবল পিরিয়ড
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition">
                            <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                              <Plus size={14}/> যুক্ত করুন
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* মডাল (Modal) - পিরিয়ডে বিষয় ও শিক্ষক বসানোর জন্য */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b bg-slate-50">
              <h3 className="font-bold text-gray-800 text-lg">
                পিরিয়ড সেটআপ ({editingCell?.day}, {editingCell?.period}ম)
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-red-500">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleModalSave} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">বিষয় (Subject) *</label>
                <select 
                  required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={cellSubjectId} onChange={e => setCellSubjectId(e.target.value)}
                >
                  <option value="">-- বিষয় নির্বাচন করুন --</option>
                  {classData.subjects?.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">শিক্ষক (Teacher) *</label>
                <select 
                  required className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                  value={cellTeacherId} onChange={e => setCellTeacherId(e.target.value)}
                >
                  <option value="">-- শিক্ষক নির্বাচন করুন --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.personalInfo.fullName} ({t.employeeId})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 p-3 rounded-lg border">
                  <input 
                    type="checkbox" className="w-4 h-4 text-purple-600 rounded" 
                    checked={isDoublePeriod} onChange={e => setIsDoublePeriod(e.target.checked)} 
                  />
                  <div>
                    <span className="text-sm font-bold text-gray-800 block">ডাবল পিরিয়ড হিসেবে সেট করুন</span>
                    <span className="text-xs text-gray-500">এটি সিলেক্ট করলে পরবর্তী পিরিয়ডটিও একই বিষয়ের জন্য নির্ধারিত হবে।</span>
                  </div>
                </label>
              </div>

              <div className="pt-4 flex items-center justify-between border-t mt-2">
                <button type="button" onClick={handleClearCell} className="text-red-500 text-sm font-medium hover:underline">
                  পিরিয়ড মুছুন
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-gray-50">
                    বাতিল
                  </button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                    সেট করুন
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}