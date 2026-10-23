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

  function normalizeClassId(classId) {
    if (!classId) return '';
    const trimmed = String(classId).trim();
    if (trimmed === 'Tất cả các lớp' || trimmed === 'TAT CA CAC LOP') return '';
    return trimmed.toUpperCase();
  }

  // Recursively sanitize objects for Firebase Realtime Database:
  // Converts undefined to null, ensures clean JSON serializable data.
  function sanitizeForFirebase(data) {
    if (data === undefined) return null;
    if (data === null || typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => sanitizeForFirebase(item));
    }
    const clean = {};
    for (const key of Object.keys(data)) {
      const val = data[key];
      clean[key] = val === undefined ? null : sanitizeForFirebase(val);
    }
    return clean;
  }

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
          notifyLocalListeners();
        }
      };
    }
  } catch (e) {
    console.debug('BroadcastChannel not available:', e);
  }

  function saveLocalRoster(roster) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(roster));
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'ROSTER_UPDATED' });
      }
    } catch (e) {
      console.warn('Lỗi ghi local roster:', e);
    }
  }

  // Active listeners for realtime broadcast - stores { classId, callback }
  const localListeners = [];

  function notifyLocalListeners() {
    const roster = getLocalRoster();
    localListeners.forEach(({ classId, callback }) => {
      try {
        const filtered = classId 
          ? roster.filter(s => (s.grade || '').toUpperCase() === classId || (s.studentCode || '').toUpperCase().startsWith(classId + '-')) 
          : roster;
        callback(filtered);
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

    getAllStudents: async (classId = '') => {
      const normClass = normalizeClassId(classId);

      if (isFirebaseReady && dbInstance) {
        try {
          const snapshot = await dbInstance.ref('students').once('value');
          if (snapshot.exists()) {
            const data = snapshot.val() || {};
            const list = Object.values(data).filter(s => s && s.studentCode);
            return list.filter(s => {
              if (!normClass) return true;
              const sGrade = (s.grade || '').toUpperCase();
              const sCode = (s.studentCode || '').toUpperCase();
              return sGrade === normClass || sCode.startsWith(normClass + '-');
            });
          }
          return [];
        } catch (err) {
          console.warn('Lỗi lấy danh sách từ Firebase, dùng fallback:', err);
        }
      }

      const roster = getLocalRoster();
      return roster.filter(s => {
        if (!normClass) return true;
        const sGrade = (s.grade || '').toUpperCase();
        const sCode = (s.studentCode || '').toUpperCase();
        return sGrade === normClass || sCode.startsWith(normClass + '-');
      });
    },

    addStudent: async (student) => {
      if (!student || !student.studentCode) return false;
      const cleanCode = student.studentCode.toUpperCase().trim();
      const forbidden = /[.#$[\]/]/;
      if (forbidden.test(cleanCode)) {
        throw new Error('Mã học sinh không được chứa ký tự đặc biệt: . # $ [ ] /');
      }

      let payload = {
        ...student,
        studentCode: cleanCode,
        updatedAt: new Date().toISOString()
      };

      let firebaseError = null;
      if (isFirebaseReady && dbInstance) {
        try {
          const snap = await dbInstance.ref(`students/${cleanCode}`).once('value');
          if (snap.exists()) {
            const existing = snap.val() || {};
            payload = {
              ...existing,
              ...payload,
              name: student.name || existing.name || '',
              grade: student.grade || existing.grade || '',
              school: student.school || existing.school || '',
              code: (student.code && student.code.trim().length > 0) ? student.code : (existing.code || ''),
              major: (student.major && student.major.trim().length > 0) ? student.major : (existing.major || ''),
              hollandScores: student.hollandScores || existing.hollandScores || null,
              hollandPercentages: student.hollandPercentages || existing.hollandPercentages || null,
              surveyHistory: student.surveyHistory || existing.surveyHistory || null,
              threeQuestions: student.threeQuestions || existing.threeQuestions || null,
              selfTraits: student.selfTraits || existing.selfTraits || null,
              projectScore: typeof student.projectScore === 'number' ? student.projectScore : (existing.projectScore !== undefined ? existing.projectScore : null),
              classification: student.classification || existing.classification || '',
              stream: student.stream || existing.stream || '',
              updatedAt: new Date().toISOString()
            };
          }
          const cleanPayload = sanitizeForFirebase(payload);
          await dbInstance.ref(`students/${cleanCode}`).set(cleanPayload);
        } catch (err) {
          console.error('Lỗi ghi Firebase:', err);
          firebaseError = err;
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        const existingLocal = roster[idx] || {};
        roster[idx] = {
          ...existingLocal,
          ...payload,
          code: (payload.code && payload.code.trim().length > 0) ? payload.code : (existingLocal.code || ''),
          major: (payload.major && payload.major.trim().length > 0) ? payload.major : (existingLocal.major || '')
        };
      } else {
        payload.id = roster.length > 0 ? Math.max(...roster.map(s => s.id || 0)) + 1 : 1;
        roster.push(payload);
      }
      saveLocalRoster(roster);
      notifyLocalListeners();

      if (firebaseError && typeof navigator !== 'undefined' && !navigator.onLine) {
        return true;
      }
      if (firebaseError) {
        throw firebaseError;
      }
      return true;
    },

    updateStudent: async (studentCode, updateData) => {
      if (!studentCode || !updateData) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      let firebaseError = null;
      if (isFirebaseReady && dbInstance) {
        try {
          const cleanUpdate = sanitizeForFirebase({
            ...updateData,
            updatedAt: new Date().toISOString()
          });
          await dbInstance.ref(`students/${cleanCode}`).update(cleanUpdate);
        } catch (err) {
          console.error('Lỗi cập nhật Firebase:', err);
          firebaseError = err;
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        roster[idx] = { ...roster[idx], ...updateData, updatedAt: new Date().toISOString() };
        saveLocalRoster(roster);
        notifyLocalListeners();
      }

      if (firebaseError && typeof navigator !== 'undefined' && !navigator.onLine) {
        return true;
      }
      if (firebaseError) {
        throw firebaseError;
      }
      return true;
    },

    deleteStudent: async (studentCode) => {
      if (!studentCode) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      let firebaseError = null;
      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref(`students/${cleanCode}`).remove();
        } catch (err) {
          console.error('Lỗi xóa trên Firebase:', err);
          firebaseError = err;
        }
      }

      const roster = getLocalRoster();
      const filtered = roster.filter(s => !s.studentCode || s.studentCode.toUpperCase() !== cleanCode);
      saveLocalRoster(filtered);
      notifyLocalListeners();

      if (firebaseError && typeof navigator !== 'undefined' && !navigator.onLine) {
        return true;
      }
      if (firebaseError) {
        throw firebaseError;
      }
      return true;
    },

    saveStudentProgress: async (studentCode, progressData) => {
      if (!studentCode || !progressData) return false;
      const cleanCode = studentCode.toUpperCase().trim();

      let firebaseError = null;
      if (isFirebaseReady && dbInstance) {
        try {
          const cleanProgress = sanitizeForFirebase({
            ...progressData,
            lastProgressUpdate: new Date().toISOString()
          });
          await dbInstance.ref(`students/${cleanCode}`).update(cleanProgress);
        } catch (err) {
          console.error('Lỗi cập nhật tiến độ Firebase:', err);
          firebaseError = err;
        }
      }

      const roster = getLocalRoster();
      const idx = roster.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === cleanCode);
      if (idx >= 0) {
        roster[idx] = { ...roster[idx], ...progressData, lastProgressUpdate: new Date().toISOString() };
        saveLocalRoster(roster);
        notifyLocalListeners();
      }

      if (firebaseError && typeof navigator !== 'undefined' && !navigator.onLine) {
        return true;
      }
      if (firebaseError) {
        throw firebaseError;
      }
      return true;
    },

    onClassStudentsChange: (classId, callback) => {
      if (typeof callback !== 'function') return () => {};

      const normClass = normalizeClassId(classId);

      if (isFirebaseReady && dbInstance) {
        const ref = dbInstance.ref('students');
        const listener = (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val() || {};
            const list = Object.values(data).filter(s => s && s.studentCode);
            const filtered = list.filter(s => {
              if (!normClass) return true;
              const sGrade = (s.grade || '').toUpperCase();
              const sCode = (s.studentCode || '').toUpperCase();
              return sGrade === normClass || sCode.startsWith(normClass + '-');
            });
            callback(filtered);
          } else {
            callback([]);
          }
        };
        ref.on('value', listener);
        return () => ref.off('value', listener);
      }

      // Local listener fallback
      const listenerObj = { classId: normClass, callback };
      localListeners.push(listenerObj);

      // Immediate first callback invocation
      const roster = getLocalRoster();
      const filtered = normClass 
        ? roster.filter(s => (s.grade || '').toUpperCase() === normClass || (s.studentCode || '').toUpperCase().startsWith(normClass + '-')) 
        : roster;
      callback(filtered);

      return () => {
        const index = localListeners.indexOf(listenerObj);
        if (index >= 0) localListeners.splice(index, 1);
      };
    },

    getTeacherPin: async () => {
      if (isFirebaseReady && dbInstance) {
        try {
          const snapshot = await dbInstance.ref('settings/teacherPin').once('value');
          if (snapshot.exists()) {
            return String(snapshot.val());
          }
        } catch (e) {
          console.warn('Lỗi đọc teacherPin từ Firebase:', e);
        }
      }
      return localStorage.getItem('edupath_teacher_pin') || '2026';
    },

    setTeacherPin: async (newPin) => {
      const cleanPin = String(newPin).trim();
      localStorage.setItem('edupath_teacher_pin', cleanPin);
      if (isFirebaseReady && dbInstance) {
        try {
          await dbInstance.ref('settings/teacherPin').set(cleanPin);
          return true;
        } catch (e) {
          console.warn('Lỗi ghi teacherPin lên Firebase:', e);
        }
      }
      return true;
    },

    getGeminiConfig: async () => {
      if (isFirebaseReady && dbInstance) {
        try {
          const snapshot = await dbInstance.ref('settings/geminiConfig').once('value');
          if (snapshot.exists()) {
            const val = snapshot.val();
            if (val && typeof val === 'object' && val.apiKey) {
              return {
                apiKey: String(val.apiKey).trim(),
                model: String(val.model || 'gemini-1.5-flash').trim()
              };
            }
          }
        } catch (e) {
          console.warn('Lỗi đọc geminiConfig từ Firebase:', e);
        }
      }
      return null;
    },

    setGeminiConfig: async (cfg) => {
      if (isFirebaseReady && dbInstance) {
        try {
          if (!cfg || !cfg.apiKey) {
            await dbInstance.ref('settings/geminiConfig').remove();
          } else {
            await dbInstance.ref('settings/geminiConfig').set({
              apiKey: String(cfg.apiKey).trim(),
              model: String(cfg.model || 'gemini-1.5-flash').trim(),
              updatedAt: new Date().toISOString()
            });
          }
          return true;
        } catch (e) {
          console.warn('Lỗi ghi geminiConfig lên Firebase:', e);
        }
      }
      return false;
    }
  };
})();

// Auto-run init
if (typeof window !== 'undefined') {
  window.EduPathFirebase.init();
}
