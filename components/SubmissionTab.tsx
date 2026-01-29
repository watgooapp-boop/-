
import React, { useState, useMemo } from 'react';
import { Student, Assignment, Submission, EvaluationStatus } from '../types';
import Swal from 'sweetalert2';

interface SubmissionTabProps {
  students: Student[];
  assignments: Assignment[];
  submissions: Submission[];
  setSubmissions: React.Dispatch<React.SetStateAction<Submission[]>>;
  refreshData?: () => Promise<void>;
}

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwUJc_m_c-SlsbiIOj4-lD6a7_VTorepqPpvdwS-jDssWTq5t_8QEPHWvBVk8DwqYc9/exec';

const SubmissionTab: React.FC<SubmissionTabProps> = ({ students, assignments, submissions, setSubmissions, refreshData }) => {
  const [studentIdInput, setStudentIdInput] = useState('');
  const [foundStudent, setFoundStudent] = useState<Student | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('');
  const [submissionType, setSubmissionType] = useState<'image' | 'link' | 'file'>('image');
  const [submissionContent, setSubmissionContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const currentAssignment = useMemo(() => {
    return assignments.find(a => a.id === selectedAssignmentId);
  }, [selectedAssignmentId, assignments]);

  const studentSubmissions = useMemo(() => {
    if (!foundStudent) return [];
    return submissions.filter(s => String(s.studentId).trim() === String(foundStudent.id).trim());
  }, [foundStudent, submissions]);

  const searchStudent = () => {
    if (!studentIdInput.trim()) {
      Swal.fire('กรุณากรอกรหัส', 'โปรดระบุเลขประจำตัว 5 หลัก', 'warning');
      return;
    }

    const query = studentIdInput.trim();
    const student = students.find(s => String(s.id).trim() === query);
    
    if (student) {
      setFoundStudent(student);
      setStudentIdInput('');
    } else {
      setFoundStudent(null);
      Swal.fire({
        icon: 'error',
        title: 'ไม่พบข้อมูลนักเรียน!',
        text: `ไม่พบรหัสประจำตัว ${query} ในฐานข้อมูลปัจจุบัน`,
        footer: '<div class="text-indigo-600 font-bold italic">กรุณาตรวจสอบรหัส หรือลงทะเบียนก่อนเข้าสู่ระบบ</div>'
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { 
        Swal.fire('ไฟล์ใหญ่เกินไป', 'กรุณาเลือกไฟล์ขนาดไม่เกิน 2MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSubmissionContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const submitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundStudent || !selectedAssignmentId || !submissionContent) {
      Swal.fire('ข้อมูลไม่ครบ', 'กรุณาเลือกชิ้นงานและแนบหลักฐาน', 'warning');
      return;
    }

    setIsUploading(true);
    Swal.fire({
      title: 'กำลังส่งข้อมูล...',
      text: 'ระบบกำลังอัปโหลดหลักฐานไปยัง Cloud',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); }
    });

    const submissionData = {
      id: Date.now().toString(),
      assignmentId: selectedAssignmentId,
      studentId: String(foundStudent.id).trim(),
      type: submissionType,
      content: submissionContent,
      submittedAt: new Date().toISOString()
    };

    try {
      const params = new URLSearchParams();
      params.append('mode', 'submission');
      params.append('id', submissionData.id);
      params.append('assignmentId', submissionData.assignmentId);
      params.append('studentId', submissionData.studentId);
      params.append('type', submissionData.type);
      params.append('content', submissionData.content);
      params.append('submittedAt', submissionData.submittedAt);

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
        title: 'ส่งงานเรียบร้อย!',
        text: 'ข้อมูลของคุณถูกบันทึกเรียบร้อยแล้ว',
        timer: 2000,
        showConfirmButton: false
      });
      
      setSelectedAssignmentId('');
      setSubmissionContent('');
      
    } catch (error) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-2xl border border-indigo-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-0 opacity-40"></div>
        
        <h2 className="text-2xl font-bold text-indigo-900 mb-6 flex items-center relative z-10">
          <i className="fas fa-upload mr-3 text-indigo-600 animate-bounce"></i> 
          ส่งงานนักเรียน
        </h2>

        {!foundStudent ? (
          <div className="space-y-4 animate-fade-in relative z-10 py-6">
            <label className="block text-sm font-bold text-gray-500 ml-1 uppercase tracking-widest text-center">ระบุเลขประจำตัว 5 หลักเพื่อส่งงาน</label>
            <div className="flex flex-col md:flex-row gap-2 max-w-md mx-auto">
              <input 
                type="text" 
                maxLength={10}
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && searchStudent()}
                className="flex-grow px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-indigo-500 focus:bg-white outline-none text-2xl font-black text-center text-indigo-700 transition-all placeholder:text-sm placeholder:font-normal"
                placeholder="รหัสประจำตัว"
              />
              <button 
                onClick={searchStudent}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <i className="fas fa-sign-in-alt"></i> เข้าใช้งาน
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10 animate-fade-in">
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border-2 border-indigo-100 flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 w-1 h-full bg-indigo-600"></div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                    <i className="fas fa-graduation-cap text-2xl"></i>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-indigo-900 leading-tight">{foundStudent.name}</h3>
                    <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest mt-1">
                      ชั้น {foundStudent.level}/{foundStudent.room} • รหัส {foundStudent.id}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setFoundStudent(null); setStudentIdInput(''); }}
                  className="bg-red-50 hover:bg-red-500 hover:text-white text-red-500 w-10 h-10 rounded-xl transition-all flex items-center justify-center shadow-sm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100 h-full max-h-[500px] overflow-y-auto scrollbar-hide">
                <h4 className="text-lg font-bold text-indigo-900 mb-4 flex items-center">
                  <i className="fas fa-tasks mr-2 text-indigo-500"></i> เลือกชิ้นงาน
                </h4>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm italic">ยังไม่มีงานที่มอบหมาย</div>
                  ) : (
                    assignments.map(asg => {
                      const submission = studentSubmissions.find(s => String(s.assignmentId).trim() === String(asg.id).trim());
                      return (
                        <div 
                          key={asg.id} 
                          onClick={() => setSelectedAssignmentId(asg.id)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer bg-white ${selectedAssignmentId === asg.id ? 'border-indigo-600 shadow-md ring-4 ring-indigo-50' : 'border-transparent hover:border-indigo-100'}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-grow">
                              <p className={`font-bold text-sm ${selectedAssignmentId === asg.id ? 'text-indigo-700' : 'text-gray-700'}`}>{asg.title}</p>
                              <p className="text-[10px] text-gray-400 mt-1">กำหนดส่ง: {asg.dueDate}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              {submission ? (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                  submission.evaluation === EvaluationStatus.PASS ? 'bg-green-100 text-green-600' :
                                  submission.evaluation === EvaluationStatus.FAIL ? 'bg-red-100 text-red-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>
                                  {submission.evaluation === EvaluationStatus.PASS ? 'ผ่าน' : 
                                   submission.evaluation === EvaluationStatus.FAIL ? 'มผ' : 
                                   'รอตรวจ'}
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-400 rounded-full text-[9px] font-black uppercase tracking-widest">ยังไม่ส่ง</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-3xl p-6 border-2 border-dashed border-slate-200">
              {selectedAssignmentId ? (
                <form onSubmit={submitWork} className="space-y-6">
                  <div className="flex flex-col gap-4 pb-4 border-b border-slate-200">
                    <div>
                      <h4 className="font-black text-indigo-900 text-lg uppercase tracking-tight">{currentAssignment?.title}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase">ระบุข้อมูลหลักฐานเพื่อส่งงาน</p>
                    </div>

                    {/* ส่วนรายละเอียดที่ครูมอบหมาย */}
                    {currentAssignment?.description && (
                      <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl relative overflow-hidden group">
                        <div className="absolute -right-2 -bottom-2 opacity-5 text-4xl text-indigo-900 rotate-12 group-hover:scale-110 transition-transform">
                          <i className="fas fa-info-circle"></i>
                        </div>
                        <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                          <i className="fas fa-chalkboard-teacher"></i> รายละเอียดที่ครูมอบหมาย
                        </h5>
                        <p className="text-sm text-indigo-900 whitespace-pre-wrap leading-relaxed font-medium">
                          {currentAssignment.description}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">รูปแบบการส่ง</label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { type: 'image', icon: 'fa-image', label: 'รูปภาพ' },
                          { type: 'link', icon: 'fa-link', label: 'ลิงก์งาน' },
                          { type: 'file', icon: 'fa-file-alt', label: 'ไฟล์งาน' }
                        ].map(item => (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => { setSubmissionType(item.type as any); setSubmissionContent(''); }}
                            className={`py-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${submissionType === item.type ? 'border-indigo-600 bg-white text-indigo-600 font-bold shadow-md shadow-indigo-100' : 'border-transparent bg-white/50 text-gray-400 hover:bg-white'}`}
                          >
                            <i className={`fas ${item.icon} text-sm`}></i>
                            <span className="text-[9px] uppercase font-black tracking-widest">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-widest">ข้อมูลหลักฐาน</label>
                      {submissionType === 'link' ? (
                        <input 
                          type="url"
                          required
                          placeholder="วางลิงก์หลักฐานที่นี่"
                          value={submissionContent}
                          onChange={(e) => setSubmissionContent(e.target.value)}
                          className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl focus:border-indigo-500 outline-none text-sm font-medium shadow-sm"
                        />
                      ) : (
                        <div className="relative">
                          <input 
                            type="file"
                            accept={submissionType === 'image' ? 'image/*' : '*/*'}
                            onChange={handleFileUpload}
                            className="hidden"
                            id="upload-input-submission"
                          />
                          <label 
                            htmlFor="upload-input-submission"
                            className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 bg-white rounded-2xl p-6 cursor-pointer hover:bg-indigo-50 transition-all min-h-[120px] shadow-sm"
                          >
                            <i className={`fas ${submissionContent ? 'fa-check-circle text-green-500' : 'fa-cloud-upload-alt text-indigo-300'} text-3xl mb-2`}></i>
                            <span className="text-xs font-bold text-indigo-900 text-center truncate w-full px-4">
                              {submissionContent ? 'เลือกไฟล์ใหม่' : `เลือกไฟล์${submissionType === 'image' ? 'รูปภาพ' : 'งาน'}`}
                            </span>
                            <span className="text-[9px] text-gray-400 mt-1">สูงสุด 2MB</span>
                          </label>
                        </div>
                      )}
                    </div>

                    {submissionType === 'image' && submissionContent && (
                      <div className="p-2 bg-white rounded-2xl border shadow-inner flex justify-center animate-fade-in">
                        <img src={submissionContent} alt="preview" className="max-h-32 rounded-lg object-contain" />
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isUploading}
                      className={`w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${isUploading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 active:scale-95 shadow-indigo-100'}`}
                    >
                      {isUploading ? <><i className="fas fa-circle-notch animate-spin"></i> กำลังบันทึก...</> : <><i className="fas fa-paper-plane"></i> ส่งงาน</>}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16 opacity-30">
                  <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-500">
                    <i className="fas fa-mouse-pointer text-3xl"></i>
                  </div>
                  <p className="text-sm font-black text-indigo-900 uppercase tracking-widest">เลือกงานที่ต้องการส่ง</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmissionTab;
