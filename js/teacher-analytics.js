/**
 * EduPath AI - Teacher Analytics & Classroom Heatmap Dashboard
 * Provides whole-class RIASEC distribution, streaming suggestions & CSV gradebook export.
 */
'use strict';

const TeacherAnalytics = (() => {
  // Sample realistic class roster for demo classroom 9A1
  const DEFAULT_CLASS_DATA = [
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

  const currentClassData = [...DEFAULT_CLASS_DATA];

  function addStudentToRoster(studentObj) {
    const list = (window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || currentClassData;
    const nextId = list.length > 0 ? Math.max(...list.map(s => s.id || 0)) + 1 : 1;
    const grade = studentObj.grade || '9A1';
    const newStudent = {
      id: nextId,
      studentCode: studentObj.studentCode || `${grade}-${String(nextId).padStart(2, '0')}`,
      school: studentObj.school || 'THCS Chu Văn An',
      grade: grade,
      name: studentObj.name || 'Học sinh',
      code: studentObj.code || 'RIE',
      major: studentObj.major || 'Kỹ thuật Cơ điện tử',
      projectScore: typeof studentObj.projectScore === 'number' ? studentObj.projectScore : 8,
      classification: studentObj.classification || 'Phù hợp hoàn toàn',
      stream: studentObj.stream || 'Học tiếp THPT & Đại học'
    };
    list.push(newStudent);
    if (window.EduPathFirebase) {
      window.EduPathFirebase.addStudent(newStudent);
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
    const total = classList.length || 1;

    classList.forEach(student => {
      const primary = (student.code && student.code[0]) || 'R';
      if (counts[primary] !== undefined) {
        counts[primary] += 1;
      }
    });

    const percentages = {};
    for (const key in counts) {
      percentages[key] = Math.round((counts[key] / total) * 100);
    }

    return { counts, percentages, total };
  }

  /**
   * Vẽ biểu đồ thanh phân bố RIASEC cả lớp lên Canvas
   */
  function renderClassHeatmap(canvas, distribution) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.parentElement.clientWidth;
    const h = 260;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);

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
    const maxBarHeight = 160;

    keys.forEach((key, idx) => {
      const pct = distribution.percentages[key] || 0;
      const barH = Math.max(8, (pct / 100) * maxBarHeight);
      const x = 30 + idx * (barWidth + spacing);
      const y = h - 50 - barH;

      // Bar
      ctx.fillStyle = colors[key];
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [6, 6, 0, 0]);
      ctx.fill();

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
