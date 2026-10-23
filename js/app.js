/**
 * EduPath AI - Main Application Coordinator & UI Controller
 * Zero-guesswork, Real-data binding, Smooth SPA Tab Navigation
 * Integrated with SVG Living Career Tree Animator (Hình 4.3 SGK)
 */
'use strict';

if (typeof window.sanitize === 'undefined') {
  window.sanitize = (html) => html;
}

class EduPathApp {
  constructor() {
    this.currentTab = 'tree';
    this.quizMode = 'full';
    this.currentQuestionIdx = 0;
    this.quizAnswers = [];
    this.quizQuestions = [];
    this.activeAgentId = 'psychologist';
    this.agentChatHistories = {
      psychologist: [],
      'tech-lead': [],
      'streaming-officer': [],
      'market-analyst': []
    };
    this.isAgentThinking = false;

    this.studentProfile = {
      name: '',
      school: '',
      grade: '',
      studentCode: '',
      academicYear: '2025 – 2026',
      code: '',
      scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      percentages: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      targetMajorId: '',
      targetMajorName: '',
      selfTraits: {},
      threeQuestions: {
        understandSelf: '',
        understandCareer: '',
        careerPathPlan: ''
      }
    };

    // Assessment matches (10 items boolean) - Clean initial state (none pre-checked)
    this.assessmentMatches = [false, false, false, false, false, false, false, false, false, false];

    this.treeAnimator = null;
    this.audioCtx = null;
    this.currentUser = null;
    this.selectedTeacherStudentCode = null;
    this.userRole = null;

    this.loadProfileFromStorage();
    this.init();
  }

  init() {
    this.initAudio();
    this.initDOM();
    this.initAuth();
    this.initTreeAnimator();
    this.initQuiz();
    this.initAIAgents();
    this.initProjectAssessment();
    this.initTeacherDashboard();
    this.bindEvents();
    if (this.currentUser && this.currentUser.role === 'teacher') {
      this.switchTab('teacher');
    } else {
      this.switchTab('tree');
    }
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch {
      console.warn('Web Audio not supported');
    }
  }

  playBeep(freq = 520, type = 'sine', duration = 0.08) {
    if (!this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.debug('AudioContext not allowed or uninitialized:', e);
    }
  }

  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  formatAgentText(text) {
    if (typeof text !== 'string') return '';
    let safe = this.escapeHtml(text);
    safe = safe.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    safe = safe.replace(/\*(.*?)\*/g, '<em>$1</em>');
    safe = safe.replace(/\n/g, '<br>');
    return safe;
  }

