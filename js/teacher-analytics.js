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
      const existing = list[existingIdx] || {};
      const validName = (newStudent.name && newStudent.name.trim() !== '' && newStudent.name.toUpperCase() !== newStudent.studentCode)
        ? newStudent.name
        : (existing.name && existing.name.toUpperCase() !== newStudent.studentCode ? existing.name : (newStudent.name || ''));
      list[existingIdx] = {
        ...existing,
        ...newStudent,
        id: existing.id || nextId,
        name: validName,
        grade: newStudent.grade || existing.grade || '',
        school: newStudent.school || existing.school || '',
        code: (newStudent.code && newStudent.code.trim().length > 0) ? newStudent.code : (existing.code || ''),
        major: (newStudent.major && newStudent.major.trim().length > 0) ? newStudent.major : (existing.major || ''),
        projectScore: typeof newStudent.projectScore === 'number' ? newStudent.projectScore : existing.projectScore,
        classification: newStudent.classification || existing.classification || '',
        stream: newStudent.stream || existing.stream || ''
      };
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
    link.download = `Bao_Cao_Huong_Nghiep_${fileSuffix}_TeenVoca.csv`;
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
      window.XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh_TeenVoca.xlsx');
    } else {
      let csv = '\uFEFF' + headers.join(',') + '\n';
      sampleRows.forEach(row => {
        csv += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Mau_Danh_Sach_Hoc_Sinh_TeenVoca.csv';
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
    let colMap = { code: -1, name: -1, ho: -1, ten: -1, grade: -1, school: -1 };

    function normalizeHeader(str) {
      return String(str || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
    }

    for (let r = 0; r < Math.min(rows.length, 10); r++) {
      const row = rows[r].map(normalizeHeader);
      const codeIdx = row.findIndex(c => c !== 'stt' && (c.includes('ma hoc sinh') || c.includes('ma hs') || c.includes('mahs') || c.includes('code') || c === 'id' || (c.includes('ma') && !c.includes('ten'))));
      
      // Nhận diện tách 2 cột Họ và đệm / Tên (chuẩn xuất Excel trường học VnEdu, SMAS, CSDL Ngành)
      const hoIdx = row.findIndex((c, idx) => idx !== codeIdx && (c.includes('ho dem') || c.includes('ho va dem') || c.includes('ho lot') || c.includes('ho va ten dem') || c === 'ho'));
      const tenIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== hoIdx && (c === 'ten' || c.includes('ten goi') || c === 'ten hs' || c === 'ten hoc sinh'));
      
      // Nhận diện cột Họ và tên gộp
      const nameIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== hoIdx && idx !== tenIdx && (c.includes('ho va ten') || c.includes('ho ten') || c.includes('fullname') || (c.includes('ten') && !c.includes('ma'))));
      
      const gradeIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== nameIdx && idx !== hoIdx && idx !== tenIdx && (c.includes('lop') || c.includes('grade') || c.includes('class')));
      const schoolIdx = row.findIndex((c, idx) => idx !== codeIdx && idx !== nameIdx && idx !== hoIdx && idx !== tenIdx && idx !== gradeIdx && (c.includes('truong') || c.includes('school')));

      if (codeIdx !== -1 && (nameIdx !== -1 || (hoIdx !== -1 && tenIdx !== -1))) {
        headerIdx = r;
        colMap = { code: codeIdx, name: nameIdx, ho: hoIdx, ten: tenIdx, grade: gradeIdx, school: schoolIdx };
        break;
      }
    }

    if (headerIdx === -1) {
      // Giả định thứ tự mặc định nếu không khớp từ khóa
      headerIdx = 0;
      colMap = { code: 1, name: 2, ho: -1, ten: -1, grade: 3, school: 4 };
    }

    const students = [];
    const startRow = headerIdx + 1;
    const forbiddenChars = /[.#$[\]/]/;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      let studentCode = colMap.code >= 0 && row[colMap.code] !== undefined ? String(row[colMap.code]).trim() : '';
      let name = '';
      if (colMap.ho >= 0 && colMap.ten >= 0 && (row[colMap.ho] !== undefined || row[colMap.ten] !== undefined)) {
        const hoPart = row[colMap.ho] !== undefined ? String(row[colMap.ho]).trim() : '';
        const tenPart = row[colMap.ten] !== undefined ? String(row[colMap.ten]).trim() : '';
        name = `${hoPart} ${tenPart}`.trim();
      } else if (colMap.name >= 0 && row[colMap.name] !== undefined) {
        name = String(row[colMap.name]).trim();
      }

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

      // Bảo vệ họ tên học sinh: nếu name rỗng hoặc trùng mã học sinh (như 9C-09), tra cứu từ danh sách hiện tại
      if (!name || name.toUpperCase() === studentCode) {
        const existingList = (window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || currentClassData || [];
        const found = existingList.find(s => s.studentCode && s.studentCode.toUpperCase() === studentCode);
        if (found && found.name && found.name.toUpperCase() !== studentCode) {
          name = found.name;
        }
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
   * Tính toán toàn diện số liệu thống kê khảo sát và phân luồng
   * @param {Array} classList
   * @param {string} [className]
   * @returns {Object}
   */
  function computeClassStatistics(classList, className = '') {
    const list = Array.isArray(classList) && classList.length > 0
      ? classList
      : ((window.TeacherAnalytics && window.TeacherAnalytics.currentClassData) || currentClassData || []);

    const total = list.length;
    let completed = 0;
    let pending = 0;
    let thptCount = 0;
    let vocationalCount = 0;
    let otherStreamCount = 0;
    let totalScore = 0;
    let scoredStudents = 0;

    const riasecCounts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const riasecLabels = {
      R: 'Kỹ thuật',
      I: 'Nghiên cứu',
      A: 'Nghệ thuật',
      S: 'Xã hội',
      E: 'Quản lý',
      C: 'Nghiệp vụ'
    };

    const studentRows = list.map((st, idx) => {
      const code = (st.code || '').trim().toUpperCase();
      const hasValidHolland = Boolean(code.length >= 3 && code !== '---' && /^[RIASEC]{3}$/.test(code) && !st.isUndifferentiated);
      const hasSurvey = hasValidHolland;
      if (hasSurvey) {
        completed += 1;
        const primary = code[0];
        if (riasecCounts[primary] !== undefined) {
          riasecCounts[primary] += 1;
        }
      } else {
        pending += 1;
      }

      // Check stream
      const stream = (st.stream || '').trim();
      const streamLower = stream.toLowerCase();
      let normalizedStream = 'Chưa có';
      if (hasSurvey) {
        if (streamLower.includes('thpt') || streamLower.includes('phổ thông')) {
          thptCount += 1;
          normalizedStream = 'Tiếp tục học THPT';
        } else if (streamLower.includes('nghề') || streamLower.includes('9+') || streamLower.includes('trung cấp') || streamLower.includes('học nghề')) {
          vocationalCount += 1;
          normalizedStream = 'Giáo dục nghề nghiệp (9+)';
        } else {
          otherStreamCount += 1;
          normalizedStream = stream || 'Đang cân nhắc';
        }
      }

      // Project score
      if (hasSurvey && typeof st.projectScore === 'number' && !isNaN(st.projectScore)) {
        totalScore += st.projectScore;
        scoredStudents += 1;
      }

      let resolvedMajor = 'Chưa chọn';
      const dataObj = window.TeenVocaData || window.EduPathData;
      if (hasSurvey) {
        resolvedMajor = st.major;
        if ((!resolvedMajor || resolvedMajor === 'Chưa chọn' || resolvedMajor === 'Chưa khảo sát') && window.HollandEngine && dataObj && dataObj.majors) {
          const rec = window.HollandEngine.matchMajors(code, st.hollandPercentages || {});
          if (rec && rec.length > 0) {
            resolvedMajor = rec[0].name;
          }
        }
        if (!resolvedMajor) {
          resolvedMajor = 'Đang cập nhật';
        }
      }

      return {
        stt: idx + 1,
        studentCode: st.studentCode || (st.id ? `${st.grade || 'HS'}-${String(st.id).padStart(2, '0')}` : `HS-${idx + 1}`),
        name: st.name || 'Học sinh',
        grade: st.grade || className || '---',
        school: st.school || 'Trường THCS',
        code: hasSurvey ? code : (st.isUndifferentiated ? 'CHƯA PHÂN HÓA' : '---'),
        hasSurvey,
        statusText: hasSurvey ? 'Đã hoàn thành' : 'Chưa khảo sát',
        major: resolvedMajor,
        projectScore: (hasSurvey && typeof st.projectScore === 'number') ? st.projectScore : null,
        classification: (hasSurvey && st.classification) ? st.classification : (hasSurvey ? 'Phù hợp' : '---'),
        stream: normalizedStream
      };
    });

    const completedRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingRate = total > 0 ? (100 - completedRate) : 0;
    const thptRate = total > 0 ? Math.round((thptCount / total) * 100) : 0;
    const vocationalRate = total > 0 ? Math.round((vocationalCount / total) * 100) : 0;

    const riasecPercentages = {};
    for (const k in riasecCounts) {
      riasecPercentages[k] = completed > 0 ? Math.round((riasecCounts[k] / completed) * 100) : 0;
    }

    // Determine dominant RIASEC
    let maxRiasecKey = 'R';
    let maxRiasecVal = -1;
    for (const k of ['R', 'I', 'A', 'S', 'E', 'C']) {
      if (riasecCounts[k] > maxRiasecVal) {
        maxRiasecVal = riasecCounts[k];
        maxRiasecKey = k;
      }
    }
    const dominantLabel = maxRiasecVal > 0 ? `${maxRiasecKey} (${riasecLabels[maxRiasecKey]}) - ${riasecPercentages[maxRiasecKey]}%` : 'Chưa có dữ liệu';

    const avgScore = scoredStudents > 0 ? (totalScore / scoredStudents).toFixed(1) : null;

    return {
      total,
      completed,
      pending,
      completedRate,
      pendingRate,
      thptCount,
      thptRate,
      vocationalCount,
      vocationalRate,
      otherStreamCount,
      riasecCounts,
      riasecPercentages,
      riasecLabels,
      dominantRiasec: maxRiasecKey,
      dominantLabel,
      avgScore,
      scoredStudents,
      studentRows,
      className: className || (studentRows[0] && studentRows[0].grade) || 'Khối 9',
      schoolName: (studentRows[0] && studentRows[0].school) || 'Trường THCS'
    };
  }

  /**
   * Xuất báo cáo thống kê toàn diện ra file Excel (.xlsx hoặc .csv fallback)
   */
  function exportComprehensiveExcel(classList, className = '', schoolName = '') {
    const stats = computeClassStatistics(classList, className);
    const targetSchool = schoolName || stats.schoolName || 'Trường THCS';
    const targetClass = className || stats.className || 'Toàn trường';
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (typeof window.XLSX !== 'undefined') {
      const aoa = [
        ['SỞ GIÁO DỤC VÀ ĐÀO TẠO', '', '', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
        [targetSchool.toUpperCase(), '', '', 'Độc lập - Tự do - Hạnh phúc'],
        [''],
        ['BÁO CÁO THỐNG KÊ KẾT QUẢ KHẢO SÁT HƯỚNG NGHIỆP & PHÂN LUỒNG HỌC SINH'],
        [`Lớp: ${targetClass} | Năm học: 2025 - 2026 | Ngày xuất báo cáo: ${dateStr} (${timeStr})`],
        [''],
        ['I. THỐNG KÊ TỔNG QUAN'],
        ['Chỉ tiêu đánh giá', 'Số lượng (HS)', 'Tỷ lệ (%)', 'Ghi chú'],
        ['Tổng số học sinh', stats.total, '100%', 'Sĩ số chính thức trong danh sách'],
        ['Đã hoàn thành khảo sát Holland', stats.completed, `${stats.completedRate}%`, 'Đã xác định mã nghề và nhóm ngành'],
        ['Chưa hoàn thành khảo sát', stats.pending, `${stats.pendingRate}%`, 'Cần giáo viên/phụ huynh đôn đốc hoàn thành'],
        ['Định hướng tiếp tục học THPT', stats.thptCount, `${stats.thptRate}%`, 'Học sinh có nguyện vọng/phù hợp THPT công lập/tư thục'],
        ['Định hướng Giáo dục nghề nghiệp (9+)', stats.vocationalCount, `${stats.vocationalRate}%`, 'Học nghề hoặc vừa học văn hóa vừa học trung cấp nghề'],
        [''],
        ['II. PHÂN BỐ XU HƯỚNG NGHỀ NGHIỆP HOLLAND (RIASEC)'],
        ['Mã nhóm', 'Tên nhóm nghề nghiệp', 'Số lượng (HS)', 'Tỷ lệ (%)', 'Lĩnh vực nghề tiêu biểu'],
        ['R', 'Kỹ thuật (Realistic)', stats.riasecCounts.R, `${stats.riasecPercentages.R}%`, 'Cơ khí, Ô tô, Điện tử, Xây dựng, Nông lâm nghiệp'],
        ['I', 'Nghiên cứu (Investigative)', stats.riasecCounts.I, `${stats.riasecPercentages.I}%`, 'Khoa học tự nhiên, Công nghệ thông tin, Y dược, Nghiên cứu'],
        ['A', 'Nghệ thuật (Artistic)', stats.riasecCounts.A, `${stats.riasecPercentages.A}%`, 'Thiết kế đồ họa, Kiến trúc, Truyền thông, Âm nhạc, Sáng tạo'],
        ['S', 'Xã hội (Social)', stats.riasecCounts.S, `${stats.riasecPercentages.S}%`, 'Sư phạm, Y tế điều dưỡng, Tâm lý học, Du lịch, Dịch vụ xã hội'],
        ['E', 'Quản lý (Enterprising)', stats.riasecCounts.E, `${stats.riasecPercentages.E}%`, 'Quản trị kinh doanh, Khởi nghiệp, Marketing, Tài chính, Pháp luật'],
        ['C', 'Nghiệp vụ (Conventional)', stats.riasecCounts.C, `${stats.riasecPercentages.C}%`, 'Kế toán, Thống kê, Quản trị văn phòng, Ngân hàng, Lưu trữ'],
        [''],
        ['III. BẢNG CHI TIẾT KẾT QUẢ TỪNG HỌC SINH'],
        [
          'STT',
          'Mã học sinh',
          'Họ và tên',
          'Lớp',
          'Trường THCS',
          'Trạng thái',
          'Mã Holland',
          'Ngành nghề đề xuất',
          'Điểm Bài 5',
          'Xếp loại',
          'Định hướng phân luồng'
        ]
      ];

      stats.studentRows.forEach(st => {
        aoa.push([
          st.stt,
          st.studentCode,
          st.name,
          st.grade,
          st.school,
          st.statusText,
          st.code,
          st.major,
          st.projectScore !== null ? st.projectScore : '',
          st.classification,
          st.stream
        ]);
      });

      aoa.push(['']);
      aoa.push(['', '', 'XÁC NHẬN CỦA BAN GIÁM HIỆU', '', '', '', '', 'NGƯỜI LẬP BÁO CÁO']);
      aoa.push(['', '', '(Ký, ghi rõ họ tên và đóng dấu)', '', '', '', '', '(Ký và ghi rõ họ tên)']);

      const ws = window.XLSX.utils.aoa_to_sheet(aoa);
      ws['!cols'] = [
        { wch: 6 },
        { wch: 14 },
        { wch: 26 },
        { wch: 10 },
        { wch: 24 },
        { wch: 16 },
        { wch: 14 },
        { wch: 32 },
        { wch: 12 },
        { wch: 14 },
        { wch: 28 }
      ];

      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoThongKe');
      const cleanClass = targetClass.replace(/\s+/g, '_');
      window.XLSX.writeFile(wb, `Bao_Cao_Thong_Ke_Huong_Nghiep_${cleanClass}_TeenVoca.xlsx`);
    } else {
      let csv = '\uFEFF';
      csv += `"BÁO CÁO THỐNG KÊ KẾT QUẢ KHẢO SÁT HƯỚNG NGHIỆP & PHÂN LUỒNG HỌC SINH"\n`;
      csv += `"Trường: ${targetSchool} - Lớp: ${targetClass} - Ngày xuất: ${dateStr}"\n\n`;
      csv += `"I. THỐNG KÊ TỔNG QUAN"\n`;
      csv += `"Tổng số học sinh",${stats.total},"100%"\n`;
      csv += `"Đã hoàn thành khảo sát",${stats.completed},"${stats.completedRate}%"\n`;
      csv += `"Chưa hoàn thành",${stats.pending},"${stats.pendingRate}%"\n`;
      csv += `"Định hướng THPT",${stats.thptCount},"${stats.thptRate}%"\n`;
      csv += `"Định hướng Giáo dục nghề nghiệp (9+)",${stats.vocationalCount},"${stats.vocationalRate}%"\n\n`;
      csv += `"II. BẢNG CHI TIẾT TỪNG HỌC SINH"\n`;
      csv += `"STT","Mã HS","Họ và tên","Lớp","Trường","Trạng thái","Mã Holland","Ngành nghề đề xuất","Điểm Bài 5","Xếp loại","Định hướng phân luồng"\n`;

      stats.studentRows.forEach(st => {
        csv += `${st.stt},"${st.studentCode}","${st.name}","${st.grade}","${st.school}","${st.statusText}","${st.code}","${st.major}",${st.projectScore !== null ? st.projectScore : '""'},"${st.classification}","${st.stream}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanClass = targetClass.replace(/\s+/g, '_');
      link.download = `Bao_Cao_Thong_Ke_Huong_Nghiep_${cleanClass}_TeenVoca.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Tạo chuỗi HTML bản in báo cáo A4 chuẩn biểu mẫu quản lý giáo dục
   */
  function generatePrintableHTMLReport(classList, className = '', schoolName = '') {
    const stats = computeClassStatistics(classList, className);
    const targetSchool = schoolName || stats.schoolName || 'Trường THCS';
    const targetClass = className || stats.className || 'Toàn trường';
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

    let studentTrs = '';
    stats.studentRows.forEach(st => {
      const statusClass = st.hasSurvey ? 'status-done' : 'status-pending';
      const scoreDisplay = st.projectScore !== null ? st.projectScore : '---';
      studentTrs += `
        <tr>
          <td class="text-center">${st.stt}</td>
          <td class="text-center font-bold">${st.studentCode}</td>
          <td>${st.name}</td>
          <td class="text-center">${st.grade}</td>
          <td class="text-center ${statusClass}">${st.statusText}</td>
          <td class="text-center font-bold">${st.code}</td>
          <td>${st.major}</td>
          <td class="text-center">${scoreDisplay}</td>
          <td>${st.stream}</td>
        </tr>`;
    });

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Báo Cáo Thống Kê Khảo Sát Hướng Nghiệp & Phân Luồng - ${targetClass}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm 12mm 10mm 12mm;
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 11pt;
      line-height: 1.35;
      color: #000000;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: top;
      border: none;
      padding: 0 4px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .uppercase { text-transform: uppercase; }
    .title-box {
      text-align: center;
      margin: 14px 0 16px 0;
    }
    .doc-title {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 0 0 4px 0;
    }
    .doc-subtitle {
      font-size: 10.5pt;
      font-style: italic;
    }
    .section-title {
      font-size: 11.5pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 14px 0 6px 0;
      border-bottom: 1px solid #333;
      padding-bottom: 2px;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    table.report-table th, table.report-table td {
      border: 1px solid #000;
      padding: 4px 6px;
      font-size: 10pt;
    }
    table.report-table th {
      background-color: #f1f5f9;
      font-weight: bold;
      text-align: center;
    }
    .status-done {
      color: #047857;
      font-weight: bold;
    }
    .status-pending {
      color: #b45309;
      font-style: italic;
    }
    .sig-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      page-break-inside: avoid;
    }
    .sig-table td {
      border: none;
      vertical-align: top;
      text-align: center;
      width: 50%;
      padding: 0 10px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <!-- Header Table -->
  <table class="header-table">
    <tr>
      <td style="width: 48%; text-align: center;">
        <div style="font-size: 10pt;">PHÒNG GIÁO DỤC VÀ ĐÀO TẠO</div>
        <div class="font-bold uppercase" style="font-size: 10.5pt;">${targetSchool}</div>
        <div style="width: 100px; height: 1px; background: #000; margin: 3px auto 0 auto;"></div>
      </td>
      <td style="width: 52%; text-align: center;">
        <div class="font-bold" style="font-size: 10.5pt;">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
        <div class="font-bold" style="font-size: 10.5pt; text-decoration: underline;">Độc lập - Tự do - Hạnh phúc</div>
        <div style="font-size: 9.5pt; font-style: italic; margin-top: 4px;">Ngày ${dateStr}</div>
      </td>
    </tr>
  </table>

  <!-- Title -->
  <div class="title-box">
    <div class="doc-title">BÁO CÁO THỐNG KÊ KẾT QUẢ KHẢO SÁT HƯỚNG NGHIỆP<br>& ĐỊNH HƯỚNG PHÂN LUỒNG HỌC SINH LỚP 9</div>
    <div class="doc-subtitle">Căn cứ Chương trình GDPT môn Công nghệ 9 & Đề án Giáo dục Hướng nghiệp - Phân luồng</div>
    <div style="font-weight: bold; margin-top: 4px; font-size: 11pt;">LỚP: ${targetClass} &nbsp;|&nbsp; NĂM HỌC 2025 - 2026</div>
  </div>

  <!-- I. Thống kê tổng quan -->
  <div class="section-title">I. KẾT QUẢ THỐNG KÊ CHUNG</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 40%;">Chỉ tiêu thống kê</th>
        <th style="width: 20%;">Số lượng (Học sinh)</th>
        <th style="width: 20%;">Tỷ lệ (%)</th>
        <th style="width: 20%;">Ghi chú</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="font-bold">Tổng sĩ số học sinh</td>
        <td class="text-center font-bold">${stats.total}</td>
        <td class="text-center font-bold">100%</td>
        <td>Danh sách chính thức</td>
      </tr>
      <tr>
        <td>Đã hoàn thành bài khảo sát Holland RIASEC</td>
        <td class="text-center status-done">${stats.completed}</td>
        <td class="text-center status-done">${stats.completedRate}%</td>
        <td>Đã có kết quả mã nghề</td>
      </tr>
      <tr>
        <td>Chưa thực hiện khảo sát</td>
        <td class="text-center status-pending">${stats.pending}</td>
        <td class="text-center status-pending">${stats.pendingRate}%</td>
        <td>Đang đôn đốc làm bài</td>
      </tr>
      <tr>
        <td>Định hướng tiếp tục học THPT</td>
        <td class="text-center font-bold">${stats.thptCount}</td>
        <td class="text-center font-bold">${stats.thptRate}%</td>
        <td>Nguyện vọng THPT</td>
      </tr>
      <tr>
        <td>Định hướng Giáo dục nghề nghiệp (9+)</td>
        <td class="text-center font-bold">${stats.vocationalCount}</td>
        <td class="text-center font-bold">${stats.vocationalRate}%</td>
        <td>Học nghề kết hợp văn hóa</td>
      </tr>
    </tbody>
  </table>

  <!-- II. Phân bố RIASEC -->
  <div class="section-title">II. PHÂN BỐ XU HƯỚNG NGHỀ NGHIỆP HOLLAND (RIASEC)</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 10%;">Mã</th>
        <th style="width: 28%;">Nhóm nghề</th>
        <th style="width: 16%;">Số lượng (HS)</th>
        <th style="width: 16%;">Tỷ lệ (%)</th>
        <th style="width: 30%;">Ngành nghề tiêu biểu</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-center font-bold">R</td>
        <td>Kỹ thuật (Realistic)</td>
        <td class="text-center">${stats.riasecCounts.R}</td>
        <td class="text-center">${stats.riasecPercentages.R}%</td>
        <td>Cơ khí, Điện tử, Xây dựng, Nông lâm</td>
      </tr>
      <tr>
        <td class="text-center font-bold">I</td>
        <td>Nghiên cứu (Investigative)</td>
        <td class="text-center">${stats.riasecCounts.I}</td>
        <td class="text-center">${stats.riasecPercentages.I}%</td>
        <td>Khoa học, CNTT, Y dược, Công nghệ</td>
      </tr>
      <tr>
        <td class="text-center font-bold">A</td>
        <td>Nghệ thuật (Artistic)</td>
        <td class="text-center">${stats.riasecCounts.A}</td>
        <td class="text-center">${stats.riasecPercentages.A}%</td>
        <td>Thiết kế, Mỹ thuật, Truyền thông, Âm nhạc</td>
      </tr>
      <tr>
        <td class="text-center font-bold">S</td>
        <td>Xã hội (Social)</td>
        <td class="text-center">${stats.riasecCounts.S}</td>
        <td class="text-center">${stats.riasecPercentages.S}%</td>
        <td>Sư phạm, Y tế, Tâm lý, Dịch vụ xã hội</td>
      </tr>
      <tr>
        <td class="text-center font-bold">E</td>
        <td>Quản lý (Enterprising)</td>
        <td class="text-center">${stats.riasecCounts.E}</td>
        <td class="text-center">${stats.riasecPercentages.E}%</td>
        <td>Kinh doanh, Quản trị, Marketing, Luật</td>
      </tr>
      <tr>
        <td class="text-center font-bold">C</td>
        <td>Nghiệp vụ (Conventional)</td>
        <td class="text-center">${stats.riasecCounts.C}</td>
        <td class="text-center">${stats.riasecPercentages.C}%</td>
        <td>Kế toán, Văn phòng, Ngân hàng, Thống kê</td>
      </tr>
    </tbody>
  </table>

  <!-- III. Danh sách chi tiết học sinh -->
  <div class="section-title">III. BẢNG DANH SÁCH CHI TIẾT HỌC SINH</div>
  <table class="report-table">
    <thead>
      <tr>
        <th style="width: 4%;">STT</th>
        <th style="width: 8%;">Mã HS</th>
        <th style="width: 19%;">Họ và tên</th>
        <th style="width: 5%;">Lớp</th>
        <th style="width: 11%;">Trạng thái</th>
        <th style="width: 8%;">Mã nghề</th>
        <th style="width: 26%;">Ngành đề xuất</th>
        <th style="width: 6%;">Điểm Bài 5</th>
        <th style="width: 13%;">Phân luồng</th>
      </tr>
    </thead>
    <tbody>
      ${studentTrs}
    </tbody>
  </table>

  <!-- IV. Khuyến nghị sư phạm -->
  <div class="section-title">IV. ĐÁNH GIÁ VÀ KHUYẾN NGHỊ SƯ PHẠM</div>
  <div style="font-size: 10pt; line-height: 1.45; text-align: justify; margin-bottom: 16px;">
    1. <strong>Đánh giá chung:</strong> Đa số học sinh lớp ${targetClass} đã tích cực tham gia khảo sát nghề nghiệp theo mô hình chuẩn Holland RIASEC. Kết quả phản ánh rõ nét sở thích, xu hướng nổi trội và sự phù hợp với mục tiêu đào tạo của môn Công nghệ 9.<br>
    2. <strong>Khuyến nghị Ban Giám Hiệu & Phụ Huynh:</strong> Nhà trường và gia đình cần phối hợp tổ chức các buổi tư vấn chuyên sâu, định hướng học sinh đăng ký đúng nguyện vọng lớp 10 THPT hoặc trường nghề theo mô hình 9+ phù hợp với năng lực học tập thực tế và nhu cầu của thị trường lao động.
  </div>

  <!-- Signatures -->
  <table class="sig-table">
    <tr>
      <td>
        <div class="font-bold uppercase" style="font-size: 10.5pt;">BAN GIÁM HIỆU NHÀ TRƯỜNG</div>
        <div style="font-size: 9.5pt; font-style: italic;">(Ký, ghi rõ họ tên và đóng dấu)</div>
        <div style="height: 60px;"></div>
      </td>
      <td>
        <div class="font-bold uppercase" style="font-size: 10.5pt;">GIÁO VIÊN CHỦ NHIỆM / PHỤ TRÁCH</div>
        <div style="font-size: 9.5pt; font-style: italic;">(Ký và ghi rõ họ tên)</div>
        <div style="height: 60px;"></div>
      </td>
    </tr>
  </table>
  <div style="font-size: 8pt; color: #666; text-align: right; margin-top: 15px; font-style: italic;">Hệ thống Hướng nghiệp Thông minh TeenVoca AI &mdash; Môn Công nghệ 9 (Bộ Kết nối tri thức với cuộc sống)</div>
</body>
</html>`;
  }

  /**
   * Kích hoạt in báo cáo qua iframe ảo an toàn tuyệt đối (Không dùng document.write)
   */
  function printStatsReport(classList, className = '', schoolName = '') {
    const htmlContent = generatePrintableHTMLReport(classList, className, schoolName);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'TeenVoca Print Report Frame');
    document.body.appendChild(iframe);

    iframe.onload = () => {
      setTimeout(() => {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          }
        } catch (err) {
          console.warn('Lỗi khi kích hoạt lệnh in:', err);
        } finally {
          setTimeout(() => {
            if (iframe.parentNode) {
              iframe.parentNode.removeChild(iframe);
            }
          }, 1200);
        }
      }, 350);
    };

    iframe.srcdoc = htmlContent;
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
    parseCSVText,
    computeClassStatistics,
    exportComprehensiveExcel,
    generatePrintableHTMLReport,
    printStatsReport
  };
})();

window.TeacherAnalytics = TeacherAnalytics;
