/**
 * TeenVoca AI - Phân hệ Trò chơi Nghề nghiệp (Career Games)
 * 4 trò chơi học tập bám sát SGK Công nghệ 9 – Định hướng nghề nghiệp (Kết nối tri thức):
 *   1. Thám tử nghề nghiệp  – đọc gợi ý để đoán nghề (Bài 1, Bài 4)
 *   2. Phân loại nghề RIASEC – xếp nghề vào đúng nhóm Holland (Bài 4)
 *   3. Một ngày làm nghề     – nhập vai xử lí tình huống, khám phá thiên hướng (Bài 4, Bài 5)
 *   4. Đố vui SGK            – câu hỏi tính giờ về kiến thức 5 bài học
 * Nội dung do nhóm dự án tự biên soạn từ SGK; mã Holland của nghề chỉ mang tính tham khảo.
 * Điểm, lượt chơi và huy hiệu lưu vào hồ sơ học sinh (localStorage + Firebase) để giáo viên theo dõi.
 */
'use strict';

if (typeof window.sanitize === 'undefined') {
  window.sanitize = (html) => html;
}

const CareerGames = (() => {
  // ------------------------------------------------------------------ DỮ LIỆU
  const GROUPS = {
    R: { name: 'Kĩ thuật', color: '#2563eb' },
    I: { name: 'Nghiên cứu', color: '#0891b2' },
    A: { name: 'Nghệ thuật', color: '#d946ef' },
    S: { name: 'Xã hội', color: '#10b981' },
    E: { name: 'Quản lí', color: '#f59e0b' },
    C: { name: 'Nghiệp vụ', color: '#64748b' }
  };
  const ORDER = ['R', 'I', 'A', 'S', 'E', 'C'];

  // Thám tử nghề nghiệp: gợi ý xếp từ khó -> dễ
  const DETECTIVE_CASES = [
    {
      answer: 'Lập trình viên', code: 'IRC',
      clues: [
        'Công cụ làm việc chính của tôi là máy tính và tư duy logic.',
        'Mỗi ngày tôi đi "bắt bọ" – tìm và sửa lỗi (debug).',
        'Tôi viết mã nguồn để tạo ra phần mềm và ứng dụng.',
        'SGK Công nghệ 9 chọn nghề của tôi làm hồ sơ nghề tiêu biểu ở Bài 1.'
      ],
      note: 'Cần tư duy logic chặt chẽ, thành thạo ngôn ngữ lập trình và tự học công nghệ mới liên tục (SGK Bài 1).'
    },
    {
      answer: 'Kĩ thuật viên điện công nghiệp', code: 'RCI',
      clues: [
        'Trong nghề của tôi, nguy hiểm thường vô hình nên phải tuân thủ quy trình an toàn tuyệt đối.',
        'Tôi đọc sơ đồ, lắp đặt và bảo dưỡng tủ điện, động cơ trong nhà máy.',
        'Đồ nghề quen thuộc: đồng hồ vạn năng, bút thử điện, kìm cách điện.',
        'Tên nghề của tôi có chữ "điện".'
      ],
      note: 'Nghề kĩ thuật có nguy cơ mất an toàn (điện áp cao) nên cần ý thức kỉ luật, tuân thủ quy trình an toàn lao động.'
    },
    {
      answer: 'Kĩ sư xây dựng', code: 'RIE',
      clues: [
        'Tôi tính toán để công trình chịu được tải trọng, gió bão và động đất.',
        'Tôi đọc bản vẽ kết cấu và giám sát thi công ngoài công trường.',
        'Mũ bảo hộ và áo phản quang là "đồng phục" của tôi.',
        'Cầu, đường, nhà cao tầng là sản phẩm của tôi.'
      ],
      note: 'Sản phẩm của nghề kĩ thuật gồm cả công trình hạ tầng kĩ thuật; cần nắm vững nguyên lí toán – lí.'
    },
    {
      answer: 'Kĩ thuật viên ô tô', code: 'RIC',
      clues: [
        'Chỉ cần nghe tiếng máy, tôi có thể đoán được "bệnh".',
        'Tôi dùng máy chẩn đoán để đọc mã lỗi từ hệ thống điện tử.',
        'Nơi làm việc của tôi có cầu nâng, cờ lê và dầu nhớt.',
        'Tôi sửa chữa và bảo dưỡng xe ô tô.'
      ],
      note: 'Nghề phù hợp người thích máy móc, thao tác tay khéo léo; có thể học từ trình độ trung cấp (mô hình 9+).'
    },
    {
      answer: 'Nhà thiết kế đồ họa', code: 'AER',
      clues: [
        'Tôi kể chuyện bằng màu sắc, hình khối và con chữ.',
        'Tôi phải hiểu khách hàng muốn truyền tải thông điệp gì.',
        'Máy tính bảng vẽ và phần mềm thiết kế là công cụ của tôi.',
        'Logo, poster, bao bì sản phẩm đều do tôi tạo ra.'
      ],
      note: 'Nhóm A (Nghệ thuật) thích sáng tạo, tự do; nghề này vẫn cần kỉ luật về tiến độ và kĩ năng tin học.'
    },
    {
      answer: 'Giáo viên', code: 'SAE',
      clues: [
        'Thành công của tôi được đo bằng sự tiến bộ của người khác.',
        'Tôi chuẩn bị kế hoạch, học liệu trước mỗi buổi làm việc.',
        'Tôi đứng trên bục và giải thích kiến thức thật dễ hiểu.',
        'Học sinh gọi tôi là "thầy" hoặc "cô".'
      ],
      note: 'Nhóm S (Xã hội) thích giúp đỡ, hướng dẫn người khác, giàu lòng trắc ẩn.'
    },
    {
      answer: 'Điều dưỡng', code: 'SIR',
      clues: [
        'Tôi làm việc theo ca, kể cả ban đêm và ngày lễ.',
        'Tôi theo dõi mạch, nhiệt độ, huyết áp và ghi chép cẩn thận.',
        'Tôi chăm sóc, động viên người bệnh và hỗ trợ bác sĩ.',
        'Nơi làm việc của tôi là bệnh viện, trạm y tế.'
      ],
      note: 'Cần sự tận tâm (S), cẩn thận và hiểu biết khoa học sức khỏe (I).'
    },
    {
      answer: 'Kế toán', code: 'CEI',
      clues: [
        'Một con số sai có thể khiến tôi mất cả buổi để rà soát.',
        'Tôi làm việc với chứng từ, sổ sách và phần mềm bảng tính.',
        'Tôi lập báo cáo thu – chi, lãi – lỗ cho doanh nghiệp.',
        'Tên nghề của tôi gắn với "tính toán tiền bạc" của công ty.'
      ],
      note: 'Nhóm C (Nghiệp vụ) ngăn nắp, cẩn trọng, thích làm việc theo quy trình và số liệu.'
    },
    {
      answer: 'Nhà khởi nghiệp công nghệ', code: 'ECI',
      clues: [
        'Tôi chấp nhận rủi ro để biến một ý tưởng thành sản phẩm thật.',
        'Tôi phải thuyết phục nhà đầu tư và tuyển người giỏi về đội.',
        'Tôi lập kế hoạch kinh doanh cho một ứng dụng/thiết bị mới.',
        'Tôi sáng lập và điều hành một công ty công nghệ của riêng mình.'
      ],
      note: 'Nhóm E (Quản lí) tự tin, có khiếu lãnh đạo, thích thuyết phục và dám mạo hiểm.'
    },
    {
      answer: 'Kĩ sư nông nghiệp công nghệ cao', code: 'RIE',
      clues: [
        'Tôi làm việc với cả sinh vật sống lẫn cảm biến điện tử.',
        'Tôi điều khiển hệ thống tưới nhỏ giọt bằng điện thoại.',
        'Nhà kính, nhà màng và giống cây trồng mới là "phòng thí nghiệm" của tôi.',
        'Tôi giúp nông dân tăng năng suất nhờ ứng dụng công nghệ.'
      ],
      note: 'Chuyển dịch cơ cấu kinh tế và công nghệ 4.0 tạo ra nhu cầu mới cho nghề nông nghiệp công nghệ cao (SGK Bài 3).'
    },
    {
      answer: 'Kĩ sư trí tuệ nhân tạo (AI)', code: 'IRC',
      clues: [
        'Dữ liệu là "nguyên liệu" quan trọng nhất trong công việc của tôi.',
        'Tôi thử nghiệm, đo độ chính xác rồi cải tiến mô hình liên tục.',
        'Tôi "dạy" máy tính nhận biết hình ảnh, giọng nói.',
        'Trợ lí ảo, xe tự lái có dấu ấn công việc của tôi.'
      ],
      note: 'Đột phá khoa học – công nghệ như trí tuệ nhân tạo là một yếu tố chi phối thị trường lao động (SGK Bài 3).'
    },
    {
      answer: 'Thợ hàn', code: 'RCI',
      clues: [
        'Tôi luôn đeo mặt nạ bảo hộ vì ánh sáng trong công việc rất mạnh.',
        'Tôi phải đọc bản vẽ để nối các chi tiết đúng kích thước.',
        'Tia lửa bắn ra mỗi khi tôi làm việc với kim loại.',
        'Tôi nối các tấm, ống kim loại lại với nhau bằng nhiệt.'
      ],
      note: 'Nghề cần thể lực tốt, tuân thủ an toàn lao động; có thể học trình độ sơ cấp, trung cấp nghề.'
    }
  ];

  // Phân loại nghề vào nhóm Holland (nhóm chủ đạo, mang tính tham khảo)
  const RIASEC_CARDS = [
    { name: 'Thợ hàn', task: 'Nối kim loại bằng nhiệt, đọc bản vẽ kĩ thuật', type: 'R', why: 'Làm việc trực tiếp với công cụ, máy móc, vật liệu.' },
    { name: 'Kĩ thuật viên ô tô', task: 'Sửa chữa, bảo dưỡng xe', type: 'R', why: 'Thao tác tay, làm việc với máy móc.' },
    { name: 'Thợ mộc', task: 'Chế tác đồ gỗ, lắp đặt nội thất', type: 'R', why: 'Làm việc với dụng cụ và vật liệu cụ thể.' },
    { name: 'Kĩ thuật viên vận hành máy CNC', task: 'Vận hành máy gia công cơ khí tự động', type: 'R', why: 'Vận hành, điều chỉnh máy móc trong xưởng.' },
    { name: 'Thợ điện dân dụng', task: 'Lắp đặt, sửa chữa điện trong nhà', type: 'R', why: 'Công việc thực hành với thiết bị, công cụ.' },
    { name: 'Phi công', task: 'Điều khiển máy bay', type: 'R', why: 'Vận hành thiết bị phức tạp, cần phản xạ và thể lực.' },
    { name: 'Nhà khoa học dữ liệu', task: 'Phân tích dữ liệu lớn tìm quy luật', type: 'I', why: 'Quan sát, phân tích, giải quyết bài toán bằng tư duy logic.' },
    { name: 'Kĩ sư nghiên cứu vật liệu', task: 'Thử nghiệm vật liệu mới bền, nhẹ hơn', type: 'I', why: 'Nghiên cứu, thí nghiệm để khám phá.' },
    { name: 'Nhà hóa học', task: 'Làm thí nghiệm trong phòng lab', type: 'I', why: 'Khám phá bản chất sự vật bằng phương pháp khoa học.' },
    { name: 'Nhà sinh học', task: 'Nghiên cứu tế bào, gen, sinh vật', type: 'I', why: 'Tò mò, quan sát, phân tích.' },
    { name: 'Kĩ sư trí tuệ nhân tạo', task: 'Xây dựng mô hình học máy', type: 'I', why: 'Tư duy trừu tượng, giải bài toán phức tạp.' },
    { name: 'Bác sĩ chẩn đoán hình ảnh', task: 'Đọc phim X-quang, MRI để tìm bệnh', type: 'I', why: 'Phân tích, suy luận dựa trên bằng chứng khoa học.' },
    { name: 'Nhà thiết kế đồ họa', task: 'Thiết kế logo, poster, bao bì', type: 'A', why: 'Sáng tạo hình ảnh, cảm quan thẩm mĩ.' },
    { name: 'Kiến trúc sư', task: 'Thiết kế hình dáng, không gian công trình', type: 'A', why: 'Sáng tạo không gian và thẩm mĩ (kết hợp kĩ thuật).' },
    { name: 'Nhạc sĩ', task: 'Sáng tác, phối khí bài hát', type: 'A', why: 'Biểu đạt cảm xúc qua âm nhạc.' },
    { name: 'Nhiếp ảnh gia', task: 'Chụp và chỉnh sửa ảnh nghệ thuật', type: 'A', why: 'Sáng tạo, tự do thể hiện góc nhìn riêng.' },
    { name: 'Nhà thiết kế thời trang', task: 'Thiết kế mẫu quần áo', type: 'A', why: 'Sáng tạo mẫu mã, màu sắc.' },
    { name: 'Họa sĩ hoạt hình 3D', task: 'Dựng nhân vật, cảnh phim hoạt hình', type: 'A', why: 'Trí tưởng tượng và kĩ năng thể hiện nghệ thuật.' },
    { name: 'Giáo viên', task: 'Giảng dạy, hướng dẫn học sinh', type: 'S', why: 'Giúp đỡ, hướng dẫn người khác phát triển.' },
    { name: 'Điều dưỡng', task: 'Chăm sóc người bệnh', type: 'S', why: 'Chăm sóc, hỗ trợ con người.' },
    { name: 'Nhân viên công tác xã hội', task: 'Hỗ trợ người có hoàn cảnh khó khăn', type: 'S', why: 'Lắng nghe, giúp đỡ, kết nối cộng đồng.' },
    { name: 'Chuyên viên tư vấn hướng nghiệp', task: 'Tư vấn chọn nghề cho học sinh', type: 'S', why: 'Thấu hiểu và định hướng người khác.' },
    { name: 'Nhà vật lí trị liệu', task: 'Giúp người bệnh phục hồi vận động', type: 'S', why: 'Hỗ trợ, động viên người khác hồi phục.' },
    { name: 'Huấn luyện viên thể thao', task: 'Huấn luyện, động viên vận động viên', type: 'S', why: 'Truyền cảm hứng, hướng dẫn con người.' },
    { name: 'Giám đốc kinh doanh', task: 'Lập chiến lược bán hàng, quản lí đội ngũ', type: 'E', why: 'Lãnh đạo, thuyết phục, đặt mục tiêu.' },
    { name: 'Nhà khởi nghiệp', task: 'Sáng lập và điều hành công ty', type: 'E', why: 'Dám mạo hiểm, chủ động, có khiếu lãnh đạo.' },
    { name: 'Luật sư', task: 'Tranh tụng, bảo vệ quyền lợi khách hàng', type: 'E', why: 'Hoạt ngôn, thuyết phục, tranh luận.' },
    { name: 'Chuyên viên marketing', task: 'Quảng bá sản phẩm đến khách hàng', type: 'E', why: 'Thuyết phục, nắm bắt thị trường.' },
    { name: 'Quản lí dự án', task: 'Điều phối nguồn lực, tiến độ dự án', type: 'E', why: 'Điều hành, ra quyết định, chịu trách nhiệm.' },
    { name: 'Môi giới bất động sản', task: 'Đàm phán mua bán nhà đất', type: 'E', why: 'Đàm phán, thuyết phục, cạnh tranh.' },
    { name: 'Kế toán', task: 'Ghi chép sổ sách, lập báo cáo tài chính', type: 'C', why: 'Làm việc với số liệu theo quy trình chặt chẽ.' },
    { name: 'Nhân viên kho vận (logistics)', task: 'Quản lí xuất nhập hàng hóa', type: 'C', why: 'Ngăn nắp, theo dõi số liệu, quy trình.' },
    { name: 'Giao dịch viên ngân hàng', task: 'Xử lí giao dịch gửi, rút tiền', type: 'C', why: 'Cẩn thận, chính xác, tuân thủ quy định.' },
    { name: 'Thư kí văn phòng', task: 'Quản lí lịch làm việc, hồ sơ, văn bản', type: 'C', why: 'Tổ chức, sắp xếp thông tin gọn gàng.' },
    { name: 'Kiểm toán viên', task: 'Kiểm tra tính chính xác của báo cáo tài chính', type: 'C', why: 'Tỉ mỉ, đối chiếu số liệu theo chuẩn mực.' },
    { name: 'Nhân viên nhập liệu', task: 'Nhập, kiểm tra dữ liệu vào hệ thống', type: 'C', why: 'Chính xác, kiên nhẫn, làm theo quy trình.' }
  ];

  // Một ngày làm nghề: thực tập tại công ty sản xuất robot giáo dục
  const DAY_SCENES = [
    {
      time: '7:30', title: 'Ngày đầu thực tập',
      text: 'Em đến thực tập tại một công ty sản xuất robot giáo dục. Trưởng nhóm cho em tự chọn việc đầu tiên:',
      options: [
        { type: 'R', text: 'Lắp ráp khung và động cơ cho robot mẫu.' },
        { type: 'I', text: 'Đọc tài liệu, tìm hiểu vì sao cảm biến hay báo sai.' },
        { type: 'A', text: 'Phác thảo hình dáng và màu sắc cho robot mới.' },
        { type: 'S', text: 'Hướng dẫn nhóm học sinh tham quan xem robot hoạt động.' }
      ]
    },
    {
      time: '9:00', title: 'Sự cố trước buổi demo',
      text: 'Robot mẫu bất ngờ không chạy, 30 phút nữa khách hàng sẽ đến xem. Em sẽ:',
      options: [
        { type: 'R', text: 'Tháo vỏ, kiểm tra dây nối và động cơ.' },
        { type: 'I', text: 'Phân tích nhật kí lỗi để tìm nguyên nhân gốc.' },
        { type: 'E', text: 'Trấn an khách, đề xuất phương án thay thế để buổi demo vẫn diễn ra.' },
        { type: 'C', text: 'Rà lại danh sách kiểm tra (checklist) xem bước nào bị bỏ sót.' }
      ]
    },
    {
      time: '10:30', title: 'Họp lên ý tưởng',
      text: 'Cả nhóm họp để chọn ý tưởng cho sản phẩm mới. Em thường là người:',
      options: [
        { type: 'A', text: 'Đưa ra ý tưởng robot có "khuôn mặt" biểu cảm độc đáo.' },
        { type: 'E', text: 'Thuyết phục cả nhóm chọn ý tưởng có khả năng bán tốt nhất.' },
        { type: 'S', text: 'Lắng nghe và đảm bảo bạn nào cũng được góp ý.' },
        { type: 'C', text: 'Ghi biên bản, phân công rõ ai làm gì, hạn chót khi nào.' }
      ]
    },
    {
      time: '12:00', title: 'Giờ nghỉ trưa',
      text: 'Còn 30 phút nghỉ trưa, em thích làm gì nhất?',
      options: [
        { type: 'R', text: 'Ra xưởng xem các anh chị vận hành máy in 3D.' },
        { type: 'I', text: 'Đọc một bài báo khoa học về trí tuệ nhân tạo.' },
        { type: 'A', text: 'Chụp ảnh, dựng video ngắn giới thiệu công ty.' },
        { type: 'S', text: 'Trò chuyện, hỏi han các anh chị mới vào làm.' }
      ]
    },
    {
      time: '13:30', title: 'Phản hồi từ khách hàng',
      text: 'Một trường học phản hồi: "Robot khó sử dụng với học sinh lớp 6". Em sẽ:',
      options: [
        { type: 'S', text: 'Gọi điện hỏi thầy cô gặp khó khăn gì để hỗ trợ ngay.' },
        { type: 'A', text: 'Thiết kế lại sách hướng dẫn bằng hình minh họa sinh động.' },
        { type: 'I', text: 'Thu thập phản hồi của nhiều trường, tìm điểm khó dùng chung.' },
        { type: 'E', text: 'Đề xuất gói tập huấn cho các trường và lên kế hoạch triển khai.' }
      ]
    },
    {
      time: '15:00', title: 'Kho linh kiện lộn xộn',
      text: 'Kho linh kiện bừa bộn, mọi người mất nhiều thời gian tìm đồ. Em sẽ:',
      options: [
        { type: 'C', text: 'Lập bảng tính quản lí linh kiện theo mã số.' },
        { type: 'R', text: 'Sắp xếp lại kệ và dán nhãn từng ngăn.' },
        { type: 'E', text: 'Đề xuất quy định mới và phân công người phụ trách kho.' },
        { type: 'I', text: 'Thống kê linh kiện nào hay thiếu để dự báo nhu cầu.' }
      ]
    },
    {
      time: '16:00', title: 'Chuẩn bị triển lãm',
      text: 'Tuần sau công ty có gian hàng ở triển lãm công nghệ. Em xung phong:',
      options: [
        { type: 'A', text: 'Trang trí gian hàng, thiết kế poster.' },
        { type: 'E', text: 'Thuyết trình, giới thiệu sản phẩm cho khách tham quan.' },
        { type: 'S', text: 'Tổ chức trò chơi cho học sinh đến tham quan.' },
        { type: 'C', text: 'Chuẩn bị tài liệu và danh sách khách đăng kí.' }
      ]
    },
    {
      time: '17:00', title: 'Kế hoạch ngày mai',
      text: 'Cuối ngày, trưởng nhóm hỏi em muốn được giao việc gì vào ngày mai:',
      options: [
        { type: 'R', text: 'Trực tiếp chế tạo một bộ phận của robot.' },
        { type: 'I', text: 'Thử nghiệm, đo đạc hiệu năng của robot.' },
        { type: 'S', text: 'Hỗ trợ đào tạo người dùng mới.' },
        { type: 'C', text: 'Kiểm tra chất lượng và lập báo cáo số liệu.' }
      ]
    }
  ];

  // Đố vui SGK Công nghệ 9 – đáp án đúng luôn ở vị trí 0 (sẽ được trộn khi chơi)
  const SGK_QUESTIONS = [
    { lesson: 'Bài 1', q: 'Theo SGK, điểm khác biệt chủ yếu giữa nghề nghiệp và việc làm là gì?', options: ['Nghề nghiệp cần đào tạo bài bản, mang tính ổn định, gắn bó lâu dài', 'Nghề nghiệp không mang lại thu nhập', 'Việc làm luôn đòi hỏi bằng đại học', 'Hai khái niệm hoàn toàn giống nhau'], explain: 'Việc làm có thể chỉ là công việc thời vụ; nghề nghiệp đòi hỏi đào tạo chuyên môn và có tính bền vững.' },
    { lesson: 'Bài 1', q: 'Đâu KHÔNG phải là phẩm chất cần có của người lao động kĩ thuật, công nghệ?', options: ['Làm theo cảm hứng, bỏ qua quy trình an toàn', 'Ý thức kỉ luật, tuân thủ quy trình an toàn', 'Cần cù, tỉ mỉ, kiên nhẫn', 'Tinh thần học tập suốt đời'], explain: 'SGK nhấn mạnh tuân thủ nghiêm ngặt quy trình an toàn lao động và bảo vệ môi trường.' },
    { lesson: 'Bài 1', q: 'Môi trường làm việc của nghề kĩ thuật, công nghệ có đặc điểm nào?', options: ['Năng động, đổi mới nhanh, có thể tiềm ẩn nguy cơ mất an toàn', 'Ít thay đổi, chỉ dùng công nghệ cũ', 'Hoàn toàn không có áp lực', 'Chỉ làm việc ngoài trời'], explain: 'Môi trường năng động, tốc độ đổi mới cao, có nguy cơ về điện, nhiệt, hóa chất, cơ khí.' },
    { lesson: 'Bài 1', q: 'Hồ sơ nghề tiêu biểu được giới thiệu trong Bài 1 là nghề nào?', options: ['Lập trình viên', 'Bác sĩ', 'Kế toán', 'Ca sĩ'], explain: 'Lập trình viên: viết mã nguồn, sửa lỗi, tối ưu hệ thống, bảo mật thông tin.' },
    { lesson: 'Bài 1', q: 'Chọn đúng nghề nghiệp mang lại ý nghĩa gì cho xã hội?', options: ['Giảm thất nghiệp và lãng phí nguồn lực đào tạo', 'Làm tăng số người thất nghiệp', 'Không có ý nghĩa gì', 'Chỉ có lợi cho cá nhân'], explain: 'Chọn đúng nghề giúp giảm thất nghiệp, giảm lãng phí khi làm trái ngành, đáp ứng nhu cầu nhân lực.' },
    { lesson: 'Bài 2', q: 'Thời điểm phân luồng thứ nhất trong hệ thống giáo dục là khi nào?', options: ['Sau khi tốt nghiệp THCS (hết lớp 9)', 'Sau khi học xong tiểu học', 'Sau khi tốt nghiệp đại học', 'Khi học lớp 7'], explain: 'Có hai thời điểm phân luồng: sau THCS và sau THPT.' },
    { lesson: 'Bài 2', q: 'Mô hình đào tạo "9+" là gì?', options: ['Tốt nghiệp THCS vào trường nghề, vừa học văn hóa vừa học nghề', 'Học đại học trong 9 năm', 'Học thêm 9 môn văn hóa', 'Chỉ học nghề, không học văn hóa'], explain: 'Đây là hướng thứ 2 sau THCS: học trung cấp tại trường nghề theo mô hình 9+.' },
    { lesson: 'Bài 2', q: 'Khung trình độ quốc gia Việt Nam gồm bao nhiêu bậc?', options: ['8 bậc', '5 bậc', '6 bậc', '10 bậc'], explain: 'Từ Sơ cấp I (bậc 1) đến Tiến sĩ (bậc 8).' },
    { lesson: 'Bài 2', q: 'Trình độ trung cấp dành cho học sinh tốt nghiệp THCS kéo dài khoảng bao lâu?', options: ['2 – 3 năm', '3 tháng', '5 năm', '1 tháng'], explain: 'Trung cấp: 2 – 3 năm (sau THCS) hoặc 1 – 2 năm (sau THPT).' },
    { lesson: 'Bài 3', q: 'Thị trường lao động là nơi trao đổi "hàng hóa đặc biệt" nào?', options: ['Sức lao động', 'Vàng bạc', 'Đất đai', 'Máy móc'], explain: 'Trao đổi sức lao động giữa người lao động (cung) và người sử dụng lao động (cầu).' },
    { lesson: 'Bài 3', q: 'Theo SGK, thực trạng thị trường lao động Việt Nam hiện nay là gì?', options: ['Thừa lao động phổ thông, thiếu lao động kĩ thuật có tay nghề cao', 'Thừa kĩ sư, thiếu lao động phổ thông', 'Cung và cầu hoàn toàn cân bằng', 'Không cần lao động kĩ thuật'], explain: 'Mất cân đối cung – cầu: thiếu trầm trọng nhân lực kĩ thuật có tay nghề.' },
    { lesson: 'Bài 3', q: 'Bước đầu tiên trong quy trình tìm kiếm thông tin thị trường lao động là gì?', options: ['Xác định mục tiêu tìm kiếm', 'Chọn công cụ tìm kiếm', 'Thu thập và phân tích', 'Xác định nguồn tin'], explain: 'Quy trình 4 bước: mục tiêu → nguồn tin → công cụ → tìm kiếm, tổng hợp.' },
    { lesson: 'Bài 3', q: 'Nguồn nào đáng tin cậy để tra cứu thông tin thị trường lao động?', options: ['Cổng thông tin của Bộ Lao động – Thương binh và Xã hội', 'Lời đồn trên mạng xã hội', 'Bình luận ẩn danh', 'Quảng cáo tuyển dụng không rõ nguồn gốc'], explain: 'SGK gợi ý nguồn chính thống: cơ quan nhà nước, Tổng cục Thống kê, website các trường.' },
    { lesson: 'Bài 3', q: 'Yếu tố nào chi phối thị trường lao động theo SGK?', options: ['Đột phá khoa học – công nghệ như tự động hóa, trí tuệ nhân tạo', 'Màu sắc đồng phục công ty', 'Thời tiết trong ngày', 'Sở thích của người nổi tiếng'], explain: 'Có 5 yếu tố: khoa học – công nghệ, chuyển dịch cơ cấu kinh tế, nhu cầu lao động, nguồn cung lao động, chính sách Nhà nước.' },
    { lesson: 'Bài 4', q: 'Chữ "R" trong mật mã Holland là viết tắt của nhóm nào?', options: ['Realistic – Kĩ thuật', 'Research – Nghiên cứu', 'Responsible – Trách nhiệm', 'Reading – Đọc hiểu'], explain: 'R (Realistic): thích làm việc với công cụ, máy móc, khéo léo tay chân.' },
    { lesson: 'Bài 4', q: 'Người thích giúp đỡ, hướng dẫn, chăm sóc người khác thuộc nhóm Holland nào?', options: ['S – Xã hội', 'R – Kĩ thuật', 'C – Nghiệp vụ', 'I – Nghiên cứu'], explain: 'Nhóm S (Social) giàu lòng trắc ẩn, thích giao lưu, giúp đỡ.' },
    { lesson: 'Bài 4', q: 'Người ngăn nắp, cẩn trọng, thích làm việc với số liệu và quy trình thuộc nhóm nào?', options: ['C – Nghiệp vụ', 'A – Nghệ thuật', 'E – Quản lí', 'S – Xã hội'], explain: 'Nhóm C (Conventional) ngăn nắp, tỉ mỉ, làm việc theo quy trình.' },
    { lesson: 'Bài 4', q: 'Trong mô hình Cây nghề nghiệp, phần "gốc rễ" gồm những gì?', options: ['Sở thích, khả năng, cá tính, giá trị nghề nghiệp', 'Lương cao, công việc ổn định', 'Bạn bè, người nổi tiếng', 'Xe đẹp, nhà to'], explain: 'Lương cao, ổn định, được tôn trọng… là "quả ngọt"; phải chọn nghề bắt đầu từ gốc rễ.' },
    { lesson: 'Bài 4', q: 'Nếu chỉ chạy theo "quả ngọt" (nghề hot, lương cao) mà bỏ qua gốc rễ thì sao?', options: ['Cây dễ đổ: dễ chán nản và thất bại', 'Chắc chắn thành công', 'Không ảnh hưởng gì', 'Cây ra nhiều quả hơn'], explain: 'SGK nhấn mạnh: thiếu gốc rễ phù hợp thì "cây sẽ đổ".' },
    { lesson: 'Bài 4', q: 'Ikigai là điểm giao thoa của những yếu tố nào?', options: ['Điều em yêu thích, làm giỏi, xã hội cần và được trả tiền xứng đáng', 'Điều bố mẹ thích, bạn bè thích, thầy cô thích, hàng xóm thích', 'Lương cao, ít việc, gần nhà, nhiều ngày nghỉ', 'Học giỏi Toán, Văn, Anh, Tin'], explain: 'Triết lí Ikigai của người Nhật về lí tưởng sống.' },
    { lesson: 'Bài 4', q: 'Quy trình chọn nghề 3 bước theo SGK là gì?', options: ['Đánh giá bản thân → Tìm hiểu thị trường lao động → Ra quyết định', 'Hỏi bạn bè → Chọn nghề hot → Nộp hồ sơ', 'Ra quyết định → Đánh giá bản thân → Tìm hiểu thị trường', 'Chọn trường gần nhà → Chọn nghề → Đánh giá bản thân'], explain: 'Đối chiếu bước 1 và bước 2 để ra quyết định tối ưu.' },
    { lesson: 'Bài 4', q: 'Yếu tố nào là yếu tố KHÁCH QUAN tác động đến quyết định chọn nghề?', options: ['Điều kiện tài chính của gia đình', 'Sở thích của bản thân', 'Năng lực học tập', 'Cá tính bản thân'], explain: 'Khách quan: định hướng nhà trường, tài chính gia đình, xu hướng xã hội, bạn bè.' },
    { lesson: 'Bài 4', q: 'Khi bạn thân chọn một nghề, em nên làm gì?', options: ['Tham khảo nhưng không a dua, bắt chước', 'Chọn y hệt bạn để được học cùng nhau', 'Chọn nghề ngược lại với bạn', 'Không cần suy nghĩ gì'], explain: 'SGK: tuyệt đối không a dua, bắt chước bạn bè khi chọn nghề.' },
    { lesson: 'Bài 5', q: 'Trong dự án Bài 5, tổng điểm từ 7 đến 10 được xếp loại thế nào?', options: ['Phù hợp hoàn toàn', 'Phù hợp một phần', 'Không phù hợp', 'Cần làm lại'], explain: '1 – 3: không phù hợp; 4 – 6: phù hợp một phần; 7 – 10: phù hợp hoàn toàn.' },
    { lesson: 'Bài 5', q: 'Ma trận đánh giá Bài 5 gồm bao nhiêu tiêu chí?', options: ['10 tiêu chí', '5 tiêu chí', '3 tiêu chí', '20 tiêu chí'], explain: '10 tiêu chí thuộc 4 nhóm: năng lực, sở thích, cá tính, gia đình.' },
    { lesson: 'Bài 5', q: 'Bộ ba câu hỏi định hướng trong Bài 5 gồm những gì?', options: ['Hiểu mình – Hiểu nghề – Học nghề và rèn nghề', 'Học gì – Ăn gì – Chơi gì', 'Lương bao nhiêu – Làm ở đâu – Nghỉ mấy ngày', 'Ai giàu nhất – Ai nổi tiếng nhất – Ai giỏi nhất'], explain: 'Ba câu hỏi giúp học sinh định hướng con đường nghề nghiệp.' }
  ];

  const GAMES = {
    detective: { icon: '🕵️', title: 'Thám tử nghề nghiệp', desc: 'Đọc từng manh mối để đoán ra nghề nghiệp bí ẩn. Đoán càng sớm, điểm càng cao!', lesson: 'Bài 1 · Bài 4', rounds: 5, max: 500 },
    riasec: { icon: '🧭', title: 'Phân loại nghề RIASEC', desc: 'Xếp mỗi nghề vào đúng nhóm sở thích Holland: R – I – A – S – E – C.', lesson: 'Bài 4', rounds: 12, max: 120 },
    dayinlife: { icon: '🤖', title: 'Một ngày làm nghề', desc: 'Nhập vai thực tập sinh ở công ty robot. Cách em xử lí tình huống tiết lộ thiên hướng nghề nghiệp.', lesson: 'Bài 4 · Bài 5', rounds: DAY_SCENES.length, max: 100 },
    sgkquiz: { icon: '📚', title: 'Đố vui SGK Công nghệ 9', desc: '10 câu hỏi tính giờ về kiến thức định hướng nghề nghiệp trong SGK.', lesson: 'Bài 1 – Bài 5', rounds: 10, max: 200 }
  };
  const GAME_IDS = Object.keys(GAMES);
  const MAX_ACHIEVEMENT = GAME_IDS.reduce((sum, id) => sum + GAMES[id].max, 0);
  const QUIZ_SECONDS = 20;

  const BADGES = {
    first_game: { icon: '🌱', name: 'Khởi động', desc: 'Hoàn thành lượt chơi đầu tiên' },
    explorer: { icon: '🗺️', name: 'Nhà thám hiểm nghề', desc: 'Chơi đủ cả 4 trò chơi' },
    detective_master: { icon: '🕵️', name: 'Thám tử tài ba', desc: 'Đạt từ 400 điểm trò Thám tử nghề nghiệp' },
    riasec_expert: { icon: '🧭', name: 'Chuyên gia RIASEC', desc: 'Phân loại đúng cả 12 nghề' },
    sgk_scholar: { icon: '📚', name: 'Học giả SGK', desc: 'Trả lời đúng từ 8/10 câu Đố vui SGK' },
    self_reflect: { icon: '🪞', name: 'Soi chiếu bản thân', desc: 'Chơi "Một ngày làm nghề" sau khi đã có mã Holland để đối chiếu' },
    star_500: { icon: '⭐', name: 'Ngôi sao nghề nghiệp', desc: 'Đạt 500 điểm thành tích' },
    legend_800: { icon: '🏆', name: 'Huyền thoại hướng nghiệp', desc: 'Đạt 800 điểm thành tích' }
  };

  // ------------------------------------------------------------------ TIỆN ÍCH
  let app = null;
  let root = null;
  let state = null;
  let quizTimer = null;

  function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Mọi nội dung động đã được esc(); vẫn đi qua window.sanitize theo quy ước chung của dự án
  function setHtml(html) {
    if (!root) return;
    root.innerHTML = window.sanitize(html);
  }

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function groupLabel(type) {
    return `${type} – ${GROUPS[type] ? GROUPS[type].name : type}`;
  }

  function beep(freq, type, dur) {
    if (app && typeof app.playBeep === 'function') app.playBeep(freq, type, dur);
  }

  function emptyStats() {
    const zero = {};
    GAME_IDS.forEach(id => { zero[id] = 0; });
    return { best: { ...zero }, plays: { ...zero }, badges: {}, achievementPoints: 0, lastPlayedAt: '', dayInLifeCode: '' };
  }

  // Chuẩn hóa dữ liệu thống kê (dữ liệu từ Firebase có thể thiếu trường)
  function normalizeStats(raw) {
    const s = emptyStats();
    if (!raw || typeof raw !== 'object') return s;
    GAME_IDS.forEach(id => {
      s.best[id] = Math.max(0, Number(raw.best && raw.best[id]) || 0);
      s.plays[id] = Math.max(0, Number(raw.plays && raw.plays[id]) || 0);
    });
    if (raw.badges && typeof raw.badges === 'object') {
      Object.keys(raw.badges).forEach(k => { if (BADGES[k]) s.badges[k] = String(raw.badges[k] || ''); });
    }
    s.lastPlayedAt = String(raw.lastPlayedAt || '');
    s.dayInLifeCode = String(raw.dayInLifeCode || '');
    s.achievementPoints = GAME_IDS.reduce((sum, id) => sum + s.best[id], 0);
    return s;
  }

  // Gộp thống kê từ 2 nguồn (máy này và Firebase): lấy kỉ lục/lượt chơi lớn hơn, hợp nhất huy hiệu
  function mergeStats(a, b) {
    const x = normalizeStats(a);
    const y = normalizeStats(b);
    const m = emptyStats();
    GAME_IDS.forEach(id => {
      m.best[id] = Math.max(x.best[id], y.best[id]);
      m.plays[id] = Math.max(x.plays[id], y.plays[id]);
    });
    m.badges = { ...y.badges, ...x.badges };
    m.lastPlayedAt = x.lastPlayedAt > y.lastPlayedAt ? x.lastPlayedAt : y.lastPlayedAt;
    m.dayInLifeCode = (x.lastPlayedAt >= y.lastPlayedAt ? x.dayInLifeCode : y.dayInLifeCode) || x.dayInLifeCode || y.dayInLifeCode;
    m.achievementPoints = GAME_IDS.reduce((sum, id) => sum + m.best[id], 0);
    return m;
  }

  function currentStats() {
    return normalizeStats(app && app.studentProfile ? app.studentProfile.gameStats : null);
  }

  function studentHollandCode() {
    const p = (app && app.studentProfile) || {};
    const code = String(p.code || '').trim().toUpperCase();
    return (/^[RIASEC]{3}$/.test(code) && !p.isUndifferentiated) ? code : '';
  }

  /**
   * Ghi nhận kết quả 1 lượt chơi: cập nhật kỉ lục, lượt chơi, huy hiệu; lưu hồ sơ.
   * @returns {string[]} danh sách huy hiệu MỚI đạt được
   */
  function recordResult(gameId, points, meta = {}) {
    const stats = currentStats();
    stats.plays[gameId] = (stats.plays[gameId] || 0) + 1;
    stats.best[gameId] = Math.max(stats.best[gameId] || 0, Math.max(0, Math.round(points)));
    stats.lastPlayedAt = new Date().toISOString();
    if (gameId === 'dayinlife' && meta.code) stats.dayInLifeCode = meta.code;
    stats.achievementPoints = GAME_IDS.reduce((sum, id) => sum + stats.best[id], 0);

    const earned = [];
    const award = (id, condition) => {
      if (condition && !stats.badges[id]) {
        stats.badges[id] = stats.lastPlayedAt;
        earned.push(id);
      }
    };
    award('first_game', true);
    award('explorer', GAME_IDS.every(id => stats.plays[id] > 0));
    award('detective_master', stats.best.detective >= 400);
    award('riasec_expert', stats.best.riasec >= GAMES.riasec.max);
    award('sgk_scholar', gameId === 'sgkquiz' && meta.correct >= 8);
    award('self_reflect', gameId === 'dayinlife' && Boolean(studentHollandCode()));
    award('star_500', stats.achievementPoints >= 500);
    award('legend_800', stats.achievementPoints >= 800);

    if (app && typeof app.saveGameStats === 'function') {
      app.saveGameStats(stats);
    }
    return earned;
  }

  function stopTimer() {
    if (quizTimer) {
      clearInterval(quizTimer);
      quizTimer = null;
    }
  }

  // ------------------------------------------------------------------ GIAO DIỆN CHUNG
  function renderHub() {
    stopTimer();
    state = null;
    if (!root) return;
    const stats = currentStats();
    const badgeCount = Object.keys(stats.badges).length;

    const cards = GAME_IDS.map(id => {
      const g = GAMES[id];
      const played = stats.plays[id];
      return `
        <article class="game-card">
          <div class="game-card-icon" aria-hidden="true">${g.icon}</div>
          <h3 class="game-card-title">${esc(g.title)}</h3>
          <p class="game-card-desc">${esc(g.desc)}</p>
          <div class="game-card-meta">
            <span class="game-chip">📖 ${esc(g.lesson)}</span>
            <span class="game-chip">🏅 Kỉ lục: <strong>${stats.best[id]}</strong>/${g.max}</span>
            <span class="game-chip">🔁 ${played} lượt</span>
          </div>
          <button type="button" class="btn-primary game-play-btn" data-action="start" data-game="${id}">▶ Chơi ngay</button>
        </article>`;
    }).join('');

    const badgeItems = Object.keys(BADGES).map(id => {
      const b = BADGES[id];
      const owned = Boolean(stats.badges[id]);
      return `
        <div class="game-badge ${owned ? 'owned' : 'locked'}" title="${esc(b.desc)}">
          <span class="game-badge-icon" aria-hidden="true">${owned ? b.icon : '🔒'}</span>
          <span class="game-badge-name">${esc(b.name)}</span>
          <span class="game-badge-desc">${esc(b.desc)}</span>
        </div>`;
    }).join('');

    setHtml(`
      <div class="card-panel-header">
        <div>
          <h2 class="card-title">🎮 Trò Chơi Khám Phá Nghề Nghiệp</h2>
          <p class="card-subtitle">Vừa chơi vừa học kiến thức định hướng nghề nghiệp – SGK Công nghệ 9</p>
        </div>
        <div class="games-score-summary">
          <div><span class="games-score-num">${stats.achievementPoints}</span><span class="games-score-max">/${MAX_ACHIEVEMENT}</span></div>
          <div class="games-score-label">Điểm thành tích · ${badgeCount}/${Object.keys(BADGES).length} huy hiệu</div>
        </div>
      </div>
      <p class="games-hint">💡 Điểm thành tích = tổng kỉ lục của 4 trò chơi. Thầy cô có thể xem điểm và huy hiệu của em trên Bảng Giáo Viên.</p>
      <div class="games-grid">${cards}</div>
      <h3 class="games-section-title">🏅 Bộ sưu tập huy hiệu</h3>
      <div class="games-badges">${badgeItems}</div>`);
  }

  function gameHeader(gameId, progressText, score) {
    const g = GAMES[gameId];
    return `
      <div class="game-topbar">
        <button type="button" class="btn-secondary game-back-btn" data-action="hub">← Sảnh trò chơi</button>
        <div class="game-topbar-title">${g.icon} ${esc(g.title)}</div>
        <div class="game-topbar-stats">
          <span class="game-chip">${esc(progressText)}</span>
          <span class="game-chip game-chip-score">⭐ ${score} điểm</span>
        </div>
      </div>`;
  }

  function renderFinish(gameId, points, detailHtml, earned) {
    stopTimer();
    const g = GAMES[gameId];
    const badgeHtml = earned.length > 0
      ? `<div class="game-new-badges">🎉 Huy hiệu mới: ${earned.map(id => `<span class="game-badge-pill">${BADGES[id].icon} ${esc(BADGES[id].name)}</span>`).join(' ')}</div>`
      : '';
    setHtml(`
      ${gameHeader(gameId, 'Hoàn thành', points)}
      <div class="game-finish">
        <div class="game-finish-icon" aria-hidden="true">${g.icon}</div>
        <h3>Hoàn thành "${esc(g.title)}"!</h3>
        <div class="game-finish-score"><strong>${points}</strong> / ${g.max} điểm</div>
        ${badgeHtml}
        <div class="game-finish-detail">${detailHtml}</div>
        <div class="game-actions">
          <button type="button" class="btn-primary" data-action="start" data-game="${gameId}">🔁 Chơi lại</button>
          <button type="button" class="btn-secondary" data-action="hub">🏠 Về sảnh trò chơi</button>
        </div>
      </div>`);
    beep(880, 'triangle', 0.25);
  }

  // ------------------------------------------------------------------ 1. THÁM TỬ NGHỀ NGHIỆP
  function startDetective() {
    const cases = shuffle(DETECTIVE_CASES).slice(0, GAMES.detective.rounds).map(c => {
      const distractors = shuffle(DETECTIVE_CASES.filter(o => o.answer !== c.answer)).slice(0, 3).map(o => o.answer);
      return { ...c, options: shuffle([c.answer, ...distractors]) };
    });
    state = { game: 'detective', cases, idx: 0, revealed: 1, caseScore: 100, wrong: [], solved: false, total: 0, log: [] };
    renderDetective();
  }

  function renderDetective() {
    const s = state;
    const c = s.cases[s.idx];
    const clues = c.clues.slice(0, s.revealed).map((clue, i) =>
      `<li class="detective-clue"><span class="detective-clue-num">Manh mối ${i + 1}</span>${esc(clue)}</li>`).join('');
    const options = c.options.map(opt => {
      const isWrong = s.wrong.includes(opt);
      const isRight = s.solved && opt === c.answer;
      return `<button type="button" class="game-option ${isWrong ? 'wrong' : ''} ${isRight ? 'correct' : ''}"
        data-action="detective-guess" data-value="${esc(opt)}" ${isWrong || s.solved ? 'disabled' : ''}>${esc(opt)}</button>`;
    }).join('');

    const feedback = s.solved
      ? `<div class="game-feedback ok">✅ Chính xác: <strong>${esc(c.answer)}</strong> · Mã Holland tham khảo: <strong>${esc(c.code)}</strong> (${esc(groupLabel(c.code[0]))})<br>📖 ${esc(c.note)}</div>
         <div class="game-actions"><button type="button" class="btn-primary" data-action="detective-next">${s.idx < s.cases.length - 1 ? 'Vụ tiếp theo ➔' : 'Xem kết quả ➔'}</button></div>`
      : `<div class="game-actions">
           <button type="button" class="btn-secondary" data-action="detective-clue" ${s.revealed >= c.clues.length ? 'disabled' : ''}>🔎 Xem manh mối tiếp (−20 điểm)</button>
           <span class="game-chip">Điểm vụ này: <strong>${Math.max(10, s.caseScore)}</strong></span>
         </div>`;

    setHtml(`
      ${gameHeader('detective', `Vụ ${s.idx + 1}/${s.cases.length}`, s.total)}
      <div class="game-stage">
        <h3 class="game-question">🕵️ Nghề nghiệp bí ẩn này là gì?</h3>
        <ol class="detective-clues">${clues}</ol>
        <div class="game-options">${options}</div>
        ${feedback}
      </div>`);
  }

  function detectiveGuess(value) {
    const s = state;
    const c = s.cases[s.idx];
    if (s.solved) return;
    if (value === c.answer) {
      const gained = Math.max(10, s.caseScore);
      s.total += gained;
      s.solved = true;
      s.log.push({ answer: c.answer, gained, clues: s.revealed });
      beep(880, 'sine', 0.12);
    } else {
      if (!s.wrong.includes(value)) s.wrong.push(value);
      s.caseScore -= 30;
      if (s.revealed < c.clues.length) s.revealed += 1;
      beep(220, 'sawtooth', 0.15);
    }
    renderDetective();
  }

  function detectiveClue() {
    const s = state;
    if (s.solved || s.revealed >= s.cases[s.idx].clues.length) return;
    s.revealed += 1;
    s.caseScore -= 20;
    beep(520);
    renderDetective();
  }

  function detectiveNext() {
    const s = state;
    if (s.idx < s.cases.length - 1) {
      s.idx += 1;
      s.revealed = 1;
      s.caseScore = 100;
      s.wrong = [];
      s.solved = false;
      renderDetective();
      return;
    }
    const earned = recordResult('detective', s.total);
    const rows = s.log.map((l, i) => `<li>Vụ ${i + 1}: <strong>${esc(l.answer)}</strong> – dùng ${l.clues} manh mối, +${l.gained} điểm</li>`).join('');
    renderFinish('detective', s.total, `<ul class="game-summary-list">${rows}</ul>`, earned);
  }

  // ------------------------------------------------------------------ 2. PHÂN LOẠI NGHỀ RIASEC
  function startRiasec() {
    // Mỗi nhóm 2 nghề để bài cân bằng
    const cards = shuffle(ORDER.flatMap(t => shuffle(RIASEC_CARDS.filter(c => c.type === t)).slice(0, 2)));
    state = { game: 'riasec', cards, idx: 0, answered: null, correct: 0, total: 0, mistakes: [] };
    renderRiasec();
  }

  function renderRiasec() {
    const s = state;
    const c = s.cards[s.idx];
    const buttons = ORDER.map(t => {
      let cls = '';
      if (s.answered) {
        if (t === c.type) cls = 'correct';
        else if (t === s.answered) cls = 'wrong';
      }
      return `<button type="button" class="game-option riasec-option ${cls}" style="--group-color:${GROUPS[t].color}"
        data-action="riasec-pick" data-value="${t}" ${s.answered ? 'disabled' : ''}>
        <strong>${t}</strong><span>${esc(GROUPS[t].name)}</span></button>`;
    }).join('');

    const feedback = s.answered
      ? `<div class="game-feedback ${s.answered === c.type ? 'ok' : 'bad'}">${s.answered === c.type ? '✅ Chính xác!' : `❌ Chưa đúng. Đáp án: <strong>${esc(groupLabel(c.type))}</strong>.`} ${esc(c.why)}</div>
         <div class="game-actions"><button type="button" class="btn-primary" data-action="riasec-next">${s.idx < s.cards.length - 1 ? 'Nghề tiếp theo ➔' : 'Xem kết quả ➔'}</button></div>`
      : '';

    setHtml(`
      ${gameHeader('riasec', `Nghề ${s.idx + 1}/${s.cards.length}`, s.total)}
      <div class="game-stage">
        <div class="riasec-card">
          <div class="riasec-card-name">${esc(c.name)}</div>
          <div class="riasec-card-task">Công việc chính: ${esc(c.task)}</div>
        </div>
        <h3 class="game-question">Nghề này thuộc nhóm sở thích Holland nào?</h3>
        <div class="game-options riasec-options">${buttons}</div>
        ${feedback}
      </div>`);
  }

  function riasecPick(type) {
    const s = state;
    if (s.answered) return;
    const c = s.cards[s.idx];
    s.answered = type;
    if (type === c.type) {
      s.correct += 1;
      s.total += 10;
      beep(880, 'sine', 0.1);
    } else {
      s.mistakes.push(c);
      beep(220, 'sawtooth', 0.15);
    }
    renderRiasec();
  }

  function riasecNext() {
    const s = state;
    if (s.idx < s.cards.length - 1) {
      s.idx += 1;
      s.answered = null;
      renderRiasec();
      return;
    }
    const earned = recordResult('riasec', s.total, { correct: s.correct });
    const review = s.mistakes.length > 0
      ? `<p>📌 Ôn lại các nghề em xếp chưa đúng:</p><ul class="game-summary-list">${s.mistakes.map(m => `<li><strong>${esc(m.name)}</strong> → ${esc(groupLabel(m.type))}: ${esc(m.why)}</li>`).join('')}</ul>`
      : '<p>🌟 Tuyệt vời! Em xếp đúng toàn bộ các nghề.</p>';
    renderFinish('riasec', s.total, `<p>Đúng <strong>${s.correct}/${s.cards.length}</strong> nghề.</p>${review}`, earned);
  }

  // ------------------------------------------------------------------ 3. MỘT NGÀY LÀM NGHỀ
  function startDayInLife() {
    const scenes = DAY_SCENES.map(sc => ({ ...sc, options: shuffle(sc.options) }));
    const zero = {};
    ORDER.forEach(t => { zero[t] = 0; });
    state = { game: 'dayinlife', scenes, idx: 0, picks: { ...zero }, offered: { ...zero } };
    renderDayInLife();
  }

  function renderDayInLife() {
    const s = state;
    const sc = s.scenes[s.idx];
    const options = sc.options.map((o, i) =>
      `<button type="button" class="game-option day-option" data-action="day-pick" data-value="${i}">${esc(o.text)}</button>`).join('');
    setHtml(`
      ${gameHeader('dayinlife', `Tình huống ${s.idx + 1}/${s.scenes.length}`, 0)}
      <div class="game-stage">
        <div class="day-scene-time">🕒 ${esc(sc.time)} · ${esc(sc.title)}</div>
        <h3 class="game-question">${esc(sc.text)}</h3>
        <div class="game-options day-options">${options}</div>
        <p class="games-hint">Không có đáp án đúng – sai. Hãy chọn điều em thực sự muốn làm nhất.</p>
      </div>`);
  }

  /**
   * Tính "mã trải nghiệm" từ các lựa chọn: tỉ lệ số lần chọn / số lần nhóm đó xuất hiện,
   * để nhóm xuất hiện nhiều hơn không bị lợi thế.
   */
  function dayInLifeCode(picks, offered) {
    const ratio = t => (offered[t] > 0 ? picks[t] / offered[t] : 0);
    return ORDER.slice().sort((a, b) => {
      const diff = ratio(b) - ratio(a);
      if (Math.abs(diff) > 1e-9) return diff;
      return picks[b] - picks[a] || ORDER.indexOf(a) - ORDER.indexOf(b);
    }).slice(0, 3).join('');
  }

  function dayPick(index) {
    const s = state;
    const sc = s.scenes[s.idx];
    const chosen = sc.options[index];
    if (!chosen) return;
    sc.options.forEach(o => { s.offered[o.type] += 1; });
    s.picks[chosen.type] += 1;
    beep(600 + s.idx * 30);
    if (s.idx < s.scenes.length - 1) {
      s.idx += 1;
      renderDayInLife();
      return;
    }
    const code = dayInLifeCode(s.picks, s.offered);
    const points = GAMES.dayinlife.max;
    const earned = recordResult('dayinlife', points, { code });
    const holland = studentHollandCode();
    const meta = (window.HollandEngine && window.HollandEngine.GROUP_METADATA) || {};
    const topMeta = meta[code[0]] || {};
    const samples = RIASEC_CARDS.filter(c => c.type === code[0]).slice(0, 4).map(c => c.name).join(', ');
    let compare;
    if (holland) {
      const common = code.split('').filter(ch => holland.includes(ch)).length;
      compare = `<p>🔍 Mã Holland từ bài trắc nghiệm của em: <strong>${esc(holland)}</strong> – trùng <strong>${common}/3</strong> chữ cái với mã trải nghiệm.
        ${common >= 2 ? 'Cách em xử lí tình huống khá nhất quán với kết quả trắc nghiệm.' : 'Có sự khác biệt – em hãy trao đổi thêm với thầy cô hoặc làm lại trắc nghiệm khi có thêm trải nghiệm.'}</p>`;
    } else {
      compare = '<p>📝 Em chưa có mã Holland. Hãy làm bài <strong>Trắc nghiệm Holland</strong> để đối chiếu với mã trải nghiệm này nhé!</p>';
    }
    const bars = ORDER.map(t => {
      const pct = s.offered[t] > 0 ? Math.round((s.picks[t] / s.offered[t]) * 100) : 0;
      return `<div class="day-bar-row"><span class="day-bar-label">${t}</span><div class="day-bar-bg"><div class="day-bar-fill" style="width:${pct}%; background:${GROUPS[t].color};"></div></div><span class="day-bar-val">${pct}%</span></div>`;
    }).join('');
    const detail = `
      <p>Mã trải nghiệm của em: <strong class="day-code">${esc(code)}</strong></p>
      <p>Nhóm nổi bật: <strong>${esc(groupLabel(code[0]))}</strong>${topMeta.description ? ` – ${esc(topMeta.description)}` : ''}</p>
      <div class="day-bars">${bars}</div>
      <p>💼 Một số nghề thuộc nhóm ${esc(code[0])}: ${esc(samples)}.</p>
      ${compare}
      <p class="games-hint">⚠️ Đây là trò chơi khám phá, không thay thế bài trắc nghiệm Holland.</p>`;
    renderFinish('dayinlife', points, detail, earned);
  }

  // ------------------------------------------------------------------ 4. ĐỐ VUI SGK
  function startQuiz() {
    const questions = shuffle(SGK_QUESTIONS).slice(0, GAMES.sgkquiz.rounds).map(q => {
      const correct = q.options[0];
      return { ...q, correct, options: shuffle(q.options) };
    });
    state = { game: 'sgkquiz', questions, idx: 0, answered: null, timeLeft: QUIZ_SECONDS, correct: 0, total: 0, mistakes: [] };
    renderQuiz();
    startQuizTimer();
  }

  function startQuizTimer() {
    stopTimer();
    quizTimer = setInterval(() => {
      if (!state || state.game !== 'sgkquiz' || state.answered) {
        stopTimer();
        return;
      }
      // Tạm dừng đếm giờ khi học sinh rời khỏi tab trò chơi
      if (!root || root.offsetParent === null) return;
      state.timeLeft -= 1;
      if (state.timeLeft <= 0) {
        quizAnswer(null);
        return;
      }
      const timerEl = root.querySelector('[data-role="quiz-timer"]');
      const barEl = root.querySelector('[data-role="quiz-timer-bar"]');
      if (timerEl) timerEl.textContent = `⏱ ${state.timeLeft}s`;
      if (barEl) barEl.style.width = `${(state.timeLeft / QUIZ_SECONDS) * 100}%`;
    }, 1000);
  }

  function renderQuiz() {
    const s = state;
    const q = s.questions[s.idx];
    const options = q.options.map(opt => {
      let cls = '';
      if (s.answered) {
        if (opt === q.correct) cls = 'correct';
        else if (opt === s.answered) cls = 'wrong';
      }
      return `<button type="button" class="game-option ${cls}" data-action="quiz-answer" data-value="${esc(opt)}" ${s.answered ? 'disabled' : ''}>${esc(opt)}</button>`;
    }).join('');

    let feedback = '';
    if (s.answered) {
      const ok = s.answered === q.correct;
      const timeout = s.answered === '__timeout__';
      feedback = `<div class="game-feedback ${ok ? 'ok' : 'bad'}">${ok ? `✅ Chính xác! +${s.lastGain} điểm` : (timeout ? '⏰ Hết giờ!' : '❌ Chưa đúng.')} Đáp án: <strong>${esc(q.correct)}</strong><br>📖 ${esc(q.lesson)}: ${esc(q.explain)}</div>
        <div class="game-actions"><button type="button" class="btn-primary" data-action="quiz-next">${s.idx < s.questions.length - 1 ? 'Câu tiếp theo ➔' : 'Xem kết quả ➔'}</button></div>`;
    }

    setHtml(`
      ${gameHeader('sgkquiz', `Câu ${s.idx + 1}/${s.questions.length}`, s.total)}
      <div class="game-stage">
        <div class="quiz-timer-row">
          <span class="game-chip">📖 ${esc(q.lesson)}</span>
          <span class="game-chip quiz-timer" data-role="quiz-timer">⏱ ${s.timeLeft}s</span>
        </div>
        <div class="quiz-timer-bg"><div class="quiz-timer-bar" data-role="quiz-timer-bar" style="width:${(s.timeLeft / QUIZ_SECONDS) * 100}%"></div></div>
        <h3 class="game-question">${esc(q.q)}</h3>
        <div class="game-options">${options}</div>
        ${feedback}
      </div>`);
  }

  function quizAnswer(value) {
    const s = state;
    if (!s || s.answered) return;
    stopTimer();
    const q = s.questions[s.idx];
    s.answered = value === null ? '__timeout__' : value;
    s.lastGain = 0;
    if (value !== null && value === q.correct) {
      // 10 điểm đúng + thưởng tốc độ tối đa 10 điểm
      s.lastGain = 10 + Math.min(10, Math.floor(s.timeLeft / 2));
      s.total += s.lastGain;
      s.correct += 1;
      beep(880, 'sine', 0.1);
    } else {
      s.mistakes.push(q);
      beep(220, 'sawtooth', 0.15);
    }
    renderQuiz();
  }

  function quizNext() {
    const s = state;
    if (s.idx < s.questions.length - 1) {
      s.idx += 1;
      s.answered = null;
      s.timeLeft = QUIZ_SECONDS;
      renderQuiz();
      startQuizTimer();
      return;
    }
    const earned = recordResult('sgkquiz', s.total, { correct: s.correct });
    const review = s.mistakes.length > 0
      ? `<p>📌 Ôn lại kiến thức:</p><ul class="game-summary-list">${s.mistakes.map(m => `<li>${esc(m.lesson)} – ${esc(m.q)} → <strong>${esc(m.correct)}</strong></li>`).join('')}</ul>`
      : '<p>🌟 Xuất sắc! Em trả lời đúng tất cả các câu hỏi.</p>';
    renderFinish('sgkquiz', s.total, `<p>Đúng <strong>${s.correct}/${s.questions.length}</strong> câu.</p>${review}`, earned);
  }

  // ------------------------------------------------------------------ ĐIỀU PHỐI SỰ KIỆN
  function handleClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn || !root.contains(btn) || btn.disabled) return;
    const action = btn.getAttribute('data-action');
    const value = btn.getAttribute('data-value');
    switch (action) {
      case 'hub': renderHub(); beep(500); break;
      case 'start': {
        const game = btn.getAttribute('data-game');
        if (game === 'detective') startDetective();
        else if (game === 'riasec') startRiasec();
        else if (game === 'dayinlife') startDayInLife();
        else if (game === 'sgkquiz') startQuiz();
        beep(660);
        break;
      }
      case 'detective-guess': detectiveGuess(value); break;
      case 'detective-clue': detectiveClue(); break;
      case 'detective-next': detectiveNext(); break;
      case 'riasec-pick': riasecPick(value); break;
      case 'riasec-next': riasecNext(); break;
      case 'day-pick': dayPick(Number(value)); break;
      case 'quiz-answer': quizAnswer(value); break;
      case 'quiz-next': quizNext(); break;
      default: break;
    }
  }

  function init(appInstance) {
    app = appInstance;
    root = document.getElementById('games-root');
    if (!root) return;
    root.addEventListener('click', handleClick);
    renderHub();
  }

  // Mở tab trò chơi: giữ nguyên ván đang chơi, nếu không thì hiện sảnh (cập nhật điểm mới nhất)
  function show() {
    if (!root) return;
    if (!state) renderHub();
  }

  // Đổi người dùng (đăng nhập/đăng xuất): hủy ván đang chơi
  function reset() {
    stopTimer();
    state = null;
    if (root) renderHub();
  }

  return {
    GAMES,
    BADGES,
    MAX_ACHIEVEMENT,
    DETECTIVE_CASES,
    RIASEC_CARDS,
    DAY_SCENES,
    SGK_QUESTIONS,
    init,
    show,
    reset,
    normalizeStats,
    mergeStats,
    recordResult,
    dayInLifeCode
  };
})();

window.CareerGames = CareerGames;
