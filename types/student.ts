export interface Student {
  id?: string; // Firebase Document ID
  admissionNumber: string; // ইউনিক ভর্তি নম্বর
  
  basicInfo: {
    fullName: string;
    dob: string; // জন্ম তারিখ
    gender: 'male' | 'female';
    bloodGroup?: string;
  };

  familyInfo: {
    fatherName: string;
    motherName: string;
    guardianPhone: string;
    guardianRelation: string; // অভিভাবকের সাথে সম্পর্ক[cite: 1]
  };

  address: {
    present: string;
    permanent: string;
  };

  healthDetails?: string; // স্বাস্থ্য সংক্রান্ত তথ্য[cite: 1]
  
  academicInfo: {
    classId: string; // 'classes' কালেকশনের রেফারেন্স
    sectionId: string;
    previousInstitute?: string;
  };

  status: 'active' | 'incomplete' | 'dropped'; // ফি বাকি থাকলে 'incomplete'[cite: 1]
  createdAt: Date | string;
}