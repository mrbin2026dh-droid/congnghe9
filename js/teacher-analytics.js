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
    const grade = studentObj.grade || (studentObj.studentCode && studentObj.studentCode.includes('-') ? studentObj.studentCode.split('-')[0].trim() : 'Chưa phân lớp');
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
    const idx = list.findIndex(s => (s.studentCode && s.studentCode.toUpperCase() === clean) || (s.id && `${s.grade || 'HS'}-${String(s.id).padStart(2, '0')}` === clean));
    if (idx >= 0) {
      list.splice(idx, 1);
    }
    return list;
  }

  function generateCSVContent(classList, className = '') {
    let csv = '\uFEFF'; // UTF-8 BOM for Microsoft Excel
    csv += 'STT,Trường THCS,Lớp,Họ và tên,Mã Holland,Ngành nghề phù hợp,Điểm Bài 5,Xếp loại SGK,Định hướng phân luồng\n';

    classList.forEach((st, idx) => {
      const school = (st.school || 'Trường THCS').replace(/"/g, '""');
      const grade = (st.grade || className || '---').replace(/"/g, '""');
      const name = (st.name || '').replace(/"/g, '""');
      const code = (st.code || '').replace(/"/g, '""');
      const major = (st.major || '').replace(/"/g, '""');
      const classification = (st.classification || 'Phù hợp').replace(/"/g, '""');
      const stream = (st.stream || '').replace(/"/g, '""');
      csv += `${idx + 1},"${school}","${grade}","${name}","${code}","${major}",${st.projectScore},"${classification}","${stream}"\n`;
    });

    return csv;
  }

  function exportClassCSV(classList, className = '') {
    const csvContent = generateCSVContent(classList, className);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileSuffix = className ? className.replace(/\s+/g, '_') : 'Toan_Truong';
    link.download = `Bao_Cao_Huong_Nghiep_${fileSuffix}_EduPath.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Tải file mẫu Excel danh sách học sinh (.xlsx hoặc .csv)
   */
  function downloadExcelTemplate() {
    const headers = ['STT', 'Mã học sinh', 'Họ và tên', 'Lớp', 'Trường THCS'];
    const sampleRows = [
      [1, '9A-01', 'Nguyễn Văn An', '9A', 'THCS Chu Văn An'],
      [2, '9A-02', 'Trần Thị Bích', '9A', 'THCS Chu Văn An'],
      [3, '9B-01', 'Lê Hoàng Long', '9B', 'THCS Chu Văn An'],
      [4, '9B-02', 'Phạm Minh Đức', '9B', 'THCS Chu Văn An'],
      [5, '9C-01', 'Võ Thị Mai', '9C', 'THCS Chu Văn An']
    ];

    if (typeof window.XLSX !== 'undefined') {
      const aoa = [headers, ...sampleRows];
      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [
        { wch: 8 },
        { wch: 16 },
        { wch: 26 },
        { wch: 12 },
        { wch: 28 }
      ];
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'DanhSachHocSinh');
      window.XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_EduPath.xlsx');
    } else {
      let csv = '\uFEFF' + headers.join(',') + '\n';
      sampleRows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Mau_Danh_Sach_Hoc_Sinh_EduPath.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Đọc và trích xuất danh sách học sinh từ raw rows
   * @param {Array<Array>} rows
   */
  function extractStudentsFromRows(rows) {
    if (!rows || rows.length < 2) {
      throw new Error('Tệp không chứa đủ dữ liệu (Cần có ít nhất 1 dòng tiêu đề và 1 dòng thông tin học sinh).');
    }

    let headerIdx = -1;
    let colMap = { code: -1, name: -1, grade: -1, school: -1 };

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map(cell => String(cell || '').trim().toLowerCase());
      const codeIdx = row.findIndex(c => c.includes('mã') || c.includes('code') || c === 'mahs' || c.includes('ma ') || c === 'id');
      const nameIdx = row.findIndex((c, idx) => idx !== codeIdx && (c.includes('tên') || c.includes('ten') || c.includes('họ tên') || c.includes('họ và tên') || c.includes('ho va ten') || c.startsWith('họ ') || c.startsWith('ho ') || c === 'họ' || c === 'ho' || c.includes('name')));
      const gradeIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== nameIdx && (c.includes('lớp') || c.includes('lop') || c.includes('grade') || c.includes('class')));
      const schoolIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== nameIdx && idx !== gradeIdx && (c.includes('trường') || c.includes('truong') || c.includes('school')));

      if (codeIdx !== -1 && nameIdx !== -1) {
        headerIdx = r;
        colMap = { code: codeIdx, name: nameIdx, grade: gradeIdx, school: schoolIdx };
        break;
      }
    }

    if (headerIdx === -1) {
      // Giả định thứ tự mặc định nếu không khớp từ khóa
      headerIdx = 0;
      colMap = { code: 1, name: 2, grade: 3, school: 4 };
    }

    const students = [];
    const startRow = headerIdx + 1;
    const forbiddenChars = /[.#$[\]/]/;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let studentCode = colMap.code >= 0 && row[colMap.code] !== undefined ? String(row[colMap.code]).trim() : '';
      let name = colMap.name >= 0 && row[colMap.name] !== undefined ? String(row[colMap.name]).trim() : '';
      let grade = colMap.grade >= 0 && row[colMap.grade] !== undefined ? String(row[colMap.grade]).trim() : '';
      let school = colMap.school >= 0 && row[colMap.school] !== undefined ? String(row[colMap.school]).trim() : '';

      if (!studentCode && !name) continue;

      if (!grade) {
        if (studentCode && studentCode.includes('-')) {
          grade = studentCode.split('-')[0].trim().toUpperCase();
        } else {
          grade = 'Chưa phân lớp';
        }
      }
      if (!school) school = 'Trường THCS';

      if (!studentCode && name) {
        const padNum = String(students.length + 1).padStart(2, '0');
        studentCode = `${grade}-${padNum}`;
      }

      studentCode = studentCode.toUpperCase().replace(/\s+/g, '-');
      if (forbiddenChars.test(studentCode)) {
        studentCode = studentCode.replace(/[.#$[\]/]/g, '-');
      }

      students.push({
        studentCode,
        name,
        grade,
        school,
        code: '',
        major: '',
        projectScore: null,
        classification: '',
        stream: '',
        createdAt: new Date().toISOString()
      });
    }

    if (students.length === 0) {
      throw new Error('Không tìm thấy bản ghi học sinh hợp lệ nào trong tệp.');
    }

    return students;
  }

  /**
   * Bộ giải mã CSV độc lập (thuần JavaScript) khi không có thư viện bên ngoài
   */
  function parseCSVText(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    return lines.map(line => {
      const row = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i += 1;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      row.push(current.trim());
      return row;
    });
  }

  /**
   * Đọc tệp Excel hoặc CSV được tải lên từ máy tính
   * @param {File} file
   * @returns {Promise<Array>}
   */
  function parseExcelFile(file) {
    return new Promise((resolve, reject) => {
      if (!file) return reject(new Error('Chưa chọn tệp tin.'));

      const fileName = file.name.toLowerCase();
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCsv = fileName.endsWith('.csv') || fileName.endsWith('.txt');

      if (!isExcel && !isCsv) {
        return reject(new Error('Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp .xlsx, .xls hoặc .csv'));
      }

      if (isExcel && typeof window.XLSX !== 'undefined') {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const rawRows = window.XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false });
            const students = extractStudentsFromRows(rawRows);
            resolve(students);
          } catch (err) {
            reject(new Error('Lỗi khi đọc file Excel: ' + (err.message || 'Tệp không hợp lệ.')));
          }
        };
        reader.onerror = () => reject(new Error('Không thể đọc tệp từ thiết bị.'));
        reader.readAsArrayBuffer(file);
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const rawRows = parseCSVText(text);
            resolve(extractStudentsFromRows(rawRows));
          } catch (err) {
            reject(new Error('Lỗi khi đọc file CSV: ' + (err.message || 'Tệp không hợp lệ.')));
          }
        };
        reader.onerror = () => reject(new Error('Không thể đọc tệp từ thiết bị.'));
        reader.readAsText(file, 'utf-8');
      }
    });
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
    exportClassCSV,
    downloadExcelTemplate,
    parseExcelFile,
    extractStudentsFromRows,
    parseCSVText
  };
})();

window.TeacherAnalytics = TeacherAnalytics;
