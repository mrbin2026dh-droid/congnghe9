/**
 * EduPath AI - Firebase Realtime Database Connector & Offline Fallback Engine
 * Strictly follows ES6 standards, Alibaba Open-Code-Review guidelines (zero var, strict equality).
 * Ensures zero-data loss, automatic local fallback when credentials are not yet configured.
 */
'use strict';

// -------------------------------------------------------------
// FIREBASE CONFIGURATION OBJECT
// Giáo viên / Quản trị viên dán thông số cấu hình Firebase vào đây
// Chi tiết xem tại tệp: HUONG_DAN_TAO_FIREBASE_MIEN_PHI.md
// -------------------------------------------------------------
window.EduPathFirebaseConfig = window.EduPathFirebaseConfig || {
  apiKey: "AIzaSyYOUR_API_KEY_HERE",
  authDomain: "edupath-ai-demo.firebaseapp.com",
  databaseURL: "https://edupath-ai-demo-default-rtdb.firebaseio.com",
  projectId: "edupath-ai-demo",
  storageBucket: "edupath-ai-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};

window.EduPathFirebase = (() => {
  let dbInstance = null;
  let isFirebaseReady = false;

  // Initialize Firebase if valid credentials provided
  function initFirebase() {
    const cfg = window.EduPathFirebaseConfig;
    if (
      cfg &&
      cfg.apiKey &&
      cfg.apiKey !== 'AIzaSyYOUR_API_KEY_HERE' &&
      typeof window.firebase !== 'undefined'
    ) {
      try {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(cfg);
        }
        dbInstance = window.firebase.database();
        isFirebaseReady = true;
        console.info('EduPath AI: Kết nối thành công Firebase Realtime Database.');
      } catch (err) {
        console.warn('EduPath AI: Khởi tạo Firebase thất bại, chuyển sang chế độ dự phòng:', err);
        isFirebaseReady = false;
      }
    } else {
      isFirebaseReady = false;
    }
  }

  // Fallback Local Storage Storage Key
  const STORAGE_KEY = 'edupath_synced_roster';

  function getLocalRoster() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc local roster:', e);
    }
    // Default initial seed roster
    const seed = [
      { id: 1, studentCode: '9A1-01', school: 'THCS Chu Văn An', grade: '9A1', name: 'Nguyễn Văn An', code: 'RIE', major: 'Kỹ thuật Cơ điện tử', projectScore: 9, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học Kỹ thuật' },
      { id: 2, studentCode: '9A1-02', school: 'THCS Chu Văn An', grade: '9A1', name: 'Trần Thị Bích', code: 'AIR', major: 'Thiết kế Đồ họa & UI/UX', projectScore: 8, classification: 'Phù hợp hoàn toàn', stream: 'THPT & ĐH Mỹ thuật' },
      { id: 3, studentCode: '9A1-03', school: 'THCS Chu Văn An', grade: '9A1', name: 'Lê Hoàng Cường', code: 'RCI', major: 'Cơ khí Chế tạo máy (9+)', projectScore: 8, classification: 'Phù hợp hoàn toàn', stream: 'Cao đẳng Nghề 9+' },
      { id: 4, studentCode: '9A2-04', school: 'THCS Lê Quý Đôn', grade: '9A2', name: 'Phạm Đức Dũng', code: 'IRC', major: 'Công nghệ thông tin', projectScore: 10, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học CNTT' },
      { id: 5, studentCode: '9A2-05', school: 'THCS Lê Quý Đôn', grade: '9A2', name: 'Vũ Ngọc Hân', code: 'SEC', major: 'Sư phạm Kỹ thuật', projectScore: 7, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học Sư phạm' },
      { id: 6, studentCode: '9B1-06', school: 'THCS Nguyễn Du', grade: '9B1', name: 'Đặng Minh Khôi', code: 'RCS', major: 'Điện dân dụng (9+)', projectScore: 9, classification: 'Phù hợp hoàn toàn', stream: 'Trung cấp Nghề 9+' },
      { id: 7, studentCode: '9B1-07', school: 'THCS Nguyễn Du', grade: '9B1', name: 'Bùi Phương Linh', code: 'EIR', major: 'Quản lý Sản phẩm Tech', projectScore: 8, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học Kinh tế Tech' },
      { id: 8, studentCode: '9C-08', school: 'THCS Trưng Vương', grade: '9C', name: 'Hoàng Anh Tuấn', code: 'REC', major: 'Công nghệ Ô tô & Xe điện', projectScore: 9, classification: 'Phù hợp hoàn toàn', stream: 'Cao đẳng Nghề 9+' },
      { id: 9, studentCode: '9C-09', school: 'THCS Trưng Vương', grade: '9C', name: 'Đỗ Thanh Tùng', code: 'ICR', major: 'An toàn thông tin', projectScore: 8, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học Bách Khoa' },
      { id: 10, studentCode: '9A1-10', school: 'THCS Chu Văn An', grade: '9A1', name: 'Ngô Bảo Yến', code: 'RAI', major: 'Kiến trúc & Xây dựng', projectScore: 9, classification: 'Phù hợp hoàn toàn', stream: 'THPT & Đại học Kiến trúc' }
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }

  // Real-time broadcast channel for offline multi-window synchronization
  let broadcastChannel = null;
  try {
    if (typeof window !== 'undefined' && typeof window.BroadcastChannel !== 'undefined') {
      broadcastChannel = new BroadcastChannel('edupath_realtime_sync');
      broadcastChannel.onmessage = (event) => {
        if (event && event.data && event.data.type === 'ROSTER_UPDATED') {
          notifyLocalListeners(event.data.classId);
        }
      };
    }
  } catch (e) {
    console.debug('BroadcastChannel not available:', e);
  }

  function saveLocalRoster(roster, classId) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'ROSTER_UPDATED', classId });
      }
    } catch (e) {
      console.warn('Lỗi ghi local roster:', e);
    }
  }

  // Active listeners for realtime broadcast
  const localListeners = [];

  function notifyLocalListeners(classId) {
    const roster = getLocalRoster();
    const filtered = classId ? roster.filter(s => s.grade === classId || s.studentCode.startsWith(classId)) : roster;
    localListeners.forEach(listener => {
      try {
        listener(filtered);
      } catch (err) {
        console.error('Lỗi khi kích hoạt listener địa phương:', err);
      }
    });
  }

  // Cross-context real-time sync via storage event when in local fallback mode
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEY) {
        notifyLocalListeners();
      }
    });
  }

  // Public API
  return {
    init: initFirebase,

    isConfigured: () => {
      return isFirebaseReady && dbInstance !== null;
    },

    getStudent: async (studentCode) => {
      if (!studentCode) return null;
      const cleanCode = studentCode.toUpperCase().trim();

      if (isFirebaseReady && dbInstance) {
        try {
          const snapshot = await dbInstance.ref(`students/${cleanCode}`).once('value');
          if (snapshot.exists()) {
            return snapshot.val();
          }
        } catch (err) {
          console.warn('Lỗi đọc từ Firebase, tra cứu local:', err);
        }
      }

      const roster = getLocalRoster();
      const found = roster.find(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      return found || null;
    },

    getAllStudents: async (classId = '9A1') => {
      if (isFirebaseReady && dbInstance) {
        try {
          const snapshot = await dbInstance.ref('students').once('value');
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.values(data);
            return list.filter(s => !classId || s.grade === classId || (s.studentCode && s.studentCode.startsWith(classId)));
          }
        } catch (err) {
          console.warn('Lỗi lấy danh sách từ Firebase, dùng fallback:', err);
        }
      }

      const roster = getLocalRoster();
      return roster.filter(s => !classId || s.grade === classId || (s.studentCode && s.studentCode.startsWith(classId)));
    },

    addStudent: async (student) => {
      if (!student || !student.studentCode) return false;
      const cleanCode = student.studentCode.toUpperCase().trim();
      const payload = {
        ...student,
        studentCode: cleanCode,
        updatedAt: new Date().toISOString()
      };

      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref(`students/${cleanCode}`).set(payload);
        } catch (err) {
          console.warn('Lỗi ghi Firebase:', err);
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        roster[idx] = { ...roster[idx], ...payload };
      } else {
        payload.id = roster.length > 0 ? Math.max(...roster.map(s => s.id || 0)) + 1 : 1;
        roster.push(payload);
      }
      saveLocalRoster(roster);
      notifyLocalListeners(payload.grade);
      return true;
    },

    updateStudent: async (studentCode, updateData) => {
      if (!studentCode || !updateData) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref(`students/${cleanCode}`).update({
            ...updateData,
            updatedAt: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Lỗi cập nhật Firebase:', err);
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        roster[idx] = { ...roster[idx], ...updateData, updatedAt: new Date().toISOString() };
        saveLocalRoster(roster);
        notifyLocalListeners(roster[idx].grade);
        return true;
      }
      return false;
    },

    deleteStudent: async (studentCode) => {
      if (!studentCode) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref(`students/${cleanCode}`).remove();
        } catch (err) {
          console.warn('Lỗi xóa trên Firebase:', err);
        }
      }

      const roster = getLocalRoster();
      const filtered = roster.filter(s => !s.studentCode || s.studentCode.toUpperCase() !== cleanCode);
      saveLocalRoster(filtered);
      notifyLocalListeners();
      return true;
    },

    saveStudentProgress: async (studentCode, progressData) => {
      if (!studentCode || !progressData) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref(`students/${cleanCode}`).update({
            ...progressData,
            lastProgressUpdate: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Lỗi cập nhật tiến độ Firebase:', err);
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        roster[idx] = { ...roster[idx], ...progressData, lastProgressUpdate: new Date().toISOString() };
        saveLocalRoster(roster);
        notifyLocalListeners(roster[idx].grade);
        return true;
      }
      return false;
    },

    onClassStudentsChange: (classId, callback) => {
      if (typeof callback !== 'function') return () => {};

      if (isFirebaseReady && dbInstance) {
        const ref = dbInstance.ref('students');
        const listener = (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const list = Object.values(data);
            const filtered = list.filter(s => !classId || s.grade === classId || (s.studentCode && s.studentCode.startsWith(classId)));
            callback(filtered);
          } else {
            callback([]);
          }
        };
        ref.on('value', listener);
        return () => ref.off('value', listener);
      }

      // Local listener fallback
      localListeners.push(callback);
      // Immediate first callback invocation
      const roster = getLocalRoster();
      const filtered = classId ? roster.filter(s => s.grade === classId || (s.studentCode && s.studentCode.startsWith(classId))) : roster;
      callback(filtered);

      return () => {
        const index = localListeners.indexOf(callback);
        if (index >= 0) localListeners.splice(index, 1);
      };
    }
  };
})();

// Auto-run init
if (typeof window !== 'undefined') {
  window.EduPathFirebase.init();
}
