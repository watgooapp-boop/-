
export enum AttendanceStatus {
  PRESENT = 'มา',
  ABSENT = 'ขาด',
  LEAVE = 'ลา',
  ACTIVITY = 'กิจกรรม'
}

export enum EvaluationStatus {
  PASS = 'ผ',
  FAIL = 'มผ'
}

export interface Student {
  id: string; // 5-digit string
  name: string;
  level: string; // ม.4 - ม.6
  room: number; // 1-13
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  isPinned: boolean;
  isHidden: boolean;
  createdAt: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  allowedTypes?: {
    image: boolean;
    link: boolean;
    file: boolean;
  };
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  type: 'file' | 'link' | 'image';
  content: string; // URL or text
  evaluation?: EvaluationStatus;
  submittedAt: string;
}
