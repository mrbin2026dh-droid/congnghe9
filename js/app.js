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

    this.studentProfile = {
      name: 'Nguyễn Văn An',
      school: 'THCS Chu Văn An',
      grade: '9A1',
      academicYear: '2025 – 2026',
      code: 'RIE',
      scores: { R: 42, I: 38, A: 25, S: 22, E: 35, C: 28 },
      percentages: { R: 84, I: 76, A: 50, S: 44, E: 70, C: 56 },
      targetMajorId: 'co-dien-tu',
      selfTraits: {},
      threeQuestions: {
        understandSelf: '',
        understandCareer: '',
        careerPathPlan: ''
      }
    };

    // Assessment matches (10 items boolean)
    this.assessmentMatches = [true, true, true, true, false, true, true, true, true, true];

    this.treeAnimator = null;
    this.audioCtx = null;

    this.loadProfileFromStorage();
    this.init();
  }

  init() {
    this.initAudio();
    this.initDOM();
    this.initTreeAnimator();
    this.initQuiz();
    this.initAIAgents();
    this.initProjectAssessment();
    this.initTeacherDashboard();
    this.bindEvents();
    this.switchTab('tree');
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
    } catch (e) {
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

  loadProfileFromStorage() {
    try {
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
      localStorage.setItem('edupath_student_profile', JSON.stringify(this.studentProfile));
      localStorage.setItem('edupath_assessment_matches', JSON.stringify(this.assessmentMatches));
    } catch (e) {
      console.warn('Lỗi khi lưu hồ sơ vào localStorage:', e);
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
      this.updateTreeMetricsDisplay();
    }
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

    this.quizAnswers = new Array(this.quizQuestions.length).fill(null);
    this.renderQuestionPalette();
    this.renderCurrentQuestion();

    // Retake button
    const retakeBtn = document.getElementById('btn-retake-quiz');
    if (retakeBtn) {
      retakeBtn.onclick = () => this.retakeQuiz();
    }
  }

  retakeQuiz() {
    this.currentQuestionIdx = 0;
    this.quizAnswers = new Array(this.quizQuestions.length).fill(null);
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
    const filledAnswers = this.quizAnswers.map(a => (a === null ? 3 : a));
    const results = HollandEngine.calculateScores(filledAnswers, this.quizQuestions);

    this.studentProfile.code = results.code;
    this.studentProfile.scores = results.rawScores;
    this.studentProfile.percentages = results.percentages;
    this.saveProfileToStorage();

    const activeCard = document.getElementById('quiz-active-card');
    if (activeCard) activeCard.style.display = 'none';

    const resultBox = document.getElementById('quiz-result-card');
    if (resultBox) resultBox.style.display = 'block';

    const codeEl = document.getElementById('result-holland-code');
    if (codeEl) codeEl.textContent = results.code;

    // Render Detailed 6-Category RIASEC Breakdown
    this.renderRIASECBreakdown(results);

    // Render In-Depth Personality Insights & Conflict
    this.renderPersonalityInsights(results);

    // Recommended Majors
    const matchedMajors = HollandEngine.matchMajors(results.code, results.percentages);
    const majorsContainer = document.getElementById('quiz-matched-majors-grid');
    if (majorsContainer) {
      const sanitize = window.sanitize;
      majorsContainer.textContent = '';
      matchedMajors.slice(0, 6).forEach(m => {
        const div = document.createElement('div');
        div.className = 'card-panel';
        div.style.padding = '1rem';
        div.innerHTML = sanitize(`
          <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:0.5rem; gap:0.5rem;">
            <span style="font-weight:700; color:var(--text-primary); font-size:1.05rem; line-height:1.3;">${m.name}</span>
            <span style="background:var(--brand-soft); color:var(--brand); font-weight:800; padding:0.25rem 0.55rem; border-radius:4px; font-size:0.85rem; white-space:nowrap; flex-shrink:0;">${m.fitPercentage}% Hợp</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.75rem; line-height:1.45;">${m.description}</p>
          <div style="display:flex; flex-wrap:wrap; gap:0.5rem; font-size:0.78rem; color:var(--text-muted); margin-bottom:0.75rem;">
            <span class="badge-pill">🏷️ Hệ: <strong style="color:var(--text-primary); margin-left:0.2rem;">${m.level}</strong></span>
            <span class="badge-pill">💰 Lương: <strong style="color:var(--text-primary); margin-left:0.2rem;">${m.avgSalary}</strong></span>
          </div>
          <button class="btn-primary" style="margin-top:auto; width:100%; font-size:0.85rem; min-height:42px; white-space:nowrap;" onclick="window.app.selectMajorForProject('${m.id}')">
            Chọn Ngành Này Cho Bài 5 ➔
          </button>
        `);
        majorsContainer.appendChild(div);
      });
    }

    // Synchronize Tree roots with real test scores
    if (this.treeAnimator) {
      this.treeAnimator.updateState({
        rootInterest: results.percentages[results.code[0]] || 80,
        rootAbility: results.percentages[results.code[1]] || 70,
        rootPersonality: results.percentages[results.code[2]] || 75
      });
      this.updateTreeMetricsDisplay();
    }

    this.playBeep(880, 'triangle', 0.25);
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
    this.switchTab('project');
    this.renderAssessmentView();
    this.playBeep(680);
  }

  // --- AI AGENTS MODULE ---
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
        this.activeAgentId = agent.id;
        document.querySelectorAll('.agent-card-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.renderAgentChat();
        this.playBeep(580);
      });
      selector.appendChild(pill);
    });

    this.renderAgentChat();

    // Send button & Input
    const sendBtn = document.getElementById('chat-send-btn');
    const inputEl = document.getElementById('chat-input-text');
    if (sendBtn && inputEl) {
      const doSend = () => {
        const text = inputEl.value.trim();
        if (text) {
          this.handleSendMessage(text);
          inputEl.value = '';
        }
      };
      sendBtn.addEventListener('click', doSend);
      inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') doSend();
      });
    }
  }

  renderAgentChat() {
    const agent = AIAgentsManager.AGENTS.find(a => a.id === this.activeAgentId);
    if (!agent) return;
    const sanitize = window.sanitize;

    const chatBox = document.getElementById('chat-messages-scroll');
    if (chatBox) {
      chatBox.innerHTML = sanitize(`
        <div class="chat-bubble agent">
          <strong>${agent.avatar} ${agent.name}:</strong><br>
          ${agent.greeting}
        </div>
      `);
    }

    const promptsRow = document.getElementById('quick-prompts-row');
    if (promptsRow) {
      promptsRow.textContent = '';
      agent.presetPrompts.forEach(p => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'prompt-pill';
        btn.textContent = p;
        btn.addEventListener('click', () => this.handleSendMessage(p));
        promptsRow.appendChild(btn);
      });
    }
  }

  handleSendMessage(msgText) {
    const chatBox = document.getElementById('chat-messages-scroll');
    if (!chatBox) return;
    const sanitize = window.sanitize;

    const userDiv = document.createElement('div');
    userDiv.className = 'chat-bubble user';
    userDiv.textContent = msgText;
    chatBox.appendChild(userDiv);

    const agent = AIAgentsManager.AGENTS.find(a => a.id === this.activeAgentId);
    const response = AIAgentsManager.generateAgentResponse(this.activeAgentId, msgText, this.studentProfile);

    setTimeout(() => {
      const agentDiv = document.createElement('div');
      agentDiv.className = 'chat-bubble agent';
      agentDiv.innerHTML = sanitize(`<strong>${agent.avatar} ${agent.name}:</strong><br>${response.replace(/\n/g, '<br>')}`);
      chatBox.appendChild(agentDiv);
      chatBox.scrollTop = chatBox.scrollHeight;
      this.playBeep(720);
    }, 400);

    chatBox.scrollTop = chatBox.scrollHeight;
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
  }

  addCurrentStudentToTeacherRoster() {
    const targetMajor = window.EduPathData.majors.find(m => m.id === this.studentProfile.targetMajorId) || window.EduPathData.majors[0];
    const result = ProjectAssessment.calculateProjectResult(this.assessmentMatches);
    const isVocational = (this.studentProfile.code && this.studentProfile.code.startsWith('R')) || targetMajor.level.includes('9+');
    const stream = isVocational ? 'Cao đẳng / Trung cấp Nghề 9+' : 'Học tiếp THPT & Đại học';

    TeacherAnalytics.addStudentToRoster({
      school: this.studentProfile.school || 'THCS Chu Văn An',
      grade: this.studentProfile.grade || '9A1',
      name: this.studentProfile.name || 'Học sinh mới',
      code: this.studentProfile.code || 'RIE',
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

    const classData = TeacherAnalytics.currentClassData || TeacherAnalytics.DEFAULT_CLASS_DATA;
    const dist = TeacherAnalytics.computeDistribution(classData);
    TeacherAnalytics.renderClassHeatmap(canvas, dist);

    const tbody = document.getElementById('teacher-student-table-body');
    if (tbody) {
      tbody.textContent = '';
      classData.forEach((st, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = sanitize(`
          <td style="text-align:center; font-weight:bold;">${idx + 1}</td>
          <td>${st.school || 'THCS Chu Văn An'}</td>
          <td style="text-align:center;"><span style="font-weight:700; background:var(--surface-elevated); padding:0.2rem 0.4rem; border-radius:4px; font-size:0.78rem;">${st.grade || '9A1'}</span></td>
          <td><strong>${st.name}</strong></td>
          <td style="text-align:center;"><span style="font-weight:800; color:var(--brand);">${st.code}</span></td>
          <td>${st.major}</td>
          <td style="text-align:center;"><strong>${st.projectScore}/10</strong></td>
          <td><span style="background:var(--surface-elevated); padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem;">${st.stream}</span></td>
        `);
        tbody.appendChild(tr);
      });
    }
  }
}

// Bootstrap
window.addEventListener('DOMContentLoaded', () => {
  window.app = new EduPathApp();
});
