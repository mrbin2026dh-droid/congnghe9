/**
 * EduPath AI - Teacher Analytics & Classroom Heatmap Dashboard
 * Provides whole-class RIASEC distribution, streaming suggestions & CSV gradebook export.
 */
'use strict';

const TeacherAnalytics = (() => {
  // Sample realistic class roster for demo classroom 9A1
  const DEFAULT_CLASS_DATA = [
    { id: 1, name: 'Nguyễn Văn An', code: 'RIE', major: 'Kỹ thuật Cơ điện tử', projectScore: 9, stream: 'THPT & Đại học Kỹ thuật' },
    { id: 2, name: 'Trần Thị Bích', code: 'AIR', major: 'Thiết kế Đồ họa & UI/UX', projectScore: 8, stream: 'THPT & ĐH Mỹ thuật' },
    { id: 3, name: 'Lê Hoàng Cường', code: 'RCI', major: 'Cơ khí Chế tạo máy (9+)', projectScore: 8, stream: 'Cao đẳng Nghề 9+' },
    { id: 4, name: 'Phạm Đức Dũng', code: 'IRC', major: 'Công nghệ thông tin', projectScore: 10, stream: 'THPT & Đại học CNTT' },
    { id: 5, name: 'Vũ Ngọc Hân', code: 'SEC', major: 'Sư phạm Kỹ thuật', projectScore: 7, stream: 'THPT & Đại học Sư phạm' },
    { id: 6, name: 'Đặng Minh Khôi', code: 'RCS', major: 'Điện dân dụng (9+)', projectScore: 9, stream: 'Trung cấp Nghề 9+' },
    { id: 7, name: 'Bùi Phương Linh', code: 'EIR', major: 'Quản lý Sản phẩm Tech', projectScore: 8, stream: 'THPT & Đại học Kinh tế Tech' },
    { id: 8, name: 'Hoàng Anh Tuấn', code: 'REC', major: 'Công nghệ Ô tô & Xe điện', projectScore: 9, stream: 'Cao đẳng Nghề 9+' },
    { id: 9, name: 'Đỗ Thanh Tùng', code: 'ICR', major: 'An toàn thông tin', projectScore: 8, stream: 'THPT & Đại học Bách Khoa' },
    { id: 10, name: 'Ngô Bảo Yến', code: 'RAI', major: 'Kiến trúc & Xây dựng', projectScore: 9, stream: 'THPT & Đại học Kiến trúc' }
  ];

  /**
   * Tính toán phân bố RIASEC cả lớp
   */
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
  function exportClassCSV(classList, className = '9A1') {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'STT,Họ và tên,Mã Holland,Ngành nghề phù hợp,Điểm Dự án Bài 5,Định hướng phân luồng\n';

    classList.forEach((st, idx) => {
      csvContent += `${idx + 1},"${st.name}","${st.code}","${st.major}",${st.projectScore},"${st.stream}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Ket_Qua_Huong_Nghiep_Lop_${className}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return {
    DEFAULT_CLASS_DATA,
    computeDistribution,
    renderClassHeatmap,
    exportClassCSV
  };
})();

window.TeacherAnalytics = TeacherAnalytics;
