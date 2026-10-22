/**
 * EduPath AI - Holland RIASEC Calculation & Recommendation Engine
 * Strictly follows Holland Hexagon Theory & Position-Weighted Matching
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

    questions.forEach((q, idx) => {
      if (q && q.type && countPerType[q.type] !== undefined) {
        countPerType[q.type] += 1;
        const val = responses[idx];
        if (typeof val === 'number' && val >= 1 && val <= 5) {
          rawScores[q.type] += val;
        }
      }
    });

    // Tính phần trăm chuẩn hóa
    const percentages = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    RIASEC_ORDER.forEach(type => {
      const maxPossible = 5 * (countPerType[type] || 1);
      percentages[type] = Math.round((rawScores[type] / maxPossible) * 100);
    });

    // Sắp xếp thứ bậc có Tie-breaker
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
      totalQuestions: questions.length
    };
  }

  /**
   * Khớp nối và xếp hạng ngành học theo mã Holland và trọng số vị trí
   * @param {string} userCode - Mã 3 chữ cái của học sinh (vd: RIE)
   * @param {Object} percentages - Tỷ lệ phần trăm RIASEC
   */
  function matchMajors(userCode, percentages) {
    const majors = window.EduPathData.majors || [];
    const c1 = userCode[0] || 'R';
    const c2 = userCode[1] || 'I';
    const c3 = userCode[2] || 'A';

    return majors.map(major => {
      const mCode = major.code || 'RIA';
      let matchScore = 0;

      // Trọng số vị trí của học sinh: 3 * C1 + 2 * C2 + 1 * C3
      if (mCode.includes(c1)) matchScore += 45;
      if (mCode.includes(c2)) matchScore += 30;
      if (mCode.includes(c3)) matchScore += 15;

      // Cộng thêm độ mạnh theo phần trăm thực tế của học sinh trong nhóm ngành đó
      const primaryPercent = percentages[major.primaryType] || 50;
      const secondaryPercent = percentages[major.secondaryType] || 50;
      const extraScore = Math.round((primaryPercent * 0.6 + secondaryPercent * 0.4) * 0.1);

      const totalFit = Math.min(98, Math.max(45, matchScore + extraScore));

      return {
        ...major,
        fitPercentage: totalFit
      };
    }).sort((a, b) => b.fitPercentage - a.fitPercentage);
  }

  /**
   * Phát hiện mâu thuẫn nội tâm theo đường chéo Lục giác
   * @param {string} code - Mã 3 chữ cái
   */
  function detectConflict(code) {
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
    calculateScores,
    matchMajors,
    detectConflict
  };
})();

window.HollandEngine = HollandEngine;
