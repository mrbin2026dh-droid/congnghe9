/**
 * EduPath AI - Project 5 Assessment & Official Report Generator
 * Complies with SGK Cong Nghe 9 Lesson 5: 10-Criteria Suitability Matrix
 */
'use strict';

const ProjectAssessment = (() => {
  const CRITERIA_DEFINITIONS = [
    {
      id: 1,
      category: 'Năng lực',
      title: 'Hiểu biết về nguyên lý kĩ thuật, công nghệ',
      requirement: 'Có hiểu biết về các nguyên lý kĩ thuật, quy trình hoạt động cơ bản của máy móc hoặc hệ thống phần mềm.',
      selfTraitDefault: 'Đã nắm được các nguyên lý điện, cơ khí và tin học cơ bản trong chương trình THCS.'
    },
    {
      id: 2,
      category: 'Năng lực',
      title: 'Kĩ năng sử dụng phương tiện, thiết bị',
      requirement: 'Biết cách sử dụng các phương tiện, thiết bị kĩ thuật, công cụ đo đạc hoặc phần mềm đúng cách và an toàn.',
      selfTraitDefault: 'Có khả năng sử dụng máy vi tính, dụng cụ sửa chữa gia đình thành thạo.'
    },
    {
      id: 3,
      category: 'Năng lực',
      title: 'Khả năng làm việc độc lập & theo nhóm',
      requirement: 'Chủ động hoàn thành nhiệm vụ cá nhân đồng thời biết phối hợp ăn ý với đồng đội trong dự án chung.',
      selfTraitDefault: 'Từng tham gia các hoạt động làm việc nhóm, phân chia công việc hợp lý.'
    },
    {
      id: 4,
      category: 'Năng lực',
      title: 'Năng lực học Tin học, Ngoại ngữ, KHTN',
      requirement: 'Có kết quả học tập khá/tốt ở các môn Toán, Vật lí, Hóa học, Sinh học, Tin học và Tiếng Anh.',
      selfTraitDefault: 'Yêu thích học hỏi công nghệ số, điểm các môn Tự nhiên đạt từ Khá trở lên.'
    },
    {
      id: 5,
      category: 'Năng lực',
      title: 'Khả năng tự học, tự nghiên cứu',
      requirement: 'Tự giác tìm tòi tài liệu, xem video hướng dẫn kĩ thuật và tự mày mò khắc phục sự cố.',
      selfTraitDefault: 'Thường xuyên tự tìm kiếm giải pháp trên Internet khi gặp vấn đề khó.'
    },
    {
      id: 6,
      category: 'Sở thích',
      title: 'Loại công việc yêu thích',
      requirement: 'Thích vận hành, lắp ráp, thiết kế hoặc sửa chữa máy móc, thiết bị công nghệ.',
      selfTraitDefault: 'Thích tự tay tháo lắp đồ dùng trong nhà để khám phá cấu tạo bên trong.'
    },
    {
      id: 7,
      category: 'Sở thích',
      title: 'Đối tượng lao động yêu thích',
      requirement: 'Trực tiếp tạo ra các sản phẩm vật chất hoặc phần mềm ứng dụng thực tế có ích cho cuộc sống.',
      selfTraitDefault: 'Muốn nhìn thấy sản phẩm do chính tay mình tạo ra được vận hành hiệu quả.'
    },
    {
      id: 8,
      category: 'Sở thích',
      title: 'Môi trường làm việc mong muốn',
      requirement: 'Thích môi trường năng động, hiện đại, có tính kỉ luật, ngăn nắp và quy chuẩn rõ ràng.',
      selfTraitDefault: 'Thích làm việc ở xưởng thực hành, phòng máy tính có trang thiết bị hiện đại.'
    },
    {
      id: 9,
      category: 'Cá tính',
      title: '5 Nét cá tính kĩ thuật tiêu biểu',
      requirement: 'Cần cù/chịu khó, tính kỉ luật cao, có tinh thần trách nhiệm, thận trọng và tuân thủ quy trình.',
      selfTraitDefault: 'Là người cẩn thận, không làm ẩu, luôn kiểm tra kỹ càng trước khi bàn giao việc.'
    },
    {
      id: 10,
      category: 'Gia đình',
      title: 'Bối cảnh & Điều kiện gia đình',
      requirement: 'Gia đình ủng hộ và có khả năng tài chính đáp ứng thời gian đào tạo (Trung cấp, Cao đẳng hoặc Đại học).',
      selfTraitDefault: 'Gia đình luôn động viên và tạo điều kiện kinh phí để theo học nghề phù hợp.'
    }
  ];

  /**
   * Tính toán kết quả đánh giá theo thang điểm SGK Bài 5
   * @param {Array<boolean>} matches - Mảng 10 phần tử true (trùng khớp) hoặc false
   */
  function calculateProjectResult(matches) {
    let totalScore = 0;
    matches.forEach(m => {
      if (m === true) totalScore += 1;
    });

    let classification = '';
    let classBadge = '';
    let recommendation = '';

    if (totalScore === 0) {
      classification = 'Không phù hợp';
      classBadge = 'badge-danger';
      recommendation = 'Hiện tại em chưa tích chọn tiêu chí nào (0/10 điểm). Em hãy đọc kĩ 10 tiêu chí và bấm chọn các đặc điểm phù hợp của bản thân với nghề kĩ thuật đã chọn để xem kết quả phân tích!';
    } else if (totalScore <= 3) {
      classification = 'Không phù hợp';
      classBadge = 'badge-danger';
      recommendation = 'Hiện tại bản thân chưa có nhiều điểm tương đồng với nhóm nghề kĩ thuật này. Em nên cân nhắc khám phá các lĩnh vực khác (như Kinh doanh, Xã hội, Nghệ thuật) hoặc cần có kế hoạch rèn luyện nghiêm túc để bù đắp các tiêu chí còn thiếu.';
    } else if (totalScore <= 6) {
      classification = 'Phù hợp một phần';
      classBadge = 'badge-warning';
      recommendation = 'Em đã có một số phẩm chất và năng lực nền tảng tốt. Tuy nhiên, vẫn còn một vài khoảng cách về kĩ năng hoặc điều kiện đào tạo. Hãy lập kế hoạch học tập để bồi dưỡng thêm ngoại ngữ, kĩ năng thao tác và tham gia các hoạt động trải nghiệm thực tế.';
    } else {
      classification = 'Phù hợp hoàn toàn';
      classBadge = 'badge-success';
      recommendation = 'Xin chúc mừng! Em có độ tương thích rất cao với ngành nghề kĩ thuật, công nghệ đã chọn. Cả về sở thích, năng lực cốt lõi lẫn cá tính đều trùng khớp. Em hãy tự tin xây dựng lộ trình học tập để theo đuổi mục tiêu này!';
    }

    return {
      totalScore,
      maxScore: 10,
      classification,
      classBadge,
      recommendation
    };
  }

  /**
   * Sinh báo cáo in ấn chính thức chuẩn định dạng Bộ GD&ĐT
   */
  function generatePrintableHTML(studentData, targetMajor, matches, assessmentResult) {
    const dateStr = new Date().toLocaleDateString('vi-VN');
    const studentUser = (window.app && window.app.currentUser) || {};
    const rawSchool = studentData.school || studentUser.school || 'Trường THCS';
    const schoolName = rawSchool.toUpperCase().startsWith('THCS') ? rawSchool.toUpperCase() : `THCS ${rawSchool.toUpperCase()}`;
    const studentName = studentData.name || studentUser.name || 'Học sinh';
    const gradeName = studentData.grade || studentUser.grade || '9A1';
    const academicYear = studentData.academicYear || '2025 – 2026';
    const hollandCode = (studentData.code && studentData.code.trim().length > 0) ? studentData.code : 'Chưa làm khảo sát';
    const majorName = (targetMajor && targetMajor.name) ? targetMajor.name : 'Chưa lựa chọn ngành nghề';
    const majorCode = (targetMajor && targetMajor.code) ? targetMajor.code : '---';

    let rowsHTML = '';
    CRITERIA_DEFINITIONS.forEach((c, idx) => {
      const isMatched = matches[idx] === true;
      const selfTrait = (studentData.selfTraits && studentData.selfTraits[idx])
        ? studentData.selfTraits[idx]
        : c.selfTraitDefault;

      rowsHTML += `
        <tr>
          <td style="border:1px solid #334155; padding:8px; text-align:center;">${idx + 1}</td>
          <td style="border:1px solid #334155; padding:8px;">
            <strong>[${c.category}]</strong> ${c.title}<br>
            <span style="font-size:12px; color:#475569;">${selfTrait}</span>
          </td>
          <td style="border:1px solid #334155; padding:8px; font-size:12px;">${c.requirement}</td>
          <td style="border:1px solid #334155; padding:8px; text-align:center; font-weight:bold; color:#059669;">
            ${isMatched ? 'X' : ''}
          </td>
          <td style="border:1px solid #334155; padding:8px; text-align:center; font-weight:bold; color:#dc2626;">
            ${!isMatched ? 'X' : ''}
          </td>
        </tr>
      `;
    });

    const q1Ans = studentData.threeQuestions && studentData.threeQuestions.understandSelf ? studentData.threeQuestions.understandSelf : 'Chưa nhập câu trả lời';
    const q2Ans = studentData.threeQuestions && studentData.threeQuestions.understandCareer ? studentData.threeQuestions.understandCareer : 'Chưa nhập câu trả lời';
    const q3Ans = studentData.threeQuestions && studentData.threeQuestions.careerPathPlan ? studentData.threeQuestions.careerPathPlan : 'Chưa nhập câu trả lời';

    return `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="utf-8">
        <title>Báo Cáo Dự Án Bài 5 - Công Nghệ 9 - ${studentName}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 15mm; color: #000; line-height: 1.35; }
          .header { text-align: center; margin-bottom: 15px; }
          .header h4 { margin: 0; font-size: 13pt; font-weight: normal; }
          .header h3 { margin: 4px 0; font-size: 13pt; font-weight: bold; text-decoration: underline; }
          .title { text-align: center; margin: 15px 0 10px 0; font-size: 15pt; font-weight: bold; }
          .info-box { margin-bottom: 12px; font-size: 11.5pt; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; font-size: 10.5pt; }
          th { background-color: #f1f5f9; border: 1px solid #334155; padding: 6px; }
          .result-box { border: 1px solid #000; padding: 10px; margin-bottom: 15px; border-radius: 4px; }
          .questions-box { border: 1px solid #334155; padding: 10px; margin-bottom: 20px; border-radius: 4px; background: #fafafa; }
          .signatures { display: flex; justify-content: space-between; margin-top: 25px; text-align: center; }
          .sig-col { width: 30%; }
        </style>
      </head>
      <body>
        <div class="header">
          <h4>BỘ GIÁO DỤC VÀ ĐÀO TẠO — ${schoolName}</h4>
          <h3>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</h3>
          <p style="margin:2px 0; font-style:italic;">Độc lập – Tự do – Hạnh phúc</p>
        </div>

        <div class="title">BÁO CÁO DỰ ÁN HỌC TẬP (BÀI 5 SGK CÔNG NGHỆ 9)<br>
          <span style="font-size:12pt; font-weight:normal;">TỰ ĐÁNH GIÁ MỨC ĐỘ PHÙ HỢP CỦA BẢN THÂN VỚI NGÀNH NGHỀ KĨ THUẬT, CÔNG NGHỆ</span>
        </div>

        <div class="info-box">
          <p style="margin:3px 0;"><strong>Họ và tên học sinh:</strong> ${studentName} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Lớp:</strong> ${gradeName} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Năm học:</strong> ${academicYear}</p>
          <p style="margin:3px 0;"><strong>Mã Holland khảo sát:</strong> <strong style="color:#059669;">${hollandCode}</strong> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>Ngành nghề đánh giá:</strong> ${majorName} (Mã Holland nghề: <strong>${majorCode}</strong>)</p>
          <p style="margin:3px 0;"><strong>Ngày thực hiện:</strong> ${dateStr}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:5%;">STT</th>
              <th style="width:35%;">Đặc điểm của bản thân (1)</th>
              <th style="width:40%;">Đặc điểm và yêu cầu của nghề (2)</th>
              <th style="width:10%;">Trùng khớp (3)</th>
              <th style="width:10%;">Không trùng (4)</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>

        <div class="result-box">
          <p style="margin:3px 0;"><strong>TỔNG ĐIỂM TRÙNG KHỚP:</strong> ${assessmentResult.totalScore} / 10 điểm</p>
          <p style="margin:3px 0;"><strong>KẾT LUẬN MỨC ĐỘ PHÙ HỢP (SGK Bài 5):</strong> <span style="font-size:12pt; font-weight:bold; color:#059669;">${assessmentResult.classification.toUpperCase()}</span></p>
          <p style="margin:3px 0;"><strong>Nhận xét & Hướng dẫn của AI:</strong> ${assessmentResult.recommendation}</p>
        </div>

        <div class="questions-box">
          <h4 style="margin:0 0 6px 0; font-size:11pt; text-transform:uppercase; border-bottom:1px solid #cbd5e1; padding-bottom:3px;">
            🧭 KẾT QUẢ BỘ BA CÂU HỎI ĐỊNH HƯỚNG CUỘC ĐỜI (SGK BÀI 5, TRANG 35)
          </h4>
          <p style="margin:4px 0; font-size:10pt;">
            <strong>1. Hiểu mình:</strong> ${q1Ans}
          </p>
          <p style="margin:4px 0; font-size:10pt;">
            <strong>2. Hiểu nghề:</strong> ${q2Ans}
          </p>
          <p style="margin:4px 0; font-size:10pt;">
            <strong>3. Học nghề và rèn nghề (Định hướng phân luồng sau THCS):</strong> ${q3Ans}
          </p>
        </div>

        <div class="signatures">
          <div class="sig-col">
            <p><strong>HỌC SINH TỰ ĐÁNH GIÁ</strong><br><em>(Ký và ghi rõ họ tên)</em></p>
            <br><br><br>
            <p>${studentName}</p>
          </div>
          <div class="sig-col">
            <p><strong>Ý KIẾN PHỤ HUYNH</strong><br><em>(Ký và ghi rõ họ tên)</em></p>
            <br><br><br>
            <p>................................................</p>
          </div>
          <div class="sig-col">
            <p><strong>GIÁO VIÊN BỘ MÔN CHẤM</strong><br><em>(Ký, ghi điểm và nhận xét)</em></p>
            <br><br><br>
            <p>................................................</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  return {
    CRITERIA_DEFINITIONS,
    calculateProjectResult,
    generatePrintableHTML
  };
})();

window.ProjectAssessment = ProjectAssessment;
