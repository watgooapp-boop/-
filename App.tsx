
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Student, AttendanceRecord, Announcement, Assignment, Submission, 
  AttendanceStatus, EvaluationStatus 
} from './types';
import Header from './components/Header';
import Home from './components/Home';
import Registration from './components/Registration';
import AttendanceCheck from './components/AttendanceCheck';
import Settings from './components/Settings';
import SubmissionTab from './components/SubmissionTab';
import Swal from 'sweetalert2';

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUJc_m_c-SlsbiIOj4-lD6a7_VTorepqPpvdwS-jDssWTq5t_8QEPHWvBVk8DwqYc9/exec';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'register' | 'submit' | 'attendance' | 'settings'>('home');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) {
      setIsLoading(true);
      setFetchError(null);
    }
    try {
      const response = await fetch(APPS_SCRIPT_URL);
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      
      if (data.students) {
        const filteredStudents = data.students.filter((s: Student) => 
          s.id && !['id', 'เลขประจำตัว', 'รหัสประจำตัว'].includes(s.id.toString().toLowerCase())
        );
        setStudents(filteredStudents);
      }
      
      if (data.attendance) {
        const filteredAttendance = data.attendance
          .filter((r: any) => r.studentId && r.studentId.toString().toLowerCase() !== 'studentid')
          .map((r: any) => {
            let formattedDate = r.date;
            if (typeof r.date === 'string' && r.date.includes('T')) {
              formattedDate = r.date.split('T')[0];
            }
            return {
              date: formattedDate,
              studentId: String(r.studentId).trim(),
              status: r.status as AttendanceStatus
            };
          });
        setAttendance(filteredAttendance);
      }

      if (data.announcements) {
        const filteredAnns = data.announcements.filter((a: Announcement) => a.id && a.id !== 'ID');
        setAnnouncements(filteredAnns);
      }
      
      if (data.assignments) {
        const filteredAsgs = data.assignments.filter((as: Assignment) => as.id && as.id !== 'ID');
        setAssignments(filteredAsgs);
      }

      if (data.submissions) {
        const filteredSubs = data.submissions
          .filter((sub: any) => sub.id && sub.id !== 'ID')
          .map((sub: any) => ({
            ...sub,
            studentId: String(sub.studentId).trim()
          }));
        setSubmissions(filteredSubs);
      }
    } catch (e: any) {
      console.error("Fetch error: ", e);
      setFetchError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const verifyTeacher = (callback: () => void) => {
    if (isTeacherAuthenticated) {
      callback();
      return;
    }
    Swal.fire({
      title: 'เข้าสู่ระบบสำหรับครู',
      input: 'password',
      inputPlaceholder: 'รหัสผ่าน 2521',
      showCancelButton: true,
      confirmButtonText: 'เข้าสู่ระบบ',
      inputValidator: (value) => {
        if (!value) return 'กรุณากรอกรหัสผ่าน';
        if (value !== '2521') return 'รหัสผ่านไม่ถูกต้อง';
        return null;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setIsTeacherAuthenticated(true);
        callback();
      }
    });
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex flex-col items-center justify-center py-32">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-indigo-900 animate-pulse">กำลังโหลดข้อมูลจาก Cloud...</p>
      </div>
    );

    if (fetchError) return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-red-100 text-center max-w-md mx-auto my-20">
        <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
        <h3 className="text-xl font-bold text-gray-800 mb-2">ไม่สามารถเชื่อมต่อฐานข้อมูลได้</h3>
        <p className="text-gray-500 mb-6 text-sm">กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือ Apps Script ของคุณ</p>
        <button onClick={() => fetchData()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all">
          <i className="fas fa-sync-alt mr-2"></i> ลองใหม่อีกครั้ง
        </button>
      </div>
    );

    switch (activeTab) {
      case 'home':
        return <Home students={students} attendance={attendance} announcements={announcements} />;
      case 'register':
        return <Registration students={students} setStudents={setStudents} refreshData={() => fetchData(true)} />;
      case 'submit':
        return <SubmissionTab students={students} assignments={assignments} submissions={submissions} setSubmissions={setSubmissions} refreshData={() => fetchData(true)} />;
      case 'attendance':
        return <AttendanceCheck students={students} attendance={attendance} setAttendance={setAttendance} refreshData={() => fetchData(true)} />;
      case 'settings':
        return (
          <Settings 
            students={students} setStudents={setStudents}
            attendance={attendance} 
            announcements={announcements} setAnnouncements={setAnnouncements}
            assignments={assignments} setAssignments={setAssignments}
            submissions={submissions} setSubmissions={setSubmissions}
            refreshData={() => fetchData(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <nav className="bg-white border-b sticky top-0 z-50 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
        <div className="max-w-7xl mx-auto px-4 flex">
          {[
            { id: 'home', label: 'หน้าแรก', icon: 'fa-home', teacher: false },
            { id: 'register', label: 'ลงทะเบียน', icon: 'fa-user-plus', teacher: false },
            { id: 'submit', label: 'ส่งงาน', icon: 'fa-upload', teacher: false },
            { id: 'attendance', label: 'เช็คเวลาเรียน', icon: 'fa-calendar-check', teacher: true },
            { id: 'settings', label: 'ตั้งค่า', icon: 'fa-cog', teacher: true },
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => item.teacher ? verifyTeacher(() => setActiveTab(item.id as any)) : setActiveTab(item.id as any)}
              className={`px-6 py-4 font-bold transition-all border-b-4 flex items-center gap-2 ${activeTab === item.id ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-gray-500 hover:text-indigo-600 hover:bg-gray-50'}`}
            >
              <i className={`fas ${item.icon}`}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <main className="flex-grow p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
      <footer className="bg-white border-t p-6 text-center text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; 2026 ระบบงานชุมนุม โรงเรียนหนองบัวแดงวิทยา • All Rights Reserved
      </footer>
    </div>
  );
};

export default App;