  loadProfileFromStorage() {
    try {
      const rawUser = localStorage.getItem('edupath_current_user');
      if (rawUser) {
        this.currentUser = JSON.parse(rawUser);
        this.userRole = this.currentUser ? this.currentUser.role : null;
      } else {
        this.currentUser = null;
        this.userRole = null;
      }
      const raw = localStorage.getItem('edupath_student_profile');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.studentProfile = { ...this.studentProfile, ...parsed };
        }
      }
      const rawMatches = localStorage.getItem('edupath_assessment_matches');
      if (rawMatches) {
        const parsedMatches = JSON.parse(rawMatches);
        if (Array.isArray(parsedMatches) && parsedMatches.length === 10) {
          this.assessmentMatches = parsedMatches;
        }
      }
    } catch (e) {
      console.warn('Lỗi khi nạp hồ sơ từ localStorage:', e);
    }
  }

  saveProfileToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem('edupath_current_user', JSON.stringify(this.currentUser));
      }
      localStorage.setItem('edupath_student_profile', JSON.stringify(this.studentProfile));
      localStorage.setItem('edupath_assessment_matches', JSON.stringify(this.assessmentMatches));
      this.syncProgressToFirebase();
    } catch (e) {
      console.warn('Lỗi khi lưu hồ sơ vào localStorage:', e);
    }
  }

  syncProgressToFirebase() {
    if (!this.currentUser || this.currentUser.role !== 'student') return;
    const studentCode = this.currentUser.code || this.studentProfile.studentCode;
    if (!studentCode) return;

    // Only sync if student actually has data (not blank initial state)
    const hasHolland = Boolean(this.studentProfile.code && this.studentProfile.code.trim().length > 0);
    const hasMatches = Boolean(this.assessmentMatches && this.assessmentMatches.some(m => m === true));
    if (!hasHolland && !hasMatches && !this.studentProfile.targetMajorId) {
      return; // Do not push unattempted fake progress to Firebase
    }

    let targetMajorName = this.studentProfile.targetMajorName;
    if (!targetMajorName && this.studentProfile.targetMajorId && window.EduPathData && window.EduPathData.majors) {
      const targetMajor = window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId);
      targetMajorName = targetMajor ? targetMajor.name : '';
    }
    if (!targetMajorName && hasHolland && window.HollandEngine && window.EduPathData && window.EduPathData.majors) {
      const matched = window.HollandEngine.matchMajors(this.studentProfile.code, this.studentProfile.percentages || {});
      if (matched && matched.length > 0 && !this.studentProfile.isUndifferentiated) {
        this.studentProfile.targetMajorId = matched[0].id;
        this.studentProfile.targetMajorName = matched[0].name;
        targetMajorName = matched[0].name;
      }
    }
    const targetMajorObj = (window.EduPathData && window.EduPathData.majors && this.studentProfile.targetMajorId)
      ? window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId)
      : null;

    let stream = '';
    if (hasHolland) {
      // Phân luồng sau THCS theo SGK Công nghệ 9 Bài 2 & Bài 4
      const isPureVocational = targetMajorObj && targetMajorObj.level && targetMajorObj.level.includes('Trung cấp nghề 9+') && !targetMajorObj.level.includes('Đại học');
      const isTechVocational = (this.studentProfile.code && this.studentProfile.code.startsWith('R')) && targetMajorObj && targetMajorObj.level && targetMajorObj.level.includes('9+');
      if (isPureVocational || isTechVocational) {
        stream = 'Cao đẳng / Trung cấp Nghề 9+';
      } else {
        stream = 'Học tiếp THPT & Đại học';
      }
    }
    const result = hasMatches && window.ProjectAssessment ? window.ProjectAssessment.calculateProjectResult(this.assessmentMatches) : null;

    const payload = {
      name: this.studentProfile.name,
      school: this.studentProfile.school,
      grade: this.studentProfile.grade,
      code: this.studentProfile.code || '',
      major: targetMajorName || '',
      targetMajorId: this.studentProfile.targetMajorId || '',
      targetMajorName: targetMajorName || '',
      projectScore: result ? result.totalScore : null,
      classification: result ? result.classification : '',
      stream: stream,
      hollandScores: this.studentProfile.scores,
      hollandPercentages: this.studentProfile.percentages,
      assessmentMatches: this.assessmentMatches || [],
      threeQuestions: this.studentProfile.threeQuestions || { understandSelf: '', understandCareer: '', careerPathPlan: '' },
      selfTraits: this.studentProfile.selfTraits || {},
      surveyHistory: this.studentProfile.surveyHistory || [],
      activeAttemptId: this.studentProfile.activeAttemptId || '',
      isUndifferentiated: Boolean(this.studentProfile.isUndifferentiated)
    };

    if (window.EduPathFirebase) {
      window.EduPathFirebase.saveStudentProgress(studentCode, payload);
    }
  }

  exportProfileJSON() {
    this.saveProfileToStorage();
    const bundle = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      studentProfile: this.studentProfile,
      assessmentMatches: this.assessmentMatches,
      quizAnswers: this.quizAnswers,
      quizMode: this.quizMode
    };
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (this.studentProfile.name || 'hoc-sinh').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9-]/g, '_');
    a.href = url;
    a.download = `edupath_hoso_${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.playBeep(780);
  }

  importProfileJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data && data.studentProfile) {
          this.studentProfile = { ...this.studentProfile, ...data.studentProfile };
          if (Array.isArray(data.assessmentMatches) && data.assessmentMatches.length === 10) {
            this.assessmentMatches = data.assessmentMatches;
          }
          if (Array.isArray(data.quizAnswers)) {
            this.quizAnswers = data.quizAnswers;
          }
          if (data.quizMode) {
            this.quizMode = data.quizMode;
          }
          this.saveProfileToStorage();
          this.syncProfileDOM();
          this.renderAssessmentView();
          if (this.currentTab === 'teacher') {
            this.renderTeacherHeatmap();
          }
          this.playBeep(880, 'triangle', 0.2);
        } else {
          console.warn('Tệp JSON không đúng định dạng hồ sơ EduPath AI.');
        }
      } catch (err) {
        console.error('Lỗi phân tích file hồ sơ:', err);
      }
    };
    reader.readAsText(file);
  }

  syncProfileDOM() {
    const schoolInput = document.getElementById('student-school-input');
    const gradeInput = document.getElementById('student-grade-input');
    const nameInput = document.getElementById('student-name-input');
    if (schoolInput) schoolInput.value = this.studentProfile.school || '';
    if (gradeInput) gradeInput.value = this.studentProfile.grade || '';
    if (nameInput) nameInput.value = this.studentProfile.name || '';
    const infoText = document.getElementById('user-info-text');
    if (infoText && this.currentUser) {
      if (this.currentUser.role === 'teacher') {
        infoText.textContent = `Lớp ${this.currentUser.classId || '9A1'}`;
      } else {
        infoText.textContent = `${this.currentUser.code || '9A1-01'} · ${this.studentProfile.name}`;
      }
    }
  }

  initAuth() {
    const openLoginBtn = document.getElementById('btn-open-login');
    const logoutBtn = document.getElementById('btn-logout');
    const closeBtn = document.getElementById('btn-close-auth-modal');
    const authModal = document.getElementById('auth-modal');
    const tabStudent = document.getElementById('auth-tab-student');
    const tabTeacher = document.getElementById('auth-tab-teacher');
    const formStudent = document.getElementById('student-login-form');
    const formTeacher = document.getElementById('teacher-login-form');
    const studentCodeInput = document.getElementById('login-student-code');
    const teacherPinInput = document.getElementById('login-teacher-pin');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        if (this.currentUser) this.hideAuthModal();
      });
    }

    if (authModal) {
      authModal.addEventListener('click', (e) => {
        if (e.target === authModal && this.currentUser) this.hideAuthModal();
      });
    }

    if (tabStudent && tabTeacher) {
      tabStudent.addEventListener('click', () => {
        tabStudent.classList.add('active');
        tabTeacher.classList.remove('active');
        if (formStudent) formStudent.style.display = 'flex';
        if (formTeacher) formTeacher.style.display = 'none';
      });

      tabTeacher.addEventListener('click', () => {
        tabTeacher.classList.add('active');
        tabStudent.classList.remove('active');
        if (formTeacher) formTeacher.style.display = 'flex';
        if (formStudent) formStudent.style.display = 'none';
      });
    }

    if (formStudent) {
      formStudent.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = studentCodeInput ? studentCodeInput.value.trim().toUpperCase() : '';
        if (!code) return;
        this.handleStudentLogin(code);
      });
    }

    if (formTeacher) {
      formTeacher.addEventListener('submit', (e) => {
        e.preventDefault();
        const pin = teacherPinInput ? teacherPinInput.value.trim() : '';
        this.handleTeacherLogin(pin);
      });
    }

    if (openLoginBtn) {
      openLoginBtn.addEventListener('click', () => this.showAuthModal());
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    this.syncAuthUI();
  }

  showAuthModal() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'flex';
  }

  hideAuthModal() {
    if (!this.currentUser) return;
    const authModal = document.getElementById('auth-modal');
    if (authModal) authModal.style.display = 'none';
  }

  syncAuthUI() {
    const userBadge = document.getElementById('logged-in-user-badge');
    const roleTag = document.getElementById('user-role-tag');
    const infoText = document.getElementById('user-info-text');
    const openLoginBtn = document.getElementById('btn-open-login');
    const tabNav = document.querySelector('.tab-nav');
    const teacherNavBtn = document.querySelector('.tab-btn[data-tab="teacher"]');

    if (this.currentUser) {
      if (userBadge) userBadge.style.display = 'inline-flex';
      if (openLoginBtn) openLoginBtn.style.display = 'none';
      this.hideAuthModal();

      if (this.currentUser.role === 'teacher') {
        if (roleTag) {
          roleTag.textContent = 'Giáo viên';
          roleTag.classList.add('teacher');
        }
        if (infoText) {
          infoText.textContent = 'Quản trị Hệ thống';
        }
        // H3 requirement: Delete/Hide the tab navigation bar completely for Teacher!
        if (tabNav) {
          tabNav.style.display = 'none';
        }
        if (this.currentTab !== 'teacher') {
          this.switchTab('teacher');
        }
        // Giáo viên có quyền cấu hình Gemini API
        const geminiBtn = document.getElementById('btn-open-gemini-config');
        if (geminiBtn) geminiBtn.style.display = 'inline-flex';
      } else {
        // Student role
        if (roleTag) {
          roleTag.textContent = 'Học sinh';
          roleTag.classList.remove('teacher');
        }
        if (infoText) {
          infoText.textContent = `${this.currentUser.code || '9A1-01'} · ${this.studentProfile.name}`;
        }
        // H4 requirement: Show student tabs, hide teacher tab
        if (tabNav) {
          tabNav.style.display = '';
        }
        if (teacherNavBtn) {
          teacherNavBtn.style.display = 'none';
        }
        if (this.currentTab === 'teacher') {
          this.switchTab('tree');
        }
        // BẢO MẬT: Xóa / ẩn hoàn toàn nút cấu hình Gemini ở giao diện học sinh
        const geminiBtn = document.getElementById('btn-open-gemini-config');
        if (geminiBtn) geminiBtn.style.display = 'none';
        const configModal = document.getElementById('gemini-config-modal');
        if (configModal) configModal.style.display = 'none';
      }
    } else {
      if (userBadge) userBadge.style.display = 'none';
      if (openLoginBtn) openLoginBtn.style.display = 'inline-flex';
      if (tabNav) {
        tabNav.style.display = 'none';
      }
      const geminiBtn = document.getElementById('btn-open-gemini-config');
      if (geminiBtn) geminiBtn.style.display = 'none';
      const configModal = document.getElementById('gemini-config-modal');
      if (configModal) configModal.style.display = 'none';
      this.showAuthModal();
    }
  }

  async handleStudentLogin(code) {
    const studentErr = document.getElementById('student-login-error');
    if (studentErr) studentErr.style.display = 'none';

    if (!code) {
      if (studentErr) {
        studentErr.textContent = 'Vui lòng nhập mã học sinh.';
        studentErr.style.display = 'block';
      }
      return;
    }

    const cleanCode = code.toUpperCase().trim();
    let matched = null;
    if (window.EduPathFirebase) {
      matched = await window.EduPathFirebase.getStudent(cleanCode);
    }
    if (!matched && window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) {
      matched = window.TeacherAnalytics.currentClassData.find(s => (s.studentCode && s.studentCode.toUpperCase() === cleanCode));
    }

    if (!matched) {
      if (studentErr) {
        studentErr.textContent = `Mã học sinh "${code}" không tồn tại trên hệ thống Firebase. Vui lòng liên hệ giáo viên để được cấp tài khoản.`;
        studentErr.style.display = 'block';
      }
      this.playBeep(220, 'sawtooth', 0.2);
      return;
    }

    // Load REAL student profile from Firebase
    this.studentProfile.name = matched.name || 'Học sinh';
    this.studentProfile.school = matched.school || 'Trường THCS';
    this.studentProfile.grade = matched.grade || '9A1';
    this.studentProfile.code = matched.code || '';
    this.studentProfile.studentCode = matched.studentCode || cleanCode;
    this.studentProfile.scores = matched.hollandScores || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    this.studentProfile.percentages = matched.hollandPercentages || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    this.studentProfile.targetMajorId = matched.targetMajorId || '';
    this.studentProfile.targetMajorName = matched.major || matched.targetMajorName || '';
    this.studentProfile.surveyHistory = Array.isArray(matched.surveyHistory) ? matched.surveyHistory : [];
    this.studentProfile.activeAttemptId = matched.activeAttemptId || (this.studentProfile.surveyHistory.length > 0 ? this.studentProfile.surveyHistory[this.studentProfile.surveyHistory.length - 1].id : null);
    this.studentProfile.isUndifferentiated = Boolean(matched.isUndifferentiated);

    if (Array.isArray(matched.assessmentMatches)) {
      this.assessmentMatches = matched.assessmentMatches;
    } else {
      this.assessmentMatches = [false, false, false, false, false, false, false, false, false, false];
    }
    if (matched.threeQuestions) {
      this.studentProfile.threeQuestions = matched.threeQuestions;
    } else {
      this.studentProfile.threeQuestions = { understandSelf: '', understandCareer: '', careerPathPlan: '' };
    }
    if (matched.selfTraits) {
      this.studentProfile.selfTraits = matched.selfTraits;
    } else {
      this.studentProfile.selfTraits = {};
    }

    if (this.studentProfile.surveyHistory.length > 0) {
      this.renderSurveyAttemptSelector();
      const activeId = this.studentProfile.activeAttemptId || this.studentProfile.surveyHistory[this.studentProfile.surveyHistory.length - 1].id;
      this.applySurveyAttempt(activeId);
    }

    // Sync Tree State to Real Student Progress (0% if new)
    if (this.treeAnimator) {
      const c = this.studentProfile.code;
      const p = this.studentProfile.percentages || {};
      if (c && c.length >= 3 && (p[c[0]] || p[c[1]] || p[c[2]])) {
        this.treeAnimator.updateState({
          rootInterest: p[c[0]] || 0,
          rootAbility: p[c[1]] || 0,
          rootPersonality: p[c[2]] || 0,
          rootValues: p[c[0]] || 0,
          fruitExpectation: Math.round(((p[c[0]] || 0) + (p[c[1]] || 0)) / 2)
        });
      } else {
        this.treeAnimator.updateState({
          rootInterest: 0,
          rootAbility: 0,
          rootPersonality: 0,
          rootValues: 0,
          fruitExpectation: 0
        });
      }
      this.syncSlidersFromTreeState();
      this.updateTreeMetricsDisplay();
    }

    this.currentUser = {
      role: 'student',
      code: this.studentProfile.studentCode,
      name: this.studentProfile.name,
      grade: this.studentProfile.grade,
      school: this.studentProfile.school
    };
    this.userRole = 'student';

    localStorage.setItem('edupath_current_user', JSON.stringify(this.currentUser));
    this.saveProfileToStorage();
    this.syncAuthUI();
    this.switchTab('tree');
    this.renderAssessmentView();
    this.playBeep(660, 'sine', 0.15);
  }

  async handleTeacherLogin(pin) {
    const teacherErr = document.getElementById('teacher-login-error');
    if (!pin) {
      if (teacherErr) {
        teacherErr.textContent = 'Vui lòng nhập mã bảo mật giáo viên.';
        teacherErr.style.display = 'block';
      }
      this.playBeep(220, 'sawtooth', 0.2);
      return;
    }

    let activePin = '2026';
    if (window.EduPathFirebase && window.EduPathFirebase.getTeacherPin) {
      activePin = await window.EduPathFirebase.getTeacherPin();
    } else {
      activePin = localStorage.getItem('edupath_teacher_pin') || '2026';
    }

    if (pin.trim() !== String(activePin).trim()) {
      if (teacherErr) {
        teacherErr.textContent = 'Mã bảo mật giáo viên không chính xác. Vui lòng kiểm tra lại.';
        teacherErr.style.display = 'block';
      }
      this.playBeep(220, 'sawtooth', 0.2);
      return;
    }

    if (teacherErr) teacherErr.style.display = 'none';

    this.currentUser = {
      role: 'teacher',
      classId: 'Tất cả các lớp',
      name: 'Giáo viên Quản trị'
    };
    this.userRole = 'teacher';

    localStorage.setItem('edupath_current_user', JSON.stringify(this.currentUser));
    this.syncAuthUI();

    // Re-attach live Firebase listener to fetch all students
    if (window.EduPathFirebase) {
      if (this.teacherListenerUnsub) {
        this.teacherListenerUnsub();
      }
      const classFilter = document.getElementById('teacher-class-filter-select');
      const activeFilter = classFilter ? classFilter.value : '';
      this.teacherListenerUnsub = window.EduPathFirebase.onClassStudentsChange(activeFilter, (students) => {
        TeacherAnalytics.currentClassData = students || [];
        if (this.currentTab === 'teacher') {
          this.renderTeacherHeatmap();
        }
      });
    }

    this.switchTab('teacher');
    this.playBeep(880, 'sine', 0.15);
  }

  handleLogout() {
    this.currentUser = null;
    this.userRole = null;
    localStorage.removeItem('edupath_current_user');
    localStorage.removeItem('edupath_student_profile');
    localStorage.removeItem('edupath_assessment_matches');
    this.studentProfile = {
      name: '',
      school: '',
      grade: '',
      studentCode: '',
      academicYear: '2025 – 2026',
      code: '',
      scores: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      percentages: { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
      targetMajorId: '',
      targetMajorName: '',
      selfTraits: {},
      threeQuestions: { understandSelf: '', understandCareer: '', careerPathPlan: '' }
    };
    this.assessmentMatches = [false, false, false, false, false, false, false, false, false, false];
    if (this.treeAnimator) {
      this.treeAnimator.updateState({
        rootInterest: 0,
        rootAbility: 0,
        rootPersonality: 0,
        rootValues: 0,
        fruitExpectation: 0
      });
      this.syncSlidersFromTreeState();
      this.updateTreeMetricsDisplay();
    }
    this.syncAuthUI();
    this.showAuthModal();
    this.playBeep(330, 'sine', 0.15);
  }

  initDOM() {
    // Theme toggle
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        themeBtn.textContent = nextTheme === 'dark' ? '☀️' : '🌙';
        this.playBeep(440);
      });
    }

    // Student profile edit & automatic sync
    this.syncProfileDOM();

    const schoolInput = document.getElementById('student-school-input');
    if (schoolInput) {
      const updateSchool = (e) => {
        this.studentProfile.school = e.target.value.trim() || 'Trường THCS';
        this.saveProfileToStorage();
        this.renderAssessmentView();
      };
      schoolInput.addEventListener('input', updateSchool);
      schoolInput.addEventListener('change', updateSchool);
    }

    const gradeInput = document.getElementById('student-grade-input');
    if (gradeInput) {
      const updateGrade = (e) => {
        this.studentProfile.grade = e.target.value.trim() || '9A1';
        this.saveProfileToStorage();
        this.renderAssessmentView();
      };
      gradeInput.addEventListener('input', updateGrade);
      gradeInput.addEventListener('change', updateGrade);
    }

    const nameInput = document.getElementById('student-name-input');
    if (nameInput) {
      const updateName = (e) => {
        this.studentProfile.name = e.target.value.trim() || 'Học sinh';
        this.saveProfileToStorage();
        this.renderAssessmentView();
      };
      nameInput.addEventListener('input', updateName);
      nameInput.addEventListener('change', updateName);
    }

    // Export & Import Profile buttons
    const exportBtn = document.getElementById('export-profile-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportProfileJSON());
    }

    const importBtn = document.getElementById('import-profile-btn');
    const importFileInput = document.getElementById('import-profile-file-input');
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importProfileJSON(e.target.files[0]);
          e.target.value = '';
        }
      });
    }
  }

  initTreeAnimator() {
    if (typeof TreeSVGAnimator !== 'undefined') {
      this.treeAnimator = new TreeSVGAnimator('tree-svg-container');
      this.syncSlidersFromTreeState();
      this.updateTreeMetricsDisplay();
    }
  }

  syncSlidersFromTreeState() {
    if (!this.treeAnimator) return;
    const st = this.treeAnimator.state;
    const map = [
      { id: 'slider-interest', val: st.rootInterest },
      { id: 'slider-ability', val: st.rootAbility },
      { id: 'slider-personality', val: st.rootPersonality },
      { id: 'slider-values', val: st.rootValues },
      { id: 'slider-expectation', val: st.fruitExpectation }
    ];
    map.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) el.value = item.val;
      const display = document.getElementById(item.id + '-val');
      if (display) display.textContent = item.val + '%';
    });
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.getAttribute('data-tab');
        if (targetTab) {
          this.switchTab(targetTab);
          this.playBeep(650);
        }
      });
    });

    // Horizontal scroll support for tab navigation
    const tabNav = document.querySelector('.tab-nav');
    if (tabNav) {
      tabNav.addEventListener('wheel', (e) => {
        if (tabNav.scrollWidth > tabNav.clientWidth && e.deltaY !== 0) {
          e.preventDefault();
          tabNav.scrollLeft += e.deltaY;
        }
      }, { passive: false });
    }

    // Tree Root Sliders
    const sliders = [
      { id: 'slider-interest', key: 'rootInterest' },
      { id: 'slider-ability', key: 'rootAbility' },
      { id: 'slider-personality', key: 'rootPersonality' },
      { id: 'slider-values', key: 'rootValues' },
      { id: 'slider-expectation', key: 'fruitExpectation' }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        el.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (this.treeAnimator) {
            this.treeAnimator.updateState({ [s.key]: val });
          }
          const valDisplay = document.getElementById(s.id + '-val');
          if (valDisplay) valDisplay.textContent = val + '%';
          this.updateTreeMetricsDisplay();
        });
      }
    });

    // Quiz Mode switcher
    const modeQuick = document.getElementById('quiz-mode-quick');
    const modeFull = document.getElementById('quiz-mode-full');
    if (modeQuick && modeFull) {
      modeQuick.addEventListener('click', () => this.setQuizMode('quick'));
      modeFull.addEventListener('click', () => this.setQuizMode('full'));
    }

    // Quiz Navigation
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateQuestion(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateQuestion(1));
  }

  switchTab(tabId) {
    if (tabId === 'teacher' && this.userRole === 'student') {
      tabId = 'tree';
    }
    this.currentTab = tabId;

    // Toggle Tab Buttons active state
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Toggle Stage Views
    document.querySelectorAll('.stage-view-section').forEach(sec => {
      if (sec.id === `view-${tabId}`) {
        sec.style.display = 'block';
      } else {
        sec.style.display = 'none';
      }
    });

    // Tab-specific refreshes
    if (tabId === 'tree' && this.treeAnimator) {
      this.treeAnimator.handleResize();
    } else if (tabId === 'teacher') {
      this.renderTeacherHeatmap();
    } else if (tabId === 'project') {
      this.renderAssessmentView();
    } else if (tabId === 'quiz') {
      if (this.studentProfile && this.studentProfile.surveyHistory && this.studentProfile.surveyHistory.length > 0) {
        const activeId = this.studentProfile.activeAttemptId || this.studentProfile.surveyHistory[this.studentProfile.surveyHistory.length - 1].id;
        const activeAttempt = this.studentProfile.surveyHistory.find(a => a.id === activeId);
        const resultCard = document.getElementById('quiz-result-card');
        if (activeAttempt && resultCard && resultCard.style.display !== 'none') {
          this.applySurveyAttempt(activeId);
        }
      }
    }
  }

  updateTreeMetricsDisplay() {
    if (!this.treeAnimator) return;
    const sanitize = window.sanitize;
    const stats = this.treeAnimator.applyStateChanges();
    const alertBox = document.getElementById('tree-stability-alert');
    const panel = document.getElementById('tree-pedagogy-feedback-panel');
    const badge = document.getElementById('feedback-state-badge');
    const ratioVal = document.getElementById('feedback-ratio-val');
    const content = document.getElementById('feedback-main-content');
    const rescueContainer = document.getElementById('rescue-action-container');

    if (stats.stateType === 0) {
      if (alertBox) {
        alertBox.className = 'stability-alert-box initial';
        alertBox.innerHTML = sanitize('<strong>🌱 CÂY NGHỀ NGHIỆP MỚI KHỞI TẠO:</strong> Tất cả chỉ số đang ở mức 0%. Hãy kéo thanh trượt để mô phỏng sự cân bằng cơ học hoặc hoàn thành bài trắc nghiệm Holland!');
      }
      if (!panel || !badge || !content) return;
      panel.className = 'tree-feedback-container state-initial';
      badge.className = 'feedback-badge initial';
      badge.innerHTML = sanitize('🌱 TRẠNG THÁI KHỞI TẠO: CHƯA CÓ CHỈ SỐ (0%)');
      if (ratioVal) ratioVal.innerHTML = sanitize('<span style="color:var(--text-muted);">0.00 (Chưa thiết lập)</span>');

      content.innerHTML = sanitize(`
        <h3 style="color:var(--brand);">🌱 Hãy bắt đầu vun đắp Cây Nghề Nghiệp!</h3>
        <p class="feedback-text">
          Chào mừng em đến với <strong>Mô hình Cây Nghề Nghiệp Sinh Học (Hình 4.3 SGK)</strong>! Hiện tại tài khoản của em chưa thiết lập các chỉ số đánh giá bản thân (tất cả các thanh trượt đang ở mức 0%).
        </p>
        <p class="feedback-text">
          Để cây phát triển xanh tốt và đơm hoa kết trái bền vững:
        </p>
        <div class="pillars-grid" style="margin-top:0.4rem;">
          <div class="pillar-item">🔵 <strong>Sở thích:</strong> Làm trắc nghiệm Holland (Tab 2) để khám phá nhóm nghề yêu thích.</div>
          <div class="pillar-item">🟢 <strong>Khả năng:</strong> Tự đánh giá năng lực học tập và kỹ năng thực hành.</div>
          <div class="pillar-item">🟠 <strong>Cá tính:</strong> Rèn luyện 5 phẩm chất kĩ thuật cốt lõi theo SGK.</div>
          <div class="pillar-item">🟣 <strong>Giá trị:</strong> Xác định mục tiêu và điều kiện gia đình tại Dự án Bài 5 (Tab 4).</div>
        </div>
        <div class="challenge-callout" style="margin-top:0.6rem;">
          💡 <strong>Khám phá ngay:</strong> Em có thể trực tiếp kéo các thanh trượt bên trên để mô phỏng sự cân bằng sinh học giữa "Gốc rễ" và "Quả ngọt"!
        </div>
      `);

      if (rescueContainer) rescueContainer.style.display = 'none';
      this.toggleRescueGuidance(false);
      return;
    }

    if (alertBox) {
      if (stats.stateType === 1) {
        alertBox.className = 'stability-alert-box unstable';
        alertBox.innerHTML = sanitize(`<strong>⚠️ CẢNH BÁO: CÂY NGHỀ NGHIỆP ĐANG MẤT CÂN BẰNG!</strong> (Độ vững: ${stats.ratio}) — Gốc rễ nội lực (${stats.avgRoots}%) chưa tương xứng với quả ngọt (${stats.fruitDemand}%).`);
      } else if (stats.stateType === 2) {
        alertBox.className = 'stability-alert-box transition';
        alertBox.innerHTML = sanitize(`<strong>🌱 CÂY BẮT ĐẦU CÂN BẰNG:</strong> (Độ vững: ${stats.ratio}) — Em đang đi đúng hướng, dòng dinh dưỡng bắt đầu lưu thông!`);
      } else {
        alertBox.className = 'stability-alert-box stable';
        alertBox.innerHTML = sanitize(`<strong>✨ CÂY NGHỀ NGHIỆP VỮNG VÀNG:</strong> (Độ vững: ${stats.ratio}) — Gốc rễ bám sâu, cành lá sum suê sinh quả ngọt lâu bền!`);
      }
    }

    if (!panel || !badge || !content) return;

    if (stats.stateType === 1) {
      // TRẠNG THÁI 1: CÂY NGHIÊNG ĐỔ
      panel.className = 'tree-feedback-container state-unstable';
      badge.className = 'feedback-badge unstable';
      badge.innerHTML = sanitize('⚠️ TRẠNG THÁI 1: CÂY ĐANG NGHIÊNG ĐỔ');
      if (ratioVal) ratioVal.innerHTML = sanitize(`<span style="color:var(--danger);">${stats.ratio} (Mất cân bằng)</span>`);

      content.innerHTML = sanitize(`
        <h3 style="color:var(--danger);">⚠️ Ước mơ lớn nhưng gốc rễ chưa vững!</h3>
        <p class="feedback-text">
          <strong>Ồ! Vì sao cây nghề nghiệp của em bị nghiêng đổ?</strong><br>
          Có vẻ em đang đặt quá nhiều kỳ vọng vào những "quả ngọt" (lương cao, công việc ổn định, môi trường tốt, được nhiều người tôn trọng), trong khi "bộ rễ" gồm sở thích, năng lực, cá tính và giá trị nghề nghiệp chưa đủ vững chắc.
        </p>
        <p class="feedback-text" style="font-style:italic; background:rgba(220,38,38,0.06); padding:0.5rem; border-radius:4px; border-left:3px solid var(--danger);">
          Hãy tưởng tượng: Một cây có nhiều quả nặng nhưng bộ rễ yếu sẽ dễ bị nghiêng đổ khi gặp giông gió. Lựa chọn nghề nghiệp cũng vậy! Nếu chỉ chạy theo điều hấp dẫn bên ngoài mà chưa hiểu rõ bản thân, em có thể chọn nghề không phù hợp, gặp khó khăn trong học tập và khó gắn bó lâu dài.
        </p>
        <div style="margin-top:0.4rem;">
          <strong style="font-size:0.85rem; color:var(--text-primary);">🌱 Lời khuyên: Hãy vun đắp bộ rễ trước khi mong chờ quả ngọt!</strong>
          <div class="pillars-grid">
            <div class="pillar-item">❤️ <strong>Sở thích:</strong> Khám phá công việc em thực sự hứng thú.</div>
            <div class="pillar-item">💪 <strong>Năng lực:</strong> Nhận biết điểm mạnh và rèn luyện kỹ năng.</div>
            <div class="pillar-item">🌈 <strong>Cá tính:</strong> Tìm hiểu nét tính cách để chọn môi trường.</div>
            <div class="pillar-item">⭐ <strong>Giá trị:</strong> Xác định điều em thực sự coi trọng.</div>
          </div>
        </div>
        <div class="challenge-callout">
          🎯 <strong>Thử thách dành cho em:</strong> Hãy điều chỉnh các thanh kéo để bộ rễ phát triển cân đối với những quả ngọt mà em mong muốn. Quan sát xem điều gì sẽ xảy ra với cây nhé!
        </div>
        <div class="quote-motto" style="color:var(--danger); background:rgba(220,38,38,0.08);">
          ✨ Thông điệp: "Rễ càng vững – Cây càng bền – Quả ngọt càng lâu!"
        </div>
      `);

      if (rescueContainer) rescueContainer.style.display = 'block';

    } else if (stats.stateType === 2) {
      // TRẠNG THÁI 2: CÂY BẮT ĐẦU CÂN BẰNG
      panel.className = 'tree-feedback-container state-transition';
      badge.className = 'feedback-badge transition';
      badge.innerHTML = sanitize('🌱 TRẠNG THÁI 2: ĐANG TIẾN TỚI CÂN BẰNG');
      if (ratioVal) ratioVal.innerHTML = sanitize(`<span style="color:var(--warning);">${stats.ratio} (Đang cân bằng)</span>`);

      content.innerHTML = sanitize(`
        <h3 style="color:var(--warning);">🌱 Em đang đi đúng hướng!</h3>
        <p class="feedback-text">
          Bộ rễ nghề nghiệp của em đang dần vững chắc. Cây đã lấy lại thế đứng thẳng và dòng nhựa dinh dưỡng màu trắng đang lưu thông nhịp nhàng từ lòng đất lên thân cây.
        </p>
        <p class="feedback-text">
          Hãy tiếp tục tìm hiểu bản thân, phát triển năng lực và khám phá thông tin nghề nghiệp trong SGK Công nghệ 9 để đưa ra những quyết định phù hợp nhất!
        </p>
        <div class="challenge-callout" style="background:rgba(217, 119, 6, 0.08); border-left-color:var(--warning);">
          🚀 <strong>Mẹo nhỏ:</strong> Tăng thêm một chút ở thanh <em>Khả năng</em> hoặc <em>Sở thích</em> để cây bước vào trạng thái vững vàng trĩu quả hoàn hảo!
        </div>
        <div class="quote-motto" style="color:var(--warning); background:rgba(217, 119, 6, 0.08);">
          ✨ Thông điệp: "Rễ càng vững – Cây càng bền – Quả ngọt càng lâu!"
        </div>
      `);

      if (rescueContainer) rescueContainer.style.display = 'none';
      this.toggleRescueGuidance(false);

    } else {
      // TRẠNG THÁI 3: CÂY VỮNG VÀNG TRĨU QUẢ
      panel.className = 'tree-feedback-container state-stable';
      badge.className = 'feedback-badge stable';
      badge.innerHTML = sanitize('🌳 TRẠNG THÁI 3: VỮNG VÀNG — TRĨU QUẢ');
      if (ratioVal) ratioVal.innerHTML = sanitize(`<span style="color:var(--brand);">${stats.ratio} (Rất vững chắc)</span>`);

      content.innerHTML = sanitize(`
        <h3 style="color:var(--brand);">🌳 Tuyệt vời! Cây nghề nghiệp của em đang phát triển tốt!</h3>
        <p class="feedback-text">
          Em đã biết cân nhắc mong muốn nghề nghiệp dựa trên sở thích, năng lực, cá tính và giá trị của bản thân.
        </p>
        <p class="feedback-text">
          Gốc rễ vững vàng là bệ phóng an toàn nhất giúp em tự tin đón nhận những "quả ngọt" lớn: mức lương xứng đáng, công việc bền vững và sự tôn trọng từ xã hội. Hãy tiếp tục rèn luyện và tìm hiểu thực tế các nghề để biến ước mơ thành hiện thực!
        </p>
        <div class="quote-motto">
          ✨ Thông điệp: "Rễ càng vững – Cây càng bền – Quả ngọt càng lâu!"
        </div>
      `);

      if (rescueContainer) rescueContainer.style.display = 'none';
      this.toggleRescueGuidance(false);
    }
  }

  triggerRescueTree() {
    this.toggleRescueGuidance(true);
    this.playBeep(650);

    const sliders = [
      { id: 'slider-interest', val: parseInt(document.getElementById('slider-interest').value, 10) },
      { id: 'slider-ability', val: parseInt(document.getElementById('slider-ability').value, 10) },
      { id: 'slider-personality', val: parseInt(document.getElementById('slider-personality').value, 10) },
      { id: 'slider-values', val: parseInt(document.getElementById('slider-values').value, 10) }
    ];

    sliders.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        if (s.val < 75) {
          el.classList.add('highlight-slider');
          setTimeout(() => el.classList.remove('highlight-slider'), 3600);
        }
      }
    });

    const fruitEl = document.getElementById('slider-expectation');
    if (fruitEl && parseInt(fruitEl.value, 10) > 75) {
      fruitEl.classList.add('highlight-slider');
      setTimeout(() => fruitEl.classList.remove('highlight-slider'), 3600);
    }
  }

  toggleRescueGuidance(show) {
    const box = document.getElementById('rescue-guidance-box');
    if (box) {
      box.style.display = show ? 'block' : 'none';
    }
  }

  // --- QUIZ MODULE ---
  setQuizMode(mode) {
    this.quizMode = mode;
    this.currentQuestionIdx = 0;

    const modeQuick = document.getElementById('quiz-mode-quick');
    const modeFull = document.getElementById('quiz-mode-full');
    if (modeQuick && modeFull) {
      if (mode === 'quick') {
        modeQuick.classList.add('btn-primary');
        modeQuick.classList.remove('btn-secondary');
        modeFull.classList.add('btn-secondary');
        modeFull.classList.remove('btn-primary');
      } else {
        modeFull.classList.add('btn-primary');
        modeFull.classList.remove('btn-secondary');
        modeQuick.classList.add('btn-secondary');
        modeQuick.classList.remove('btn-primary');
      }
    }

    this.initQuiz();
  }

  initQuiz() {
    const rawQuestions = window.EduPathData.holland.questions || [];
    if (this.quizMode === 'quick') {
      this.quizQuestions = rawQuestions.slice(0, 18);
    } else {
      this.quizQuestions = rawQuestions;
    }

    this.quizAnswers = Array.from({ length: this.quizQuestions.length }, () => null);
    this.renderQuestionPalette();
    this.renderCurrentQuestion();
    this.renderSurveyAttemptSelector();

    // Retake button
    const retakeBtn = document.getElementById('btn-retake-quiz');
    if (retakeBtn) {
      retakeBtn.onclick = () => this.retakeQuiz();
    }

    // Toggle palette collapse button
    const togglePaletteBtn = document.getElementById('btn-toggle-palette');
    const paletteEl = document.getElementById('quiz-question-palette');
    if (togglePaletteBtn && paletteEl) {
      togglePaletteBtn.onclick = () => {
        const isHidden = paletteEl.style.display === 'none';
        paletteEl.style.display = isHidden ? 'flex' : 'none';
        togglePaletteBtn.textContent = isHidden ? 'Thu gọn ▴' : 'Mở rộng ▾';
      };
    }
  }

  retakeQuiz() {
    this.currentQuestionIdx = 0;
    this.quizAnswers = Array.from({ length: this.quizQuestions.length }, () => null);
    const activeCard = document.getElementById('quiz-active-card');
    const resultCard = document.getElementById('quiz-result-card');
    if (activeCard) activeCard.style.display = 'block';
    if (resultCard) resultCard.style.display = 'none';
    this.renderQuestionPalette();
    this.renderCurrentQuestion();
    this.playBeep(620);
  }

  renderQuestionPalette() {
    const palette = document.getElementById('quiz-question-palette');
    if (!palette) return;

    palette.textContent = '';
    const total = this.quizQuestions.length;

    for (let i = 0; i < total; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isAnswered = this.quizAnswers[i] !== null;
      const isCurrent = i === this.currentQuestionIdx;

      btn.className = `palette-item ${isAnswered ? 'answered' : ''} ${isCurrent ? 'current' : ''}`;
      btn.textContent = (i + 1).toString();
      btn.title = `Câu ${i + 1}: ${isAnswered ? 'Đã trả lời' : 'Chưa trả lời'}`;

      btn.addEventListener('click', () => {
        this.jumpToQuestion(i);
      });

      palette.appendChild(btn);
    }

    const activeBtn = palette.querySelector('.palette-item.current');
    if (activeBtn && typeof activeBtn.scrollIntoView === 'function') {
      activeBtn.scrollIntoView({ block: 'nearest', inline: 'center' });
    }
  }

  jumpToQuestion(idx) {
    if (idx >= 0 && idx < this.quizQuestions.length) {
      this.currentQuestionIdx = idx;
      this.renderCurrentQuestion();
      this.playBeep(560);
    }
  }

  renderCurrentQuestion() {
    const total = this.quizQuestions.length;
    const q = this.quizQuestions[this.currentQuestionIdx];
    if (!q) return;

    // Update Palette highlights
    this.renderQuestionPalette();

    // Progress bar and text
    const fillEl = document.getElementById('quiz-progress-fill');
    const textEl = document.getElementById('quiz-progress-text');
    const pct = Math.round(((this.currentQuestionIdx + 1) / total) * 100);
    if (fillEl) fillEl.style.width = pct + '%';
    if (textEl) textEl.textContent = `Câu hỏi ${this.currentQuestionIdx + 1} / ${total} (${pct}%)`;

    // Group tag
    const meta = HollandEngine.GROUP_METADATA[q.type] || {};
    const tagEl = document.getElementById('quiz-question-type-tag');
    if (tagEl) {
      tagEl.textContent = `Nhóm ${meta.shortName || q.type}`;
      tagEl.style.backgroundColor = meta.bgSoft || 'rgba(0,0,0,0.1)';
      tagEl.style.color = meta.color || 'var(--brand)';
    }

    // Question text
    const promptEl = document.getElementById('quiz-question-text');
    if (promptEl) promptEl.textContent = q.question;

    // Render 5 Likert Buttons
    const buttonsContainer = document.getElementById('quiz-likert-container');
    if (buttonsContainer) {
      const sanitize = window.sanitize;
      buttonsContainer.textContent = '';
      const scales = window.EduPathData.holland.scales || [];
      const currentAns = this.quizAnswers[this.currentQuestionIdx];

      scales.forEach(s => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `likert-btn ${currentAns === s.value ? 'selected' : ''}`;
        btn.innerHTML = sanitize(`
          <span class="likert-btn-num">${s.value}</span>
          <span class="likert-btn-label">${s.label}</span>
        `);
        btn.addEventListener('click', () => {
          this.selectAnswer(s.value);
          this.playBeep(700 + s.value * 50);
        });
        buttonsContainer.appendChild(btn);
      });
    }

    // Prev / Next button states
    const prevBtn = document.getElementById('quiz-prev-btn');
    const nextBtn = document.getElementById('quiz-next-btn');
    if (prevBtn) prevBtn.disabled = this.currentQuestionIdx === 0;
    if (nextBtn) {
      if (this.currentQuestionIdx === total - 1) {
        nextBtn.textContent = 'Hoàn thành & Xem kết quả ➔';
      } else {
        nextBtn.textContent = 'Câu tiếp theo ➔';
      }
    }
  }

  selectAnswer(val) {
    this.quizAnswers[this.currentQuestionIdx] = val;
    this.saveProfileToStorage();
    const total = this.quizQuestions.length;

    if (this.currentQuestionIdx < total - 1) {
      this.currentQuestionIdx += 1;
      this.renderCurrentQuestion();
    } else {
      this.finalizeQuizResults();
    }
  }

  navigateQuestion(direction) {
    const nextIdx = this.currentQuestionIdx + direction;
    if (nextIdx >= 0 && nextIdx < this.quizQuestions.length) {
      this.currentQuestionIdx = nextIdx;
      this.renderCurrentQuestion();
      this.playBeep(520);
    } else if (nextIdx >= this.quizQuestions.length) {
      this.finalizeQuizResults();
    }
  }

  finalizeQuizResults() {
    // Trường hợp 7: Dữ liệu chưa hoàn thành -> CẤM tự động điền số 3, bắt buộc thông báo rõ
    const unansweredIdx = this.quizAnswers.findIndex(a => a === null || a === undefined);
    if (unansweredIdx !== -1) {
      const answeredCount = this.quizAnswers.filter(a => a !== null && a !== undefined).length;
      alert(`Vui lòng hoàn thành tất cả các câu hỏi trước khi xem kết quả (Bạn mới làm ${answeredCount}/${this.quizQuestions.length} câu, còn thiếu ${this.quizQuestions.length - answeredCount} câu).`);
      this.currentQuestionIdx = unansweredIdx;
      this.renderCurrentQuestion();
      this.playBeep(220, 'sawtooth', 0.2);
      return;
    }

    const results = HollandEngine.calculateScores(this.quizAnswers, this.quizQuestions);

    // Trường hợp 8: Lưu lịch sử khảo sát để cập nhật động theo lần chọn
    if (!Array.isArray(this.studentProfile.surveyHistory)) {
      this.studentProfile.surveyHistory = [];
    }
    const attemptId = 'attempt_' + Date.now();
    const attemptNum = this.studentProfile.surveyHistory.length + 1;
    const modeLabel = this.quizMode === 'quick' ? 'Bản rút gọn (18 câu)' : 'Bản đầy đủ (60 câu)';
    const dateStr = new Date().toLocaleString('vi-VN');
    const displayCode = results.isUndifferentiated ? 'CHƯA PHÂN HÓA' : results.code;
    const attempt = {
      id: attemptId,
      attemptNumber: attemptNum,
      timestamp: dateStr,
      label: `Lần ${attemptNum} (${modeLabel} - ${displayCode}) · ${dateStr}`,
      mode: this.quizMode,
      code: results.code,
      isUndifferentiated: Boolean(results.isUndifferentiated),
      undifferentiatedMessage: results.undifferentiatedMessage || '',
      scores: { ...results.rawScores },
      percentages: { ...results.percentages },
      answers: [...this.quizAnswers]
    };
    this.studentProfile.surveyHistory.push(attempt);
    this.studentProfile.activeAttemptId = attemptId;

    this.studentProfile.code = results.code;
    this.studentProfile.scores = results.rawScores;
    this.studentProfile.percentages = results.percentages;
    this.studentProfile.isUndifferentiated = Boolean(results.isUndifferentiated);

    // Recommended Majors theo công thức mới
    const matchedMajors = HollandEngine.matchMajors(results.code, results.percentages, {
      isUndifferentiated: results.isUndifferentiated
    });

    if (matchedMajors && matchedMajors.length > 0 && !results.isUndifferentiated) {
      const topMajor = matchedMajors[0];
      this.studentProfile.targetMajorId = topMajor.id;
      this.studentProfile.targetMajorName = topMajor.name;
      this.studentProfile.major = topMajor.name;
      attempt.targetMajorId = topMajor.id;
      attempt.targetMajorName = topMajor.name;
    }

    this.saveProfileToStorage();

    const activeCard = document.getElementById('quiz-active-card');
    if (activeCard) activeCard.style.display = 'none';

    const resultBox = document.getElementById('quiz-result-card');
    if (resultBox) resultBox.style.display = 'block';

    // Cập nhật bộ chọn lần khảo sát
    this.renderSurveyAttemptSelector();

    // Trường hợp 6: Hiển thị cảnh báo nếu 6 nhóm bằng nhau (không tạo kết luận chắc chắn)
    const undiffAlert = document.getElementById('quiz-undifferentiated-alert');
    const undiffText = document.getElementById('quiz-undifferentiated-text');
    const codeEl = document.getElementById('result-holland-code');

    if (results.isUndifferentiated) {
      if (undiffAlert) undiffAlert.style.display = 'block';
      if (undiffText) undiffText.textContent = results.undifferentiatedMessage;
      if (codeEl) {
        codeEl.textContent = 'CHƯA PHÂN HÓA';
        codeEl.style.fontSize = '2.2rem';
      }
    } else {
      if (undiffAlert) undiffAlert.style.display = 'none';
      if (codeEl) {
        codeEl.textContent = results.code;
        codeEl.style.fontSize = '3.75rem';
      }
    }

    // Render Detailed 6-Category RIASEC Breakdown
    this.renderRIASECBreakdown(results);

    // Render In-Depth Personality Insights & Conflict
    this.renderPersonalityInsights(results);

    // Render danh sách ngành nghề đề xuất theo thứ tự mã Holland (A -> S -> E)
    this.lastQuizResults = results;
    this.renderHollandOrderCareers(results);

    // Render danh sách ngành học đã khớp nối
    this.renderMatchedMajors(matchedMajors);

    // Synchronize Tree roots with real test scores
    if (this.treeAnimator) {
      if (results.isUndifferentiated) {
        const val = results.percentages.R || 50;
        this.treeAnimator.updateState({
          rootInterest: val,
          rootAbility: val,
          rootPersonality: val,
          rootValues: val,
          fruitExpectation: val
        });
      } else {
        this.treeAnimator.updateState({
          rootInterest: results.percentages[results.code[0]] || 0,
          rootAbility: results.percentages[results.code[1]] || 0,
          rootPersonality: results.percentages[results.code[2]] || 0
        });
      }
      this.syncSlidersFromTreeState();
      this.updateTreeMetricsDisplay();
    }

    this.playBeep(880, 'triangle', 0.25);
  }

  filterHollandOrderCareers(filterId) {
    this.activeHollandLetterFilter = filterId;
    if (this.lastQuizResults) {
      this.renderHollandOrderCareers(this.lastQuizResults);
    }
  }

  renderHollandOrderCareers(results) {
    const container = document.getElementById('quiz-holland-order-majors-grid');
    const badgeEl = document.getElementById('holland-order-code-badge');
    const subtitleEl = document.getElementById('quiz-holland-order-subtitle');
    const pillsContainer = document.getElementById('holland-letter-filter-pills');
    if (!container) return;
    const sanitize = window.sanitize || (html => html);
    container.textContent = '';

    if (!results || results.isUndifferentiated || !results.code || results.code === '---' || results.code.length < 3) {
      if (badgeEl) badgeEl.textContent = '---';
      if (subtitleEl) subtitleEl.textContent = 'Hoàn thành trắc nghiệm Holland để nhận gợi ý ngành nghề theo thứ tự thiên hướng của bạn.';
      if (pillsContainer) pillsContainer.textContent = '';
      container.innerHTML = sanitize(`
        <div style="grid-column: 1 / -1; text-align:center; padding:1.75rem; color:var(--text-muted); background:var(--surface-elevated); border-radius:var(--radius-md); border:1px dashed var(--border);">
          Chưa có ngành nghề đề xuất theo thứ tự mã Holland. Vui lòng hoàn thành bài trắc nghiệm để mở khóa danh sách!
        </div>
      `);
      return;
    }

    const code = results.code.toUpperCase();
    if (badgeEl) badgeEl.textContent = code;

    const c1 = code[0], c2 = code[1], c3 = code[2];
    const meta = HollandEngine.GROUP_METADATA || {};
    const g1 = meta[c1] ? meta[c1].shortName : c1;
    const g2 = meta[c2] ? meta[c2].shortName : c2;
    const g3 = meta[c3] ? meta[c3].shortName : c3;

    if (subtitleEl) {
      subtitleEl.innerHTML = sanitize(`
        Đề xuất ưu tiên theo thứ tự thiên hướng:
        <strong style="color:${meta[c1] ? meta[c1].color : 'var(--brand)'};">${c1} (${g1} - Chủ đạo)</strong> ➔ 
        <strong style="color:${meta[c2] ? meta[c2].color : 'var(--brand)'};">${c2} (${g2} - Bổ trợ)</strong> ➔ 
        <strong style="color:${meta[c3] ? meta[c3].color : 'var(--brand)'};">${c3} (${g3} - Xúc tác)</strong>
      `);
    }

    const activeFilter = this.activeHollandLetterFilter || 'all';
    const allRanked = HollandEngine.matchHollandOrderCareers ? HollandEngine.matchHollandOrderCareers(code) : [];

    // Render Dynamic Letter Filter Pills
    if (pillsContainer) {
      pillsContainer.textContent = '';
      const filters = [
        { id: 'all', label: `Tất cả (${Math.min(12, allRanked.length)})` },
        { id: 'c1', label: `1️⃣ Chữ cái ${c1} (${g1})`, color: meta[c1] ? meta[c1].color : null },
        { id: 'c2', label: `2️⃣ Chữ cái ${c2} (${g2})`, color: meta[c2] ? meta[c2].color : null },
        { id: 'c3', label: `3️⃣ Chữ cái ${c3} (${g3})`, color: meta[c3] ? meta[c3].color : null }
      ];

      filters.forEach(f => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-filter-pill';
        const isActive = (f.id === activeFilter);
        btn.style.cssText = `
          padding: 0.35rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid ${isActive ? (f.color || 'var(--brand)') : 'var(--border)'};
          background: ${isActive ? (f.color || 'var(--brand)') : 'var(--surface-elevated)'};
          color: ${isActive ? '#ffffff' : 'var(--text-secondary)'};
        `;
        btn.textContent = f.label;
        btn.onclick = () => window.app.filterHollandOrderCareers(f.id);
        pillsContainer.appendChild(btn);
      });
    }

    // Filter list
    let displayedMajors = allRanked;
    if (activeFilter !== 'all') {
      displayedMajors = allRanked.filter(m => m.letterStage === activeFilter);
    }
    // Hiển thị top các ngành nổi bật
    displayedMajors = displayedMajors.slice(0, activeFilter === 'all' ? 12 : 8);

    if (displayedMajors.length === 0) {
      container.innerHTML = sanitize(`
        <div style="grid-column: 1 / -1; text-align:center; padding:1.5rem; color:var(--text-muted); background:var(--surface-elevated); border-radius:var(--radius-md);">
          Không có ngành nào thuộc bộ lọc này trong danh mục đề xuất.
        </div>
      `);
      return;
    }

    displayedMajors.forEach((m, idx) => {
      const card = document.createElement('div');
      card.className = 'card-panel';
      card.style.cssText = `
        padding: 1rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        border-left: 4px solid ${meta[m.code[0]] ? meta[m.code[0]].color : 'var(--brand)'};
        background: var(--surface-card);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `;

      const stageColor = meta[m.stageLetter] ? meta[m.stageLetter].color : (meta[m.code[0]] ? meta[m.code[0]].color : 'var(--brand)');
      const stageBg = meta[m.stageLetter] ? meta[m.stageLetter].bgSoft : 'rgba(37, 99, 235, 0.08)';

      let careersSnippet = '';
      if (m.careers && m.careers.length > 0) {
        careersSnippet = `
          <div style="font-size:0.78rem; color:var(--text-secondary); margin-top:0.5rem; padding-top:0.5rem; border-top:1px dashed var(--border);">
            💼 <strong>Nghề tiêu biểu:</strong> ${m.careers.join(', ')}
          </div>
        `;
      }

      card.innerHTML = sanitize(`
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:0.5rem; margin-bottom:0.4rem;">
            <span style="font-weight:700; color:var(--text-primary); font-size:1.025rem; line-height:1.35;">
              ${idx + 1}. ${m.name}
            </span>
            <span style="font-weight:800; font-size:0.825rem; letter-spacing:0.05em; padding:0.2rem 0.5rem; border-radius:4px; background:var(--surface-elevated); border:1px solid var(--border); color:var(--text-primary); flex-shrink:0;">
              Mã: ${m.code}
            </span>
          </div>
          <div style="display:inline-block; font-size:0.75rem; font-weight:700; padding:0.2rem 0.5rem; border-radius:4px; margin-bottom:0.6rem; background:${stageBg}; color:${stageColor};">
            ${m.stageLabel}
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin:0 0 0.5rem 0; font-style:italic;">
            "${m.description}"
          </p>
          ${careersSnippet}
        </div>
        <div style="margin-top:0.75rem; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:0.35rem;">
          <span>🎯 Chuẩn tham chiếu Aiducation & SGK Hướng nghiệp</span>
        </div>
      `);
      container.appendChild(card);
    });
  }

  renderMatchedMajors(matchedMajors) {
    const majorsContainer = document.getElementById('quiz-matched-majors-grid');
    if (!majorsContainer) return;
    const sanitize = window.sanitize;
    majorsContainer.textContent = '';

    if (!Array.isArray(matchedMajors) || matchedMajors.length === 0) {
      majorsContainer.innerHTML = sanitize(`
        <div style="grid-column: 1 / -1; text-align:center; padding:2rem; color:var(--text-muted);">
          Chưa có ngành nghề phù hợp được hiển thị. Vui lòng hoàn thành bài trắc nghiệm Holland để nhận gợi ý!
        </div>
      `);
      return;
    }

    matchedMajors.slice(0, 6).forEach(m => {
      const div = document.createElement('div');
      div.className = 'card-panel';
      div.style.padding = '1rem';
      const fitLabel = m.exploratory ? `${m.fitPercentage}% (Tham khảo)` : `${m.fitPercentage}% Hợp`;
      div.innerHTML = sanitize(`
        <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.5rem; gap:0.5rem;">
          <span style="font-weight:700; color:var(--text-primary); font-size:1.05rem; line-height:1.3;">${m.name}</span>
          <span style="background:var(--brand-soft); color:var(--brand); font-weight:800; padding:0.25rem 0.55rem; border-radius:4px; font-size:0.85rem; white-space:nowrap; flex-shrink:0;">${fitLabel}</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem; line-height:1.45;">${m.description}</p>
        <div style="display:flex; flex-wrap:wrap; gap:0.5rem; font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
          <span class="badge-pill">🏷️ Hệ: <strong style="color:var(--text-primary); margin-left:0.2rem;">${m.level}</strong></span>
          <span class="badge-pill">💰 Lương: <strong style="color:var(--text-primary); margin-left:0.2rem;">${m.avgSalary}</strong></span>
          <span class="badge-pill">📌 Mã: <strong style="color:var(--text-primary); margin-left:0.2rem;">${m.code}</strong></span>
        </div>
        <button class="btn-primary" style="margin-top:auto; width:100%; font-size:0.85rem; min-height:42px; white-space:nowrap;" onclick="window.app.selectMajorForProject('${m.id}')">
          Chọn Ngành Này Cho Bài 5 ➔
        </button>
      `);
      majorsContainer.appendChild(div);
    });
  }

  renderSurveyAttemptSelector() {
    const wrapper = document.getElementById('survey-history-wrapper');
    const select = document.getElementById('survey-attempt-select');
    if (!wrapper || !select) return;

    const history = this.studentProfile.surveyHistory || [];
    if (history.length === 0) {
      wrapper.style.display = 'none';
      return;
    }

    wrapper.style.display = 'flex';
    select.textContent = '';
    history.forEach((att) => {
      const opt = document.createElement('option');
      opt.value = att.id;
      opt.textContent = att.label || `Lần ${att.attemptNumber} (${att.code})`;
      if (att.id === this.studentProfile.activeAttemptId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    select.onchange = (e) => {
      this.applySurveyAttempt(e.target.value);
    };
  }

  applySurveyAttempt(attemptId) {
    const history = this.studentProfile.surveyHistory || [];
    const attempt = history.find(a => a.id === attemptId);
    if (!attempt) return;

    this.studentProfile.activeAttemptId = attempt.id;
    this.studentProfile.code = attempt.code;
    this.studentProfile.scores = attempt.scores;
    this.studentProfile.percentages = attempt.percentages;
    this.studentProfile.isUndifferentiated = Boolean(attempt.isUndifferentiated);

    const matchedMajors = HollandEngine.matchMajors(attempt.code, attempt.percentages, {
      isUndifferentiated: attempt.isUndifferentiated
    });

    let topMajor = null;
    if (attempt.targetMajorId && window.EduPathData && window.EduPathData.majors) {
      topMajor = window.EduPathData.majors.find(m => m.id === attempt.targetMajorId);
    }
    if (!topMajor && matchedMajors && matchedMajors.length > 0 && !attempt.isUndifferentiated) {
      topMajor = matchedMajors[0];
    }
    if (topMajor) {
      this.studentProfile.targetMajorId = topMajor.id;
      this.studentProfile.targetMajorName = topMajor.name;
      this.studentProfile.major = topMajor.name;
      attempt.targetMajorId = topMajor.id;
      attempt.targetMajorName = topMajor.name;
    }

    this.saveProfileToStorage();

    // Cập nhật UI
    const undiffAlert = document.getElementById('quiz-undifferentiated-alert');
    const undiffText = document.getElementById('quiz-undifferentiated-text');
    const codeEl = document.getElementById('result-holland-code');

    if (attempt.isUndifferentiated) {
      if (undiffAlert) undiffAlert.style.display = 'block';
      if (undiffText) undiffText.textContent = attempt.undifferentiatedMessage || 'Chưa có nhóm nổi bật rõ rệt (Điểm cả 6 nhóm RIASEC đều bằng nhau). Kết quả không tạo kết luận mang tính chắc chắn từ thứ tự phá hòa tùy ý.';
      if (codeEl) {
        codeEl.textContent = 'CHƯA PHÂN HÓA';
        codeEl.style.fontSize = '2.2rem';
      }
    } else {
      if (undiffAlert) undiffAlert.style.display = 'none';
      if (codeEl) {
        codeEl.textContent = attempt.code;
        codeEl.style.fontSize = '3.75rem';
      }
    }

    const dummyResults = {
      code: attempt.code,
      top3: attempt.isUndifferentiated ? [] : [attempt.code[0], attempt.code[1], attempt.code[2]],
      rawScores: attempt.scores,
      percentages: attempt.percentages,
      isUndifferentiated: attempt.isUndifferentiated,
      undifferentiatedMessage: attempt.undifferentiatedMessage
    };

    this.renderRIASECBreakdown(dummyResults);
    this.renderPersonalityInsights(dummyResults);

    // Render danh sách ngành nghề đề xuất theo thứ tự mã Holland (A -> S -> E)
    this.lastQuizResults = dummyResults;
    this.renderHollandOrderCareers(dummyResults);

    this.renderMatchedMajors(matchedMajors);

    // Đồng bộ Cây nghề nghiệp
    if (this.treeAnimator) {
      if (attempt.isUndifferentiated) {
        const val = attempt.percentages.R || 50;
        this.treeAnimator.updateState({
          rootInterest: val,
          rootAbility: val,
          rootPersonality: val,
          rootValues: val,
          fruitExpectation: val
        });
      } else {
        this.treeAnimator.updateState({
          rootInterest: attempt.percentages[attempt.code[0]] || 0,
          rootAbility: attempt.percentages[attempt.code[1]] || 0,
          rootPersonality: attempt.percentages[attempt.code[2]] || 0
        });
      }
      this.syncSlidersFromTreeState();
      this.updateTreeMetricsDisplay();
    }

    // Đồng bộ Bài 5
    this.renderAssessmentView();
    this.playBeep(720);
  }

  renderRIASECBreakdown(results) {
    const container = document.getElementById('quiz-riasec-breakdown');
    if (!container) return;
    const sanitize = window.sanitize;
    container.textContent = '';

    const maxPerGroup = this.quizMode === 'quick' ? 15 : 50;

    HollandEngine.RIASEC_ORDER.forEach(type => {
      const meta = HollandEngine.GROUP_METADATA[type] || {};
      const score = results.rawScores[type] || 0;
      const pct = results.percentages[type] || 0;

      const row = document.createElement('div');
      row.className = 'riasec-bar-row';
      row.innerHTML = sanitize(`
        <div class="riasec-bar-header">
          <span style="color:${meta.color};">${meta.code} — ${meta.name}</span>
          <span style="font-weight:800; color:var(--text-primary);">${score}/${maxPerGroup} (${pct}%)</span>
        </div>
        <div class="riasec-bar-bg">
          <div class="riasec-bar-fill" style="width:${pct}%; background-color:${meta.color};"></div>
        </div>
      `);
      container.appendChild(row);
    });
  }

  renderPersonalityInsights(results) {
    const detailsContainer = document.getElementById('quiz-personality-details');
    const conflictContainer = document.getElementById('quiz-conflict-insight');
    const sanitize = window.sanitize;

    if (detailsContainer) {
      detailsContainer.textContent = '';
      if (results.isUndifferentiated || !results.top3 || results.top3.length < 3) {
        const card = document.createElement('div');
        card.className = 'personality-detail-card';
        card.innerHTML = sanitize(`
          <div class="personality-detail-header" style="color:var(--warning);">
            <span>🔍 Phân Tích: Xu Hướng Đa Năng / Chưa Phân Hóa Rõ Rệt</span>
          </div>
          <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.4rem;">
            Điểm số của em trải đều trên cả 6 nhóm tính cách RIASEC. Điều này phản ánh em có tiềm năng rộng mở hoặc chưa tập trung vào một lĩnh vực cụ thể.
          </p>
          <div style="font-size:0.825rem; line-height:1.5; color:var(--text-secondary);">
            <div>💡 <strong>Khuyến nghị sư phạm:</strong> Không nên vội kết luận một mã nghề cố định. Em hãy tích cực tham gia các dự án thực hành, câu lạc bộ STEM, hoặc làm lại khảo sát khi có trải nghiệm mới.</div>
          </div>
        `);
        detailsContainer.appendChild(card);
        if (conflictContainer) conflictContainer.style.display = 'none';
        return;
      }
      const top1 = results.top3[0];
      const top2 = results.top3[1];
      const top3 = results.top3[2];

      const meta1 = HollandEngine.GROUP_METADATA[top1] || {};
      const meta2 = HollandEngine.GROUP_METADATA[top2] || {};
      const meta3 = HollandEngine.GROUP_METADATA[top3] || {};

      const card = document.createElement('div');
      card.className = 'personality-detail-card';
      card.innerHTML = sanitize(`
        <div class="personality-detail-header" style="color:${meta1.color};">
          <span>🌟 Nhóm Thống Trị: ${meta1.name} (Chữ cái ${top1})</span>
        </div>
        <p style="font-size:0.875rem; color:var(--text-secondary); margin-bottom:0.4rem;">${meta1.description}</p>
        <div style="font-size:0.825rem; line-height:1.5; color:var(--text-secondary);">
          <div>💪 <strong>Thế mạnh vượt trội:</strong> ${meta1.strengths}</div>
          <div>📖 <strong>Học hiệu quả nhất khi:</strong> ${meta1.bestLearnsWhen}</div>
          <div>⚠️ <strong>Dễ chán nản khi:</strong> ${meta1.losesInterestWhen}</div>
        </div>
        <div style="margin-top:0.6rem; padding-top:0.6rem; border-top:1px dashed var(--border); font-size:0.825rem; color:var(--text-muted);">
          🔗 <strong>Kênh bổ trợ & xúc tác:</strong> Chữ cái thứ hai (${top2} - ${meta2.shortName}) và thứ ba (${top3} - ${meta3.shortName}) giúp em đa dạng hóa khả năng thích nghi và mở rộng cơ hội việc làm kĩ thuật.
        </div>
      `);
      detailsContainer.appendChild(card);
    }

    if (conflictContainer) {
      const conflict = HollandEngine.detectConflict(results.code);
      if (conflict) {
        conflictContainer.style.display = 'block';
        conflictContainer.innerHTML = sanitize(`
          <div class="conflict-callout-card">
            <h4 style="font-size:0.925rem; font-weight:700; color:var(--accent-enterprise); margin-bottom:0.35rem;">
              ⚖️ Điểm Giao Thoa Độc Đáo: ${conflict.title}
            </h4>
            <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5;">
              ${conflict.insight}
            </p>
          </div>
        `);
      } else {
        conflictContainer.style.display = 'none';
      }
    }
  }

  selectMajorForProject(majorId) {
    this.studentProfile.targetMajorId = majorId;
    if (window.EduPathData && window.EduPathData.majors) {
      const found = window.EduPathData.majors.find(m => m.id === majorId);
      if (found) this.studentProfile.targetMajorName = found.name;
    }
    this.saveProfileToStorage();
    this.switchTab('project');
    this.renderAssessmentView();
    this.playBeep(680);
  }

  // --- AI AGENTS MODULE (Gemini AI + SGK Expert Hybrid) ---
  initAIAgents() {
    const selector = document.getElementById('ai-agent-selector-container');
    if (!selector) return;
    const sanitize = window.sanitize;

    selector.textContent = '';
    AIAgentsManager.AGENTS.forEach(agent => {
      const pill = document.createElement('div');
      pill.className = `agent-card-pill ${agent.id === this.activeAgentId ? 'active' : ''}`;
      pill.setAttribute('data-agent-id', agent.id);
      pill.innerHTML = sanitize(`
        <span style="font-size:1.5rem;">${agent.avatar}</span>
        <div>
          <div style="font-weight:700; font-size:0.875rem;">${agent.name}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${agent.tag}</div>
        </div>
      `);
      pill.addEventListener('click', () => {
        if (this.activeAgentId === agent.id) return;
        this.activeAgentId = agent.id;
        document.querySelectorAll('.agent-card-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderAgentChat();
        this.playBeep(580);
      });
      selector.appendChild(pill);
    });

    this.updateGeminiStatusBadge();
    this.renderAgentChat();

    // Send button & Input
    const sendBtn = document.getElementById('chat-send-btn');
    const inputEl = document.getElementById('chat-input-text');
    if (sendBtn && inputEl) {
      const doSend = () => {
        const text = inputEl.value.trim();
        if (text && !this.isAgentThinking) {
          this.handleSendMessage(text);
          inputEl.value = '';
        }
      };
      sendBtn.addEventListener('click', doSend);
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSend();
      });
    }

    // Clear chat history button
    const clearChatBtn = document.getElementById('btn-clear-chat-history');
    if (clearChatBtn) {
      clearChatBtn.addEventListener('click', () => {
        if (this.agentChatHistories && this.agentChatHistories[this.activeAgentId]) {
          this.agentChatHistories[this.activeAgentId] = [];
        }
        this.renderAgentChat();
        this.playBeep(620);
      });
    }

    // Gemini Config Modal Hooks (Bảo mật: Chỉ Giáo viên có quyền mở)
    const openConfigBtn = document.getElementById('btn-open-gemini-config');
    const teacherOpenConfigBtn = document.getElementById('teacher-btn-open-gemini-config');
    const configModal = document.getElementById('gemini-config-modal');
    const closeConfigBtn = document.getElementById('btn-close-gemini-modal');
    const keyInput = document.getElementById('gemini-api-key-input');
    const modelSelect = document.getElementById('gemini-model-select');
    const toggleKeyBtn = document.getElementById('btn-toggle-key-visibility');
    const testBtn = document.getElementById('btn-test-gemini-connection');
    const saveBtn = document.getElementById('btn-save-gemini-config');
    const clearConfigBtn = document.getElementById('btn-clear-gemini-config');
    const configMsg = document.getElementById('gemini-config-msg');

    const openConfigHandler = () => {
      if (!this.currentUser || this.currentUser.role !== 'teacher') {
        alert('Chỉ tài khoản Giáo viên quản trị mới có quyền cấu hình Google Gemini AI.');
        return;
      }
      const cfg = AIAgentsManager.getGeminiConfig();
      if (keyInput) keyInput.value = cfg.apiKey;
      if (modelSelect) modelSelect.value = cfg.model;
      if (configMsg) configMsg.style.display = 'none';
      if (configModal) configModal.style.display = 'flex';
    };

    if (openConfigBtn) {
      openConfigBtn.addEventListener('click', openConfigHandler);
    }
    if (teacherOpenConfigBtn) {
      teacherOpenConfigBtn.addEventListener('click', openConfigHandler);
    }

    // Tự động đồng bộ cấu hình Gemini từ Cloud nếu có
    if (AIAgentsManager.syncGeminiConfigFromCloud) {
      AIAgentsManager.syncGeminiConfigFromCloud().then(() => {
        this.updateGeminiStatusBadge();
      }).catch((e) => {
        console.warn('Sync cloud gemini config warning:', e);
      });
    }

    if (closeConfigBtn && configModal) {
      closeConfigBtn.addEventListener('click', () => {
        configModal.style.display = 'none';
      });
    }

    if (toggleKeyBtn && keyInput) {
      toggleKeyBtn.addEventListener('click', () => {
        if (keyInput.type === 'password') {
          keyInput.type = 'text';
          toggleKeyBtn.textContent = '🙈';
        } else {
          keyInput.type = 'password';
          toggleKeyBtn.textContent = '👁️';
        }
      });
    }

    if (testBtn && keyInput && modelSelect && configMsg) {
      testBtn.addEventListener('click', async () => {
        const key = keyInput.value.trim();
        const model = modelSelect.value;
        testBtn.disabled = true;
        const originalText = testBtn.textContent;
        testBtn.textContent = '⏳ Đang thử kết nối...';
        configMsg.style.display = 'none';

        try {
          const testRes = await AIAgentsManager.testGeminiConnection(key, model);
          configMsg.style.display = 'block';
          if (testRes.ok) {
            if (testRes.detectedModel && testRes.detectedModel !== modelSelect.value) {
              modelSelect.value = testRes.detectedModel;
              AIAgentsManager.saveGeminiConfig({ apiKey: key, model: testRes.detectedModel });
            }
            configMsg.style.background = 'rgba(16, 185, 129, 0.12)';
            configMsg.style.color = '#10b981';
            configMsg.style.border = '1px solid #10b981';
            configMsg.textContent = `✅ ${testRes.message} Phản hồi: "${testRes.reply}"`;
          } else {
            configMsg.style.background = 'rgba(239, 68, 68, 0.12)';
            configMsg.style.color = '#ef4444';
            configMsg.style.border = '1px solid #ef4444';
            configMsg.textContent = `❌ ${testRes.error}`;
          }
        } catch (err) {
          configMsg.style.display = 'block';
          configMsg.style.background = 'rgba(239, 68, 68, 0.12)';
          configMsg.style.color = '#ef4444';
          configMsg.style.border = '1px solid #ef4444';
          configMsg.textContent = `❌ Lỗi kiểm tra kết nối: ${err.message}`;
        } finally {
          testBtn.disabled = false;
          testBtn.textContent = originalText;
        }
      });
    }

    if (saveBtn && keyInput && modelSelect && configMsg) {
      saveBtn.addEventListener('click', () => {
        const key = keyInput.value.trim();
        const model = modelSelect.value;
        const ok = AIAgentsManager.saveGeminiConfig({ apiKey: key, model });
        configMsg.style.display = 'block';
        if (ok) {
          configMsg.style.background = 'rgba(16, 185, 129, 0.12)';
          configMsg.style.color = '#10b981';
          configMsg.style.border = '1px solid #10b981';
          configMsg.textContent = '💾 Đã lưu cấu hình Google Gemini thành công!';
          this.updateGeminiStatusBadge();
          this.playBeep(640);
          setTimeout(() => {
            if (configModal) configModal.style.display = 'none';
          }, 800);
        } else {
          configMsg.style.background = 'rgba(239, 68, 68, 0.12)';
          configMsg.style.color = '#ef4444';
          configMsg.style.border = '1px solid #ef4444';
          configMsg.textContent = '❌ Không thể lưu cấu hình vào LocalStorage.';
        }
      });
    }

    if (clearConfigBtn && keyInput && configMsg) {
      clearConfigBtn.addEventListener('click', () => {
        AIAgentsManager.clearGeminiConfig();
        keyInput.value = '';
        configMsg.style.display = 'block';
        configMsg.style.background = 'rgba(100, 116, 139, 0.12)';
        configMsg.style.color = 'var(--text-secondary)';
        configMsg.style.border = '1px solid var(--border)';
        configMsg.textContent = '🗑️ Đã xóa API Key. Ứng dụng đã chuyển về Chế độ Cố vấn SGK Ngoại tuyến.';
        this.updateGeminiStatusBadge();
        this.playBeep(520);
      });
    }
  }

  updateGeminiStatusBadge() {
    const badge = document.getElementById('gemini-status-badge');
    if (!badge) return;
    const isLive = AIAgentsManager.isGeminiActive();
    const cfg = AIAgentsManager.getGeminiConfig();

    if (isLive) {
      badge.className = 'agent-mode-badge live-active';
      badge.textContent = `⚡ Gemini AI Live (${cfg.model})`;
      badge.title = `Đang kết nối trực tiếp với Google Gemini AI (${cfg.model})`;
    } else {
      badge.className = 'agent-mode-badge';
      badge.textContent = '🛡️ Chuyên Gia SGK (Ngoại Tuyến)';
      badge.title = 'Đang sử dụng hệ thống Cố vấn Chuyên gia SGK Công nghệ 9 nội bộ (Ngoại tuyến)';
    }
  }

  renderAgentChat() {
    const agent = AIAgentsManager.AGENTS.find(a => a.id === this.activeAgentId);
    if (!agent) return;
    const sanitize = window.sanitize;

    const chatBox = document.getElementById('chat-messages-scroll');
    if (chatBox) {
      chatBox.textContent = '';
      const history = (this.agentChatHistories && this.agentChatHistories[this.activeAgentId]) || [];

      if (history.length === 0) {
        const greetDiv = document.createElement('div');
        greetDiv.className = 'chat-bubble agent';
        greetDiv.innerHTML = sanitize(`
          <span class="source-badge local">🛡️ Chuyên Gia SGK</span><br>
          <strong>${agent.avatar} ${agent.name}:</strong><br>
          ${agent.greeting}
        `);
        chatBox.appendChild(greetDiv);
      } else {
        history.forEach(item => {
          if (item.role === 'user') {
            const userDiv = document.createElement('div');
            userDiv.className = 'chat-bubble user';
            userDiv.textContent = item.text;
            chatBox.appendChild(userDiv);
          } else {
            const agentDiv = document.createElement('div');
            agentDiv.className = 'chat-bubble agent';
            const sourceBadgeHtml = item.source === 'gemini'
              ? `<span class="source-badge gemini">⚡ Gemini AI (${item.model || 'Live'})</span>`
              : `<span class="source-badge local">🛡️ Chuyên Gia SGK</span>`;
            agentDiv.innerHTML = sanitize(`
              ${sourceBadgeHtml}<br>
              <strong>${agent.avatar} ${agent.name}:</strong><br>
              ${this.formatAgentText(item.text)}
            `);
            chatBox.appendChild(agentDiv);
          }
        });
      }
      chatBox.scrollTop = chatBox.scrollHeight;
    }

    const promptsRow = document.getElementById('quick-prompts-row');
    if (promptsRow) {
      promptsRow.textContent = '';
      agent.presetPrompts.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-pill';
        btn.textContent = p;
        btn.addEventListener('click', () => {
          if (!this.isAgentThinking) {
            this.handleSendMessage(p);
          }
        });
        promptsRow.appendChild(btn);
      });
    }
  }

  async handleSendMessage(msgText) {
    const chatBox = document.getElementById('chat-messages-scroll');
    const inputEl = document.getElementById('chat-input-text');
    const sendBtn = document.getElementById('chat-send-btn');
    if (!chatBox || !msgText || this.isAgentThinking) return;

    const sanitize = window.sanitize;
    const cleanText = msgText.trim();
    if (!cleanText) return;

    this.isAgentThinking = true;
    if (sendBtn) sendBtn.disabled = true;
    if (inputEl) inputEl.disabled = true;

    if (!this.agentChatHistories[this.activeAgentId]) {
      this.agentChatHistories[this.activeAgentId] = [];
    }

    // Append user message to history
    this.agentChatHistories[this.activeAgentId].push({
      role: 'user',
      text: cleanText
    });

    // Render user message bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.textContent = cleanText;
    chatBox.appendChild(userDiv);

    const agent = AIAgentsManager.AGENTS.find(a => a.id === this.activeAgentId) || AIAgentsManager.AGENTS[0];

    // Show typing indicator bubble
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-bubble agent typing-indicator';
    typingDiv.id = 'agent-typing-bubble';
    typingDiv.innerHTML = sanitize(`<span>🤖 <strong>${agent.name}</strong> đang suy nghĩ...</span> <span class="typing-dots"><span>.</span><span>.</span><span>.</span></span>`);
    chatBox.appendChild(typingDiv);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const prevHistory = this.agentChatHistories[this.activeAgentId].slice(0, -1);
      const res = await AIAgentsManager.askAgent(this.activeAgentId, cleanText, prevHistory, this.studentProfile);

      // Remove typing indicator
      const typingEl = document.getElementById('agent-typing-bubble');
      if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }

      // Append agent response to history
      this.agentChatHistories[this.activeAgentId].push({
        role: 'model',
        text: res.text,
        source: res.source,
        model: res.model
      });

      // Render agent response bubble with Typewriter Effect
      const sourceBadgeHtml = res.source === 'gemini'
        ? `<span class="source-badge gemini">⚡ Gemini AI (${res.model || 'Live'})</span>`
        : `<span class="source-badge local">🛡️ Chuyên Gia SGK</span>`;

      const agentDiv = document.createElement('div');
      agentDiv.className = 'chat-bubble agent is-typing';
      agentDiv.title = 'Nhấp vào để hiện toàn bộ văn bản ngay lập tức';
      agentDiv.innerHTML = sanitize(`
        ${sourceBadgeHtml}<br>
        <strong>${agent.avatar} ${agent.name}:</strong><br>
        <span class="agent-typed-content"></span><span class="typewriter-cursor">▌</span>
      `);
      chatBox.appendChild(agentDiv);
      chatBox.scrollTop = chatBox.scrollHeight;

      const contentEl = agentDiv.querySelector('.agent-typed-content');
      const cursorEl = agentDiv.querySelector('.typewriter-cursor');
      await this.typewriterAnimate(contentEl, cursorEl, res.text, agentDiv, chatBox);
      this.playBeep(720, 'sine', 0.1);
    } catch (err) {
      console.error('[EduPath Chat] Lỗi khi gửi tin nhắn:', err);
      const typingEl = document.getElementById('agent-typing-bubble');
      if (typingEl && typingEl.parentNode) {
        typingEl.parentNode.removeChild(typingEl);
      }
      const errDiv = document.createElement('div');
      errDiv.className = 'chat-bubble agent';
      errDiv.innerHTML = sanitize(`<strong>${agent.avatar} ${agent.name}:</strong><br>Rất tiếc, đã có sự cố kết nối. Vui lòng thử lại sau ít phút.`);
      chatBox.appendChild(errDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
    } finally {
      this.isAgentThinking = false;
      if (sendBtn) sendBtn.disabled = false;
      if (inputEl) {
        inputEl.disabled = false;
        inputEl.focus();
      }
    }
  }

  typewriterAnimate(contentEl, cursorEl, fullText, containerBubble, chatBox) {
    return new Promise((resolve) => {
      if (!contentEl || !fullText) {
        if (cursorEl && cursorEl.parentNode) cursorEl.remove();
        if (containerBubble) containerBubble.classList.remove('is-typing');
        resolve();
        return;
      }

      let isFinished = false;
      const totalLen = fullText.length;
      let currentIdx = 0;

      const finishImmediately = () => {
        if (isFinished) return;
        isFinished = true;
        if (cursorEl && cursorEl.parentNode) cursorEl.remove();
        contentEl.innerHTML = sanitize(this.formatAgentText(fullText));
        if (containerBubble) containerBubble.classList.remove('is-typing');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        resolve();
      };

      if (containerBubble) {
        containerBubble.addEventListener('click', finishImmediately, { once: true });
      }

      // Smooth duration scaling: 0.8s to 2.2s depending on text length
      const targetDurationMs = Math.min(2200, Math.max(800, totalLen * 4));
      const intervalMs = 20;
      const totalTicks = Math.max(1, Math.round(targetDurationMs / intervalMs));
      const charsPerTick = Math.max(1, Math.ceil(totalLen / totalTicks));

      const timerId = setInterval(() => {
        if (isFinished) {
          clearInterval(timerId);
          return;
        }

        currentIdx = Math.min(totalLen, currentIdx + charsPerTick);
        const chunk = fullText.slice(0, currentIdx);

        contentEl.textContent = chunk;

        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight;
        }

        if (currentIdx >= totalLen) {
          clearInterval(timerId);
          finishImmediately();
        }
      }, intervalMs);
    });
  }

  // --- PROJECT ASSESSMENT MODULE (Bài 5 SGK) ---
  initProjectAssessment() {
    const printBtn = document.getElementById('print-project-report-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        this.printOfficialReport();
      });
    }

    // Populate Major Selector Dropdown
    const majorSelect = document.getElementById('assessment-major-select');
    if (majorSelect && window.EduPathData.majors) {
      majorSelect.textContent = '';
      window.EduPathData.majors.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = `${m.name} (${m.code}) — ${m.level}`;
        majorSelect.appendChild(opt);
      });
      majorSelect.value = this.studentProfile.targetMajorId || window.EduPathData.majors[0].id;
      majorSelect.addEventListener('change', (e) => {
        this.studentProfile.targetMajorId = e.target.value;
        const found = window.EduPathData.majors.find(m => m.id === e.target.value);
        if (found) this.studentProfile.targetMajorName = found.name;
        this.saveProfileToStorage();
        this.renderAssessmentView();
        this.playBeep(640);
      });
    }

    // Bind 3 SGK Guiding Questions
    const q1 = document.getElementById('sgk-q1-understand-self');
    const q2 = document.getElementById('sgk-q2-understand-career');
    const q3 = document.getElementById('sgk-q3-career-path');

    if (!this.studentProfile.threeQuestions) {
      this.studentProfile.threeQuestions = { understandSelf: '', understandCareer: '', careerPathPlan: '' };
    }

    const bindQ = (el, key) => {
      if (!el) return;
      el.addEventListener('input', (e) => {
        this.studentProfile.threeQuestions[key] = e.target.value;
        this.saveProfileToStorage();
      });
      el.addEventListener('change', (e) => {
        this.studentProfile.threeQuestions[key] = e.target.value;
        this.saveProfileToStorage();
      });
    };

    bindQ(q1, 'understandSelf');
    bindQ(q2, 'understandCareer');
    bindQ(q3, 'careerPathPlan');
  }

  renderAssessmentView() {
    const tableBody = document.getElementById('assessment-matrix-body');
    if (!tableBody) return;
    const sanitize = window.sanitize;

    const targetMajor = window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId) || window.EduPathData.majors[0];
    const targetMajorTitle = document.getElementById('assessment-target-major-name');
    if (targetMajorTitle) {
      targetMajorTitle.textContent = `${targetMajor.name} (Mã Holland: ${targetMajor.code})`;
    }

    const majorSelect = document.getElementById('assessment-major-select');
    if (majorSelect && majorSelect.value !== targetMajor.id) {
      majorSelect.value = targetMajor.id;
    }

    // Populate 3 questions
    if (!this.studentProfile.threeQuestions) {
      this.studentProfile.threeQuestions = { understandSelf: '', understandCareer: '', careerPathPlan: '' };
    }
    const q1 = document.getElementById('sgk-q1-understand-self');
    const q2 = document.getElementById('sgk-q2-understand-career');
    const q3 = document.getElementById('sgk-q3-career-path');
    if (q1 && q1.value !== (this.studentProfile.threeQuestions.understandSelf || '')) {
      q1.value = this.studentProfile.threeQuestions.understandSelf || '';
    }
    if (q2 && q2.value !== (this.studentProfile.threeQuestions.understandCareer || '')) {
      q2.value = this.studentProfile.threeQuestions.understandCareer || '';
    }
    if (q3 && q3.value !== (this.studentProfile.threeQuestions.careerPathPlan || '')) {
      q3.value = this.studentProfile.threeQuestions.careerPathPlan || '';
    }

    tableBody.textContent = '';
    ProjectAssessment.CRITERIA_DEFINITIONS.forEach((c, idx) => {
      const isMatched = this.assessmentMatches[idx];
      const currentTrait = (this.studentProfile.selfTraits && this.studentProfile.selfTraits[idx])
        ? this.studentProfile.selfTraits[idx]
        : c.selfTraitDefault;

      const tr = document.createElement('tr');
      tr.innerHTML = sanitize(`
        <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
        <td>
          <span style="font-size:0.75rem; text-transform:uppercase; font-weight:700; color:var(--brand);">${c.category}</span><br>
          <strong style="display:block; margin-bottom:0.25rem;">${c.title}</strong>
          <textarea class="criteria-self-trait-input" id="self-trait-input-${idx}" rows="2" placeholder="Ghi nhận đặc điểm bản thân...">${currentTrait}</textarea>
        </td>
        <td style="font-size:0.85rem; color:var(--text-secondary); line-height:1.45;">${c.requirement}</td>
        <td style="text-align:center;">
          <button type="button" class="match-toggle-btn ${isMatched ? 'matched' : ''}" onclick="window.app.toggleAssessmentMatch(${idx})">
            ${isMatched ? '✓' : ''}
          </button>
        </td>
      `);
      tableBody.appendChild(tr);

      // Bind trait input change
      const traitInput = tr.querySelector(`#self-trait-input-${idx}`);
      if (traitInput) {
        const handleTraitChange = (e) => {
          if (!this.studentProfile.selfTraits) this.studentProfile.selfTraits = {};
          this.studentProfile.selfTraits[idx] = e.target.value;
          this.saveProfileToStorage();
        };
        traitInput.addEventListener('input', handleTraitChange);
        traitInput.addEventListener('change', handleTraitChange);
      }
    });

    const result = ProjectAssessment.calculateProjectResult(this.assessmentMatches);
    const scoreVal = document.getElementById('assessment-score-value');
    const badgeEl = document.getElementById('assessment-classification-badge');
    const recEl = document.getElementById('assessment-recommendation-text');

    if (scoreVal) scoreVal.textContent = `${result.totalScore} / 10`;
    if (badgeEl) {
      badgeEl.textContent = result.classification;
      badgeEl.className = `question-tag ${result.classBadge}`;
      badgeEl.style.backgroundColor = result.totalScore >= 7 ? 'var(--brand-soft)' : (result.totalScore >= 4 ? 'var(--warning-soft)' : 'var(--danger-soft)');
      badgeEl.style.color = result.totalScore >= 7 ? 'var(--brand)' : (result.totalScore >= 4 ? 'var(--warning)' : 'var(--danger)');
    }
    if (recEl) recEl.textContent = result.recommendation;
  }

  toggleAssessmentMatch(idx) {
    this.assessmentMatches[idx] = !this.assessmentMatches[idx];
    this.saveProfileToStorage();
    this.renderAssessmentView();
    this.playBeep(600);
  }

  printOfficialReport() {
    const sanitize = window.sanitize;
    const targetMajor = window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId) || window.EduPathData.majors[0];
    const result = ProjectAssessment.calculateProjectResult(this.assessmentMatches);
    const html = ProjectAssessment.generatePrintableHTML(this.studentProfile, targetMajor, this.assessmentMatches, result);

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.documentElement.innerHTML = sanitize(html);
      printWin.document.close();
      printWin.focus();
      setTimeout(() => {
        printWin.print();
      }, 350);
    }
  }

  // --- TEACHER DASHBOARD MODULE ---
  initTeacherDashboard() {
    const exportBtn = document.getElementById('export-class-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        const classData = TeacherAnalytics.currentClassData || TeacherAnalytics.DEFAULT_CLASS_DATA;
        TeacherAnalytics.exportClassCSV(classData, this.studentProfile.grade || '9A1');
        this.playBeep(800);
      });
    }

    const addStudentBtn = document.getElementById('add-current-to-roster-btn');
    if (addStudentBtn) {
      addStudentBtn.addEventListener('click', () => {
        this.addCurrentStudentToTeacherRoster();
      });
    }

    const openAddBtn = document.getElementById('btn-open-add-student-modal');
    if (openAddBtn) {
      openAddBtn.addEventListener('click', () => this.openAddStudentModal());
    }

    const closeCrudBtn = document.getElementById('btn-close-crud-modal');
    if (closeCrudBtn) {
      closeCrudBtn.addEventListener('click', () => this.closeCrudModal());
    }

    const cancelCrudBtn = document.getElementById('btn-cancel-crud-student');
    if (cancelCrudBtn) {
      cancelCrudBtn.addEventListener('click', () => this.closeCrudModal());
    }

    const crudForm = document.getElementById('student-crud-form');
    if (crudForm) {
      crudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveCrudStudent();
      });
    }

    // Change Teacher PIN modal bindings
    const openPinBtn = document.getElementById('btn-open-change-pin-modal');
    if (openPinBtn) {
      openPinBtn.addEventListener('click', () => this.openChangePinModal());
    }

    const closePinBtn = document.getElementById('btn-close-change-pin-modal');
    if (closePinBtn) {
      closePinBtn.addEventListener('click', () => this.closeChangePinModal());
    }

    const cancelPinBtn = document.getElementById('btn-cancel-change-pin');
    if (cancelPinBtn) {
      cancelPinBtn.addEventListener('click', () => this.closeChangePinModal());
    }

    const pinForm = document.getElementById('teacher-change-pin-form');
    if (pinForm) {
      pinForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleChangeTeacherPin();
      });
    }

    const classFilter = document.getElementById('teacher-class-filter-select');
    if (classFilter) {
      classFilter.addEventListener('change', (e) => {
        const val = e.target.value;
        this.selectedTeacherStudentCode = null;
        if (window.EduPathFirebase) {
          if (this.teacherListenerUnsub) this.teacherListenerUnsub();
          this.teacherListenerUnsub = window.EduPathFirebase.onClassStudentsChange(val, (students) => {
            TeacherAnalytics.currentClassData = students || [];
            if (this.currentTab === 'teacher') {
              this.renderTeacherHeatmap();
            }
          });
        }
      });
    }

    // Nút quay lại biểu đồ toàn lớp
    const wholeClassBtn = document.getElementById('btn-view-whole-class-chart');
    if (wholeClassBtn) {
      wholeClassBtn.addEventListener('click', () => {
        this.selectedTeacherStudentCode = null;
        this.renderTeacherHeatmap();
        this.playBeep(640, 'sine', 0.1);
      });
    }

    // Dropdown chọn học sinh để xem biểu đồ cá nhân
    const studentChartSelect = document.getElementById('teacher-student-chart-select');
    if (studentChartSelect) {
      studentChartSelect.addEventListener('change', (e) => {
        this.selectedTeacherStudentCode = e.target.value ? e.target.value : null;
        this.renderTeacherHeatmap();
        this.playBeep(680, 'sine', 0.1);
      });
    }

    // Auto-update student code prefix when grade changes in Add Student modal
    const codeInput = document.getElementById('crud-student-code');
    if (codeInput) {
      codeInput.addEventListener('input', () => {
        codeInput.dataset.auto = 'false';
      });
    }

    const gradeInput = document.getElementById('crud-student-grade');
    if (gradeInput) {
      gradeInput.addEventListener('input', () => {
        const isEdit = document.getElementById('crud-is-edit');
        if (isEdit && isEdit.value === 'true') return;
        const codeInput = document.getElementById('crud-student-code');
        if (codeInput && codeInput.dataset.auto === 'false') return;
        const newGrade = gradeInput.value.trim().toUpperCase();
        if (!newGrade || newGrade.includes('TẤT CẢ') || newGrade.includes('TAT CA')) return;

        const classData = TeacherAnalytics.currentClassData || [];
        const matchingNums = classData
          .filter(s => {
            const g = (s.grade || '').toUpperCase();
            const c = (s.studentCode || '').toUpperCase();
            return g === newGrade || c.startsWith(newGrade + '-');
          })
          .map(s => {
            const parts = (s.studentCode || '').split('-');
            const lastNum = parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
            return isNaN(lastNum) ? 0 : lastNum;
          });
        const nextNum = matchingNums.length > 0 ? Math.max(...matchingNums) + 1 : 1;
        if (codeInput) {
          codeInput.value = `${newGrade}-${String(nextNum).padStart(2, '0')}`;
        }
      });
    }

    // Realtime Sync Listener for Teacher Dashboard
    if (window.EduPathFirebase) {
      if (this.teacherListenerUnsub) this.teacherListenerUnsub();
      const initialFilter = classFilter ? classFilter.value : '';
      this.teacherListenerUnsub = window.EduPathFirebase.onClassStudentsChange(initialFilter, (students) => {
        TeacherAnalytics.currentClassData = students || [];
        if (this.currentTab === 'teacher') {
          this.renderTeacherHeatmap();
        }
      });
    }
  }

  openAddStudentModal() {
    const modal = document.getElementById('student-crud-modal');
    const isEdit = document.getElementById('crud-is-edit');
    const title = document.getElementById('crud-modal-title');
    const codeIn = document.getElementById('crud-student-code');
    const nameIn = document.getElementById('crud-student-name');
    const gradeIn = document.getElementById('crud-student-grade');
    const schoolIn = document.getElementById('crud-student-school');
    const err = document.getElementById('crud-student-error');

    if (err) err.style.display = 'none';
    if (isEdit) isEdit.value = 'false';
    if (title) title.textContent = 'Thêm Học Sinh Mới';

    // Determine target grade: never use 'Tất cả các lớp'
    const filterSelect = document.getElementById('teacher-class-filter-select');
    const filterVal = filterSelect ? filterSelect.value.trim() : '';
    const targetGrade = (filterVal && filterVal !== 'Tất cả các lớp') ? filterVal : '9A1';

    if (gradeIn) gradeIn.value = targetGrade;
    if (nameIn) nameIn.value = '';
    if (schoolIn) schoolIn.value = 'THCS Chu Văn An';

    if (codeIn) {
      codeIn.disabled = false;
      codeIn.dataset.auto = 'true';
      const classData = TeacherAnalytics.currentClassData || [];
      const matchingNums = classData
        .filter(s => {
          const g = (s.grade || '').toUpperCase();
          const c = (s.studentCode || '').toUpperCase();
          return g === targetGrade.toUpperCase() || c.startsWith(targetGrade.toUpperCase() + '-');
        })
        .map(s => {
          const parts = (s.studentCode || '').split('-');
          const lastNum = parts.length > 1 ? parseInt(parts[parts.length - 1], 10) : 0;
          return isNaN(lastNum) ? 0 : lastNum;
        });
      const nextNum = matchingNums.length > 0 ? Math.max(...matchingNums) + 1 : 1;
      codeIn.value = `${targetGrade}-${String(nextNum).padStart(2, '0')}`;
    }

    if (modal) modal.style.display = 'flex';
  }

  openEditStudentModal(code) {
    const modal = document.getElementById('student-crud-modal');
    const isEdit = document.getElementById('crud-is-edit');
    const title = document.getElementById('crud-modal-title');
    const codeIn = document.getElementById('crud-student-code');
    const nameIn = document.getElementById('crud-student-name');
    const gradeIn = document.getElementById('crud-student-grade');
    const schoolIn = document.getElementById('crud-student-school');
    const err = document.getElementById('crud-student-error');

    const classData = TeacherAnalytics.currentClassData || [];
    const st = classData.find(s => (s.studentCode && s.studentCode.toUpperCase() === code.toUpperCase()) || (s.id && `9A1-${String(s.id).padStart(2, '0')}` === code.toUpperCase()));
    if (!st) return;

    if (err) err.style.display = 'none';
    if (isEdit) isEdit.value = 'true';
    if (title) title.textContent = 'Chỉnh Sửa Tài Khoản Học Sinh';
    if (codeIn) {
      codeIn.value = st.studentCode || code;
      codeIn.disabled = true;
    }
    if (nameIn) nameIn.value = st.name || '';
    if (gradeIn) gradeIn.value = st.grade || '9A1';
    if (schoolIn) schoolIn.value = st.school || 'THCS Chu Văn An';

    if (modal) modal.style.display = 'flex';
  }

  closeCrudModal() {
    const modal = document.getElementById('student-crud-modal');
    if (modal) modal.style.display = 'none';
  }

  async saveCrudStudent() {
    const isEdit = document.getElementById('crud-is-edit').value === 'true';
    const codeIn = document.getElementById('crud-student-code');
    const nameIn = document.getElementById('crud-student-name');
    const gradeIn = document.getElementById('crud-student-grade');
    const schoolIn = document.getElementById('crud-student-school');
    const err = document.getElementById('crud-student-error');
    const saveBtn = document.getElementById('btn-save-crud-student');

    const studentCode = codeIn ? codeIn.value.trim().toUpperCase() : '';
    const name = nameIn ? nameIn.value.trim() : '';
    let grade = gradeIn ? gradeIn.value.trim().toUpperCase() : '9A1';
    const school = schoolIn ? schoolIn.value.trim() : 'THCS Chu Văn An';

    if (err) err.style.display = 'none';

    if (!studentCode || !name) {
      if (err) {
        err.textContent = 'Vui lòng nhập đầy đủ Mã học sinh và Họ và tên.';
        err.style.display = 'block';
      }
      return;
    }

    if (grade.includes('TẤT CẢ') || grade.includes('TAT CA')) {
      if (err) {
        err.textContent = 'Lớp không hợp lệ. Vui lòng nhập tên lớp cụ thể (ví dụ: 9A1, 9A2...).';
        err.style.display = 'block';
      }
      return;
    }

    if (studentCode.includes('TẤT CẢ') || studentCode.includes('TAT CA')) {
      if (err) {
        err.textContent = 'Mã học sinh không được chứa "Tất cả các lớp". Định dạng đúng: Lớp-STT (ví dụ: 9A1-01).';
        err.style.display = 'block';
      }
      return;
    }

    const forbiddenKeyChars = /[.#$[\]/]/;
    if (forbiddenKeyChars.test(studentCode)) {
      if (err) {
        err.textContent = 'Mã học sinh không được chứa các ký tự đặc biệt: . # $ [ ] /';
        err.style.display = 'block';
      }
      return;
    }

    const classData = TeacherAnalytics.currentClassData || [];

    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Đang lưu...';
    }

    try {
      if (isEdit) {
        if (window.EduPathFirebase) {
          await window.EduPathFirebase.updateStudent(studentCode, { name, grade, school });
        }
        const st = classData.find(s => s.studentCode && s.studentCode.toUpperCase() === studentCode);
        if (st) {
          st.name = name;
          st.grade = grade;
          st.school = school;
        }
      } else {
        const existingIdx = classData.findIndex(s => s.studentCode && s.studentCode.toUpperCase() === studentCode);
        const newStudent = {
          studentCode,
          name,
          grade,
          school,
          code: existingIdx >= 0 && classData[existingIdx].code ? classData[existingIdx].code : '',
          major: existingIdx >= 0 && classData[existingIdx].major ? classData[existingIdx].major : '',
          projectScore: (existingIdx >= 0 && typeof classData[existingIdx].projectScore === 'number') ? classData[existingIdx].projectScore : null,
          classification: existingIdx >= 0 && classData[existingIdx].classification ? classData[existingIdx].classification : '',
          stream: existingIdx >= 0 && classData[existingIdx].stream ? classData[existingIdx].stream : '',
          createdAt: existingIdx >= 0 && classData[existingIdx].createdAt ? classData[existingIdx].createdAt : new Date().toISOString()
        };
        TeacherAnalytics.addStudentToRoster(newStudent);
        if (window.EduPathFirebase) {
          await window.EduPathFirebase.addStudent(newStudent);
        }
      }

      this.closeCrudModal();
      this.renderTeacherHeatmap();
      this.playBeep(700, 'sine', 0.15);
    } catch (saveErr) {
      console.error('Lỗi khi lưu học sinh:', saveErr);
      if (err) {
        err.textContent = 'Lỗi lưu dữ liệu: ' + (saveErr.message || 'Không thể ghi lên Firebase.');
        err.style.display = 'block';
      }
      this.playBeep(220, 'sawtooth', 0.2);
    } finally {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Lưu thông tin';
      }
    }
  }

  async confirmDeleteStudent(code) {
    const ok = window.confirm(`Thầy/Cô có chắc chắn muốn xóa học sinh mã ${code} không?`);
    if (!ok) return;

    try {
      if (window.EduPathFirebase) {
        await window.EduPathFirebase.deleteStudent(code);
      }
      if (TeacherAnalytics.deleteStudentFromRoster) {
        TeacherAnalytics.deleteStudentFromRoster(code);
      } else {
        const idx = TeacherAnalytics.currentClassData.findIndex(s => (s.studentCode && s.studentCode.toUpperCase() === code.toUpperCase()) || (s.id && `9A1-${String(s.id).padStart(2, '0')}` === code.toUpperCase()));
        if (idx >= 0) TeacherAnalytics.currentClassData.splice(idx, 1);
      }

      this.renderTeacherHeatmap();
      this.playBeep(400, 'sawtooth', 0.15);
    } catch (err) {
      console.error('Lỗi xóa học sinh:', err);
      alert('Lỗi xóa học sinh: ' + (err.message || 'Không thể xóa trên Firebase.'));
    }
  }

  openChangePinModal() {
    const modal = document.getElementById('teacher-change-pin-modal');
    const errBox = document.getElementById('change-pin-error');
    const successBox = document.getElementById('change-pin-success');
    const curIn = document.getElementById('change-pin-current');
    const newIn = document.getElementById('change-pin-new');
    const confIn = document.getElementById('change-pin-confirm');

    if (errBox) errBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';
    if (curIn) curIn.value = '';
    if (newIn) newIn.value = '';
    if (confIn) confIn.value = '';

    if (modal) modal.style.display = 'flex';
  }

  closeChangePinModal() {
    const modal = document.getElementById('teacher-change-pin-modal');
    if (modal) modal.style.display = 'none';
  }

  async handleChangeTeacherPin() {
    const currentPinInput = document.getElementById('change-pin-current');
    const newPinInput = document.getElementById('change-pin-new');
    const confirmPinInput = document.getElementById('change-pin-confirm');
    const errBox = document.getElementById('change-pin-error');
    const successBox = document.getElementById('change-pin-success');

    if (errBox) errBox.style.display = 'none';
    if (successBox) successBox.style.display = 'none';

    const currentPin = currentPinInput ? currentPinInput.value.trim() : '';
    const newPin = newPinInput ? newPinInput.value.trim() : '';
    const confirmPin = confirmPinInput ? confirmPinInput.value.trim() : '';

    if (!currentPin) {
      if (errBox) {
        errBox.textContent = 'Vui lòng nhập mã PIN hiện tại.';
        errBox.style.display = 'block';
      }
      return;
    }

    let activePin = '2026';
    if (window.EduPathFirebase && window.EduPathFirebase.getTeacherPin) {
      activePin = await window.EduPathFirebase.getTeacherPin();
    } else {
      activePin = localStorage.getItem('edupath_teacher_pin') || '2026';
    }

    if (currentPin !== String(activePin).trim()) {
      if (errBox) {
        errBox.textContent = 'Mã PIN hiện tại không chính xác.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (newPin.length < 4) {
      if (errBox) {
        errBox.textContent = 'Mã PIN mới phải có tối thiểu 4 ký tự.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (newPin !== confirmPin) {
      if (errBox) {
        errBox.textContent = 'Mã PIN mới và xác nhận mã PIN không trùng khớp.';
        errBox.style.display = 'block';
      }
      return;
    }

    if (window.EduPathFirebase && window.EduPathFirebase.setTeacherPin) {
      await window.EduPathFirebase.setTeacherPin(newPin);
    } else {
      localStorage.setItem('edupath_teacher_pin', newPin);
    }

    if (successBox) {
      successBox.textContent = 'Đổi mã PIN giáo viên thành công! Mã mới đã được lưu bảo mật.';
      successBox.style.display = 'block';
    }
    this.playBeep(880, 'sine', 0.2);
    setTimeout(() => {
      this.closeChangePinModal();
    }, 1200);
  }

  addCurrentStudentToTeacherRoster() {
    const targetMajor = window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId) || window.EduPathData.majors[0];
    const result = ProjectAssessment.calculateProjectResult(this.assessmentMatches);
    const isVocational = (this.studentProfile.code && this.studentProfile.code.startsWith('R')) || targetMajor.level.includes('9+');
    const stream = isVocational ? 'Cao đẳng / Trung cấp Nghề 9+' : 'Học tiếp THPT & Đại học';

    const currentRoster = TeacherAnalytics.currentClassData || TeacherAnalytics.DEFAULT_CLASS_DATA;
    const grade = this.studentProfile.grade || '9A1';
    let nextNum = currentRoster.length + 1;
    let newCode = `${grade}-${String(nextNum).padStart(2, '0')}`;
    while (currentRoster.some(s => s.studentCode === newCode)) {
      nextNum++;
      newCode = `${grade}-${String(nextNum).padStart(2, '0')}`;
    }

    TeacherAnalytics.addStudentToRoster({
      studentCode: newCode,
      school: this.studentProfile.school || 'THCS Chu Văn An',
      grade: grade,
      name: `${this.studentProfile.name || 'Học sinh mới'} (${newCode})`,
      code: this.studentProfile.code || '',
      major: targetMajor.name,
      projectScore: result.totalScore,
      classification: result.classification,
      stream: stream
    });

    this.renderTeacherHeatmap();
    this.playBeep(850, 'triangle', 0.2);
  }

  renderTeacherHeatmap() {
    const canvas = document.getElementById('teacher-heatmap-canvas');
    if (!canvas) return;
    const sanitize = window.sanitize;

    const classData = (window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || [];
    const filterSelect = document.getElementById('teacher-class-filter-select');
    const currentFilter = (filterSelect && filterSelect.value) || '';
    const totalStudents = classData.length;
    const assessedStudents = classData.filter(s => Boolean(s.code && s.code.trim().length > 0));

    // Cập nhật danh sách trong dropdown chọn học sinh xem biểu đồ
    const studentChartSelect = document.getElementById('teacher-student-chart-select');
    if (studentChartSelect) {
      const prevVal = this.selectedTeacherStudentCode || '';
      studentChartSelect.textContent = '';
      const defOpt = document.createElement('option');
      defOpt.value = '';
      defOpt.textContent = currentFilter ? `👥 Cả lớp ${currentFilter}` : '👥 Cả lớp / Toàn bộ';
      studentChartSelect.appendChild(defOpt);

      classData.forEach(st => {
        const opt = document.createElement('option');
        opt.value = st.studentCode;
        const codeSuffix = st.code ? ` (${st.code})` : ' (Chưa làm)';
        opt.textContent = `👤 ${st.studentCode} - ${st.name || 'Học sinh'}${codeSuffix}`;
        studentChartSelect.appendChild(opt);
      });
      studentChartSelect.value = prevVal;
    }

    const wholeClassBtn = document.getElementById('btn-view-whole-class-chart');
    const thptPercentEl = document.getElementById('teacher-stream-thpt-percent');
    const thptBarEl = document.getElementById('teacher-stream-thpt-bar');
    const vocPercentEl = document.getElementById('teacher-stream-vocational-percent');
    const vocBarEl = document.getElementById('teacher-stream-vocational-bar');
    const recEl = document.getElementById('teacher-pedagogy-recommendation');
    const heatmapTitleEl = document.getElementById('teacher-heatmap-title');

    // Kiểm tra xem có đang chọn 1 học sinh cụ thể để xem biểu đồ không
    const selectedStudent = this.selectedTeacherStudentCode
      ? classData.find(s => s.studentCode && s.studentCode.toUpperCase() === this.selectedTeacherStudentCode.toUpperCase())
      : null;

    if (selectedStudent) {
      // ===== CHẾ ĐỘ XEM BIỂU ĐỒ RIASEC CÁ NHÂN TỪNG HỌC SINH =====
      if (wholeClassBtn) wholeClassBtn.style.display = 'inline-flex';

      const hasSurvey = Boolean(selectedStudent.code && selectedStudent.code.trim().length > 0 && selectedStudent.code !== '---');
      let studentPercentages = selectedStudent.hollandPercentages;
      if (!studentPercentages && selectedStudent.hollandScores) {
        const scores = selectedStudent.hollandScores;
        const maxScore = Math.max(15, ...Object.values(scores));
        studentPercentages = {};
        ['R', 'I', 'A', 'S', 'E', 'C'].forEach(k => {
          studentPercentages[k] = Math.round(((scores[k] || 0) / maxScore) * 100);
        });
      }
      if (!studentPercentages) {
        studentPercentages = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
      }

      TeacherAnalytics.renderClassHeatmap(canvas, { percentages: studentPercentages }, {
        isIndividual: true,
        hasSurvey,
        student: selectedStudent
      });

      if (heatmapTitleEl) {
        if (hasSurvey) {
          heatmapTitleEl.innerHTML = sanitize(`📊 Biểu Đồ RIASEC Cá Nhân: <span style="color:var(--brand);">${selectedStudent.name || 'Học sinh'}</span> (${selectedStudent.studentCode} · Mã: <strong style="color:var(--brand);">${selectedStudent.code}</strong>)`);
        } else {
          heatmapTitleEl.innerHTML = sanitize(`📊 Biểu Đồ RIASEC Cá Nhân: <span style="color:var(--brand);">${selectedStudent.name || 'Học sinh'}</span> (${selectedStudent.studentCode} · Chưa làm bài)`);
        }
      }

      if (hasSurvey) {
        const streamStr = (selectedStudent.stream || '').toLowerCase();
        const isVoc = streamStr.includes('nghề') || streamStr.includes('cao đẳng') || streamStr.includes('trung cấp') || streamStr.includes('9+');
        const thptVal = isVoc ? 0 : 100;
        const vocVal = isVoc ? 100 : 0;

        if (thptPercentEl) thptPercentEl.textContent = `${thptVal}% (${selectedStudent.name})`;
        if (thptBarEl) thptBarEl.style.width = `${thptVal}%`;
        if (vocPercentEl) vocPercentEl.textContent = `${vocVal}% (${selectedStudent.name})`;
        if (vocBarEl) vocBarEl.style.width = `${vocVal}%`;

        if (recEl) {
          const stMajor = selectedStudent.major || (window.HollandEngine && window.EduPathData ? window.HollandEngine.matchMajors(selectedStudent.code, studentPercentages)[0].name : '');
          const m0 = (window.HollandEngine && window.HollandEngine.GROUP_METADATA && window.HollandEngine.GROUP_METADATA[selectedStudent.code[0]]) ? window.HollandEngine.GROUP_METADATA[selectedStudent.code[0]].shortName : selectedStudent.code[0];
          const m1 = (window.HollandEngine && window.HollandEngine.GROUP_METADATA && window.HollandEngine.GROUP_METADATA[selectedStudent.code[1]]) ? window.HollandEngine.GROUP_METADATA[selectedStudent.code[1]].shortName : selectedStudent.code[1];
          recEl.innerHTML = sanitize(`💡 <strong>Hồ sơ Hướng nghiệp Cá nhân (${selectedStudent.name || 'Học sinh'} - ${selectedStudent.studentCode}):</strong><br>• Mã Holland: <strong>${selectedStudent.code}</strong> · Ngành đề xuất: <strong>${stMajor}</strong><br>• Đề xuất phân luồng: <strong>${selectedStudent.stream || 'Học tiếp THPT & Đại học'}</strong>.<br>• Phân tích: Học sinh có điểm nổi bật ở nhóm <strong>${m0} (${studentPercentages[selectedStudent.code[0]] || 0}%)</strong> và <strong>${m1} (${studentPercentages[selectedStudent.code[1]] || 0}%)</strong>. Giáo viên nên định hướng em tập trung vào tổ hợp môn phù hợp với thế mạnh này.`);
        }
      } else {
        if (thptPercentEl) thptPercentEl.textContent = '0%';
        if (thptBarEl) thptBarEl.style.width = '0%';
        if (vocPercentEl) vocPercentEl.textContent = '0%';
        if (vocBarEl) vocBarEl.style.width = '0%';

        if (recEl) {
          recEl.innerHTML = sanitize(`💡 <strong>Chưa có dữ liệu khảo sát:</strong> Học sinh <strong>${selectedStudent.name || 'Học sinh'}</strong> (${selectedStudent.studentCode}) chưa hoàn thành bài trắc nghiệm Holland RIASEC. Giáo viên vui lòng hướng dẫn học sinh đăng nhập vào hệ thống để làm bài.`);
        }
      }
    } else {
      // ===== CHẾ ĐỘ XEM BIỂU ĐỒ RIASEC CẢ LỚP (TỔNG QUAN) =====
      if (wholeClassBtn) wholeClassBtn.style.display = 'none';

      const dist = TeacherAnalytics.computeDistribution(classData);
      TeacherAnalytics.renderClassHeatmap(canvas, dist);

    if (heatmapTitleEl) {
      if (assessedStudents.length > 0) {
        heatmapTitleEl.textContent = currentFilter 
          ? `📊 Bản Đồ Nhiệt RIASEC Cả Lớp (${currentFilter} · ${assessedStudents.length}/${totalStudents} em đã làm bài)` 
          : `📊 Bản Đồ Nhiệt RIASEC Toàn Bộ Hệ Thống (${assessedStudents.length}/${totalStudents} em đã làm bài)`;
      } else {
        heatmapTitleEl.textContent = currentFilter 
          ? `📊 Bản Đồ Nhiệt RIASEC Cả Lớp (${currentFilter} · 0 em đã làm bài)` 
          : `📊 Bản Đồ Nhiệt RIASEC Toàn Bộ Hệ Thống (0 em đã làm bài)`;
      }
    }

    if (totalStudents === 0) {
      if (thptPercentEl) thptPercentEl.textContent = '0% (0 học sinh)';
      if (thptBarEl) thptBarEl.style.width = '0%';
      if (vocPercentEl) vocPercentEl.textContent = '0% (0 học sinh)';
      if (vocBarEl) vocBarEl.style.width = '0%';
      if (recEl) {
        recEl.innerHTML = sanitize(`💡 <strong>Khuyến nghị Sư phạm:</strong> Chưa có dữ liệu học sinh trên hệ thống Firebase. Giáo viên hãy nhấn "➕ Thêm Học Sinh" để cấp tài khoản cho lớp.`);
      }
    } else {
      // Calculate ONLY from students who have completed assessment or have assigned stream
      const streamedStudents = classData.filter(s => Boolean(s.stream && s.stream.trim().length > 0));
      const totalStreamed = streamedStudents.length;

      if (totalStreamed === 0) {
        if (thptPercentEl) thptPercentEl.textContent = '0% (0 học sinh)';
        if (thptBarEl) thptBarEl.style.width = '0%';
        if (vocPercentEl) vocPercentEl.textContent = '0% (0 học sinh)';
        if (vocBarEl) vocBarEl.style.width = '0%';
        if (recEl) {
          recEl.innerHTML = sanitize(`💡 <strong>Khuyến nghị Sư phạm:</strong> Đã tạo ${totalStudents} tài khoản học sinh trên Firebase. Học sinh chưa thực hiện khảo sát Holland hoặc dự án Bài 5 nên chưa có dữ liệu phân luồng. Hãy hướng dẫn các em đăng nhập để làm bài.`);
        }
      } else {
        const vocationalCount = streamedStudents.filter(s => {
          const streamStr = (s.stream || '').toLowerCase();
          return streamStr.includes('nghề') || streamStr.includes('cao đẳng') || streamStr.includes('trung cấp') || streamStr.includes('9+');
        }).length;
        const thptCount = totalStreamed - vocationalCount;
        const thptPct = Math.round((thptCount / totalStreamed) * 100);
        const vocPct = 100 - thptPct;

        if (thptPercentEl) thptPercentEl.textContent = `${thptPct}% (${thptCount} học sinh)`;
        if (thptBarEl) thptBarEl.style.width = `${thptPct}%`;
        if (vocPercentEl) vocPercentEl.textContent = `${vocPct}% (${vocationalCount} học sinh)`;
        if (vocBarEl) vocBarEl.style.width = `${vocPct}%`;

        if (recEl) {
          const groupLabels = {
            R: 'Kỹ thuật thực hành (R)',
            I: 'Nghiên cứu & CNTT / KHTN (I)',
            A: 'Nghệ thuật & Thiết kế sáng tạo (A)',
            S: 'Xã hội, Sư phạm & Nhân văn (S)',
            E: 'Quản lý & Kinh doanh công nghệ (E)',
            C: 'Nghiệp vụ, Logistics & Quy trình (C)'
          };
          const dominantGroups = {};
          streamedStudents.forEach(st => {
            const c = (st.code || '').trim().toUpperCase();
            if (c.length > 0 && groupLabels[c[0]]) {
              dominantGroups[c[0]] = (dominantGroups[c[0]] || 0) + 1;
            }
          });
          const topPrimaryGroups = Object.keys(dominantGroups)
            .sort((a, b) => dominantGroups[b] - dominantGroups[a])
            .map(k => groupLabels[k])
            .slice(0, 2)
            .join(', ');

          const groupDesc = topPrimaryGroups ? `các khối ngành ${topPrimaryGroups}` : 'các khối ngành phù hợp với năng khiếu';

          if (vocationalCount > 0 && thptCount > 0) {
            recEl.innerHTML = sanitize(`💡 <strong>Khuyến nghị Sư phạm (Theo SGK Công nghệ 9):</strong> Trong số ${totalStreamed} em đã có kết quả: <strong>${thptPct}% học sinh (${thptCount} em)</strong> phù hợp <strong>học tiếp THPT</strong> để định hướng xét tuyển Đại học/Cao đẳng ${groupDesc}. <strong>${vocPct}% học sinh (${vocationalCount} em)</strong> có thiên hướng kỹ thuật thực hành (R) phù hợp mô hình <strong>Đào tạo Nghề 9+</strong> (Cao đẳng / Trung cấp nghề) để sớm có việc làm ổn định.`);
          } else if (vocationalCount > 0) {
            recEl.innerHTML = sanitize(`💡 <strong>Khuyến nghị Sư phạm (Theo SGK Công nghệ 9):</strong> 100% học sinh (${vocationalCount} em đã đánh giá) có thiên hướng kỹ thuật thực hành (R), khuyến nghị phân luồng vào <strong>Mô hình Đào tạo Nghề 9+</strong> (Trung cấp / Cao đẳng nghề kỹ thuật) để nhanh chóng phát triển kỹ năng thực tiễn.`);
          } else {
            recEl.innerHTML = sanitize(`💡 <strong>Khuyến nghị Sư phạm (Theo SGK Công nghệ 9):</strong> 100% học sinh (${thptCount} em đã đánh giá) phù hợp <strong>học tiếp THPT</strong> để định hướng xét tuyển Đại học / Cao đẳng ${groupDesc}. Nhà trường và GV nên tư vấn học sinh đăng ký tổ hợp môn THPT phù hợp.`);
          }
        }
      }
    }
    }

    const tbody = document.getElementById('teacher-student-table-body');
    if (tbody) {
      tbody.textContent = '';
      if (classData.length === 0) {
        const emptyTr = document.createElement('tr');
        emptyTr.innerHTML = sanitize(`
          <td colspan="10" style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted); font-size:0.9rem;">
            Chưa có học sinh nào trên Firebase. Hãy nhấn <strong>"➕ Thêm Học Sinh"</strong> để cấp tài khoản.
          </td>
        `);
        tbody.appendChild(emptyTr);
        return;
      }

      classData.forEach((st, idx) => {
        const studentCode = st.studentCode || `HS-${idx + 1}`;
        const hollandBadge = st.code ? `<span style="font-weight:800; color:var(--brand);">${st.code}</span>` : `<span style="color:var(--text-muted); font-size:0.75rem;">Chưa làm</span>`;
        let resolvedMajor = st.major;
        if (st.code && st.code !== '---' && window.HollandEngine && window.EduPathData && window.EduPathData.majors) {
          const recMajors = window.HollandEngine.matchMajors(st.code, st.hollandPercentages || {});
          if (recMajors && recMajors.length > 0 && !st.isUndifferentiated) {
            if (!resolvedMajor || resolvedMajor === 'Chưa chọn') {
              resolvedMajor = recMajors[0].name;
            } else {
              // Tự động kiểm tra và đồng bộ nếu st.major bị kẹt từ lần khảo sát cũ khác mã
              const curObj = window.EduPathData.majors.find(m => m.name === resolvedMajor);
              if (curObj && curObj.primaryType !== st.code[0]) {
                const fitScore = recMajors.find(m => m.name === resolvedMajor);
                if ((!fitScore || fitScore.fitPercentage < 35) && recMajors[0].fitPercentage >= 60) {
                  resolvedMajor = recMajors[0].name;
                }
              }
            }
          }
        }
        const majorText = resolvedMajor ? resolvedMajor : `<span style="color:var(--text-muted); font-style:italic;">Chưa chọn</span>`;
        const scoreText = typeof st.projectScore === 'number' ? `<strong>${st.projectScore}/10</strong>` : `<span style="color:var(--text-muted); font-size:0.75rem;">Chưa làm</span>`;
        const streamText = st.stream ? `<span style="background:var(--surface-elevated); padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem;">${st.stream}</span>` : `<span style="color:var(--text-muted); font-size:0.75rem;">Chưa có</span>`;

        const isSelected = this.selectedTeacherStudentCode && (this.selectedTeacherStudentCode.toUpperCase() === studentCode.toUpperCase());
        const tr = document.createElement('tr');
        if (isSelected) {
          tr.className = 'selected-student-row';
        }
        tr.style.cursor = 'pointer';
        tr.title = 'Click để xem biểu đồ RIASEC của riêng học sinh này';

        tr.innerHTML = sanitize(`
          <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
          <td style="text-align:center;"><code style="font-weight:700; color:var(--brand); background:var(--surface-elevated); padding:0.15rem 0.35rem; border-radius:4px; font-size:0.75rem;">${studentCode}</code></td>
          <td>${st.school || 'Trường THCS'}</td>
          <td style="text-align:center;"><span style="font-weight:700; background:var(--surface-elevated); padding:0.2rem 0.4rem; border-radius:4px; font-size:0.78rem;">${st.grade || '9A1'}</span></td>
          <td><strong>${st.name || 'Học sinh'}</strong></td>
          <td style="text-align:center;">${hollandBadge}</td>
          <td>${majorText}</td>
          <td style="text-align:center;">${scoreText}</td>
          <td>${streamText}</td>
          <td style="text-align:center; white-space:nowrap;">
            <button type="button" class="btn-table-action btn-table-chart" data-code="${studentCode}" title="Xem biểu đồ của riêng học sinh này">📊 Biểu đồ</button>
            <button type="button" class="btn-table-action btn-table-edit" data-code="${studentCode}">Sửa</button>
            <button type="button" class="btn-table-action btn-table-delete" data-code="${studentCode}">Xóa</button>
          </td>
        `);
        tbody.appendChild(tr);

        // Click cả hàng để xem biểu đồ học sinh
        tr.addEventListener('click', (e) => {
          if (e.target.closest('button')) return; // Bỏ qua nếu bấm nút con
          this.selectedTeacherStudentCode = (this.selectedTeacherStudentCode === studentCode) ? null : studentCode;
          this.renderTeacherHeatmap();
          this.playBeep(650, 'sine', 0.08);
        });
      });

      // Bind button xem biểu đồ
      tbody.querySelectorAll('.btn-table-chart').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const code = e.currentTarget.getAttribute('data-code');
          this.selectedTeacherStudentCode = (this.selectedTeacherStudentCode === code) ? null : code;
          this.renderTeacherHeatmap();
          this.playBeep(720, 'triangle', 0.12);
        });
      });

      // Bind edit & delete buttons
      tbody.querySelectorAll('.btn-table-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const code = e.currentTarget.getAttribute('data-code');
          this.openEditStudentModal(code);
        });
      });

      tbody.querySelectorAll('.btn-table-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const code = e.currentTarget.getAttribute('data-code');
          this.confirmDeleteStudent(code);
        });
      });
    }
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.app = new EduPathApp();
  window.EduPath = window.app;
});
