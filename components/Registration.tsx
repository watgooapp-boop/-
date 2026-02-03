
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
  const [showPreview, setShowPreview] = useState(false);

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

  const sortedStudentsForList = [...students].sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level, 'th');
    if (a.room !== b.room) return a.room - b.room;
    return a.id.localeCompare(b.id);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Registration Form - Section 1 */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-50 no-print">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 text-white text-center">
          <h2 className="text-3xl font-black tracking-tight">ลงทะเบียนเข้าชุมนุม</h2>
          <p className="text-indigo-100 opacity-90 text-sm mt-2 font-medium uppercase tracking-widest">โรงเรียนหนองบัวแดงวิทยา</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="md:col-span-2">
              <label className="block text-2xl font-black text-indigo-900 mb-3 ml-1">เลขประจำตัว 5 หลัก</label>
              <input 
                type="text" 
                maxLength={5}
                required
                disabled={isSubmitting}
                value={formData.id}
                onChange={(e) => setFormData({...formData, id: e.target.value.replace(/\D/g, '')})}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-black text-2xl text-indigo-700 transition-all placeholder:text-gray-300 shadow-inner"
                placeholder="00000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xl font-black text-indigo-900 mb-3 ml-1">ชื่อ-นามสกุล</label>
              <input 
                type="text" 
                required
                disabled={isSubmitting}
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-xl text-gray-700 transition-all shadow-inner"
                placeholder="กรอกชื่อและนามสกุล"
              />
            </div>
            <div>
              <label className="block text-xl font-black text-indigo-900 mb-3 ml-1">ระดับชั้น</label>
              <select 
                disabled={isSubmitting}
                value={formData.level}
                onChange={(e) => setFormData({...formData, level: e.target.value})}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-xl text-gray-700 appearance-none shadow-inner"
              >
                <option value="ม.4">ม.4</option>
                <option value="ม.5">ม.5</option>
                <option value="ม.6">ม.6</option>
              </select>
            </div>
            <div>
              <label className="block text-xl font-black text-indigo-900 mb-3 ml-1">ห้อง</label>
              <select 
                disabled={isSubmitting}
                value={formData.room}
                onChange={(e) => setFormData({...formData, room: parseInt(e.target.value)})}
                className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-xl text-gray-700 appearance-none shadow-inner"
              >
                {Array.from({ length: 13 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num}>ห้อง {num}</option>
                ))}
              </select>
            </div>
          </div>
          <button 
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-6 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 text-xl ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'shadow-indigo-200'}`}
          >
            {isSubmitting ? <><i className="fas fa-spinner animate-spin"></i> กำลังบันทึกข้อมูล...</> : <><i className="fas fa-user-plus"></i> ลงทะเบียน</>}
          </button>
        </form>
      </div>

      {/* Registered Student List - Section 2 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-50 no-print">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-indigo-50 pb-6 gap-6">
          <div>
            <h3 className="text-xl font-black text-indigo-900 flex items-center gap-3">
              <i className="fas fa-users text-indigo-500 text-2xl"></i>
              <span>นักเรียนที่ลงทะเบียน ({students.length})</span>
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">รายชื่อเรียงตามระดับชั้นและห้อง</p>
          </div>
          <button 
            onClick={() => setShowPreview(true)}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-3 shadow-lg shadow-emerald-100 transition-all active:scale-95 uppercase tracking-wider text-sm"
          >
            <i className="fas fa-file-pdf"></i> พิมพ์รายงาน / PDF
          </button>
        </div>

        <div className="max-h-[500px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-indigo-100 scrollbar-track-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedStudentsForList.map(student => (
              <div key={student.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md group-hover:rotate-6 transition-transform">
                    {student.level.replace('ม.', '')}
                  </div>
                  <div>
                    <p className="font-black text-indigo-900 leading-tight group-hover:text-indigo-600 transition-colors">{student.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">รหัส {student.id} • ห้อง {student.room}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[10px] font-black text-indigo-500 uppercase tracking-tighter shadow-sm">
                     {student.level}/{student.room}
                   </span>
                </div>
              </div>
            ))}
            {students.length === 0 && (
              <div className="col-span-2 text-center text-gray-400 py-20 italic font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 uppercase tracking-widest">
                <i className="fas fa-inbox text-4xl mb-4 block opacity-20"></i>
                ยังไม่มีนักเรียนลงทะเบียนในฐานข้อมูล
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Preview - Official Report */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 md:p-10 animate-fade-in no-print backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="bg-white px-8 py-6 border-b flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-xl">
                  <i className="fas fa-eye"></i>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-800 tracking-tight">ตัวอย่างก่อนพิมพ์รายงาน</h2>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Official Registration Report Preview</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPreview(false)} 
                className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 md:p-16 bg-slate-200/50">
              <div className="printable-report border border-slate-200 p-12 md:p-20 shadow-2xl max-w-[210mm] mx-auto bg-white min-h-[297mm] rounded-sm relative">
                {/* Logo & Header */}
                <div className="text-center mb-12">
                  <img src="https://img5.pic.in.th/file/secure-sv1/nw_logo-removebg.png" alt="logo" className="h-28 mx-auto mb-6" />
                  <h1 className="text-3xl font-black text-gray-900 mb-2">รายงานรายชื่อนักเรียนลงทะเบียนเข้าชุมนุม</h1>
                  <h2 className="text-xl font-bold text-gray-700 uppercase tracking-widest">โรงเรียนหนองบัวแดงวิทยา</h2>
                  <div className="w-24 h-1 bg-indigo-600 mx-auto mt-6 rounded-full"></div>
                </div>

                <div className="flex justify-between items-end mb-6 text-sm text-gray-500">
                  <p className="font-bold">กลุ่มสาระการเรียนรู้กิจกรรมพัฒนาผู้เรียน</p>
                  <p>ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="border border-slate-300 px-4 py-3 text-center w-16 font-black text-indigo-900 uppercase">ลำดับ</th>
                      <th className="border border-slate-300 px-4 py-3 text-center w-32 font-black text-indigo-900 uppercase">รหัสประจำตัว</th>
                      <th className="border border-slate-300 px-4 py-3 text-left font-black text-indigo-900 uppercase">ชื่อ-นามสกุล</th>
                      <th className="border border-slate-300 px-4 py-3 text-center w-32 font-black text-indigo-900 uppercase">ระดับชั้น/ห้อง</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStudentsForList.map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="border border-slate-300 px-4 py-3 text-center font-medium">{idx + 1}</td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-bold text-indigo-600">{s.id}</td>
                        <td className="border border-slate-300 px-4 py-3 font-bold">{s.name}</td>
                        <td className="border border-slate-300 px-4 py-3 text-center font-medium">{s.level}/{s.room}</td>
                      </tr>
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={4} className="border border-slate-300 px-4 py-20 text-center text-gray-400 italic">ไม่พบข้อมูลนักเรียน</td></tr>
                    )}
                  </tbody>
                </table>
                
                <div className="mt-12 flex justify-between items-center pt-8 border-t border-slate-100">
                  <div className="text-sm text-slate-400 italic">
                    * พิมพ์โดยระบบบริหารจัดการงานชุมนุม โรงเรียนหนองบัวแดงวิทยา
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-900">รวมทั้งสิ้น {students.length} ราย</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Total Enrolled Students</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 bg-white border-t flex flex-col md:flex-row justify-end items-center gap-4">
              <p className="text-xs text-slate-400 font-bold mr-auto hidden md:block italic">
                <i className="fas fa-info-circle mr-1"></i> กรุณาเลือกเครื่องพิมพ์เป็น "Save as PDF" หากต้องการบันทึกเป็นไฟล์
              </p>
              <button 
                onClick={() => setShowPreview(false)} 
                className="w-full md:w-auto px-8 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-100 transition-all uppercase tracking-widest text-xs"
              >
                ย้อนกลับ
              </button>
              <button 
                onClick={handlePrint} 
                className="w-full md:w-auto px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 transition-all active:scale-95 uppercase tracking-wider"
              >
                <i className="fas fa-print"></i> พิมพ์ / บันทึก PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actual Hidden Section for Browser Print Engine */}
      <div className="print-only">
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
          <img src="https://img5.pic.in.th/file/secure-sv1/nw_logo-removebg.png" style={{height: '100px', marginBottom: '20px'}} />
          <h1 style={{fontSize: '24pt', fontWeight: 'bold', margin: '0'}}>รายงานรายชื่อนักเรียนลงทะเบียนเข้าชุมนุม</h1>
          <h2 style={{fontSize: '18pt', fontWeight: 'bold', margin: '5px 0'}}>โรงเรียนหนองบัวแดงวิทยา</h2>
          <p style={{fontSize: '12pt', color: '#666'}}>ข้อมูล ณ วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
          <thead>
            <tr style={{backgroundColor: '#f8f9fa'}}>
              <th style={{border: '1px solid black', padding: '12px', width: '60px', textAlign: 'center'}}>ลำดับ</th>
              <th style={{border: '1px solid black', padding: '12px', width: '130px', textAlign: 'center'}}>รหัสประจำตัว</th>
              <th style={{border: '1px solid black', padding: '12px', textAlign: 'left'}}>ชื่อ-นามสกุล</th>
              <th style={{border: '1px solid black', padding: '12px', width: '110px', textAlign: 'center'}}>ชั้น/ห้อง</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudentsForList.map((s, idx) => (
              <tr key={s.id}>
                <td style={{border: '1px solid black', padding: '10px', textAlign: 'center'}}>{idx + 1}</td>
                <td style={{border: '1px solid black', padding: '10px', textAlign: 'center', fontWeight: 'bold'}}>{s.id}</td>
                <td style={{border: '1px solid black', padding: '10px'}}>{s.name}</td>
                <td style={{border: '1px solid black', padding: '10px', textAlign: 'center'}}>{s.level}/{s.room}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{marginTop: '30px', textAlign: 'right', fontSize: '14pt', fontWeight: 'bold'}}>
          รวมจำนวนนักเรียนทั้งหมด {students.length} คน
        </div>
      </div>
    </div>
  );
};

export default Registration;
