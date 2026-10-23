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
  const DEFAULT_MODEL = 'gemini-flash-lite-latest';
  const FALLBACK_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3.5-flash-lite',
    'gemini-2.5-flash',
    'gemma-4-31b-it'
  ];

  const MASTER_COUNSELOR = {
    id: 'counselor',
    name: 'TS. Hướng Nghiệp EduPath',
    title: 'Chuyên Gia Cố Vấn Hướng Nghiệp Toàn Diện',
    avatar: '🎓',
    tag: 'Cố Vấn Toàn Diện (Tâm lý - Kỹ thuật - Phân luồng - Thị trường)',
    greeting: 'Chào em! Thầy là Cố vấn Hướng nghiệp Toàn diện của em. Thầy sẵn sàng giải đáp và định hướng cho em về mọi mặt: từ thấu hiểu bản thân, giải mã mã Holland RIASEC, khám phá các ngành nghề kỹ thuật công nghệ thực tế, cho đến lựa chọn ngã rẽ phân luồng sau lớp 9 và cơ hội việc làm tương lai.',
    presetPrompts: [
      'Mã Holland của em phù hợp nhất với những ngành nghề kỹ thuật, công nghệ nào?',
      'Em có sở thích này thì nên định hướng nghề nghiệp và chọn ngành học ra sao?',
      'Sức học trung bình thì sau lớp 9 nên thi vào THPT hay chọn mô hình học nghề 9+?',
      'Các ngành nghề công nghệ nào đang khát nhân lực và có mức thu nhập tốt nhất?'
    ]
  };

  const AGENTS = [MASTER_COUNSELOR];

  /**
   * System Prompt Chuẩn mực Quốc gia - Master Unified Prompt
   * Tích hợp toàn diện 4 trụ cột SGK Công nghệ 9 & Mô hình Holland RIASEC
   */
  const MASTER_SYSTEM_PROMPT = `Bạn là TS. Hướng Nghiệp EduPath - Chuyên Gia Cố Vấn Hướng Nghiệp Toàn Diện cho học sinh THCS (lớp 9 chuẩn bị phân luồng), bám sát 100% Chương trình GDPT 2018, SGK Công nghệ 9 (Định hướng nghề nghiệp - Bộ GD&ĐT) và Mô hình Holland RIASEC chuẩn quốc tế.

NĂNG LỰC CỐ VẤN TÍCH HỢP TOÀN DIỆN (4 TRỤ CỘT CỐT LÕI):
1. TÂM LÝ & BẢN THÂN (Bài 4 SGK):
   - Luôn thấu cảm, ân cần, tôn trọng mọi sở thích của học sinh (như ca hát, vẽ tranh, chơi game, thể thao, tháo lắp máy móc, viết lách, giao tiếp...).
   - Vận dụng triết lý "Cây nghề nghiệp" (SGK Bài 4): Sở thích, khả năng, cá tính là GỐC RỄ; Quá trình học tập, rèn luyện là THÂN CÂY; Thu nhập, thành công, đóng góp xã hội là QUẢ NGỌT.
   - Giúp học sinh giải tỏa áp lực từ gia đình, xóa bỏ định kiến giới tính (như nữ sinh làm kỹ thuật/công nghệ), giải tỏa tự ti về điểm số hay học lực (không giỏi Toán lý thuyết vẫn có thể trở thành kỹ thuật viên/kỹ sư thực hành xuất sắc).
2. KỸ THUẬT & CÔNG NGHỆ THỰC TẾ (Bài 1 & Bài 5 SGK):
   - Am hiểu sâu sắc các ngành kỹ thuật, cơ điện tử, tự động hóa, ô tô điện, năng lượng tái tạo, công nghệ thông tin, lập trình, an ninh mạng, vi mạch bán dẫn.
   - Giải thích công việc thực tế, tư duy xử lý sự cố (troubleshooting) và kỹ năng thực hành vi mạch, cơ khí, logic một cách dễ hiểu, sinh động cho lứa tuổi 14-15.
3. PHÂN LUỒNG SAU THCS (Bài 2 SGK & Luật Giáo dục 2019):
   - Tư vấn rõ ràng 2 nhánh rẽ sau khi tốt nghiệp lớp 9:
     + Nhánh 1: Học tiếp THPT (công lập, tư thục, GDTX) để thi tuyển Đại học, Cao đẳng chính quy.
     + Nhánh 2: Mô hình Đào tạo Nghề 9+ (tại các trường Cao đẳng/Trung cấp nghề): Học sinh học song song văn hóa THPT và tay nghề kỹ thuật, tốt nghiệp tuổi 18 có cả Bằng THPT và Bằng nghề, có thể đi làm tự chủ thu nhập sớm hoặc học liên thông lên Đại học.
   - Giúp học sinh tự đánh giá sức học và điều kiện kinh tế gia đình để chọn hướng đi phù hợp, không bị áp lực thi cử đè nặng.
4. THỊ TRƯỜNG LAO ĐỘNG & THU NHẬP (Bài 3 SGK):
   - Cung cấp dữ liệu thực tế năm 2026: 3 nhóm ngành khát nhân lực hàng đầu tại Việt Nam (CNTT & An ninh mạng, Cơ điện tử & Ô tô điện, Kỹ thuật Điện & Năng lượng tái tạo).
   - Khung thu nhập thực tế năm 2026: Kỹ sư đại học mới ra trường: 10 - 18 triệu/tháng; Kỹ thuật viên hệ 9+/cao đẳng nghề: 8 - 14 triệu/tháng; sau 3-5 năm có kinh nghiệm: 25 - 45 triệu/tháng.

QUY TẮC PHÂN TÍCH LOGIC KHẢO SÁT & ĐỊNH HƯỚNG NGHỀ NGHIỆP:
- Khi học sinh nêu một sở thích cá nhân (ví dụ: thích hát, thích vẽ, thích chơi game, thích máy tính...):
  1) Nhận diện ngay sở thích đó thuộc nhóm nào trong 6 nhóm Holland:
     + Thích vẽ, hát, sáng tạo tự do -> Nhóm A (Nghệ thuật - Artistic)
     + Thích tháo lắp máy móc, chế tạo, hoạt động ngoài trời -> Nhóm R (Kỹ thuật - Realistic)
     + Thích nghiên cứu, tìm tòi nguyên lý, giải đố logic -> Nhóm I (Nghiên cứu - Investigative)
     + Thích giúp đỡ, chia sẻ, kết nối mọi người -> Nhóm S (Xã hội - Social)
     + Thích lãnh đạo, kinh doanh, tổ chức hoạt động -> Nhóm E (Quản lý - Enterprising)
     + Thích tỉ mỉ, trật tự, số liệu, quy trình chuẩn -> Nhóm C (Nghiệp vụ - Conventional)
  2) Đối chiếu trực tiếp với mã Holland RIASEC trong hồ sơ khảo sát của học sinh (và danh sách các ngành nghề đề xuất đi kèm).
  3) Nếu học sinh hỏi "CHỌN NGHỀ NÀO": Phân tích cách kết hợp sở thích với năng lực và gợi ý 2-3 ngành nghề cụ thể nằm trong danh sách ngành được đề xuất của hệ thống (ví dụ: nếu thích hát/nghệ thuật mà có mã ASE/R: gợi ý Kỹ thuật âm thanh, Thiết kế mỹ thuật đa phương tiện, Biên tập truyền thông số, Sư phạm âm nhạc...). Nêu rõ lý do phù hợp và lộ trình học tập sau lớp 9.

QUY TẮC HIỂN THỊ & ĐỊNH DẠNG BẮT BUỘC:
- Xưng hô chuẩn mực: "Thầy - em" hoặc "Tôi - bạn trẻ/em", truyền cảm hứng, tích cực và tôn trọng học sinh.
- TUYỆT ĐỐI KHÔNG DỪNG GIỮA CHỪNG / KHÔNG CẮT CHỮ: Câu trả lời phải hoàn chỉnh 100%, có mở đầu, thân bài phân tích sắc bén và lời khuyên/hành động kết luận trọn vẹn.
- Trình bày mạch lạc, sử dụng in đậm (**từ khóa quan trọng**) và gạch đầu dòng ngắn gọn, không viết một khối văn bản dài dằng dặc.`;

  const PERSONA_SYSTEM_PROMPTS = {
    counselor: MASTER_SYSTEM_PROMPT,
    psychologist: MASTER_SYSTEM_PROMPT,
    'tech-lead': MASTER_SYSTEM_PROMPT,
    'streaming-officer': MASTER_SYSTEM_PROMPT,
    'market-analyst': MASTER_SYSTEM_PROMPT
  };

  /**
   * Đọc cấu hình Gemini từ LocalStorage
   */
  function getGeminiConfig() {
    try {
      const apiKey = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
      let model = (localStorage.getItem(STORAGE_KEY_MODEL) || DEFAULT_MODEL).trim();
      // Tự động nâng cấp model nếu đang lưu các model cũ không còn được Google hỗ trợ hoặc bị kẹt hạn ngạch 20 req
      const deprecated = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro'
      ];
      if (deprecated.includes(model)) {
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

    let proposedCareersText = '';
    if (window.HollandEngine && window.HollandEngine.matchHollandOrderCareers) {
      try {
        const matched = window.HollandEngine.matchHollandOrderCareers(rawCode, { limit: 8 });
        if (matched && matched.length > 0) {
          proposedCareersText = matched.map((m, idx) => `  ${idx + 1}. ${m.name} (Tổ hợp: ${m.code || '---'}, ${m.stageLabel || ''})`).join('\n');
        }
      } catch (err) {
        console.warn('[EduPath Gemini] Không thể trích xuất top ngành nghề:', err);
      }
    }

    return `THÔNG TIN HỒ SƠ HỌC SINH ĐANG ĐỐI THOẠI:
- Học sinh: ${name} (${grade}, ${school})
- Mã Holland RIASEC: ${rawCode}
- Tỉ lệ % từng nhóm RIASEC trong trắc nghiệm: ${pctDetails}
- Ngành nghề kĩ thuật, công nghệ phù hợp hàng đầu (SGK Bài 5): ${targetMajorName}
- Khuyến nghị phân luồng sau THCS: ${stream}
- Danh sách top ngành nghề đề xuất theo thứ tự chữ cái mã (${rawCode}) từ hệ thống Aiducation & Công nghệ 9:
${proposedCareersText || '  - ' + targetMajorName}

QUY TẮC TƯ VẤN BẮT BUỘC (MASTER LOGIC):
1. Vận dụng chính xác mã Holland ${rawCode} và danh sách các ngành nghề đề xuất ở trên vào câu trả lời.
2. Khi học sinh nêu sở thích riêng (như ca hát, vẽ tranh, game, máy móc, giao tiếp...), hãy phân tích sở thích đó thuộc chữ cái nào trong Holland RIASEC, rồi đối chiếu với mã ${rawCode} của học sinh và gợi ý những ngành nghề có sự kết hợp phù hợp từ danh sách trên.
3. Luôn hoàn thiện đầy đủ câu trả lời, không cắt ngang giữa chừng.`;
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
      .filter(m => Array.isArray(m.supportedGenerationMethods) && 
                   m.supportedGenerationMethods.includes('generateContent') &&
                   !m.name.includes('-tts') &&
                   !m.name.includes('-image') &&
                   !m.name.includes('-transcribe')
      )
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
      if (!candidate || !candidate.content || !candidate.content.parts || !candidate.content.parts.length) {
        throw new Error('Gemini không phản hồi định dạng nội dung hợp lệ.');
      }

      // Trích xuất toàn bộ text từ tất cả các parts để đảm bảo văn bản hiển thị trọn vẹn, không cụt chữ
      const fullText = candidate.content.parts
        .map(p => p.text || '')
        .join('')
        .trim();

      if (!fullText) {
        throw new Error('Gemini phản hồi nội dung văn bản trống.');
      }

      return fullText;
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

    // Truy vấn danh sách model thực tế từ key nếu có (bổ sung phía sau)
    const onlineModels = await listAvailableModels(cleanKey);
    if (onlineModels.length > 0) {
      modelsToTry = Array.from(new Set([
        ...modelsToTry,
        ...onlineModels
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
        const msg = (err.message || '').toLowerCase();
        const isRecoverable = err.status === 404 || 
                              err.status === 429 || 
                              err.status === 503 ||
                              msg.includes('not found') || 
                              msg.includes('quota') || 
                              msg.includes('rate') || 
                              msg.includes('no longer available') || 
                              msg.includes('demand') ||
                              msg.includes('supported methods');
        if (isRecoverable) {
          console.warn(`[EduPath Gemini] Model '${m}' gặp sự cố (${err.message}). Tự động thử model tiếp theo...`);
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

    const personaPrompt = PERSONA_SYSTEM_PROMPTS[agentId] || MASTER_SYSTEM_PROMPT;
    const studentContext = buildStudentContextPrompt(studentProfile, agentId);
    const fullSystemInstruction = `${personaPrompt}\n\n${studentContext}\n\nYÊU CẦU ĐỊNH DẠNG TRẢ LỜI:\n- Trả lời bằng tiếng Việt chuẩn mực, đúng vai Cố vấn Hướng nghiệp Toàn diện, phù hợp học sinh lớp 9.\n- Trả lời đầy đủ, hoàn chỉnh 100%, tuyệt đối không dừng hay cắt ngắn giữa chừng.\n- Sử dụng markdown như in đậm (**từ khóa**) hoặc danh sách gạch đầu dòng rõ ràng, mạch lạc.`;

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
        const genConfig = {
          temperature: 0.65,
          maxOutputTokens: 2048
        };
        // Chỉ gán thinkingBudget cho gemini-2.5-flash để không bị ngốn token vào suy nghĩ nội bộ
        if (modelCandidate === 'gemini-2.5-flash') {
          genConfig.thinkingConfig = { thinkingBudget: 0 };
        }

        const modelRequestBody = {
          ...requestBody,
          generationConfig: genConfig
        };

        replyText = await sendGenerateContentRequest(modelCandidate, config.apiKey, modelRequestBody);
        successfulModel = modelCandidate;
        break;
      } catch (err) {
        lastError = err;
        const msg = (err.message || '').toLowerCase();
        const isRecoverable = err.status === 404 || 
                              err.status === 429 || 
                              err.status === 503 ||
                              msg.includes('not found') || 
                              msg.includes('quota') || 
                              msg.includes('rate') || 
                              msg.includes('no longer available') || 
                              msg.includes('demand') ||
                              msg.includes('supported methods');
        if (isRecoverable) {
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
   * Phản hồi thông minh nội bộ dựa trên SGK Công nghệ 9 và ngữ cảnh thực tế (Local Rule-based Master Engine)
   */
  function generateAgentResponse(_agentId, userMessage, studentProfile) {
    const rawCode = (studentProfile && studentProfile.code) ? String(studentProfile.code).trim().toUpperCase() : '';
    const hasValidSurvey = Boolean(rawCode && rawCode.length >= 3 && rawCode !== '---');
    const code = hasValidSurvey ? rawCode : null;
    const name = (studentProfile && studentProfile.name) || 'em';
    const cleanMsg = (userMessage || '').toLowerCase();
    const targetMajorName = (studentProfile && studentProfile.targetMajorName) || 'Kỹ thuật công nghệ';

    // Trường hợp 7 SGK: Nếu học sinh chưa hoàn thành khảo sát
    if (!hasValidSurvey && (cleanMsg.includes('mã của em') || cleanMsg.includes('tính cách') || cleanMsg.includes('phù hợp nghề gì') || cleanMsg.includes('ngành nào'))) {
      return `Chào ${name}! Hiện tại hồ sơ của em chưa có kết quả trắc nghiệm Holland RIASEC. Để thầy có thể phân tích chính xác thiên hướng tính cách và tư vấn ngành nghề phù hợp nhất, em hãy chuyển sang tab **"Trắc Nghiệm Holland"** và hoàn thành 60 câu hỏi khảo sát trước nhé!`;
    }

    const codeDisplay = code ? `(Mã Holland: ${code})` : '';

    // 1. Phân tích sở thích cá nhân (Hát, vẽ, nhạc, sáng tạo...)
    if (cleanMsg.includes('hát') || cleanMsg.includes('ca hát') || cleanMsg.includes('vẽ') || cleanMsg.includes('nhạc') || cleanMsg.includes('sáng tạo') || cleanMsg.includes('nghệ thuật')) {
      let careerAdvice = 'Kỹ thuật âm thanh, Thiết kế đồ họa đa phương tiện hoặc Sản xuất nội dung số';
      if (code) {
        careerAdvice = `Kỹ thuật âm thanh, Thiết kế mỹ thuật số, Biên tập truyền thông (rất khớp với mã ${code})`;
      }
      return `Thầy rất vui khi ${name} chia sẻ sở thích này! Trong mô hình Holland RIASEC, sở thích này thuộc về **nhóm A (Artistic - Nghệ thuật)** — những người giàu cảm xúc, sáng tạo và trực giác thẩm mỹ.\n\nTheo triết lý "Cây nghề nghiệp" (Bài 4 SGK Công nghệ 9), sở thích là gốc rễ. Để phát triển thành nghề nghiệp vững chắc trong thời đại số, em có thể kết hợp sở thích nghệ thuật với kỹ thuật, công nghệ như: **${careerAdvice}**. ${code ? `Mã khảo sát của em là **${code}**, em hãy tận dụng tối đa sự giao thoa này nhé!` : 'Em hãy làm trắc nghiệm Holland để xem thêm nhóm tính cách bổ trợ nhé!'}`;
    }

    // 2. Tư vấn chọn nghề theo mã khảo sát
    if (cleanMsg.includes('chọn nghề') || cleanMsg.includes('nghề nào') || cleanMsg.includes('ngành nào') || cleanMsg.includes('phù hợp nghề gì')) {
      let matchedNames = targetMajorName;
      if (code && window.HollandEngine && window.HollandEngine.matchHollandOrderCareers) {
        try {
          const list = window.HollandEngine.matchHollandOrderCareers(code, { limit: 3 });
          if (list && list.length > 0) {
            matchedNames = list.map(m => `**${m.name}**`).join(', ');
          }
        } catch {}
      }
      return `Dựa trên hồ sơ của ${name} ${codeDisplay}, hệ thống hướng nghiệp định hướng cho em các ngành nghề kĩ thuật, công nghệ phù hợp hàng đầu: ${matchedNames}.\n\nThầy khuyên em: Hãy chọn ngành nghề giao thoa giữa 3 yếu tố: **Sở thích cá nhân** (em thích làm gì), **Khả năng thực tế** (sức học & thế mạnh), và **Cơ hội thị trường** (nhu cầu việc làm). Em có thể bấm vào tab **"Dự Án Bài 5 SGK"** để chấm điểm chi tiết 10 tiêu chí phù hợp nhé!`;
    }

    // 3. Tâm lý: Bố mẹ & áp lực gia đình
    if (cleanMsg.includes('bố mẹ') || cleanMsg.includes('gia đình') || cleanMsg.includes('áp lực')) {
      const adviceCode = code ? `kết quả trắc nghiệm (${code})` : 'bài khảo sát sở thích';
      return `Thầy rất hiểu cảm giác này của ${name}. Bố mẹ thúc giục thường xuất phát từ sự lo lắng cho tương lai của em, nhưng có thể bố mẹ chưa cập nhật xu hướng nghề nghiệp hiện đại. Em hãy dùng ${adviceCode} và bảng Cây nghề nghiệp trong SGK để trò chuyện với bố mẹ: “Con hiểu bố mẹ lo cho tương lai của con, nhưng con có thế mạnh ở thiên hướng này, con tin mình sẽ có động lực và kiên trì nhất khi được phát triển đúng sở trường.”`;
    }

    // 4. Định kiến giới tính (Nữ làm kỹ thuật)
    if (cleanMsg.includes('con gái') || cleanMsg.includes('nữ')) {
      return `Định kiến “con gái không nên làm kĩ thuật” hoàn toàn lỗi thời rồi ${name} nhé! Trong ngành Công nghệ thông tin, Thiết kế và Tự động hóa, sự tỉ mỉ, kiên nhẫn, gu thẩm mỹ và kỹ năng giao tiếp của các bạn nữ lại là lợi thế cạnh tranh cực lớn. Rất nhiều kỹ sư kiểm thử phần mềm (QA), quản lý sản phẩm công nghệ (Product Manager) và chuyên gia dữ liệu hàng đầu hiện nay là nữ giới.`;
    }

    // 5. Học lực & Điểm số Toán
    if (cleanMsg.includes('toán') || cleanMsg.includes('học kém') || cleanMsg.includes('không giỏi')) {
      return `Kỹ thuật không chỉ có giải Toán trừu tượng trên giấy tờ đâu ${name}! Nhóm Realistic (Kỹ thuật) là nhóm của những người tư duy qua đôi bàn tay và thao tác thực tế. Có những bạn không thích giải phương trình phức tạp nhưng lại lắp ráp vi mạch, đấu nối tủ điện hoặc dựng mô hình 3D cực chuẩn. Điểm số trường học chỉ phản ánh một phần năng lực của em thôi!`;
    }

    // 6. Phân luồng sau THCS: Mô hình 9+ vs THPT
    if (cleanMsg.includes('9+') || cleanMsg.includes('trung cấp') || cleanMsg.includes('nghề') || cleanMsg.includes('trung bình') || cleanMsg.includes('sau thcs') || cleanMsg.includes('lớp 10')) {
      return `Hết lớp 9 có 2 ngã rẽ quan trọng (theo Bài 2 SGK Công nghệ 9):\n- **Nhánh 1 (Học tiếp THPT):** Phù hợp nếu em có học lực khá - giỏi và mong muốn thi vào các trường Đại học chính quy.\n- **Nhánh 2 (Mô hình Đào tạo Nghề 9+):** Học tại các trường Cao đẳng/Trung cấp nghề. Em được học song song văn hóa THPT và tay nghề kỹ thuật. Đến năm 18 tuổi, em vừa có Bằng tốt nghiệp THPT vừa có Bằng nghề chính quy, có thể tự chủ thu nhập sớm hoặc học liên thông lên Đại học!`;
    }

    // 7. Thị trường lao động & Mức lương 2026
    if (cleanMsg.includes('khát') || cleanMsg.includes('nhu cầu') || cleanMsg.includes('lương') || cleanMsg.includes('thu nhập') || cleanMsg.includes('thị trường')) {
      return `Số liệu thực tế thị trường lao động kỹ thuật, công nghệ năm 2026:\n- **3 nhóm ngành khát nhân lực nhất:** 1) Công nghệ thông tin & An ninh mạng; 2) Cơ điện tử, Tự động hóa & Kỹ thuật Ô tô điện; 3) Kỹ thuật Điện & Năng lượng tái tạo.\n- **Khung thu nhập:** Kỹ sư đại học mới ra trường: 10 - 18 triệu/tháng; Kỹ thuật viên hệ 9+/cao đẳng nghề: 8 - 14 triệu/tháng; sau 3-5 năm có kinh nghiệm: 25 - 45 triệu/tháng. Việt Nam đang rất thiếu lao động kỹ thuật có tay nghề cao!`;
    }

    // 8. Thử thách kỹ thuật tình huống
    if (cleanMsg.includes('thử thách') || cleanMsg.includes('tình huống')) {
      return `🔥 **Thử thách thực tế dành cho ${name}:**\nGiả sử em đang vận hành một dây chuyền tự động thì hệ thống báo lỗi dừng khẩn cấp. Em sẽ xử lý theo quy trình nào?\n1. Giữ an toàn và kiểm tra công tắc E-Stop.\n2. Đọc mã lỗi (Error Code) trên màn hình điều khiển HMI/PLC.\n3. Kiểm tra cảm biến và đường truyền tín hiệu.\n👉 *Một kỹ sư giỏi luôn đặt an toàn lên hàng đầu, sau đó mới tư duy truy vết nguyên nhân sự cố!*`;
    }

    if (code) {
      return `Chào ${name} ${codeDisplay}! Thầy đã nắm rõ hồ sơ khảo sát của em. Em có thể hỏi thầy về cách phát huy thế mạnh của mã ${code}, tìm hiểu chi tiết các ngành nghề đề xuất, hoặc cách chọn trường sau khi tốt nghiệp lớp 9 nhé!`;
    }

    return `Thầy là Cố vấn Hướng nghiệp Toàn diện của ${name}. Em hãy thoải mái chia sẻ mọi băn khoăn về sở thích, học lực, các ngành nghề kỹ thuật hay định hướng sau lớp 9 nhé!`;
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

if (typeof window !== 'undefined') {
  window.AIAgentsManager = AIAgentsManager;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AIAgentsManager;
}
