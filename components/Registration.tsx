
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

  // แบ่งข้อมูลนักเรียนเป็นหน้าละ 25 คน และเติมแถวให้ครบ 25 แถวเสมอ
  const getPagedData = (arr: any[], size: number) => {
    const pages = [];
    for (let i = 0; i < arr.length; i += size) {
      const chunk = arr.slice(i, i + size);
      // เติมข้อมูลว่างให้ครบ 25 แถว
      const paddedChunk = [...chunk];
      while (paddedChunk.length < size) {
        paddedChunk.push(null); 
      }
      pages.push(paddedChunk);
    }
    // ถ้าไม่มีข้อมูลเลย ให้สร้างหน้าว่าง 1 หน้าที่มี 25 แถว
    if (pages.length === 0) {
      pages.push(Array(size).fill(null));
    }
    return pages;
  };

  const pagedStudents = getPagedData(sortedStudentsForList, 25);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-8 no-print">
      {/* Registration Form */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-indigo-50">
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

      {/* Student List Grid (Web View) - เต็มหน้าจอและ 2 คอลัมน์ */}
      <div className="w-full bg-white p-8 rounded-3xl shadow-sm border border-indigo-50">
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

        <div className="max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-indigo-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sortedStudentsForList.map(student => (
              <div key={student.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-indigo-100 hover:bg-white transition-all shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs group-hover:scale-110 transition-transform">
                    {student.level.replace('ม.', '')}
                  </div>
                  <div>
                    <p className="font-bold text-indigo-900 group-hover:text-indigo-600 text-sm">{student.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">รหัส {student.id}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-white border border-indigo-100 rounded-full text-[10px] font-black text-indigo-500">{student.level}/{student.room}</span>
              </div>
            ))}
            {students.length === 0 && (
              <div className="col-span-2 text-center py-20 text-gray-300 italic font-bold uppercase tracking-widest border-2 border-dashed rounded-3xl">ยังไม่มีนักเรียนลงทะเบียน</div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Preview - แสดงตัวอย่างก่อนพิมพ์ */}
      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-5xl h-[95vh] rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl">
            <div className="bg-white px-8 py-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">ตัวอย่างก่อนพิมพ์รายงาน (A4)</h2>
              <button onClick={() => setShowPreview(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-400 hover:text-red-500 rounded-xl transition-all">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-8 bg-slate-200/50">
              {pagedStudents.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className={`bg-white mb-10 shadow-xl mx-auto rounded-sm border border-slate-300`} style={{ width: '210mm', height: '297mm', padding: '15mm 20mm', boxSizing: 'border-box' }}>
                  <div className="text-center mb-6">
                    <img src="https://img5.pic.in.th/file/secure-sv1/nw_logo-removebg.png" alt="logo" className="h-14 mx-auto mb-3" />
                    <h1 className="text-lg font-bold text-gray-900">รายงานรายชื่อนักเรียนลงทะเบียนเข้าชุมนุม</h1>
                    <h2 className="text-sm font-bold text-gray-700">โรงเรียนหนองบัวแดงวิทยา</h2>
                    <div className="flex justify-between items-end mt-4 text-[10px] text-gray-600 border-b border-black pb-1">
                      <p className="font-bold">กิจกรรมพัฒนาผู้เรียน</p>
                      <p>วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                  
                  <table className="w-full text-[10pt] border-collapse border border-black">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-black px-2 py-1 text-center w-10 font-bold">ลำดับ</th>
                        <th className="border border-black px-2 py-1 text-center w-24 font-bold">รหัสประจำตัว</th>
                        <th className="border border-black px-2 py-1 text-left font-bold">ชื่อ-นามสกุล</th>
                        <th className="border border-black px-2 py-1 text-center w-20 font-bold">ชั้น/ห้อง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunk.map((s, idx) => (
                        <tr key={idx} style={{ height: '8.5mm' }}>
                          <td className="border border-black px-2 py-0 text-center">{s ? (chunkIdx * 25 + idx + 1) : ''}</td>
                          <td className="border border-black px-2 py-0 text-center font-bold">{s ? s.id : ''}</td>
                          <td className="border border-black px-2 py-0 font-bold">{s ? s.name : ''}</td>
                          <td className="border border-black px-2 py-0 text-center">{s ? `${s.level}/${s.room}` : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-4 text-right text-[8pt] text-gray-500 font-bold">
                    หน้า {chunkIdx + 1} จาก {pagedStudents.length} | รวมทั้งสิ้น {students.length} คน
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white border-t flex justify-end gap-4">
              <button onClick={() => setShowPreview(false)} className="px-8 py-3 rounded-2xl font-black text-slate-500 hover:bg-slate-100">ย้อนกลับ</button>
              <button onClick={handlePrint} className="px-10 py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 shadow-xl flex items-center gap-3 transition-all active:scale-95">
                <i className="fas fa-print"></i> พิมพ์ / บันทึก PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* เนื้อหาที่จะพิมพ์จริง (Hoisted for visibility technique) */}
      <div id="print-area-container" style={{ display: 'none' }}>
        {pagedStudents.map((chunk, chunkIdx) => (
          <div 
            key={`print-page-${chunkIdx}`} 
            className={`page-break ${chunkIdx === pagedStudents.length - 1 ? 'last-page' : ''}`}
          >
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <img src="https://img5.pic.in.th/file/secure-sv1/nw_logo-removebg.png" style={{ height: '60px', margin: '0 auto 10px auto', display: 'block' }} />
              <h1 style={{ fontSize: '14pt', fontWeight: 'bold', margin: '0', color: '#000000' }}>รายงานรายชื่อนักเรียนลงทะเบียนเข้าชุมนุม</h1>
              <h2 style={{ fontSize: '12pt', fontWeight: 'bold', margin: '2px 0', color: '#000000' }}>โรงเรียนหนองบัวแดงวิทยา</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1.5px solid #000000', paddingBottom: '5px', marginTop: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>กิจกรรมพัฒนาผู้เรียน</span>
                <span style={{ fontSize: '9pt', color: '#000000' }}>วันที่ {new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1.2px solid #000000' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6' }}>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '40px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>ลำดับ</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '100px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>รหัสประจำตัว</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 8px', textAlign: 'left', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>ชื่อ-นามสกุล</th>
                  <th style={{ border: '1px solid #000000', padding: '6px 4px', width: '80px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>ชั้น/ห้อง</th>
                </tr>
              </thead>
              <tbody>
                {chunk.map((s, idx) => (
                  <tr key={`print-row-${chunkIdx}-${idx}`} style={{ height: '8.5mm' }}>
                    <td style={{ border: '1px solid #000000', padding: '0 4px', textAlign: 'center', fontSize: '10pt', color: '#000000' }}>
                      {s ? (chunkIdx * 25 + idx + 1) : ''}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '0 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>
                      {s ? s.id : ''}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '0 8px', fontWeight: 'bold', fontSize: '10pt', color: '#000000' }}>
                      {s ? s.name : ''}
                    </td>
                    <td style={{ border: '1px solid #000000', padding: '0 4px', textAlign: 'center', fontSize: '10pt', color: '#000000' }}>
                      {s ? `${s.level}/${s.room}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '15px', textAlign: 'right', fontWeight: 'bold', fontSize: '9pt', color: '#000000' }}>
              หน้าที่ {chunkIdx + 1} จาก {pagedStudents.length} | รวมทั้งสิ้น {students.length} คน
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Registration;
