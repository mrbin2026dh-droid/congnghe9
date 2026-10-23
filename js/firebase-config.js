/**
 * EduPath AI - Firebase Realtime Database Connector & Offline Fallback Engine
 * Strictly follows ES6 standards, Alibaba Open-Code-Review guidelines (zero var, strict equality).
 * Ensures zero-data loss, automatic local fallback when credentials are not yet configured.
 */
'use strict';

// -------------------------------------------------------------
// FIREBASE CONFIGURATION OBJECT (DỮ LIỆU THẬT TỪ GOOGLE CLOUD)
// -------------------------------------------------------------
window.EduPathFirebaseConfig = window.EduPathFirebaseConfig || {
  apiKey: "AIzaSyApj4uZHUsiEyPqOdPuFD2pp3hfw0i7TGE",
  authDomain: "edupath-ai-huongnghiep.firebaseapp.com",
  databaseURL: "https://edupath-ai-huongnghiep-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edupath-ai-huongnghiep",
  storageBucket: "edupath-ai-huongnghiep.firebasestorage.app",
  messagingSenderId: "137500941801",
  appId: "1:137500941801:web:8576b9bf0d75d2e664bf78"
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
        // Live Firebase: 100% cloud sync, zero fake auto-seed
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
    return [];
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
