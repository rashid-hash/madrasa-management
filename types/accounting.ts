export interface Transaction {
  id?: string;
  studentId: string;
  studentName: string;
  feeType: 'admission' | 'monthly' | 'exam' | 'other';
  amount: number;
  discount: number;
  netAmount: number;
  amountInWords: string; // টাকা কথায় লেখা
  collectedBy: string; // যে ইউজার ফি গ্রহণ করেছেন
  date: Date | string;
  status: 'completed' | 'refunded';
}