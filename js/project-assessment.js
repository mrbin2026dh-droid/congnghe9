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
   * Yêu cầu của nghề cho 10 tiêu chí, viết theo NHÓM HOLLAND CHỦ ĐẠO của ngành (chữ cái đầu mã Holland).
   * Nhóm R giữ đúng tinh thần SGK Bài 5 (nghề kĩ thuật, công nghệ); các nhóm khác điều chỉnh cho phù hợp.
   * {name}: tên ngành · {careers}: nghề tiêu biểu của ngành
   */
  const GROUP_REQUIREMENTS = [
    { // 1. Hiểu biết về nguyên lý kĩ thuật, công nghệ
      R: 'Nắm vững nguyên lí cấu tạo, vận hành của máy móc, thiết bị, vật liệu và quy trình kĩ thuật dùng trong ngành {name}.',
      I: 'Hiểu sâu cơ sở khoa học (Toán, Vật lí, Hóa học, Sinh học, Tin học) và phương pháp nghiên cứu, thí nghiệm của ngành {name}.',
      A: 'Hiểu nguyên lí thẩm mĩ, bố cục, màu sắc và cách dùng các công cụ, phần mềm sáng tác của ngành {name}.',
      S: 'Hiểu tâm lí con người và các nguyên tắc, quy trình chuyên môn (chăm sóc, giảng dạy, tư vấn...) của ngành {name}.',
      E: 'Hiểu quy luật thị trường, kinh doanh, quản lí và cách ứng dụng công nghệ số trong ngành {name}.',
      C: 'Nắm vững quy trình nghiệp vụ, quy định, chuẩn mực và phần mềm quản lí dữ liệu dùng trong ngành {name}.'
    },
    { // 2. Kĩ năng sử dụng phương tiện, thiết bị
      R: 'Thao tác thành thạo, an toàn các dụng cụ, máy móc, thiết bị đo kiểm của ngành {name}.',
      I: 'Sử dụng chính xác thiết bị thí nghiệm, dụng cụ đo lường và phần mềm phân tích dữ liệu.',
      A: 'Sử dụng thành thạo công cụ sáng tác: máy ảnh, bảng vẽ, nhạc cụ, phần mềm đồ họa, dựng phim...',
      S: 'Sử dụng được các phương tiện hỗ trợ làm việc với con người: thiết bị dạy học, y tế, trình chiếu, hồ sơ điện tử...',
      E: 'Sử dụng tốt máy tính, phần mềm văn phòng, công cụ thuyết trình và các nền tảng kinh doanh số.',
      C: 'Sử dụng thành thạo, chính xác máy tính, phần mềm bảng tính, kế toán, quản lí kho hoặc hồ sơ.'
    },
    { // 3. Khả năng làm việc độc lập & theo nhóm
      R: 'Tự hoàn thành công đoạn kĩ thuật được giao và phối hợp an toàn với tổ, đội tại xưởng, công trường, trang trại.',
      I: 'Kiên trì nghiên cứu độc lập trong thời gian dài, đồng thời biết chia sẻ, thảo luận kết quả với nhóm.',
      A: 'Tự chủ ý tưởng sáng tạo cá nhân và biết phối hợp với ê-kíp, khách hàng để hoàn thiện sản phẩm.',
      S: 'Làm việc nhóm tốt, phối hợp nhịp nhàng với đồng nghiệp để hỗ trợ con người hiệu quả.',
      E: 'Dẫn dắt, điều phối nhóm, chủ động ra quyết định và chịu trách nhiệm với kết quả chung.',
      C: 'Hoàn thành chính xác phần việc của mình theo quy trình và phối hợp chặt chẽ với các bộ phận liên quan.'
    },
    { // 4. Năng lực học Tin học, Ngoại ngữ, KHTN
      R: 'Học khá trở lên các môn Toán, Vật lí, Công nghệ, Tin học; đọc được tài liệu kĩ thuật tiếng Anh cơ bản.',
      I: 'Học tốt Toán, Khoa học tự nhiên (Lí, Hóa, Sinh) và Tin học; tiếng Anh đủ để đọc tài liệu khoa học.',
      A: 'Có năng khiếu Mĩ thuật hoặc Âm nhạc; học tốt Ngữ văn, Tin học (đồ họa, đa phương tiện) và tiếng Anh.',
      S: 'Học tốt Ngữ văn, Giáo dục công dân, Sinh học (với nghề y, sư phạm); diễn đạt tốt và có nền tảng tiếng Anh.',
      E: 'Học tốt Toán, Ngữ văn, tiếng Anh và Tin học; tự tin thuyết trình, giao tiếp.',
      C: 'Học tốt Toán, Tin học (bảng tính) và tiếng Anh; cẩn thận, ít sai sót khi tính toán.'
    },
    { // 5. Khả năng tự học, tự nghiên cứu
      R: 'Tự cập nhật công nghệ, máy móc mới qua tài liệu, video kĩ thuật và tự mày mò khắc phục sự cố.',
      I: 'Tự tìm đọc tài liệu, bài báo khoa học, tự đặt câu hỏi và kiểm chứng bằng thực nghiệm.',
      A: 'Tự tìm cảm hứng, học kĩ thuật sáng tác mới và xây dựng bộ sưu tập sản phẩm (portfolio).',
      S: 'Tự học về tâm lí, kĩ năng giao tiếp và cập nhật kiến thức chuyên môn để hỗ trợ con người tốt hơn.',
      E: 'Tự cập nhật xu hướng thị trường, mô hình kinh doanh và kĩ năng quản lí mới.',
      C: 'Tự cập nhật quy định, văn bản và phần mềm nghiệp vụ mới.'
    },
    { // 6. Loại công việc yêu thích
      R: 'Thích vận hành, lắp ráp, bảo dưỡng, sửa chữa máy móc, thiết bị – công việc hằng ngày của {careers}.',
      I: 'Thích quan sát, phân tích, thí nghiệm, giải quyết vấn đề phức tạp – công việc hằng ngày của {careers}.',
      A: 'Thích sáng tạo, thiết kế, thể hiện ý tưởng bằng hình ảnh, âm thanh, câu chữ – công việc hằng ngày của {careers}.',
      S: 'Thích giảng giải, chăm sóc, tư vấn, giúp đỡ người khác – công việc hằng ngày của {careers}.',
      E: 'Thích thuyết phục, lãnh đạo, kinh doanh, tổ chức dự án – công việc hằng ngày của {careers}.',
      C: 'Thích sắp xếp, ghi chép, tính toán, xử lí số liệu theo quy trình – công việc hằng ngày của {careers}.'
    },
    { // 7. Đối tượng lao động yêu thích
      R: 'Làm việc trực tiếp với máy móc, vật liệu, cây trồng, vật nuôi hoặc công trình để tạo ra sản phẩm cụ thể.',
      I: 'Làm việc với dữ liệu, mẫu vật, hiện tượng tự nhiên và các bài toán khoa học.',
      A: 'Làm việc với ý tưởng, hình ảnh, âm thanh, chất liệu nghệ thuật để tạo ra sản phẩm sáng tạo.',
      S: 'Làm việc trực tiếp với con người: học sinh, người bệnh, khách hàng, cộng đồng.',
      E: 'Làm việc với con người, thị trường, nguồn vốn và các dự án kinh doanh.',
      C: 'Làm việc với số liệu, hồ sơ, văn bản, hàng hóa cần được quản lí chính xác.'
    },
    { // 8. Môi trường làm việc mong muốn
      R: 'Xưởng sản xuất, công trường, trang trại hoặc phòng kĩ thuật; cần sức khỏe tốt và tuân thủ an toàn lao động.',
      I: 'Phòng thí nghiệm, viện nghiên cứu, phòng máy; môi trường yên tĩnh, đòi hỏi tập trung cao.',
      A: 'Studio, xưởng sáng tác; môi trường tự do, linh hoạt nhưng chịu áp lực về ý tưởng và thời hạn.',
      S: 'Trường học, bệnh viện, trung tâm xã hội; tiếp xúc nhiều người, cần kiên nhẫn và thấu cảm.',
      E: 'Văn phòng, doanh nghiệp, thị trường; năng động, cạnh tranh, có áp lực chỉ tiêu.',
      C: 'Văn phòng, ngân hàng, kho vận; ổn định, ngăn nắp, có quy định rõ ràng.'
    },
    { // 9. 5 nét cá tính tiêu biểu
      R: 'Cần cù, chịu khó, thận trọng, kỉ luật cao và tuân thủ quy trình an toàn.',
      I: 'Tò mò, kiên nhẫn, tư duy logic, trung thực và cẩn thận với số liệu.',
      A: 'Giàu trí tưởng tượng, nhạy cảm thẩm mĩ, độc lập và dám thể hiện cái riêng.',
      S: 'Thân thiện, kiên nhẫn, giàu lòng trắc ẩn, biết lắng nghe và có trách nhiệm.',
      E: 'Tự tin, quyết đoán, năng động, dám chấp nhận rủi ro và có khả năng thuyết phục.',
      C: 'Ngăn nắp, tỉ mỉ, chính xác, trung thực và tôn trọng quy định.'
    }
  ];

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const GROUP_NAMES = { R: 'Kĩ thuật', I: 'Nghiên cứu', A: 'Nghệ thuật', S: 'Xã hội', E: 'Quản lí', C: 'Nghiệp vụ' };

  /** Tiêu chí 10 (gia đình) phụ thuộc trình độ, thời gian đào tạo của ngành. */
  function familyRequirement(level) {
    const lv = String(level || '');
    const vocational = /9\+|trung cấp/i.test(lv);
    const university = /đại học|viện nghiên cứu/i.test(lv);
    if (vocational && university) {
      return 'Có nhiều lộ trình: học trung cấp ngay sau lớp 9 (mô hình 9+, 2–3 năm, vừa học văn hóa vừa học nghề) hoặc học THPT rồi cao đẳng, đại học. Gia đình cùng chọn lộ trình phù hợp với khả năng tài chính.';
    }
    if (vocational) {
      return 'Học trung cấp ngay sau lớp 9 (mô hình 9+, khoảng 2–3 năm, vừa học văn hóa vừa học nghề), chi phí thấp hơn và sớm đi làm. Gia đình ủng hộ con theo con đường học nghề.';
    }
    if (/viện nghiên cứu/i.test(lv)) {
      return 'Cần học THPT, đại học (khoảng 4–5 năm) và thường học tiếp sau đại học. Gia đình ủng hộ và chuẩn bị được kinh phí cho thời gian học dài.';
    }
    return 'Cần học THPT rồi cao đẳng (2–3 năm) hoặc đại học (khoảng 4–5 năm). Gia đình ủng hộ và chuẩn bị được kinh phí học tập, sinh hoạt trong thời gian đào tạo.';
  }

  /**
   * Yêu cầu của NGÀNH ĐANG CHỌN cho 10 tiêu chí Bài 5 (cột 2 của ma trận đánh giá).
   * Không có ngành -> dùng yêu cầu chung của nghề kĩ thuật, công nghệ theo SGK.
   * @param {Object} major ngành (name, code, level, careers)
   * @returns {string[]} 10 câu yêu cầu
   */
  function getMajorRequirements(major) {
    if (!major || !major.name) return CRITERIA_DEFINITIONS.map(c => c.requirement);
    const group = String(major.primaryType || major.code || 'R').trim().toUpperCase()[0];
    const g = GROUP_NAMES[group] ? group : 'R';
    const careers = Array.isArray(major.careers) && major.careers.length > 0
      ? major.careers.slice(0, 2).join(', ')
      : `người làm ngành ${major.name}`;
    const fill = text => text.replace(/\{name\}/g, major.name).replace(/\{careers\}/g, careers);
    const reqs = GROUP_REQUIREMENTS.map(row => fill(row[g]));
    reqs.push(familyRequirement(major.level));
    return reqs;
  }

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
    const schoolName = escapeHtml(rawSchool.toUpperCase().startsWith('THCS') ? rawSchool.toUpperCase() : `THCS ${rawSchool.toUpperCase()}`);
    const studentName = escapeHtml(studentData.name || studentUser.name || 'Học sinh');
    const gradeName = escapeHtml(studentData.grade || studentUser.grade || '---');
    const academicYear = escapeHtml(studentData.academicYear || '2025 – 2026');
    const hollandCode = escapeHtml((studentData.code && studentData.code.trim().length > 0) ? studentData.code : 'Chưa làm khảo sát');
    const majorName = escapeHtml((targetMajor && targetMajor.name) ? targetMajor.name : 'Chưa lựa chọn ngành nghề');
    const majorCode = (targetMajor && targetMajor.code) ? targetMajor.code : '---';

    // Yêu cầu theo đúng ngành đã chọn (không dùng câu chung cho mọi ngành)
    const requirements = getMajorRequirements(targetMajor);
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
            <span style="font-size:12px; color:#475569;">${escapeHtml(selfTrait)}</span>
          </td>
          <td style="border:1px solid #334155; padding:8px; font-size:12px;">${escapeHtml(requirements[idx])}</td>
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
          @page { size: A4 portrait; margin: 12mm 15mm; }
          body { font-family: 'Times New Roman', serif; margin: 12mm 15mm; color: #000; line-height: 1.35; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @media print {
            body { margin: 0; }
            .no-print { display: none !important; }
          }
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
    getMajorRequirements,
    calculateProjectResult,
    generatePrintableHTML
  };
})();

window.ProjectAssessment = ProjectAssessment;
