
import React, { useState } from 'react';
import { Student } from '../types';
import Swal from 'sweetalert2';

interface RegistrationProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  refreshData?: () => Promise<void>;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUJc_m_c-SlsbiIOj4-lD6a7_VTorepqPpvdwS-jDssWTq5t_8QEPHWvBVk8DwqYc9/exec';

const Registration: React.FC<RegistrationProps> = ({ students, setStudents, refreshData }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    level: 'ม.4',
    room: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.id.length !== 5) {
      Swal.fire({ icon: 'error', title: 'ข้อมูลผิดพลาด', text: 'เลขประจำตัวต้องมี 5 หลักเท่านั้น' });
      return;
    }

    if (students.some(s => s.id.toString() === formData.id.toString())) {
      Swal.fire({
        icon: 'warning',
        title: 'รหัสซ้ำ!',
        text: `รหัสประจำตัว ${formData.id} มีในระบบอยู่แล้ว ไม่สามารถลงทะเบียนซ้ำได้`
      });
      return;
    }

    setIsSubmitting(true);
    Swal.fire({
      title: 'กำลังบันทึกข้อมูล...',
      text: 'ระบบกำลังส่งข้อมูลไปยัง Google Sheet',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const params = new URLSearchParams();
      params.append('mode', 'registration');
      params.append('id', formData.id);
      params.append('name', formData.name);
      params.append('level', formData.level);
      params.append('room', formData.room.toString());

      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });

      if (refreshData) await refreshData();
      
      Swal.fire({ 
        icon: 'success', 
        title: 'ลงทะเบียนสำเร็จ', 
        text: 'ข้อมูลของคุณถูกบันทึกลงฐานข้อมูลแล้ว',
        timer: 2000, 
        showConfirmButton: false 
      });
      
      setFormData({ id: '', name: '', level: 'ม.4', room: 1 });
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // เรียงลำดับนักเรียนตาม ระดับชั้น และ ห้อง
  const sortedStudentsForList = [...students].sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level, 'th');
    return a.room - b.room;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-indigo-50">
        <div className="bg-indigo-600 p-6 text-white text-center">
          <h2 className="text-2xl font-bold">ลงทะเบียนเข้าชุมนุม</h2>
          <p className="text-indigo-100 opacity-80 text-sm mt-1">โรงเรียนหนองบัวแดงวิทยา</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">เลขประจำตัว (5 หลัก)</label>
              <input 
                type="text" 
                maxLength={5}
                required
                disabled={isSubmitting}
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value.replace(/\D/g, '')})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                placeholder="ระบุตัวเลข 5 หลัก"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-สกุล</label>
              <input 
                type="text" 
                required
                disabled={isSubmitting}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="ชื่อ และ นามสกุล"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้น</label>
              <select 
                disabled={isSubmitting}
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ม.4">ม.4</option>
                <option value="ม.5">ม.5</option>
                <option value="ม.6">ม.6</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ห้อง</label>
              <select 
                disabled={isSubmitting}
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: parseInt(e.target.value)})}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {Array.from({ length: 13 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isSubmitting ? 'opacity-50' : ''}`}
          >
            {isSubmitting ? <><i className="fas fa-spinner animate-spin"></i> กำลังบันทึก...</> : <><i className="fas fa-user-plus"></i> ลงทะเบียน</>}
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border">
        <h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2 flex justify-between items-center">
          <span>รายชื่อนักเรียนที่ลงทะเบียนแล้ว ({students.length})</span>
          <i className="fas fa-users text-indigo-500"></i>
        </h3>
        <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-100 pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sortedStudentsForList.map(student => (
              <div key={student.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                    {student.level.replace('ม.', '')}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-indigo-900 leading-tight">{student.name}</p>
                    <p className="text-[10px] text-gray-400">รหัส: {student.id} • ห้อง {student.room}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border text-gray-400 font-bold">{student.level}/{student.room}</span>
              </div>
            ))}
            {students.length === 0 && <div className="col-span-2 text-center text-gray-400 py-10 italic">ยังไม่มีข้อมูลนักเรียนในระบบ</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;
