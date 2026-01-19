
import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import Swal from 'sweetalert2';

interface AttendanceCheckProps {
  students: Student[];
  attendance: AttendanceRecord[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  refreshData?: () => Promise<void>;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUJc_m_c-SlsbiIOj4-lD6a7_VTorepqPpvdwS-jDssWTq5t_8QEPHWvBVk8DwqYc9/exec';

const AttendanceCheck: React.FC<AttendanceCheckProps> = ({ students, attendance, setAttendance, refreshData }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentStatuses, setCurrentStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [filterLevel, setFilterLevel] = useState('ทั้งหมด');
  const [filterRoom, setFilterRoom] = useState('ทั้งหมด');
  const [isSaving, setIsSaving] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  // ดึงข้อมูลเดิมมาแสดงผลเมื่อวันที่เปลี่ยน
  useEffect(() => {
    if (!students || students.length === 0) return;

    setIsDataReady(false);
    
    // สร้าง Map ของรหัสนักเรียน -> สถานะ สำหรับวันที่เลือก
    const existingDataMap: Record<string, AttendanceStatus> = {};
    attendance.forEach(record => {
      const rDate = record.date && record.date.includes('T') ? record.date.split('T')[0] : String(record.date || "").trim();
      if (rDate === selectedDate) {
        existingDataMap[String(record.studentId).trim()] = record.status;
      }
    });

    // ตั้งค่าสถานะให้กับนักเรียนทุกคน
    const newStatuses: Record<string, AttendanceStatus> = {};
    students.forEach(student => {
      const sId = String(student.id).trim();
      newStatuses[sId] = existingDataMap[sId] || AttendanceStatus.PRESENT;
    });

    setCurrentStatuses(newStatuses);
    setIsDataReady(true);
  }, [selectedDate, attendance, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setCurrentStatuses(prev => ({ ...prev, [studentId.trim()]: status }));
  };

  const saveAttendance = async () => {
    if (students.length === 0) return;

    setIsSaving(true);
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'ระบบกำลังส่งข้อมูลไปบันทึกทับในฐานข้อมูล Cloud',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const attendanceArray = Object.entries(currentStatuses).map(([studentId, status]) => ({
        studentId: studentId.trim(),
        status
      }));

      const params = new URLSearchParams();
      params.append('mode', 'attendance');
      params.append('date', selectedDate);
      params.append('records', JSON.stringify(attendanceArray));

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (refreshData) {
        await refreshData();
      }
      
      Swal.fire({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        text: `ข้อมูลการเข้าเรียนวันที่ ${selectedDate} ได้รับการอัปเดตแล้ว`,
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Attendance save error:", error);
      Swal.fire('ผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchLevel = filterLevel === 'ทั้งหมด' || s.level === filterLevel;
      const matchRoom = filterRoom === 'ทั้งหมด' || s.room === Number(filterRoom);
      return matchLevel && matchRoom;
    }).sort((a, b) => {
      if (a.level !== b.level) return a.level.localeCompare(b.level, 'th');
      return a.room - b.room;
    });
  }, [students, filterLevel, filterRoom]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-wrap items-center gap-6">
        <div className="flex-grow md:flex-grow-0">
          <label className="block text-xs font-black text-indigo-900 mb-1 uppercase tracking-wider italic">
            <i className="fas fa-calendar-day mr-1"></i> วันที่ทำรายการ
          </label>
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-700 shadow-sm transition-all"
          />
        </div>
        
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-wider">ระดับชั้น</label>
            <select 
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-700 bg-white shadow-sm"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              <option value="ม.4">ม.4</option>
              <option value="ม.5">ม.5</option>
              <option value="ม.6">ม.6</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 mb-1 uppercase tracking-wider">ห้อง</label>
            <select 
              value={filterRoom}
              onChange={(e) => setFilterRoom(e.target.value)}
              className="px-4 py-2 border-2 border-slate-100 rounded-xl focus:border-indigo-500 outline-none font-bold text-gray-700 bg-white shadow-sm"
            >
              <option value="ทั้งหมด">ทั้งหมด</option>
              {Array.from({ length: 13 }, (_, i) => i + 1).map(num => (
                <option key={num} value={num}>{num}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="ml-auto w-full md:w-auto">
          <button 
            onClick={saveAttendance}
            disabled={isSaving || !isDataReady}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-3 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isSaving || !isDataReady ? 'opacity-50 cursor-wait' : 'hover:shadow-indigo-200'}`}
          >
            <i className={`fas ${isSaving ? 'fa-sync animate-spin' : 'fa-save'}`}></i> 
            {isSaving ? 'กำลังบันทึก...' : 'บันทึกทับข้อมูลลงชีท'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.2em] border-b">
              <tr>
                <th className="px-6 py-4">ห้อง</th>
                <th className="px-6 py-4">รหัสประจำตัว</th>
                <th className="px-6 py-4">ชื่อ-สกุล</th>
                <th className="px-6 py-4 text-center">สถานะการเรียน</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {!isDataReady ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400 italic font-bold animate-pulse"><i className="fas fa-spinner animate-spin mr-2"></i> กำลังดึงข้อมูลเดิม...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-16 text-center text-gray-400 italic font-bold">ไม่พบนักเรียนในกลุ่มที่เลือก</td></tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student.id} className="hover:bg-indigo-50/20 transition-colors">
                    <td className="px-6 py-4 font-black text-slate-300">{student.level}/{student.room}</td>
                    <td className="px-6 py-4 font-bold text-indigo-600">{student.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">{student.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center items-center gap-1 md:gap-2">
                        {[
                          { status: AttendanceStatus.PRESENT, color: 'bg-green-500', label: 'มา' },
                          { status: AttendanceStatus.LEAVE, color: 'bg-blue-500', label: 'ลา' },
                          { status: AttendanceStatus.ABSENT, color: 'bg-red-500', label: 'ขาด' },
                          { status: AttendanceStatus.ACTIVITY, color: 'bg-orange-500', label: 'กิจกรรม' }
                        ].map(item => (
                          <label key={item.status} className="flex flex-col items-center gap-1 cursor-pointer min-w-[45px] group">
                            <input 
                              type="radio" 
                              name={`status-${student.id}`} 
                              checked={currentStatuses[String(student.id).trim()] === item.status}
                              onChange={() => handleStatusChange(student.id, item.status)}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer border-gray-300"
                            />
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white transition-all shadow-sm ${currentStatuses[String(student.id).trim()] === item.status ? item.color : 'bg-slate-200 opacity-40 group-hover:opacity-70'}`}>
                              {item.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-white py-4 rounded-2xl border border-dashed shadow-sm">
         <i className="fas fa-history text-indigo-400 text-sm"></i>
         ระบบจะดึงสถานะล่าสุดจากชีทมาให้แก้ไขอัตโนมัติ หากยังไม่มีข้อมูลจะตั้งเป็น "มา"
      </div>
    </div>
  );
};

export default AttendanceCheck;
