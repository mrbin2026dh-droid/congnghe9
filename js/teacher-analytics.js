/**
 * EduPath AI - Teacher Analytics & Classroom Heatmap Dashboard
 * Provides whole-class RIASEC distribution, streaming suggestions & CSV gradebook export.
 */
'use strict';

const TeacherAnalytics = (() => {
  // Sample realistic class roster for demo classroom 9A1
  const DEFAULT_CLASS_DATA = [];
  const currentClassData = [];

  function addStudentToRoster(studentObj) {
    const list = (window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || currentClassData;
    const nextId = list.length > 0 ? Math.max(...list.map(s => s.id || 0)) + 1 : 1;
    const grade = studentObj.grade || '9A1';
    const newStudent = {
      id: nextId,
      studentCode: studentObj.studentCode || `${grade}-${String(nextId).padStart(2, '0')}`,
      school: studentObj.school || '',
      grade: grade,
      name: studentObj.name || '',
      code: studentObj.code || '',
      major: studentObj.major || '',
      projectScore: typeof studentObj.projectScore === 'number' ? studentObj.projectScore : null,
      classification: studentObj.classification || '',
      stream: studentObj.stream || ''
    };
    const existingIdx = list.findIndex(s => s.studentCode === newStudent.studentCode);
    if (existingIdx >= 0) {
      list[existingIdx] = newStudent;
    } else {
      list.push(newStudent);
    }
    return list;
  }

  function deleteStudentFromRoster(studentCode) {
    const list = (window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || currentClassData;
    if (!studentCode) return list;
    const clean = studentCode.toUpperCase().trim();
    const idx = list.findIndex(s => (s.studentCode && s.studentCode.toUpperCase() === clean) || (s.id && `${s.grade || '9A1'}-${String(s.id).padStart(2, '0')}` === clean));
    if (idx >= 0) {
      list.splice(idx, 1);
    }
    return list;
  }

  function generateCSVContent(classList, className = '9A1') {
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csv += 'STT,Trường THCS,Lớp,Họ và tên,Mã Holland,Ngành nghề phù hợp,Điểm Bài 5,Xếp loại SGK,Định hướng phân luồng\n';

    classList.forEach((st, idx) => {
      const school = (st.school || 'THCS Chu Văn An').replace(/"/g, '""');
      const grade = (st.grade || className).replace(/"/g, '""');
      const name = (st.name || '').replace(/"/g, '""');
      const code = (st.code || '').replace(/"/g, '""');
      const major = (st.major || '').replace(/"/g, '""');
      const classification = (st.classification || 'Phù hợp').replace(/"/g, '""');
      const stream = (st.stream || '').replace(/"/g, '""');
      csv += `${idx + 1},"${school}","${grade}","${name}","${code}","${major}",${st.projectScore},"${classification}","${stream}"\n`;
    });

    return csv;
  }

  function exportClassCSV(classList, className = '9A1') {
    const csvContent = generateCSVContent(classList, className);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bao_Cao_Huong_Nghiep_${className}_EduPath.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  function computeDistribution(classList) {
    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    // Only count students who have taken Holland quiz (code is not empty)
    const validStudents = (classList || []).filter(s => Boolean(s.code && s.code.trim().length > 0));
    const total = validStudents.length;

    if (total > 0) {
      validStudents.forEach(student => {
        const primary = student.code[0].toUpperCase();
        if (counts[primary] !== undefined) {
          counts[primary] += 1;
        }
      });
    }

    const percentages = {};
    for (const key in counts) {
      percentages[key] = total > 0 ? Math.round((counts[key] / total) * 100) : 0;
    }

    return { counts, percentages, total };
  }

  /**
   * Vẽ biểu đồ thanh phân bố RIASEC cả lớp hoặc chi tiết từng học sinh lên Canvas
   * @param {HTMLCanvasElement} canvas
   * @param {Object} distribution - { percentages: { R, I, A, S, E, C } }
   * @param {Object} [options] - { isIndividual: boolean, hasSurvey: boolean, student: Object }
   */
  function renderClassHeatmap(canvas, distribution, options = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const parentW = canvas.parentElement ? canvas.parentElement.clientWidth : 0;
    const w = parentW > 50 ? parentW : 420;
    const h = 260;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

    const isIndividual = Boolean(options && options.isIndividual);
    const hasSurvey = (options && options.hasSurvey !== undefined) ? options.hasSurvey : true;

    // Trường hợp học sinh chưa làm bài khảo sát
    if (isIndividual && !hasSurvey) {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Học sinh này chưa hoàn thành bài khảo sát Holland RIASEC', w * 0.5, h * 0.45);
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('Vui lòng hướng dẫn em đăng nhập tài khoản để thực hiện bài trắc nghiệm.', w * 0.5, h * 0.45 + 24);
      return;
    }

    const keys = ['R', 'I', 'A', 'S', 'E', 'C'];
    const colors = {
      R: '#2563eb',
      I: '#0891b2',
      A: '#d946ef',
      S: '#10b981',
      E: '#f59e0b',
      C: '#64748b'
    };
    const labels = {
      R: 'Kỹ thuật',
      I: 'Nghiên cứu',
      A: 'Nghệ thuật',
      S: 'Xã hội',
      E: 'Quản lý',
      C: 'Nghiệp vụ'
    };

    const barWidth = Math.min(50, (w - 80) / 6);
    const spacing = (w - 60 - barWidth * 6) / 5;
    const maxBarHeight = 150;

    const studentCodeStr = (options && options.student && options.student.code) ? options.student.code.toUpperCase() : '';

    keys.forEach((key, idx) => {
      const pct = (distribution.percentages && typeof distribution.percentages[key] === 'number') ? distribution.percentages[key] : 0;
      const barH = Math.max(8, (pct / 100) * maxBarHeight);
      const x = 30 + idx * (barWidth + spacing);
      const y = h - 50 - barH;

      // Bar
      ctx.fillStyle = colors[key];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Nếu đang xem cá nhân học sinh, đánh dấu Top 1, Top 2, Top 3
      if (isIndividual && studentCodeStr.includes(key)) {
        const rankIdx = studentCodeStr.indexOf(key);
        if (rankIdx >= 0 && rankIdx < 3) {
          ctx.strokeStyle = colors[key];
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Huy hiệu Top thứ bậc
          ctx.font = 'bold 10px sans-serif';
          ctx.fillStyle = colors[key];
          ctx.textAlign = 'center';
          ctx.fillText('Top ' + (rankIdx + 1), x + barWidth * 0.5, y - 24);
        }
      }

      // Percentage label on top of bar
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(pct + '%', x + barWidth * 0.5, y - 8);

      // Key letter
      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = colors[key];
      ctx.fillText(key, x + barWidth * 0.5, h - 30);

      // Sub-label
      ctx.font = '10px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(labels[key], x + barWidth * 0.5, h - 14);
    });
  }

  /**
   * Xuất danh sách học sinh ra file CSV để nhập điểm vào Smas/VnEdu
   */
  return {
    DEFAULT_CLASS_DATA,
    currentClassData,
    addStudentToRoster,
    deleteStudentFromRoster,
    generateCSVContent,
    computeDistribution,
    renderClassHeatmap,
    exportClassCSV
  };
})();

window.TeacherAnalytics = TeacherAnalytics;
