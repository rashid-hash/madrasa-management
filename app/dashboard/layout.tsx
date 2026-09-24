// File: app/dashboard/layout.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CreditCard, 
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  FileSignature
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = [
    { name: "ড্যাশবোর্ড", href: "/dashboard", icon: LayoutDashboard },
    { name: "শিক্ষার্থী ব্যবস্থাপনা", href: "/dashboard/students", icon: Users },
    { name: "ক্লাস ও রুটিন", href: "/dashboard/classes", icon: BookOpen },
    { name: "শিক্ষক ও স্টাফ", href: "/dashboard/staff", icon: GraduationCap },
    { name: "একাউন্টিং ও ফি", href: "/dashboard/accounting", icon: CreditCard },
    { name: "পরীক্ষা ও ফলাফল", href: "/dashboard/exams", icon: FileSignature },
    { name: "সেটিংস", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Mobile Sidebar Overlay (প্রিন্টের সময় hidden থাকবে) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (প্রিন্টের সময় hidden থাকবে) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 md:relative md:translate-x-0 print:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold tracking-wider">মাদ্রাসা প্যানেল</h1>
          <button className="md:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-blue-600 text-white" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-700">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 text-red-400 rounded-lg hover:bg-slate-800 hover:text-red-300 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">লগআউট</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area (প্রিন্টের সময় overflow-visible থাকবে যাতে রসিদ কেটে না যায়) */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden print:overflow-visible">
        
        {/* Navbar (প্রিন্টের সময় hidden থাকবে) */}
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between z-10 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <button 
              className="md:hidden p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-semibold text-gray-800 hidden sm:block">
              স্বাগতম, {user?.fullName || "অ্যাডমিন"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {user?.fullName?.charAt(0) || "A"}
              </div>
              <div className="hidden md:block text-sm">
                <p className="font-medium text-gray-700 leading-tight">
                  {user?.fullName || "Admin"}
                </p>
                <p className="text-gray-500 text-xs">
                  {user?.roleId || "Super Admin"}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content (প্রিন্টের সময় প্যাডিং শূন্য এবং ব্যাকগ্রাউন্ড সাদা হবে) */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50 print:overflow-visible print:bg-white print:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}