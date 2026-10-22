/**
 * EduPath AI - Multi-Agent Roleplay Room (4 Specialized AI Persona Agents)
 * Realistic, context-aware pedagogical guidance based on student's Holland Code & SGK data.
 */
'use strict';

const AIAgentsManager = (() => {
  const AGENTS = [
    {
      id: 'psychologist',
      name: 'TS. Minh Tâm',
      title: 'Chuyên gia Tâm lý Hướng nghiệp',
      avatar: '🧠',
      tag: 'Tâm lý & Động lực',
      greeting: 'Chào em! Thầy ở đây để lắng nghe những băn khoăn chân thật nhất về bản thân, sở thích và giải tỏa những áp lực định kiến khi chọn nghề.',
      presetPrompts: [
        'Bố mẹ muốn em theo nghề khác thì em nên nói chuyện thế nào?',
        'Con gái có thể theo ngành Cơ điện tử hay Công nghệ thông tin không?',
        'Em thấy mình không giỏi Toán, liệu có làm kỹ thuật được không?'
      ]
    },
    {
      id: 'tech-lead',
      name: 'KS. Hoàng Bách',
      title: 'Kỹ sư Trưởng Công nghệ & Chế tạo',
      avatar: '⚙️',
      tag: 'Thử thách Kỹ thuật',
      greeting: 'Chào bạn trẻ! Trong thế giới kỹ thuật, lý thuyết chỉ là 20%, 80% là khả năng xắn tay áo giải quyết sự cố. Hãy cùng tôi thử sức một vài bài toán thực tế nhé!',
      presetPrompts: [
        'Hãy cho em một thử thách tình huống của kỹ sư phần mềm!',
        'Nếu một máy móc trong xưởng tự động ngừng hoạt động, kỹ sư sẽ làm gì đầu tiên?',
        'Ngành Trí tuệ Nhân tạo (AI) đòi hỏi những kỹ năng thực tế nào?'
      ]
    },
    {
      id: 'streaming-officer',
      name: 'Cô Thanh Mai',
      title: 'Chuyên viên Phân luồng Giáo dục (Bài 2 SGK)',
      avatar: '🎓',
      tag: 'Phân luồng sau THCS',
      greeting: 'Chào em! Hết lớp 9 là một ngã rẽ quan trọng. Dù em chọn thi vào lớp 10 THPT hay chọn mô hình 9+ học nghề sớm, con đường nào cũng có giá trị riêng.',
      presetPrompts: [
        'Mô hình đào tạo nghề 9+ là gì? Sau này có học lên Đại học được không?',
        'Nếu sức học của em ở mức trung bình, em nên chọn hướng đi nào sau THCS?',
        'Học trường nghề sau lớp 9 thì bao nhiêu tuổi em có thể đi làm?'
      ]
    },
    {
      id: 'market-analyst',
      name: 'ThS. Trần Nam',
      title: 'Nhà Phân tích Thị trường Lao động (Bài 3 SGK)',
      avatar: '📈',
      tag: 'Thị trường Việc làm & Lương',
      greeting: 'Chào em! Mọi sự lựa chọn nghề nghiệp đều phải gắn liền với thực tiễn thị trường. Tôi sẽ cung cấp cho em các con số khách quan về nhu cầu tuyển dụng và mức lương.',
      presetPrompts: [
        'Tại Việt Nam, nhóm ngành kỹ thuật nào đang khát nhân lực chất lượng cao nhất?',
        'Mức lương khởi điểm thực tế của cử nhân CNTT và thợ cơ khí lành nghề là bao nhiêu?',
        'Tại sao thị trường lại thừa lao động phổ thông nhưng thiếu lao động kỹ thuật?'
      ]
    }
  ];

  /**
   * Tạo phản hồi thông minh dựa trên ngữ cảnh mã Holland của học sinh
   * @param {string} agentId - ID của tác tử
   * @param {string} userMessage - Câu hỏi của học sinh
   * @param {Object} studentProfile - Hồ sơ { code, scores, name }
   */
  function generateAgentResponse(agentId, userMessage, studentProfile) {
    const code = (studentProfile && studentProfile.code) || 'RIA';
    const name = (studentProfile && studentProfile.name) || 'em';
    const cleanMsg = (userMessage || '').toLowerCase();

    if (agentId === 'psychologist') {
      if (cleanMsg.includes('bố mẹ') || cleanMsg.includes('gia đình') || cleanMsg.includes('áp lực')) {
        return `Thầy rất hiểu cảm giác này của ${name}. Bố mẹ thúc giục thường xuất phát từ sự lo lắng cho tương lai của em, nhưng họ có thể chưa cập nhật xu hướng nghề nghiệp hiện đại. Em hãy dùng kết quả trắc nghiệm (${code}) và bảng Cây nghề nghiệp trong SGK để giải thích với bố mẹ: “Con hiểu bố mẹ lo cho con, nhưng con có thế mạnh ở nhóm ${code}, con tin mình sẽ hạnh phúc và kiên trì nhất khi được làm đúng sở trường.”`;
      }
      if (cleanMsg.includes('con gái') || cleanMsg.includes('nữ')) {
        return `Định kiến “con gái không nên làm kĩ thuật” hoàn toàn lỗi thời rồi ${name} nhé! Trong ngành Công nghệ và Thiết kế, sự tỉ mỉ, kiên nhẫn và khả năng tổ chức của các bạn nữ lại là lợi thế cạnh tranh cực lớn. Rất nhiều kỹ sư kiểm thử phần mềm (QA), quản lý sản phẩm (Product Manager) và kiến trúc sư hàng đầu hiện nay là nữ giới.`;
      }
      if (cleanMsg.includes('toán') || cleanMsg.includes('học kém') || cleanMsg.includes('không giỏi')) {
        return `Kỹ thuật không chỉ có giải Toán trên giấy tờ đâu ${name}! Nhóm Realistic (Kỹ thuật) là nhóm của những người tư duy qua bàn tay và thao tác thực tế. Có những bạn không thích Toán trừu tượng nhưng lại đấu dây điện, lắp ráp vi mạch cực chuẩn. Điểm số trường học chỉ đo một phần năng lực của em thôi!`;
      }
      return `Với mã Holland ${code}, em là người có sự kết hợp đặc biệt giữa tính hành động và tư duy thực tế. Lời khuyên của thầy dành cho ${name} là: Đừng chọn nghề chỉ vì người khác thấy nó “oai”, hãy chọn nghề mà khi thức dậy mỗi sáng, em cảm thấy hào hứng muốn bắt tay vào làm!`;
    }

    if (agentId === 'tech-lead') {
      if (cleanMsg.includes('thử thách') || cleanMsg.includes('tình huống')) {
        return `🔥 **Thử thách thực tế dành cho ${name}:**\nGiả sử em đang vận hành một dây chuyền đóng gói tự động thì cánh tay robot đột ngột dừng lại và còi báo động kêu. Em sẽ làm gì trong 3 bước sau?\n1. Bấm nút dừng khẩn cấp (E-Stop) để đảm bảo an toàn tuyệt đối.\n2. Quan sát bảng mã lỗi trên màn hình điều khiển (PLC).\n3. Kiểm tra cảm biến vật cản trên băng chuyền.\n👉 *Một kỹ sư giỏi luôn đặt sự an toàn lên hàng đầu rồi mới truy vết nguyên nhân!*`;
      }
      if (cleanMsg.includes('ai') || cleanMsg.includes('trí tuệ nhân tạo')) {
        return `Muốn làm việc trong ngành AI, em cần 3 chân kiềng: 1) Kỹ năng lập trình (Python, logic thuật toán); 2) Năng lực tư duy dữ liệu (hiểu bản chất số liệu); 3) Khả năng tự học liên tục vì công nghệ AI thay đổi từng tuần. Em đang có mã ${code}, hãy bắt đầu ngay từ những dự án nhỏ như lập trình trò chơi hoặc tự tạo một chatbot học tập!`;
      }
      return `Trong giới kỹ thuật, nguyên tắc vàng là: “Thất bại sớm để hoàn thiện nhanh”. Khi viết một đoạn mã bị lỗi (Bug) hay cắm nhầm một con điện trở, đừng nản lòng — đó chính là lúc em đang học được nhiều nhất đấy ${name}!`;
    }

    if (agentId === 'streaming-officer') {
      if (cleanMsg.includes('9+') || cleanMsg.includes('nghề') || cleanMsg.includes('trung cấp')) {
        return `Mô hình đào tạo 9+ (theo Luật Giáo dục 2019) là hướng đi rất ưu việt cho học sinh tốt nghiệp THCS! Em sẽ vào học trường trung cấp hoặc cao đẳng nghề, vừa học chương trình văn hóa THPT vừa học tay nghề chuyên sâu. Sau 3 năm (khi 18 tuổi), em vừa có bằng tốt nghiệp THPT vừa có bằng nghề chính quy, có thể đi làm kiếm thu nhập ngay hoặc học liên thông lên Đại học!`;
      }
      if (cleanMsg.includes('trung bình') || cleanMsg.includes('chọn hướng')) {
        return `Nếu học lực phổ thông ở mức vừa phải, việc cố thi vào các trường THPT công lập quá sức có thể khiến em bị áp lực kéo dài. Em hoàn toàn có thể cân nhắc 2 hướng: Học tại Trung tâm GDNN - GDTX hoặc vào thẳng trường Cao đẳng nghề đào tạo hệ 9+. Nhiều bạn tốt nghiệp trường nghề có việc làm và thu nhập sớm hơn cả sinh viên đại học đấy!`;
      }
      return `Hệ thống giáo dục quốc dân Việt Nam (Bài 2 SGK) đã được thiết kế liên thông mở rất thông thoáng. Dù em đi đường vòng qua trường nghề hay đi đường thẳng qua THPT rồi vào Đại học, đích đến cuối cùng vẫn là trở thành người lao động có tay nghề và có ích cho xã hội!`;
    }

    if (agentId === 'market-analyst') {
      if (cleanMsg.includes('khát') || cleanMsg.includes('nhu cầu') || cleanMsg.includes('ngành nào')) {
        return `Theo báo cáo thường niên của Bộ LĐTBXH và Tổng cục Thống kê, 3 nhóm ngành kỹ thuật đang có nhu cầu tuyển dụng cao nhất tại Việt Nam hiện nay là: 1) Công nghệ thông tin & An ninh mạng (+18.5%); 2) Cơ điện tử, Tự động hóa & Kỹ thuật Ô tô điện (+15.2%); 3) Kỹ thuật Điện & Năng lượng tái tạo (+12.8%).`;
      }
      if (cleanMsg.includes('lương') || cleanMsg.includes('thu nhập')) {
        return `Về mức thu nhập thực tế năm 2026: Kỹ sư mới ra trường dao động từ 10 - 18 triệu đồng/tháng; Kỹ thuật viên tay nghề cao (tốt nghiệp cao đẳng nghề/hệ 9+) khởi điểm từ 8 - 14 triệu đồng/tháng. Sau 3-5 năm tích lũy kinh nghiệm và có ngoại ngữ, mức thu nhập có thể đạt 25 - 45 triệu đồng/tháng!`;
      }
      return `Nghịch lý lớn nhất của thị trường lao động nước ta hiện nay là: Thừa lao động phổ thông (chưa qua đào tạo) nhưng lại cực kì khan hiếm lao động kỹ thuật lành nghề. Do đó, việc ${name} định hướng chuyên môn kỹ thuật ngay từ lớp 9 là một quyết định đi trước đón đầu rất sáng suốt!`;
    }

    return `Tôi rất sẵn lòng đồng hành và lắng nghe câu hỏi tiếp theo của ${name}!`;
  }

  return {
    AGENTS,
    generateAgentResponse
  };
})();

window.AIAgentsManager = AIAgentsManager;
