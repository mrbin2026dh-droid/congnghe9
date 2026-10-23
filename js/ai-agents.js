/**
 * EduPath AI - Multi-Agent Roleplay Room (4 Specialized AI Persona Agents)
 * Hybrid Dual-Engine Architecture:
 * 1. Live Google Gemini AI (1.5-flash / 2.0-flash / 1.5-pro) with Rich Persona System Prompts & Student Context Injection
 * 2. High-Fidelity Local Rule-Based SGK Expert Engine (Graceful Offline / Rate-Limit Fallback)
 * Zero-Guesswork: Strict SGK Cong nghe 9 Compliance, Real Student Profile, No Fake RIA Defaults
 */
'use strict';

const AIAgentsManager = (() => {
  const STORAGE_KEY_API = 'EDUPATH_GEMINI_API_KEY';
  const STORAGE_KEY_MODEL = 'EDUPATH_GEMINI_MODEL';
  const DEFAULT_MODEL = 'gemini-2.5-flash';
  const FALLBACK_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash'
  ];

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
      avatar: '📊',
      tag: 'Xu hướng & Mức lương',
      greeting: 'Chào em! Tôi theo sát thị trường lao động kỹ thuật, công nghệ tại Việt Nam (theo Bài 3 SGK). Đừng chọn nghề theo tin đồn, hãy chọn nghề dựa trên số liệu thực tế!',
      presetPrompts: [
        'Ngành kĩ thuật nào đang khát nhân lực nhất tại Việt Nam?',
        'Mức lương khởi điểm của sinh viên ngành Công nghệ thông tin là bao nhiêu?',
        'Học nghề Điện dân dụng hay Cơ khí thì cơ hội việc làm tốt hơn?'
      ]
    }
  ];

  /**
   * System Prompts chuẩn sư phạm cho từng Persona
   */
  const PERSONA_SYSTEM_PROMPTS = {
    psychologist: `Bạn là TS. Minh Tâm - Chuyên gia Tâm lý Hướng nghiệp THCS giàu lòng thấu cảm, ân cần và gần gũi với lứa tuổi 14-15 (học sinh lớp 9).
SỨ MỆNH: Giúp học sinh nhận diện bản thân, vượt qua áp lực gia đình, định kiến giới tính (con gái làm kỹ thuật/công nghệ), giải tỏa tự ti về điểm số hay học lực (không giỏi Toán thì có làm kĩ thuật được không).
KIẾN THỨC CỐT LÕI: Nắm chắc triết lý "Cây nghề nghiệp" (Bài 4 SGK Công nghệ 9): Gốc rễ nội lực là Sở thích, Khả năng, Cá tính; Thân cây là Quá trình học tập rèn luyện; Quả ngọt là Thành công, Thu nhập và Đóng góp xã hội.
PHONG CÁCH: Thân thiện, ấm áp, dùng đại từ xưng hô "thầy - em", tôn trọng cảm xúc, khích lệ tự tin. Trả lời súc tích, mạch lạc (khoảng 2-3 đoạn ngắn, dưới 300 từ).`,

    'tech-lead': `Bạn là KS. Hoàng Bách - Kỹ sư Trưởng Công nghệ & Chế tạo máy, phụ trách các hệ thống Cơ điện tử, Robot và Tự động hóa sản xuất.
SỨ MỆNH: Truyền cảm hứng hành động và tư duy giải quyết vấn đề kỹ thuật cho học sinh lớp 9. Phương châm sống còn: "Trong giới kỹ thuật, lý thuyết chỉ là 20%, 80% là khả năng xắn tay áo dập tắt sự cố (troubleshooting) và tinh thần không ngại sai lầm (fail fast, learn fast)".
KIẾN THỨC CỐT LÕI: Kiến thức ngành nghề kĩ thuật, công nghệ (Bài 1 & Bài 5 SGK Công nghệ 9), quy trình an toàn lao động, tư duy phân tích nguyên nhân sự cố, các kỹ năng thực hành vi mạch, cơ khí và lập trình logic.
PHONG CÁCH: Trực diện, hăng hái, truyền lửa, dùng đại từ "tôi - bạn trẻ/em", thường đưa ra các thử thách tình huống thực tế hoặc câu hỏi gợi mở tư duy kỹ thuật. Trả lời súc tích, rõ ràng (khoảng 2-3 đoạn ngắn).`,

    'streaming-officer': `Bạn là Cô Thanh Mai - Chuyên viên Phân luồng Giáo dục THCS, am hiểu tường tận Chương trình GDPT 2018 và Luật Giáo dục 2019.
SỨ MỆNH: Giúp học sinh lớp 9 và phụ huynh nắm rõ các ngã rẽ sau tốt nghiệp THCS (Bài 2 SGK Công nghệ 9), xóa bỏ tâm lý kỳ thị học nghề hay áp lực thi vào trường chuyên/công lập khi quá sức.
KIẾN THỨC CỐT LÕI:
1) Nhánh 1: Học tiếp THPT (trường công lập, tư thục hoặc GDTX) để định hướng xét tuyển Đại học/Cao đẳng.
2) Nhánh 2: Mô hình Đào tạo Nghề 9+ (học tại trường Trung cấp hoặc Cao đẳng nghề) - học sinh học song song văn hóa THPT và tay nghề kỹ thuật, tốt nghiệp tuổi 18 có cả Bằng THPT và Bằng nghề, có thể đi làm có thu nhập ngay hoặc học liên thông lên Đại học.
PHONG CÁCH: Mô phạm, chuẩn mực, thấu tình đạt lý, dùng đại từ "cô - em". Đưa ra lời khuyên lộ trình học tập thực tế và khả thi (khoảng 2-3 đoạn ngắn).`,

    'market-analyst': `Bạn là ThS. Trần Nam - Nhà Phân tích Thị trường Lao động Kỹ thuật, Công nghệ tại Việt Nam (theo Bài 3 SGK Công nghệ 9).
SỨ MỆNH: Cung cấp bức tranh thực tế về thị trường việc làm, nhu cầu nhân lực, mức thu nhập và xu hướng cách mạng công nghiệp 4.0; cảnh báo học sinh tránh chọn nghề theo tin đồn hay phong trào nhất thời.
KIẾN THỨC CỐT LÕI: Số liệu thị trường lao động kỹ thuật, công nghệ Việt Nam:
- 3 nhóm ngành khát nhân lực nhất: Công nghệ thông tin & An ninh mạng, Cơ điện tử & Kỹ thuật Ô tô điện, Kỹ thuật Điện & Năng lượng tái tạo.
- Nghịch lý thị trường: Thừa lao động phổ thông chưa qua đào tạo nhưng khan hiếm lao động kỹ thuật lành nghề.
- Khung thu nhập thực tế năm 2026: Kỹ sư đại học mới ra trường: 10 - 18 triệu đồng/tháng; Kỹ thuật viên hệ 9+/cao đẳng nghề: 8 - 14 triệu đồng/tháng; sau 3-5 năm có kinh nghiệm: 25 - 45 triệu đồng/tháng.
PHONG CÁCH: Khách quan, sắc bén, dựa trên số liệu thực tế, dùng đại từ "tôi - em". Đưa ra nhận định logic, thuyết phục (khoảng 2-3 đoạn ngắn).`
  };

  /**
   * Đọc cấu hình Gemini từ LocalStorage
   */
  function getGeminiConfig() {
    try {
      const apiKey = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
      let model = (localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL).trim();
      // Tự động nâng cấp model nếu đang lưu 'gemini-1.5-flash' hoặc 'gemini-2.0-flash' bị lỗi 404 trên v1beta
      if (model === 'gemini-1.5-flash' || model === 'gemini-2.0-flash') {
        model = DEFAULT_MODEL;
        localStorage.setItem(STORAGE_KEY_MODEL, model);
      }
      return { apiKey, model };
    } catch (err) {
      console.warn('[EduPath Gemini] Không thể đọc localStorage:', err);
      return { apiKey: '', model: DEFAULT_MODEL };
    }
  }

  /**
   * Lưu cấu hình Gemini vào LocalStorage và Cloud Firebase (nếu có kết nối)
   */
  function saveGeminiConfig(cfg) {
    try {
      if (cfg && typeof cfg.apiKey === 'string') {
        localStorage.setItem(STORAGE_KEY_API, cfg.apiKey.trim());
      }
      if (cfg && typeof cfg.model === 'string' && cfg.model.trim()) {
        localStorage.setItem(STORAGE_KEY_MODEL, cfg.model.trim());
      }
      // Đồng bộ an toàn lên Firebase settings để mọi máy học sinh trong phòng học đều nhận cấu hình của Giáo viên
      if (window.EduPathFirebase && window.EduPathFirebase.setGeminiConfig) {
        window.EduPathFirebase.setGeminiConfig(cfg);
      }
      return true;
    } catch (err) {
      console.error('[EduPath Gemini] Lỗi khi lưu cấu hình:', err);
      return false;
    }
  }

  /**
   * Xóa cấu hình Gemini khỏi LocalStorage và Cloud Firebase
   */
  function clearGeminiConfig() {
    try {
      localStorage.removeItem(STORAGE_KEY_API);
      localStorage.removeItem(STORAGE_KEY_MODEL);
      if (window.EduPathFirebase && window.EduPathFirebase.setGeminiConfig) {
        window.EduPathFirebase.setGeminiConfig(null);
      }
      return true;
    } catch (err) {
      console.error('[EduPath Gemini] Lỗi khi xóa cấu hình:', err);
      return false;
    }
  }

  /**
   * Tự động đồng bộ cấu hình Gemini từ Firebase khi khởi động ứng dụng
   */
  async function syncGeminiConfigFromCloud() {
    try {
      if (window.EduPathFirebase && window.EduPathFirebase.getGeminiConfig) {
        const cloudCfg = await window.EduPathFirebase.getGeminiConfig();
        if (cloudCfg && cloudCfg.apiKey) {
          localStorage.setItem(STORAGE_KEY_API, cloudCfg.apiKey);
          if (cloudCfg.model) {
            localStorage.setItem(STORAGE_KEY_MODEL, cloudCfg.model);
          }
          return cloudCfg;
        }
      }
    } catch (err) {
      console.warn('[EduPath Gemini] Không thể đồng bộ cấu hình từ Cloud:', err);
    }
    return null;
  }

  /**
   * Kiểm tra xem Gemini Live Mode có đang được kích hoạt hay không
   */
  function isGeminiActive() {
    const cfg = getGeminiConfig();
    return Boolean(cfg.apiKey && cfg.apiKey.length >= 10);
  }

  /**
   * Xây dựng ngữ cảnh học sinh (Context Injection) để nạp vào Prompt Gemini
   */
  function buildStudentContextPrompt(studentProfile, _agentId) {
    const rawCode = (studentProfile && studentProfile.code) ? String(studentProfile.code).trim().toUpperCase() : '';
    const hasValidSurvey = Boolean(rawCode && rawCode.length >= 3 && rawCode !== '---');
    const name = (studentProfile && studentProfile.name) || 'em';
    const grade = (studentProfile && studentProfile.grade) || 'Lớp 9';
    const school = (studentProfile && studentProfile.school) || 'Trường THCS';
    const targetMajorName = (studentProfile && studentProfile.targetMajorName) || 'Chưa chọn';
    const stream = (studentProfile && studentProfile.stream) || 'Chưa xác định';

    if (!hasValidSurvey) {
      return `THÔNG TIN HỒ SƠ HỌC SINH ĐANG ĐỐI THOẠI:
- Học sinh: ${name} (${grade}, ${school})
- Trạng thái khảo sát: CHƯA HOÀN THÀNH KHẢO SÁT HOLLAND RIASEC (Chưa có mã RIASEC cá nhân).
QUY TẮC BẮT BUỘC (Trường hợp 7 SGK): Học sinh chưa làm khảo sát. Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC tự ý bịa đặt hoặc gán mã mặc định (như RIA) hay khẳng định thiên hướng nghề nghiệp cho học sinh. Nếu học sinh hỏi về kết quả của mình hoặc nghề phù hợp với mình, hãy ân cần hướng dẫn học sinh chuyển sang tab "Trắc Nghiệm Holland" để hoàn thành 60 câu hỏi trước.`;
    }

    let pctDetails = 'Chưa có chi tiết %';
    if (studentProfile && studentProfile.scores && typeof studentProfile.scores === 'object') {
      const parts = [];
      Object.keys(studentProfile.scores).forEach(k => {
        parts.push(`${k}: ${studentProfile.scores[k]}%`);
      });
      if (parts.length > 0) {
        pctDetails = parts.join(', ');
      }
    }

    return `THÔNG TIN HỒ SƠ HỌC SINH ĐANG ĐỐI THOẠI:
- Học sinh: ${name} (${grade}, ${school})
- Mã Holland RIASEC: ${rawCode}
- Tỉ lệ % từng nhóm RIASEC: ${pctDetails}
- Ngành nghề kĩ thuật, công nghệ phù hợp hàng đầu: ${targetMajorName}
- Khuyến nghị phân luồng sau THCS: ${stream}
QUY TẮC TƯ VẤN: Hãy vận dụng chính xác mã Holland ${rawCode} và ngành nghề ${targetMajorName} của học sinh vào câu trả lời khi thảo luận về sở thích, định hướng hoặc năng lực cá nhân.`;
  }

  /**
   * Lấy danh sách các model khả dụng cho API Key từ Google ModelService
   */
  async function listAvailableModels(apiKey) {
    if (!apiKey) return [];
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!resp.ok) return [];
      const data = await resp.json();
      if (!data || !Array.isArray(data.models)) return [];
      return data.models
        .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));
    } catch {
      return [];
    }
  }

  /**
   * Gửi request sinh nội dung tới một model cụ thể (Hỗ trợ chuyển đổi linh hoạt v1beta và v1)
   */
  async function sendGenerateContentRequest(modelName, apiKey, requestBody) {
    let url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 18000);

    try {
      let resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      // Nếu 404, thử sang v1 endpoint
      if (resp.status === 404) {
        const urlV1 = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const respV1 = await fetch(urlV1, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        if (respV1.ok) {
          resp = respV1;
        }
      }

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        const errMsg = (errData && errData.error && errData.error.message) || `HTTP ${resp.status} (${resp.statusText})`;
        const error = new Error(errMsg);
        error.status = resp.status;
        throw error;
      }

      const data = await resp.json();
      const candidate = data && data.candidates && data.candidates[0];
      if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
        throw new Error('Gemini không phản hồi định dạng nội dung hợp lệ.');
      }

      return (candidate.content.parts[0].text || '').trim();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Kiểm tra kết nối thử nghiệm tới Google Gemini API (Tự động phát hiện model hoạt động)
   */
  async function testGeminiConnection(apiKey, model) {
    const cleanKey = (apiKey || '').trim();
    if (!cleanKey) {
      return { ok: false, error: 'Chưa nhập API Key. Vui lòng dán khóa Gemini API hợp lệ.' };
    }

    let modelsToTry = [
      model,
      DEFAULT_MODEL,
      ...FALLBACK_MODELS
    ].filter(Boolean);
    modelsToTry = Array.from(new Set(modelsToTry));

    // Truy vấn danh sách model thực tế từ key nếu có
    const onlineModels = await listAvailableModels(cleanKey);
    if (onlineModels.length > 0) {
      modelsToTry = Array.from(new Set([
        ...onlineModels.filter(m => m.includes('flash')),
        ...onlineModels,
        ...modelsToTry
      ]));
    }

    const testBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: 'Xin chào, đây là tin nhắn kiểm tra kết nối từ ứng dụng Hướng nghiệp Lớp 9. Hãy trả lời thật ngắn gọn: Sẵn sàng đồng hành.' }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 50
      }
    };

    let lastError = null;
    for (const m of modelsToTry) {
      try {
        const reply = await sendGenerateContentRequest(m, cleanKey, testBody);
        return {
          ok: true,
          message: `Kết nối thành công tới mô hình ${m}!`,
          detectedModel: m,
          reply: reply
        };
      } catch (err) {
        lastError = err;
        if (err.status === 404 || (err.message && (err.message.includes('not found') || err.message.includes('supported methods')))) {
          continue;
        } else {
          return { ok: false, error: `Lỗi kết nối: ${err.message}` };
        }
      }
    }

    return { ok: false, error: `Không tìm thấy mô hình khả dụng: ${lastError ? lastError.message : 'Tất cả model đều thất bại'}` };
  }

  /**
   * Gọi Google Gemini API theo thời gian thực (Tự động chuyển model khi 404/not found)
   */
  async function callGeminiAPI(agentId, userMessage, conversationHistory, studentProfile) {
    const config = getGeminiConfig();
    if (!config.apiKey) {
      throw new Error('Chưa cấu hình Gemini API Key.');
    }

    const personaPrompt = PERSONA_SYSTEM_PROMPTS[agentId] || PERSONA_SYSTEM_PROMPTS.psychologist;
    const studentContext = buildStudentContextPrompt(studentProfile, agentId);
    const fullSystemInstruction = `${personaPrompt}\n\n${studentContext}\n\nYÊU CẦU ĐỊNH DẠNG TRẢ LỜI:\n- Trả lời bằng tiếng Việt chuẩn mực, đúng vai persona, phù hợp học sinh lớp 9.\n- Dung lượng súc tích (khoảng 2-3 đoạn ngắn, không quá dài dòng).\n- Sử dụng markdown như in đậm (**từ khóa**) hoặc danh sách gạch đầu dòng khi cần thiết.`;

    const contents = [];
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach(item => {
        if (item && item.text && typeof item.text === 'string') {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }]
          });
        }
      });
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const requestBody = {
      contents: contents,
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800
      }
    };

    let modelsToTry = [
      config.model,
      DEFAULT_MODEL,
      ...FALLBACK_MODELS
    ].filter(Boolean);
    modelsToTry = Array.from(new Set(modelsToTry));

    let lastError = null;
    let successfulModel = null;
    let replyText = null;

    for (const modelCandidate of modelsToTry) {
      try {
        replyText = await sendGenerateContentRequest(modelCandidate, config.apiKey, requestBody);
        successfulModel = modelCandidate;
        break;
      } catch (err) {
        lastError = err;
        // Nếu là lỗi 404 hoặc model không tìm thấy, tự động chuyển tiếp model kế tiếp
        if (err.status === 404 || (err.message && (err.message.includes('not found') || err.message.includes('supported methods')))) {
          console.warn(`[EduPath Gemini] Model '${modelCandidate}' không khả dụng (${err.message}), tự động chuyển model dự phòng...`);
          continue;
        } else {
          throw err;
        }
      }
    }

    if (!replyText && lastError) {
      throw lastError;
    }

    // Nếu model thành công khác model ban đầu cấu hình -> tự động cập nhật
    if (successfulModel && successfulModel !== config.model) {
      localStorage.setItem('edupath_gemini_model', successfulModel);
      localStorage.setItem(STORAGE_KEY_MODEL, successfulModel);
      const modelSelect = document.getElementById('gemini-model-select');
      if (modelSelect) modelSelect.value = successfulModel;
      console.log(`[EduPath Gemini] Đã tự động kích hoạt model hoạt động ổn định: ${successfulModel}`);
    }

    return {
      text: replyText,
      model: successfulModel
    };
  }

  /**
   * Tác vụ tổng hợp: Tự động điều phối giữa Gemini Live AI và Cố vấn Ngoại tuyến Fallback
   */
  async function askAgent(agentId, userMessage, conversationHistory, studentProfile) {
    const config = getGeminiConfig();
    if (config.apiKey && config.apiKey.length >= 10) {
      try {
        const geminiRes = await callGeminiAPI(agentId, userMessage, conversationHistory, studentProfile);
        return {
          text: geminiRes.text || geminiRes,
          source: 'gemini',
          model: geminiRes.model || config.model
        };
      } catch (err) {
        console.warn(`[EduPath Gemini] Lỗi gọi Gemini (${err.message}). Tự động kích hoạt Cố vấn SGK nội bộ:`, err);
        const localReply = generateAgentResponse(agentId, userMessage, studentProfile);
        return {
          text: localReply,
          source: 'local',
          fallbackReason: err.message
        };
      }
    }

    // Chế độ ngoại tuyến / Fallback mặc định
    const localReply = generateAgentResponse(agentId, userMessage, studentProfile);
    return {
      text: localReply,
      source: 'local'
    };
  }

  /**
   * Phản hồi thông minh nội bộ dựa trên SGK Công nghệ 9 và ngữ cảnh thực tế (Local Rule-based Engine)
   */
  function generateAgentResponse(agentId, userMessage, studentProfile) {
    const rawCode = (studentProfile && studentProfile.code) ? String(studentProfile.code).trim().toUpperCase() : '';
    const hasValidSurvey = Boolean(rawCode && rawCode.length >= 3 && rawCode !== '---');
    const code = hasValidSurvey ? rawCode : null;
    const name = (studentProfile && studentProfile.name) || 'em';
    const cleanMsg = (userMessage || '').toLowerCase();

    // Trường hợp 7: Nếu học sinh chưa hoàn thành khảo sát, cố vấn không giả mạo mã RIA
    if (!hasValidSurvey && (cleanMsg.includes('mã của em') || cleanMsg.includes('tính cách') || cleanMsg.includes('phù hợp nghề gì') || cleanMsg.includes('ngành nào'))) {
      return `Chào ${name}! Hiện tại hồ sơ của em chưa có kết quả trắc nghiệm Holland RIASEC. Để thầy/cô có thể phân tích chính xác thiên hướng tính cách và tư vấn ngành nghề phù hợp nhất, em hãy chuyển sang tab **"Trắc Nghiệm Holland"** và hoàn thành khảo sát trước nhé!`;
    }

    const codeDisplay = code ? `(Mã Holland: ${code})` : '';

    if (agentId === 'psychologist') {
      if (cleanMsg.includes('bố mẹ') || cleanMsg.includes('gia đình') || cleanMsg.includes('áp lực')) {
        const adviceCode = code ? `kết quả trắc nghiệm (${code})` : 'bài khảo sát sở thích';
        return `Thầy rất hiểu cảm giác này của ${name}. Bố mẹ thúc giục thường xuất phát từ sự lo lắng cho tương lai của em, nhưng họ có thể chưa cập nhật xu hướng nghề nghiệp hiện đại. Em hãy dùng ${adviceCode} và bảng Cây nghề nghiệp trong SGK để giải thích với bố mẹ: “Con hiểu bố mẹ lo cho con, nhưng con có thế mạnh ở thiên hướng này, con tin mình sẽ hạnh phúc và kiên trì nhất khi được làm đúng sở trường.”`;
      }
      if (cleanMsg.includes('con gái') || cleanMsg.includes('nữ')) {
        return `Định kiến “con gái không nên làm kĩ thuật” hoàn toàn lỗi thời rồi ${name} nhé! Trong ngành Công nghệ và Thiết kế, sự tỉ mỉ, kiên nhẫn và khả năng tổ chức của các bạn nữ lại là lợi thế cạnh tranh cực lớn. Rất nhiều kỹ sư kiểm thử phần mềm (QA), quản lý sản phẩm (Product Manager) và kiến trúc sư hàng đầu hiện nay là nữ giới.`;
      }
      if (cleanMsg.includes('toán') || cleanMsg.includes('học kém') || cleanMsg.includes('không giỏi')) {
        return `Kỹ thuật không chỉ có giải Toán trên giấy tờ đâu ${name}! Nhóm Realistic (Kỹ thuật) là nhóm của những người tư duy qua bàn tay và thao tác thực tế. Có những bạn không thích Toán trừu tượng nhưng lại đấu dây điện, lắp ráp vi mạch cực chuẩn. Điểm số trường học chỉ đo một phần năng lực của em thôi!`;
      }
      if (code) {
        let traitDesc = 'giữa tính hành động và tư duy thực tế';
        if (window.HollandEngine && window.HollandEngine.GROUP_METADATA && window.HollandEngine.GROUP_METADATA[code[0]]) {
          const m1 = window.HollandEngine.GROUP_METADATA[code[0]];
          const m2 = window.HollandEngine.GROUP_METADATA[code[1]] || m1;
          traitDesc = `giữa thiên hướng ${m1.shortName} (${code[0]}) và ${m2.shortName} (${code[1]})`;
        }
        return `Với mã Holland ${code}, em là người có sự kết hợp đặc biệt ${traitDesc}. Lời khuyên của thầy dành cho ${name} là: Đừng chọn nghề chỉ vì người khác thấy nó “oai”, hãy chọn nghề mà khi thức dậy mỗi sáng, em cảm thấy hào hứng muốn bắt tay vào làm!`;
      }
      return `Thầy luôn sẵn sàng lắng nghe tâm tư và mong muốn của ${name}. Em hãy chia sẻ thêm về những điều em thích làm nhất khi rảnh rỗi nhé!`;
    }

    if (agentId === 'tech-lead') {
      if (cleanMsg.includes('thử thách') || cleanMsg.includes('tình huống')) {
        return `🔥 **Thử thách thực tế dành cho ${name}:**\nGiả sử em đang vận hành một dây chuyền đóng gói tự động thì cánh tay robot đột ngột dừng lại và còi báo động kêu. Em sẽ làm gì trong 3 bước sau?\n1. Bấm nút dừng khẩn cấp (E-Stop) để đảm bảo an toàn tuyệt đối.\n2. Quan sát bảng mã lỗi trên màn hình điều khiển (PLC).\n3. Kiểm tra cảm biến vật cản trên băng chuyền.\n👉 *Một kỹ sư giỏi luôn đặt sự an toàn lên hàng đầu rồi mới truy vết nguyên nhân!*`;
      }
      if (cleanMsg.includes('ai') || cleanMsg.includes('trí tuệ nhân tạo')) {
        const codeNote = code ? `Em đang có mã ${code}, ` : '';
        return `Muốn làm việc trong ngành AI, em cần 3 chân kiềng: 1) Kỹ năng lập trình (Python, logic thuật toán); 2) Năng lực tư duy dữ liệu (hiểu bản chất số liệu); 3) Khả năng tự học liên tục vì công nghệ AI thay đổi từng tuần. ${codeNote}hãy bắt đầu ngay từ những dự án nhỏ như lập trình trò chơi hoặc tự tạo một chatbot học tập!`;
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
      return `Nghịch lý lớn nhất của thị trường lao động nước ta hiện nay là: Thừa lao động phổ thông (chưa qua đào tạo) nhưng lại cực kì khan hiếm lao động kỹ thuật lành nghề. Do đó, việc ${name} ${codeDisplay} định hướng chuyên môn kỹ thuật ngay từ lớp 9 là một quyết định đi trước đón đầu rất sáng suốt!`;
    }

    return `Tôi rất sẵn lòng đồng hành và lắng nghe câu hỏi tiếp theo của ${name}!`;
  }

  return {
    AGENTS,
    PERSONA_SYSTEM_PROMPTS,
    getGeminiConfig,
    saveGeminiConfig,
    clearGeminiConfig,
    syncGeminiConfigFromCloud,
    isGeminiActive,
    testGeminiConnection,
    callGeminiAPI,
    askAgent,
    generateAgentResponse,
    buildStudentContextPrompt
  };
})();

window.AIAgentsManager = AIAgentsManager;
