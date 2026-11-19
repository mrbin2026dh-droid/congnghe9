/**
 * TeenVoca AI – Bộ nhớ tài khoản offline trên thiết bị
 *
 * Giúp đăng nhập KHÔNG CẦN MẠNG ở cả 3 loại thiết bị:
 *  - Điện thoại / máy tính riêng: máy tự nhớ tài khoản học sinh đã từng đăng nhập (lỡ đăng xuất vẫn vào lại được).
 *  - Máy tính nhà trường (dùng chung): giáo viên bấm "Tải danh sách lớp về máy" khi còn mạng ->
 *    mọi học sinh trong lớp đăng nhập được trên máy đó dù mất mạng.
 *  - Giáo viên: lưu MÃ BĂM (SHA-256) của PIN đã xác minh online, không lưu PIN gốc; offline chỉ vào được
 *    trên máy đã đăng nhập giáo viên thành công trước đó. Không bao giờ dùng PIN mặc định khi offline.
 *
 * Dữ liệu offline luôn được Firebase ghi đè khi có mạng (Firebase là nguồn chuẩn).
 */
'use strict';

const OfflineAccounts = (() => {
  const ACCOUNTS_KEY = 'teenvoca_offline_accounts_v1';
  const TEACHER_ROSTER_KEY = 'teenvoca_teacher_roster_cache_v1';
  const TEACHER_PIN_HASH_KEY = 'teenvoca_teacher_pin_hash_v1';
  const PIN_SALT = 'teenvoca-ai|congnghe9|teacher-pin';

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.warn('Không lưu được dữ liệu offline (bộ nhớ đầy?):', err);
      return false;
    }
  }

  function cleanCode(code) {
    return String(code || '').toUpperCase().trim();
  }

  function allAccounts() {
    const data = read(ACCOUNTS_KEY, {});
    return (data && typeof data === 'object') ? data : {};
  }

  // ---------------------------------------------------------------- HỌC SINH
  function get(code) {
    const entry = allAccounts()[cleanCode(code)];
    return entry && entry.record ? entry.record : null;
  }

  function getEntry(code) {
    return allAccounts()[cleanCode(code)] || null;
  }

  /**
   * Lưu bản ghi học sinh (dạng giống trên Firebase).
   * @param {string} source 'login' (tự nhớ khi đăng nhập) | 'teacher' (giáo viên tải danh sách lớp)
   */
  function save(code, record, source = 'login') {
    const key = cleanCode(code);
    if (!key || !record) return false;
    const accounts = allAccounts();
    const prev = accounts[key] || {};
    accounts[key] = {
      record: { ...record, studentCode: record.studentCode || key },
      source: prev.source === 'login' ? 'login' : source,
      savedAt: new Date().toISOString()
    };
    return write(ACCOUNTS_KEY, accounts);
  }

  function saveMany(records, source = 'teacher') {
    const accounts = allAccounts();
    const now = new Date().toISOString();
    let count = 0;
    (records || []).forEach((r) => {
      const key = cleanCode(r && r.studentCode);
      if (!key) return;
      const prev = accounts[key] || {};
      accounts[key] = {
        record: { ...r, studentCode: key },
        source: prev.source === 'login' ? 'login' : source,
        savedAt: now
      };
      count += 1;
    });
    return write(ACCOUNTS_KEY, accounts) ? count : 0;
  }

  /** Cập nhật bản ghi offline bằng tiến độ mới nhất (gọi mỗi lần đồng bộ tiến độ). */
  function mergeProgress(code, payload, identity = {}) {
    const key = cleanCode(code);
    if (!key || !payload) return;
    const prev = get(key) || { studentCode: key };
    const merged = { ...prev, ...payload };
    ['name', 'grade', 'school'].forEach((f) => {
      if (identity[f]) merged[f] = identity[f];
    });
    // null nghĩa là "đã xóa" (vd: bản nháp khảo sát đã hoàn thành)
    Object.keys(merged).forEach((k) => { if (merged[k] === null) delete merged[k]; });
    save(key, merged, 'login');
  }

  function remove(code) {
    const accounts = allAccounts();
    delete accounts[cleanCode(code)];
    write(ACCOUNTS_KEY, accounts);
  }

  function count() {
    return Object.keys(allAccounts()).length;
  }

  function list() {
    return Object.values(allAccounts()).map(e => e.record).filter(Boolean);
  }

  /** Xóa toàn bộ dữ liệu offline của học sinh trên máy (máy dùng chung, cuối năm học...). */
  function clearStudents() {
    try { localStorage.removeItem(ACCOUNTS_KEY); } catch { /* bỏ qua */ }
  }

  // ---------------------------------------------------------------- GIÁO VIÊN
  async function hashPin(pin) {
    if (!(window.crypto && window.crypto.subtle && window.TextEncoder)) return '';
    const bytes = new TextEncoder().encode(`${PIN_SALT}|${String(pin).trim()}`);
    const digest = await window.crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /** Ghi nhớ PIN đã được Firebase xác nhận đúng (chỉ lưu mã băm). */
  async function rememberTeacherPin(pin) {
    const hash = await hashPin(pin);
    if (hash) write(TEACHER_PIN_HASH_KEY, { hash, savedAt: new Date().toISOString() });
  }

  function hasTeacherPin() {
    const saved = read(TEACHER_PIN_HASH_KEY, null);
    return Boolean(saved && saved.hash);
  }

  /** @returns {Promise<boolean|null>} true/false nếu máy có PIN đã lưu, null nếu máy chưa từng đăng nhập GV */
  async function verifyTeacherPinOffline(pin) {
    const saved = read(TEACHER_PIN_HASH_KEY, null);
    if (!saved || !saved.hash) return null;
    const hash = await hashPin(pin);
    return Boolean(hash) && hash === saved.hash;
  }

  function forgetTeacherPin() {
    try { localStorage.removeItem(TEACHER_PIN_HASH_KEY); } catch { /* bỏ qua */ }
  }

  /** Lưu danh sách lớp giáo viên xem gần nhất (để mở bảng giáo viên khi mất mạng). */
  function saveTeacherRoster(students) {
    if (!Array.isArray(students)) return;
    const prev = read(TEACHER_ROSTER_KEY, { students: [] });
    const byCode = {};
    (prev.students || []).forEach((s) => { if (s && s.studentCode) byCode[cleanCode(s.studentCode)] = s; });
    students.forEach((s) => { if (s && s.studentCode) byCode[cleanCode(s.studentCode)] = s; });
    write(TEACHER_ROSTER_KEY, { students: Object.values(byCode), savedAt: new Date().toISOString() });
  }

  /** Thay toàn bộ danh sách đã lưu (khi đã có danh sách đầy đủ của tất cả các lớp từ Firebase). */
  function replaceTeacherRoster(students) {
    if (!Array.isArray(students)) return;
    write(TEACHER_ROSTER_KEY, { students, savedAt: new Date().toISOString() });
  }

  function getTeacherRoster() {
    const data = read(TEACHER_ROSTER_KEY, null);
    return data && Array.isArray(data.students) ? data : null;
  }

  function clearTeacherData() {
    forgetTeacherPin();
    try { localStorage.removeItem(TEACHER_ROSTER_KEY); } catch { /* bỏ qua */ }
  }

  return {
    get,
    getEntry,
    save,
    saveMany,
    mergeProgress,
    remove,
    count,
    list,
    clearStudents,
    rememberTeacherPin,
    hasTeacherPin,
    verifyTeacherPinOffline,
    forgetTeacherPin,
    saveTeacherRoster,
    replaceTeacherRoster,
    getTeacherRoster,
    clearTeacherData
  };
})();

window.OfflineAccounts = OfflineAccounts;
