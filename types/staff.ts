export interface Staff {
  id?: string;
  employeeId: string;
  personalInfo: {
    fullName: string;
    phone: string;
    email?: string;
    designation: string; // যেমন: "প্রধান শিক্ষক", "হিসাবরক্ষক", "নিরাপত্তারক্ষী"
    joinDate: string;
  };
  salaryInfo: {
    basicSalary: number;
    // বেতনের বর্তমান অবস্থা (তিন রঙের ব্যাজের জন্য)
    currentStatus: 'due' | 'paid' | 'advance'; 
    lastPaidMonth?: string; // যেমন: "2026-08"
  };
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface PayrollRecord {
  id?: string;
  staffId: string;
  staffName: string;
  month: string; // যে মাসের বেতন দেওয়া হচ্ছে (যেমন: "2026-09")
  basicSalary: number;
  bonusAmount: number; // ভাতা বা বোনাস (+)
  deductionAmount: number; // কর্তন (-)
  netPayable: number;
  paidAmount: number; // আংশিক পরিশোধের জন্য
  dueAmount: number;
  paymentDate: string;
  processedBy: string;
  status: 'paid' | 'partial';
}