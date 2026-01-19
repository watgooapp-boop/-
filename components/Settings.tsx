
import React, { useState, useRef } from 'react';
import { 
  Student, AttendanceRecord, Announcement, Assignment, Submission, 
  AttendanceStatus, EvaluationStatus 
} from '../types';
import Swal from 'sweetalert2';

interface SettingsProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  attendance: AttendanceRecord[];
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  assignments: Assignment[];
  setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  refreshData?: () => Promise<void>;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUJc_m_c-SlsbiIOj4-lD6a7_VTorepqPpvdwS-jDssWTq5t_8QEPHWvBVk8DwqYc9/exec';

const Settings: React.FC<SettingsProps> = ({ 
  students, setStudents, attendance, 
  announcements, setAnnouncements, 
  assignments, setAssignments,
  submissions, setSubmissions,
  refreshData
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'students' | 'announcements' | 'assignments' | 'grading'>('students');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<{originalId: string, data: Student} | null>(null);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
  const [editingAsg, setEditingAsg] = useState<Assignment | null>(null);
  
  const [newAnn, setNewAnn] = useState({ title: '', content: '', imageUrl: '', isPinned: false, isHidden: false });
  const [newAsg, setNewAsg] = useState({ 
    title: '', 
    description: '', 
    dueDate: '',
    imageUrl: '',
    allowedTypes: { image: true, link: true, file: true }
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const annFileRef = useRef<HTMLInputElement>(null);

  const syncToCloud = async (mode: string, payload: any) => {
    try {
      const params = new URLSearchParams();
      params.append('mode', mode);
      Object.keys(payload).forEach(key => {
        params.append(key, payload[key]);
      });
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
    } catch (e) {
      console.error("Cloud Sync Error:", e);
    }
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent({ originalId: student.id, data: { ...student } });
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setIsSubmitting(true);
    setStudents(prev => prev.map(s => s.id === editingStudent.originalId ? editingStudent.data : s));

    await syncToCloud('registration', {
      id: editingStudent.data.id,
      name: editingStudent.data.name,
      level: editingStudent.data.level,
      room: editingStudent.data.room.toString()
    });
    
    if (refreshData) await refreshData();
    setEditingStudent(null);
    setIsSubmitting(false);
    Swal.fire({ icon: 'success', title: 'อัปเดตข้อมูลนักเรียนเรียบร้อย', timer: 1000, showConfirmButton: false });
  };

  const handleDeleteStudent = async (id: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบ?',
      text: `รหัสประจำตัว ${id} จะถูกลบออกจากระบบ Cloud`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'ใช่, ลบเลย',
      cancelButtonText: 'ยกเลิก'
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      setStudents(prev => prev.filter(s => s.id !== id));
      await syncToCloud('delete_student', { id });
      if (refreshData) await refreshData();
      setIsSubmitting(false);
      Swal.fire('ลบข้อมูลเรียบร้อย', '', 'success');
    }
  };

  const handleGradeSubmission = async (submissionId: string, status: EvaluationStatus) => {
    setSubmissions(prev => prev.map(s => s.id.toString() === submissionId.toString() ? { ...s, evaluation: status } : s));
    await syncToCloud('evaluate', {
      id: submissionId,
      status: status
    });
    Swal.fire({ icon: 'success', title: 'บันทึกผลการประเมินแล้ว', timer: 800, showConfirmButton: false });
    if (refreshData) await refreshData();
  };

  const addAnnouncement = async () => {
    const targetAnn = editingAnn || newAnn;
    if (!targetAnn.title || !targetAnn.content) return;
    
    setIsSubmitting(true);
    Swal.fire({ title: 'กำลังบันทึกประกาศ...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    
    const annId = editingAnn ? editingAnn.id : Date.now().toString();
    const annData = {
      id: annId,
      title: targetAnn.title,
      content: targetAnn.content,
      imageUrl: targetAnn.imageUrl || '',
      isPinned: targetAnn.isPinned ? 'true' : 'false',
      isHidden: targetAnn.isHidden ? 'true' : 'false',
      createdAt: editingAnn ? editingAnn.createdAt : new Date().toISOString()
    };
    
    await syncToCloud('announcement', annData);

    if (refreshData) await refreshData();
    setNewAnn({ title: '', content: '', imageUrl: '', isPinned: false, isHidden: false });
    setEditingAnn(null);
    if (annFileRef.current) annFileRef.current.value = '';
    setIsSubmitting(false);
    Swal.fire('สำเร็จ', 'บันทึกประกาศเรียบร้อย', 'success');
  };

  const handleSaveAssignment = async () => {
    const targetAsg = editingAsg || newAsg;
    if (!targetAsg.title || !targetAsg.dueDate) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณาระบุชื่อชิ้นงานและวันที่กำหนดส่ง', 'warning');
      return;
    }

    setIsSubmitting(true);
    Swal.fire({ title: 'กำลังบันทึกชิ้นงาน...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const asgId = editingAsg?.id || Date.now().toString();
    const assignmentPayload = {
      id: asgId,
      title: targetAsg.title,
      description: targetAsg.description,
      dueDate: targetAsg.dueDate
    };

    try {
      await syncToCloud('assignment', assignmentPayload);
      if (refreshData) await refreshData();
      setEditingAsg(null);
      setNewAsg({ title: '', description: '', dueDate: '', imageUrl: '', allowedTypes: { image: true, link: true, file: true } });
      Swal.fire('สำเร็จ', 'บันทึกข้อมูลชิ้นงานเรียบร้อย', 'success');
    } catch (err) {
      Swal.fire('ผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'ann' | 'editAnn') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        Swal.fire('ไฟล์ใหญ่ไป', 'กรุณาเลือกไฟล์ไม่เกิน 1.5MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (target === 'ann') setNewAnn({ ...newAnn, imageUrl: base64 });
        else if (target === 'editAnn' && editingAnn) setEditingAnn({ ...editingAnn, imageUrl: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level, 'th');
    return a.room - b.room;
  });

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl bg-white p-1" alt="Preview" />
        </div>
      )}

      <aside className="w-full md:w-64 space-y-2">
        {[
          { id: 'students', label: 'ข้อมูลนักเรียน', icon: 'fa-users' },
          { id: 'announcements', label: 'จัดการประกาศ', icon: 'fa-bullhorn' },
          { id: 'assignments', label: 'จัดการชิ้นงาน', icon: 'fa-tasks' },
          { id: 'grading', label: 'ตรวจงานนักเรียน', icon: 'fa-clipboard-check' }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)} 
            className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-3 ${activeSubTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white hover:bg-indigo-50 text-gray-600'}`}
          >
            <i className={`fas ${tab.icon} w-5`}></i>
            <span>{tab.label}</span>
          </button>
        ))}
      </aside>

      <div className="flex-grow space-y-6">
        {activeSubTab === 'students' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4 flex justify-between items-center">
              รายชื่อนักเรียนในระบบ
              <span className="text-sm font-normal text-gray-400">ทั้งหมด {students.length} คน</span>
            </h2>
            
            {editingStudent && (
              <div className="mb-8 p-4 bg-yellow-50 rounded-xl border border-yellow-100 shadow-inner">
                <h3 className="font-bold text-yellow-900 mb-3">แก้ไขข้อมูลนักเรียน</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input type="text" value={editingStudent.data.id} readOnly className="px-3 py-2 border rounded-lg bg-gray-100 font-bold text-gray-400" />
                  <input type="text" value={editingStudent.data.name} onChange={e => setEditingStudent({...editingStudent, data: {...editingStudent.data, name: e.target.value}})} className="px-3 py-2 border rounded-lg bg-white" placeholder="ชื่อ-สกุล" />
                  <select value={editingStudent.data.level} onChange={e => setEditingStudent({...editingStudent, data: {...editingStudent.data, level: e.target.value}})} className="px-3 py-2 border rounded-lg bg-white">
                    <option value="ม.4">ม.4</option><option value="ม.5">ม.5</option><option value="ม.6">ม.6</option>
                  </select>
                  <input type="number" value={editingStudent.data.room} onChange={e => setEditingStudent({...editingStudent, data: {...editingStudent.data, room: parseInt(e.target.value)}})} className="px-3 py-2 border rounded-lg bg-white" placeholder="ห้อง" />
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={handleUpdateStudent} disabled={isSubmitting} className="bg-green-600 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-green-700">
                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                  </button>
                  <button onClick={() => setEditingStudent(null)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">ยกเลิก</button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="border-b text-xs uppercase tracking-widest text-gray-400 font-black">
                    <th className="py-4 px-2">รหัส</th>
                    <th className="py-4 px-2">ชื่อ-สกุล</th>
                    <th className="py-4 px-2">ชั้น/ห้อง</th>
                    <th className="py-4 px-2 text-right">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {sortedStudents.map(s => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-2 font-black text-indigo-600">{s.id}</td>
                      <td className="py-3 px-2 font-medium">{s.name}</td>
                      <td className="py-3 px-2">{s.level}/{s.room}</td>
                      <td className="py-3 px-2 text-right flex justify-end gap-1">
                        <button onClick={() => handleEditStudent(s)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                        <button onClick={() => handleDeleteStudent(s.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"><i className="fas fa-trash text-xs"></i></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeSubTab === 'assignments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4">{editingAsg ? 'แก้ไขชิ้นงาน' : 'สร้างงานใหม่'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="ชื่อชิ้นงาน" value={editingAsg ? editingAsg.title : newAsg.title} onChange={e => editingAsg ? setEditingAsg({...editingAsg, title: e.target.value}) : setNewAsg({...newAsg, title: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2 outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea placeholder="รายละเอียด" value={editingAsg ? editingAsg.description : newAsg.description} onChange={e => editingAsg ? setEditingAsg({...editingAsg, description: e.target.value}) : setNewAsg({...newAsg, description: e.target.value})} className="px-4 py-2 border rounded-lg md:col-span-2 outline-none focus:ring-2 focus:ring-indigo-500" rows={2}></textarea>
                <input type="date" value={editingAsg ? editingAsg.dueDate : newAsg.dueDate} onChange={e => editingAsg ? setEditingAsg({...editingAsg, dueDate: e.target.value}) : setNewAsg({...newAsg, dueDate: e.target.value})} className="px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                <button onClick={handleSaveAssignment} disabled={isSubmitting} className="bg-indigo-600 text-white py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                  {isSubmitting ? 'กำลังบันทึก...' : editingAsg ? 'อัปเดตชิ้นงาน' : 'สร้างชิ้นงาน'}
                </button>
                {editingAsg && (
                  <button onClick={() => setEditingAsg(null)} className="bg-gray-200 text-gray-600 py-2 rounded-lg font-bold hover:bg-gray-300">ยกเลิก</button>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="font-bold mb-4 text-gray-500 flex items-center gap-2">
                <i className="fas fa-list"></i> ชิ้นงานทั้งหมด
              </h2>
              <div className="space-y-2">
                {assignments.map(asg => (
                  <div key={asg.id} className="p-3 rounded-lg border flex justify-between items-center bg-white shadow-sm hover:border-indigo-200 transition-colors">
                    <div>
                      <p className="font-bold text-sm text-indigo-600">{asg.title}</p>
                      <p className="text-[10px] text-gray-400">ครบกำหนด: {asg.dueDate}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAsg(asg)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'announcements' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="text-xl font-bold mb-4">{editingAnn ? 'แก้ไขประกาศ' : 'สร้างประกาศใหม่'}</h2>
              <div className="space-y-3">
                <input type="text" placeholder="หัวข้อประกาศ" value={editingAnn ? editingAnn.title : newAnn.title} onChange={e => editingAnn ? setEditingAnn({...editingAnn, title: e.target.value}) : setNewAnn({...newAnn, title: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea placeholder="เนื้อหาประกาศ" value={editingAnn ? editingAnn.content : newAnn.content} onChange={e => editingAnn ? setEditingAnn({...editingAnn, content: e.target.value}) : setNewAnn({...newAnn, content: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" rows={3}></textarea>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 uppercase mb-1">รูปภาพประกอบ</label>
                    <input type="file" accept="image/*" ref={annFileRef} onChange={(e) => handleImageUpload(e, editingAnn ? 'editAnn' : 'ann')} className="text-xs" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={editingAnn ? editingAnn.isPinned : newAnn.isPinned} onChange={e => editingAnn ? setEditingAnn({...editingAnn, isPinned: e.target.checked}) : setNewAnn({...newAnn, isPinned: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> ปักหมุด
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="checkbox" checked={editingAnn ? editingAnn.isHidden : newAnn.isHidden} onChange={e => editingAnn ? setEditingAnn({...editingAnn, isHidden: e.target.checked}) : setNewAnn({...newAnn, isHidden: e.target.checked})} className="rounded text-indigo-600 focus:ring-indigo-500" /> ซ่อนประกาศ
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={addAnnouncement} disabled={isSubmitting} className="flex-grow bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-md transition-all active:scale-95">
                    {isSubmitting ? 'กำลังบันทึก...' : editingAnn ? 'อัปเดตประกาศ' : 'บันทึกประกาศ'}
                  </button>
                  {editingAnn && (
                    <button onClick={() => setEditingAnn(null)} className="bg-gray-200 text-gray-600 px-6 rounded-lg font-bold hover:bg-gray-300">ยกเลิก</button>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border p-6">
              <h2 className="font-bold mb-4 text-gray-500 flex items-center gap-2">
                <i className="fas fa-bullhorn"></i> รายการประกาศทั้งหมด ({announcements.length})
              </h2>
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-hide">
                {announcements.map(ann => (
                  <div key={ann.id} className={`p-4 rounded-xl border flex justify-between items-center transition-colors ${ann.isHidden ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-indigo-100 hover:border-indigo-300'}`}>
                    <div className="flex items-center gap-3">
                      {ann.imageUrl && (
                        <img src={ann.imageUrl.includes('lh3.googleusercontent.com') ? ann.imageUrl : (ann.imageUrl.includes('base64') ? ann.imageUrl : `https://lh3.googleusercontent.com/d/${ann.imageUrl.split('/d/')[1]?.split('/')[0]}`)} className="w-10 h-10 rounded object-cover border" alt="Thumb" />
                      )}
                      <div>
                        <p className={`font-bold text-sm ${ann.isPinned ? 'text-indigo-600' : 'text-gray-700'}`}>
                          {ann.isPinned && <i className="fas fa-thumbtack mr-1 text-xs rotate-45"></i>}
                          {ann.title}
                        </p>
                        <p className="text-[10px] text-gray-400">{new Date(ann.createdAt).toLocaleDateString('th-TH')}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingAnn(ann)} className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"><i className="fas fa-edit text-xs"></i></button>
                    </div>
                  </div>
                ))}
                {announcements.length === 0 && <p className="text-center py-6 text-gray-400 text-xs italic">ยังไม่มีประกาศ</p>}
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'grading' && (
          <div className="bg-white rounded-2xl shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6 text-indigo-900 border-b pb-4 flex justify-between items-center">
              <span>ตรวจงานและประเมินผล</span>
              <span className="text-sm font-normal text-gray-400">พบ {submissions.length} รายการ</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-xs text-gray-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="py-3 px-2">นักเรียน</th>
                    <th className="py-3 px-2">ชิ้นงาน</th>
                    <th className="py-3 px-2 text-center">หลักฐาน</th>
                    <th className="py-3 px-2 text-center">ประเมิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm">
                  {submissions.length === 0 ? (
                    <tr><td colSpan={4} className="py-10 text-center text-gray-400">ยังไม่มีการส่งงานในระบบ</td></tr>
                  ) : (
                    submissions.slice().reverse().map(sub => {
                      const student = students.find(s => s.id.toString() === sub.studentId.toString());
                      const assignment = assignments.find(a => a.id.toString() === sub.assignmentId.toString());
                      return (
                        <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-2">
                            <p className="font-bold text-indigo-600">{student?.name || sub.studentId}</p>
                            <p className="text-[10px] text-gray-400">{student?.id || sub.studentId} • {student ? `${student.level}/${student.room}` : ''}</p>
                          </td>
                          <td className="py-4 px-2">
                            <p className="font-medium text-gray-700">{assignment?.title || 'ชิ้นงานที่ลบไปแล้ว'}</p>
                            <p className="text-[9px] text-gray-400 uppercase">{new Date(sub.submittedAt).toLocaleString('th-TH')}</p>
                          </td>
                          <td className="py-4 px-2 text-center">
                            {sub.type === 'link' ? (
                              <a href={sub.content} target="_blank" rel="noreferrer" className="text-indigo-600 underline text-xs font-bold hover:text-indigo-800">
                                <i className="fas fa-external-link-alt mr-1"></i> เปิดลิงก์
                              </a>
                            ) : (
                              <button 
                                onClick={() => setPreviewImage(sub.content)} 
                                className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                              >
                                <i className="fas fa-image mr-1"></i> ดูภาพ
                              </button>
                            )}
                          </td>
                          <td className="py-4 px-2 text-center">
                            <div className="flex gap-1 justify-center">
                              <button 
                                onClick={() => handleGradeSubmission(sub.id, EvaluationStatus.PASS)}
                                title="ประเมิน: ผ่าน"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${sub.evaluation === EvaluationStatus.PASS ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-600'}`}
                              >
                                ผ
                              </button>
                              <button 
                                onClick={() => handleGradeSubmission(sub.id, EvaluationStatus.FAIL)}
                                title="ประเมิน: มผ"
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${sub.evaluation === EvaluationStatus.FAIL ? 'bg-red-500 text-white shadow-md' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600'}`}
                              >
                                มผ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
