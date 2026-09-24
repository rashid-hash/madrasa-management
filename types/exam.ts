// File: types/exam.ts

// পরীক্ষার মূল স্কিমা
export interface Exam {
  id?: string;
  name: string; // যেমন: "অর্ধ-বার্ষিক পরীক্ষা ২০২৬"
  term: string; // যেমন: "Half-Yearly", "Final"
  examDate: string; // শুরুর তারিখ
  status: 'upcoming' | 'ongoing' | 'completed';
  isResultPublished: boolean; // এক ক্লিকে ফলাফল প্রকাশ/অপ্রকাশ নিয়ন্ত্রণ
  participatingClasses: string[]; // কোন কোন ক্লাস অংশগ্রহণ করছে
  createdAt: string;
}

// গ্রেডিং স্কেল স্কিমা[cite: 1]
export interface GradingScale {
  id?: string;
  name: string; // যেমন: "সাধারণ গ্রেডিং", "হিফজ গ্রেডিং"
  type: 'gpa' | 'average'; // জিপিএ-ভিত্তিক নাকি গড় নম্বর-ভিত্তিক[cite: 1]
  rules: {
    minMarks: number;
    maxMarks: number;
    grade: string; // যেমন: A+, A, B
    point: number; // যেমন: 5.0, 4.0
  }[];
}

// পরীক্ষার কক্ষ ও সিট প্ল্যানের স্কিমা[cite: 1]
export interface ExamRoom {
  id?: string;
  roomName: string; // যেমন: "হল রুম ১", "কক্ষ ১০২"
  capacity: number; // আসনসংখ্যা[cite: 1]
  invigilatorId?: string; // কক্ষ পরিদর্শক[cite: 1]
  status: 'active' | 'inactive';
}

// শিক্ষার্থীর প্রাপ্ত নম্বর ও ফলাফলের স্কিমা
export interface ExamResult {
  id?: string;
  examId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  marks: {
    subjectId: string;
    writtenMark: number;
    mcqMark?: number;
    attendanceMark?: number; // "উপস্থিতি" বিষয় হিসেবে নম্বর যোগ করার সুবিধা[cite: 1]
    totalSubjectMark: number;
    grade: string;
    point: number;
  }[];
  totalMarks: number;
  finalGpa: number;
  finalGrade: string;
  meritPosition?: number; // মেধা তালিকা[cite: 1]
  status: 'passed' | 'failed' | 'withheld';
}