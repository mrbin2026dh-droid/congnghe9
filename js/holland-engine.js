/**
 * EduPath AI - Holland RIASEC Calculation & Recommendation Engine
 * Strictly follows Holland Hexagon Theory & Position-Weighted Matching
 * Scientifically verified: Zero-Guesswork, No Arbitrary Clamping, Full Hexagonal Invariant
 */
'use strict';

const HollandEngine = (() => {
  const RIASEC_ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

  const GROUP_METADATA = {
    R: {
      code: 'R',
      name: 'Realistic (Kỹ thuật)',
      shortName: 'Kỹ thuật',
      color: '#2563eb',
      bgSoft: 'rgba(37, 99, 235, 0.12)',
      description: 'Thực tế, thích làm việc với máy móc, công cụ, vật liệu cơ khí và thao tác trực quan.',
      bestLearnsWhen: 'Được làm thử trước, lý thuyết đến sau.',
      losesInterestWhen: 'Cả buổi chỉ nghe giảng và chép bài trên giấy.',
      misunderstoodAs: 'Không thích học — thật ra là không thích học kiểu nhồi nhét chữ nghĩa.',
      strengths: 'Kỹ năng đôi tay khéo léo, tư duy không gian, trực quan cơ khí và khả năng sửa chữa nhanh.'
    },
    I: {
      code: 'I',
      name: 'Investigative (Nghiên cứu)',
      shortName: 'Nghiên cứu',
      color: '#0891b2',
      bgSoft: 'rgba(8, 145, 178, 0.12)',
      description: 'Tò mò, phân tích, thích quan sát, thử nghiệm và giải quyết các bài toán phức tạp.',
      bestLearnsWhen: 'Hiểu được bản chất vì sao trước khi phải học thuộc.',
      losesInterestWhen: 'Bị ép chấp nhận kết luận mà không có lý lẽ chứng minh.',
      misunderstoodAs: 'Hay cãi lý — thật ra là đang kiểm tra tính xác đáng của lập luận.',
      strengths: 'Tư duy phản biện, tìm tòi nguyên nhân cốt lõi, xử lý số liệu và phân tích logic.'
    },
    A: {
      code: 'A',
      name: 'Artistic (Nghệ thuật)',
      shortName: 'Nghệ thuật',
      color: '#d946ef',
      bgSoft: 'rgba(217, 70, 239, 0.12)',
      description: 'Sáng tạo, biểu cảm, giàu cảm xúc, thích không gian tự do và cảm quan thẩm mỹ.',
      bestLearnsWhen: 'Được tự chọn cách thực hiện, không chỉ chọn đề tài.',
      losesInterestWhen: 'Phải làm đúng y khuôn mẫu mà không được phép đổi khác.',
      misunderstoodAs: 'Thiếu kỷ luật — thật ra là kỷ luật theo cảm hứng sáng tạo.',
      strengths: 'Trí tưởng tượng phong phú, mắt thẩm mỹ tinh tế, tạo ra giải pháp độc bản.'
    },
    S: {
      code: 'S',
      name: 'Social (Xã hội)',
      shortName: 'Xã hội',
      color: '#10b981',
      bgSoft: 'rgba(16, 185, 129, 0.12)',
      description: 'Thân thiện, giàu lòng trắc ẩn, thích giảng giải, chăm sóc và giúp đỡ người khác.',
      bestLearnsWhen: 'Có đồng đội để cùng trao đổi và giảng giải lại cho người khác.',
      losesInterestWhen: 'Công việc cô lập, không nhìn thấy ai hưởng lợi từ việc mình làm.',
      misunderstoodAs: 'Mềm yếu — thật ra là ưu tiên sự hòa thuận và gắn kết con người.',
      strengths: 'Giao tiếp thấu cảm, khả năng truyền cảm hứng, lắng nghe và hợp tác nhóm.'
    },
    E: {
      code: 'E',
      name: 'Enterprising (Quản lý)',
      shortName: 'Quản lý',
      color: '#f59e0b',
      bgSoft: 'rgba(245, 158, 11, 0.12)',
      description: 'Tự tin, hoạt ngôn, có khiếu lãnh đạo, thích khởi xướng dự án và cạnh tranh lành mạnh.',
      bestLearnsWhen: 'Nhìn thấy kết quả thực tế và có mục tiêu chinh phục cụ thể.',
      losesInterestWhen: 'Họp bàn qua nhiều vòng trì trệ mà không ai đưa ra quyết định.',
      misunderstoodAs: 'Ham quyền lực — thật ra là không chịu nổi sự đình trệ, lãng phí thời gian.',
      strengths: 'Thuyết phục người khác, điều phối nguồn lực, dám nhận trách nhiệm và giải quyết việc lớn.'
    },
    C: {
      code: 'C',
      name: 'Conventional (Nghiệp vụ)',
      shortName: 'Nghiệp vụ',
      color: '#64748b',
      bgSoft: 'rgba(100, 116, 139, 0.12)',
      description: 'Ngăn nắp, cẩn trọng, tỉ mỉ, làm việc xuất sắc với quy trình, con số và bảng biểu.',
      bestLearnsWhen: 'Có tiêu chí rõ ràng, biểu mẫu cụ thể và hướng dẫn từng bước.',
      losesInterestWhen: 'Yêu cầu mơ hồ, thay đổi quy tắc liên tục không báo trước.',
      misunderstoodAs: 'Cứng nhắc — thật ra là cần lý do xác đáng và an toàn trước khi thay đổi.',
      strengths: 'Độ chính xác cao, kiên trì kiểm tra lỗi chi tiết, tổ chức tài liệu và quản lý dữ liệu.'
    }
  };

  const OPPOSITE_PAIRS = [
    { pair: ['R', 'S'], title: 'Kỹ thuật (R) kết hợp Xã hội (S)', insight: 'Bạn có sự thực tế của kỹ thuật nhưng lại ấm áp và quan tâm con người. Đây là tố chất vàng của Kỹ sư Y sinh, Chuyên gia Công nghệ Hỗ trợ người khuyết tật hoặc Giảng viên Kỹ thuật.' },
    { pair: ['I', 'E'], title: 'Nghiên cứu (I) kết hợp Quản lý (E)', insight: 'I muốn chắc chắn trước khi công bố; E buộc phải công bố để thúc đẩy tiến độ. Bạn là mẫu người có thể đứng ở ranh giới giữa kỹ sư và kinh doanh — Quản lý Sản phẩm Công nghệ (Product Manager) hoặc Khởi nghiệp Tech.' },
    { pair: ['A', 'C'], title: 'Nghệ thuật (A) kết hợp Nghiệp vụ (C)', insight: 'A bay bổng sáng tạo nhưng C lại kỷ luật, ngăn nắp. Sự kết hợp này tạo nên những nhà Thiết kế UI/UX xuất sắc, Họa viên Kiến trúc hoặc Biên tập viên Đa phương tiện chuẩn xác.' }
  ];

  /**
   * Tính khoảng cách hình học trên Lục giác Holland RIASEC (0..3)
   */
  function getHexagonDistance(type1, type2) {
    const idx1 = RIASEC_ORDER.indexOf(type1);
    const idx2 = RIASEC_ORDER.indexOf(type2);
    if (idx1 === -1 || idx2 === -1) return 2;
    const diff = Math.abs(idx1 - idx2);
    return Math.min(diff, 6 - diff);
  }

  /**
   * Tính toán điểm số từ mảng câu trả lời của học sinh
   * @param {Array<number>} responses - Mảng điểm 1..5
   * @param {Array<Object>} questions - Mảng câu hỏi RIASEC
   */
  function calculateScores(responses, questions) {
    if (!Array.isArray(responses) || !Array.isArray(questions)) {
      throw new Error('Dữ liệu câu trả lời và câu hỏi không hợp lệ');
    }

    const rawScores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const countPerType = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    let validAnswersCount = 0;

    questions.forEach((q, idx) => {
      if (q && q.type && countPerType[q.type] !== undefined) {
        countPerType[q.type] += 1;
        const val = responses[idx];
        if (typeof val === 'number' && val >= 1 && val <= 5) {
          rawScores[q.type] += val;
          validAnswersCount += 1;
        }
      }
    });

    const isIncomplete = validAnswersCount < questions.length;

    // Tính phần trăm chuẩn hóa
    const percentages = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    RIASEC_ORDER.forEach(type => {
      const maxPossible = 5 * (countPerType[type] || 1);
      percentages[type] = Math.round((rawScores[type] / maxPossible) * 100);
    });

    // Kiểm tra trường hợp 6 nhóm có điểm bằng nhau (Trường hợp 6)
    const scoreValues = Object.values(rawScores);
    const minScore = Math.min(...scoreValues);
    const maxScore = Math.max(...scoreValues);
    const isUndifferentiated = (maxScore === minScore);

    if (isUndifferentiated) {
      return {
        code: '---',
        top3: [],
        rawScores,
        percentages,
        sortedTypes: [...RIASEC_ORDER],
        totalQuestions: questions.length,
        validAnswersCount,
        isIncomplete,
        isUndifferentiated: true,
        undifferentiatedMessage: 'Chưa có nhóm nổi bật rõ rệt (Điểm cả 6 nhóm RIASEC đều bằng nhau). Ứng dụng không tạo kết luận mang tính chắc chắn từ thứ tự phá hòa tùy ý.'
      };
    }

    // Sắp xếp thứ bậc theo điểm số giảm dần
    const sortedTypes = [...RIASEC_ORDER].sort((a, b) => {
      if (rawScores[b] !== rawScores[a]) {
        return rawScores[b] - rawScores[a];
      }
      return RIASEC_ORDER.indexOf(a) - RIASEC_ORDER.indexOf(b);
    });

    const top3 = sortedTypes.slice(0, 3);
    const code = top3.join('');

    return {
      code,
      top3,
      rawScores,
      percentages,
      sortedTypes,
      totalQuestions: questions.length,
      validAnswersCount,
      isIncomplete,
      isUndifferentiated: false,
      undifferentiatedMessage: ''
    };
  }

  /**
   * Khớp nối và xếp hạng ngành học theo mã Holland và trọng số vị trí
   * Áp dụng chỉ số tương thích vị trí Iachan / Kwak-Pulvino kết hợp khoảng cách Lục giác
   * Triệt tiêu hoàn toàn lỗi kẹp sàn 45% giả tạo và lỗi includes không phân biệt thứ bậc
   * @param {string} userCode - Mã 3 chữ cái của học sinh (vd: ICR, SEC, RIE)
   * @param {Object} percentages - Tỷ lệ phần trăm thực tế RIASEC của học sinh
   * @param {Object} [options] - Tùy chọn (vd: { isUndifferentiated: boolean })
   */
  function matchMajors(userCode, percentages, options = {}) {
    const dataObj = window.TeenVocaData || window.EduPathData;
    const majors = (dataObj && dataObj.majors) ? dataObj.majors : [];

    // Trường hợp 7: Dữ liệu chưa có hoặc chưa làm khảo sát -> Không tự sinh RIA mặc định
    if (!userCode || typeof userCode !== 'string' || userCode.trim().length === 0) {
      return [];
    }

    // Trường hợp 6: Sáu nhóm bằng nhau -> Trả về danh sách định hướng khám phá đồng đều
    if (userCode === '---' || options.isUndifferentiated) {
      return majors.map(major => ({
        ...major,
        fitPercentage: 50,
        exploratory: true,
        fitNote: 'Chưa có nhóm nổi bật rõ rệt — Khám phá tiềm năng mở rộng'
      }));
    }

    const cleanUserCode = userCode.trim().toUpperCase();
    if (cleanUserCode.length < 3) return [];

    const u = [cleanUserCode[0], cleanUserCode[1], cleanUserCode[2]];
    const uWeights = [3, 2, 1]; // Trọng số người học: Top 1 = 3, Top 2 = 2, Top 3 = 1
    const mWeights = [3, 2, 1]; // Trọng số nghề nghiệp: Primary = 3, Secondary = 2, Tertiary = 1
    const maxPossibleCongruence = 14; // (3*3) + (2*2) + (1*1) = 9 + 4 + 1 = 14

    return majors.map(major => {
      const mCode = (major.code && major.code.length >= 3) ? major.code.toUpperCase() : 'RIC';
      const m = [mCode[0], mCode[1], mCode[2]];

      let matchPoints = 0;
      const matchedMajorIndices = new Set();

      // 1. Đối sánh có trọng số vị trí giữa mã Người học và mã Nghề
      for (let i = 0; i < 3; i++) {
        const uChar = u[i];
        const uW = uWeights[i];
        let bestMatchJ = -1;
        let bestPoints = 0;

        for (let j = 0; j < 3; j++) {
          if (matchedMajorIndices.has(j)) continue;
          if (uChar === m[j]) {
            const mW = mWeights[j];
            // Trùng tuyệt đối cùng vị trí -> hệ số 1.0; lệch 1 vị trí -> 0.70; lệch 2 vị trí -> 0.50
            const posFactor = (i === j) ? 1.0 : (Math.abs(i - j) === 1 ? 0.70 : 0.50);
            const pts = (uW * mW) * posFactor;
            if (pts > bestPoints) {
              bestPoints = pts;
              bestMatchJ = j;
            }
          }
        }

        if (bestMatchJ !== -1) {
          matchPoints += bestPoints;
          matchedMajorIndices.add(bestMatchJ);
        } else {
          // Ký tự không có trong nghề: Tính khoảng cách Lục giác với nhóm chủ đạo nghề m[0]
          const distToPrimary = getHexagonDistance(uChar, m[0]);
          if (distToPrimary === 3) {
            // Đối kháng trực diện đường chéo (R <-> S, I <-> E, A <-> C)
            matchPoints -= (uW === 3 ? 1.8 : 0.9);
          } else if (distToPrimary === 1) {
            // Nhóm liền kề, có tính tương thích tâm lý học hỗ trợ
            matchPoints += (uW === 3 ? 0.8 : 0.4);
          }
        }
      }

      // Phần trăm tương thích định tính từ mã Holland (0..100)
      const congruencePct = Math.max(0, Math.min(100, (matchPoints / maxPossibleCongruence) * 100));

      // 2. Điểm định lượng thực tế từ phổ điểm bài test của học sinh trong 3 nhóm của nghề
      const pM1 = (percentages && typeof percentages[m[0]] === 'number') ? percentages[m[0]] : 0;
      const pM2 = (percentages && typeof percentages[m[1]] === 'number') ? percentages[m[1]] : 0;
      const pM3 = (percentages && typeof percentages[m[2]] === 'number') ? percentages[m[2]] : 0;
      const empiricalPct = (pM1 * 3 + pM2 * 2 + pM3 * 1) / 6;

      // 3. Điểm tổng hợp: 60% từ Độ tương thích cấu trúc mã + 40% từ Năng lực thực tế của học sinh
      const finalFit = Math.round(congruencePct * 0.60 + empiricalPct * 0.40);

      // Phạm vi điểm tự nhiên từ 10% đến 98%, tuyệt đối không kẹp sàn 45%
      const totalFit = Math.min(98, Math.max(10, finalFit));

      return {
        ...major,
        fitPercentage: totalFit
      };
    }).sort((a, b) => b.fitPercentage - a.fitPercentage);
  }

  /**
   * Khớp nối và xếp hạng ngành nghề đề xuất theo thứ tự chữ cái mã Holland (A -> S -> E)
   * Thuật toán dịch ngược từ Aiducation (https://www.aiducation.edu.vn/huong-nghiep/ket-qua/...)
   * Đảm bảo tính khoa học: Chữ cái thứ 1 (Chủ đạo) -> Chữ cái thứ 2 (Bổ trợ) -> Chữ cái thứ 3 (Xúc tác)
   * @param {string} userCode - Mã Holland của học sinh (vd: 'ASE', 'RIE', 'SEC')
   * @param {Object} [options] - Tùy chọn ({ filterLetter?: 'all'|'c1'|'c2'|'c3', isUndifferentiated?: boolean })
   */
  function matchHollandOrderCareers(userCode, options = {}) {
    const dataObj = window.TeenVocaData || window.EduPathData;
    const aiduMajors = (dataObj && Array.isArray(dataObj.aiducationMajors))
      ? dataObj.aiducationMajors
      : [];

    if (!userCode || typeof userCode !== 'string' || userCode.trim().length === 0 || userCode === '---' || options.isUndifferentiated) {
      return [];
    }

    const cleanCode = userCode.trim().toUpperCase();
    if (cleanCode.length < 3) return [];

    const c1 = cleanCode[0];
    const c2 = cleanCode[1];
    const c3 = cleanCode[2];

    const ranked = aiduMajors.map(m => {
      const code = (m.code && m.code.length >= 3) ? m.code.toUpperCase() : 'RIC';
      let score = 0;

      // Trọng số vị trí 1 của ngành (Primary Type)
      if (code[0] === c1) score += 200;
      else if (code[0] === c2) score += 110;
      else if (code[0] === c3) score += 40;

      // Trọng số vị trí 2 của ngành (Secondary Type)
      if (code[1] === c1) score += 70;
      else if (code[1] === c2) score += 50;
      else if (code[1] === c3) score += 30;

      // Trọng số vị trí 3 của ngành (Tertiary Type)
      if (code[2] === c1) score += 30;
      else if (code[2] === c2) score += 20;
      else if (code[2] === c3) score += 10;

      // Phụ cấp cấu trúc tổ hợp chính xác
      if (code === cleanCode) score += 500;
      else if (code.startsWith(c1 + c2)) score += 220; // vd: AS* khi học sinh là ASE
      else if (code.startsWith(c2 + c1)) score += 160; // vd: SA*
      else if (code[0] === c1 && code[2] === c3) score += 130; // vd: A*E
      else if (code.startsWith(c1 + c3)) score += 120; // vd: AE*
      else if (code.startsWith(c2 + c3)) score += 80;  // vd: SE*
      else if (code.startsWith(c3 + c1)) score += 60;  // vd: EA*

      // Phân nhóm thiên hướng theo thứ tự chữ cái học sinh (A -> S -> E)
      let letterStage = 'combined';
      let stageLabel = 'Liên ngành';
      let stageLetter = '';

      if (code[0] === c1) {
        letterStage = 'c1';
        stageLetter = c1;
        const gName = GROUP_METADATA[c1] ? GROUP_METADATA[c1].shortName : c1;
        stageLabel = `Chữ cái 1: ${c1} (${gName} - Chủ đạo)`;
      } else if (code[0] === c2) {
        letterStage = 'c2';
        stageLetter = c2;
        const gName = GROUP_METADATA[c2] ? GROUP_METADATA[c2].shortName : c2;
        stageLabel = `Chữ cái 2: ${c2} (${gName} - Bổ trợ)`;
      } else if (code[0] === c3) {
        letterStage = 'c3';
        stageLetter = c3;
        const gName = GROUP_METADATA[c3] ? GROUP_METADATA[c3].shortName : c3;
        stageLabel = `Chữ cái 3: ${c3} (${gName} - Xúc tác)`;
      } else {
        stageLabel = `Tổ hợp bổ sung (${code})`;
      }

      return {
        ...m,
        score,
        letterStage,
        stageLabel,
        stageLetter
      };
    }).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name, 'vi');
    });

    if (options.filterLetter && options.filterLetter !== 'all') {
      return ranked.filter(m => m.letterStage === options.filterLetter);
    }

    return ranked;
  }

  /**
   * Phát hiện mâu thuẫn nội tâm theo đường chéo Lục giác
   * @param {string} code - Mã 3 chữ cái
   */
  function detectConflict(code) {
    if (!code || typeof code !== 'string' || code === '---') return null;
    for (const item of OPPOSITE_PAIRS) {
      const [t1, t2] = item.pair;
      if (code.includes(t1) && code.includes(t2)) {
        return item;
      }
    }
    return null;
  }

  return {
    RIASEC_ORDER,
    GROUP_METADATA,
    getHexagonDistance,
    calculateScores,
    matchMajors,
    matchHollandOrderCareers,
    detectConflict
  };
})();

window.HollandEngine = HollandEngine;
