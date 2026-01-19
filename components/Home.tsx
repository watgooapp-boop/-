
import React, { useState } from 'react';
import { Student, AttendanceRecord, Announcement, AttendanceStatus } from '../types';

interface HomeProps {
  students: Student[];
  attendance: AttendanceRecord[];
  announcements: Announcement[];
}

const Home: React.FC<HomeProps> = ({ students, attendance, announcements }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const totalSessionsRequired = 20;

  const formatImageUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/file/d/')) {
      const id = url.split('/d/')[1].split('/')[0].split('?')[0];
      return `https://lh3.googleusercontent.com/d/${id}`;
    }
    return url;
  };

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-medium">{part}</a>;
      }
      return part;
    });
  };

  const getStudentStats = (studentId: string) => {
    const records = attendance.filter(r => r.studentId === studentId);
    const presentCount = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const leaveCount = records.filter(r => r.status === AttendanceStatus.LEAVE).length;
    const activityCount = records.filter(r => r.status === AttendanceStatus.ACTIVITY).length;
    const absentCount = records.filter(r => r.status === AttendanceStatus.ABSENT).length;
    
    const effectiveAttended = presentCount + leaveCount + activityCount;
    const percentage = (effectiveAttended / totalSessionsRequired) * 100;
    
    return {
      present: presentCount,
      leave: leaveCount,
      activity: activityCount,
      absent: absentCount,
      percentage: Math.min(percentage, 100),
      isPassed: percentage >= 80
    };
  };

  const visibleAnnouncements = announcements
    .filter(a => !a.isHidden)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // เรียงลำดับนักเรียนตาม ระดับชั้น (ม.4-ม.6) และ ห้อง (1-13)
  const sortedStudents = [...students].sort((a, b) => {
    if (a.level !== b.level) return a.level.localeCompare(b.level, 'th');
    return a.room - b.room;
  });

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-bullhorn text-indigo-600 text-xl"></i>
          <h2 className="text-2xl font-bold text-gray-800">ประกาศข่าวสาร</h2>
        </div>
        
        {visibleAnnouncements.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-gray-400 border-2 border-dashed">
            ยังไม่มีประกาศในขณะนี้
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleAnnouncements.map(ann => (
              <div key={ann.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden relative flex flex-col ${ann.isPinned ? 'ring-2 ring-yellow-400' : ''}`}>
                {ann.isPinned && (
                  <div className="absolute top-2 right-2 text-yellow-500 z-10 bg-white/80 rounded-full p-1 shadow-sm">
                    <i className="fas fa-thumbtack rotate-45"></i>
                  </div>
                )}
                {ann.imageUrl && (
                  <div className="h-48 bg-slate-100 overflow-hidden cursor-pointer flex items-center justify-center p-2" onClick={() => setSelectedImage(formatImageUrl(ann.imageUrl!))}>
                    <img src={formatImageUrl(ann.imageUrl)} alt={ann.title} className="max-w-full max-h-full object-contain hover:scale-105 transition-transform" />
                  </div>
                )}
                <div className="p-5 flex-grow">
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{ann.title}</h3>
                  <div className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{renderTextWithLinks(ann.content)}</div>
                  <div className="mt-4 pt-3 border-t text-[10px] text-gray-400 flex justify-between items-center">
                    <span>ID: {ann.id}</span>
                    <span>{new Date(ann.createdAt).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <i className="fas fa-file-invoice text-indigo-600 text-xl"></i>
          <h2 className="text-2xl font-bold text-gray-800">สรุปการเข้าเรียน</h2>
        </div>
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-[10px] md:text-xs border-b">
                <tr>
                  <th className="px-4 py-4">รหัส</th>
                  <th className="px-4 py-4">ชื่อ-สกุล (ชั้น/ห้อง)</th>
                  <th className="px-2 py-4 text-center text-green-600">มา</th>
                  <th className="px-2 py-4 text-center text-blue-600">ลา</th>
                  <th className="px-2 py-4 text-center text-orange-600">กิจกรรม</th>
                  <th className="px-2 py-4 text-center text-red-600">ขาด</th>
                  <th className="px-4 py-4 text-center">% มาเรียน</th>
                  <th className="px-4 py-4 text-center">ประเมิน</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-700">
                {sortedStudents.map(student => {
                  const stats = getStudentStats(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium">{student.id}</td>
                      <td className="px-4 py-4">
                        <div className="font-bold">{student.name}</div>
                        <div className="text-[10px] text-gray-400">{student.level}/{student.room}</div>
                      </td>
                      <td className="px-2 py-4 text-center text-green-600 font-bold">{stats.present}</td>
                      <td className="px-2 py-4 text-center text-blue-600 font-bold">{stats.leave}</td>
                      <td className="px-2 py-4 text-center text-orange-600 font-bold">{stats.activity}</td>
                      <td className="px-2 py-4 text-center text-red-600 font-bold">{stats.absent}</td>
                      <td className="px-4 py-4 text-center font-bold">{stats.percentage.toFixed(0)}%</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${stats.isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {stats.isPassed ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {sortedStudents.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400">ยังไม่มีข้อมูลนักเรียน</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <img src={selectedImage} alt="Full" className="max-w-full max-h-full rounded shadow-2xl bg-white p-1" />
        </div>
      )}
    </div>
  );
};

export default Home;
