// File: types/class.ts

// সেকশন বা শাখার স্কিমা
export interface Section {
  id: string; // যেমন: 'sec-a'
  name: string; // যেমন: 'শাখা ক' বা 'আবু বকর (রাঃ)'
  classTeacherId: string; // 'staffs' কালেকশনের আইডি
  classTeacherName: string; 
  capacity: number; // আসনসংখ্যা
}

// পাঠ্যবই বা বিষয়ের স্কিমা
export interface Subject {
  id: string;
  name: string;
  author: string; // লেখকের নাম
  subjectCode: string;
  isOptional: boolean;
}

// মূল ক্লাস বা জামাতের স্কিমা
export interface ClassInfo {
  id?: string;
  name: string; // যেমন: 'হিফজুল কুরআন', 'কিতাব বিভাগ (১ম বর্ষ)'
  department: string; // বিভাগ (যেমন: মক্তব, হিফজ, কিতাব)
  nextClassId: string | null; // প্রমোশনের জন্য পরের ক্লাস
  orderIndex: number; // ক্লাসের প্রদর্শনের ক্রম সাজানোর জন্য
  sections: Section[]; // একাধিক সেকশন[cite: 1]
  subjects: Subject[]; // পাঠ্যবইয়ের তালিকা[cite: 1]
  status: 'active' | 'inactive';
  createdAt: string;
}

// রুটিনের সেটিং ও পিরিয়ডের স্কিমা (ভবিষ্যতের রুটিন পেজের জন্য)
export interface PeriodTime {
  periodNumber: number;
  startTime: string; // যেমন: "08:00 AM"
  endTime: string;
}

export interface RoutineSchedule {
  day: string; // যেমন: "শনিবার"
  periodNumber: number;
  subjectId: string;
  teacherId: string;
  isDoublePeriod: boolean; // ডাবল-পিরিয়ড সুবিধা[cite: 1]
}