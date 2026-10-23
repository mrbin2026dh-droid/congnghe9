# Kế Hoạch Triển Khai EduPath AI — Giai Đoạn 4 & Giai Đoạn 5

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện EduPath AI thành ứng dụng hướng nghiệp đơn giản, dễ sử dụng cho học sinh của nhiều trường; có khả năng lưu hồ sơ, khám phá sở thích Holland chuẩn hóa, tự đánh giá nghề nghiệp theo Bài 5 SGK và thu thập minh chứng thực tế phục vụ dạy học, dự thi; sau đó kiểm thử toàn hệ thống đạt Zero-Bug 100%.

**Architecture:** Mở rộng kiến trúc SPA thuần nhẹ (Vanilla ES6, HTML5 Semantic, CSS3 Modular) với mô hình dữ liệu phản ứng một chiều (Unidirectional State Flow). Kết nối chặt chẽ giữa Holland RIASEC Engine và Bài 5 Assessment Matrix thông qua State Store tập trung đồng bộ tự động với `localStorage`. Bổ sung khả năng Nhập/Xuất Hồ sơ JSON minh chứng số hóa, lưới điều hướng câu hỏi Question Grid, phân tích phổ điểm 6 nhóm tính cách và phiếu in A4 chuẩn quy chế Sư phạm Bộ GD&ĐT.

**Tech Stack:** HTML5 Semantic, CSS3 Modern (WCAG AAA), JavaScript ES6 (Zero-framework, Zero-bloat), LocalStorage API, GSAP 3.12.5, Playwright E2E Automation Testing, Alibaba Open-Code-Review v1.12.5.

**Spec:** SGK Công nghệ 9 (Kết nối tri thức với cuộc sống) - Bài 4 (Hình 4.3 Cây nghề nghiệp, Mô hình RIASEC 6 nhóm Holland) & Bài 5 (Dự án Tự đánh giá mức độ phù hợp 10 tiêu chí, Thang điểm 3 mức tr. 34, Bộ ba câu hỏi định hướng tr. 35).

---

## Global Constraints

- Không sửa đổi hay làm phức tạp thêm logic Tab 1 (Cây nghề nghiệp sinh học Hình 4.3 SGK) theo đúng yêu cầu người dùng.
- Tuân thủ quy chuẩn Alibaba Open-Code-Review: Cấm `var`, cấm so sánh lỏng `==`, cấm nuốt lỗi rỗng `catch (e) {}`, cấm dữ liệu giả mạo vô nghĩa.
- Giao diện đáp ứng tiêu chuẩn sân khấu tương tác: $1920 \times 1080$, $1366 \times 768$ và Mobile, 0 bẫy tràn ngang (`scrollWidth === clientWidth`), điểm chạm $\ge 44\text{px}$.
- Console F12 sạch 0 error, 0 warning.
- Mọi chức năng tuyên bố hoàn thành phải có bằng chứng kiểm thử thực tế từ Playwright test runner.

---

## Review Focus

1. **Khả năng lưu trữ và phục hồi hồ sơ khi F5 / đổi máy**: Khi học sinh nhập Tên, Trường, Lớp và làm dở trắc nghiệm hoặc Bài 5, tải lại trang phải giữ nguyên 100% dữ liệu, không bị trắng màn hình hay mất điểm.
2. **Lưới điều hướng 18 câu & 60 câu**: Học sinh có thể click chọn bất kỳ câu nào trong Question Palette, trạng thái đã chọn (đã trả lời / chưa trả lời) phải phản ánh đúng màu sắc ngay lập tức.
3. **Liên kết dữ liệu giữa Holland và Bài 5**: Khi học sinh chọn một ngành từ kết quả Holland (hoặc đổi ngành), Bài 5 phải tự động cập nhật tên ngành, mã Holland, yêu cầu đặc thù và tự gợi ý đặc điểm cá nhân tương ứng mà không làm mất các chỉnh sửa tùy biến của học sinh.
4. **Quy tắc tính điểm Bài 5 SGK**: Tổng điểm 10 tiêu chí phải chính xác tương ứng số lượng tiêu chí trùng khớp; phân loại đúng 3 mức: $\le 3$ (Không phù hợp), $4 - 6$ (Phù hợp một phần), $7 - 10$ (Phù hợp hoàn toàn).
5. **Định dạng in ấn A4 chuẩn mực**: Phiếu in Bài 5 mở ra đầy đủ thông tin Quốc hiệu, Trường THCS, Lớp, Học sinh, Bảng 10 tiêu chí, 3 câu hỏi định hướng cuộc đời và 3 ô chữ ký, không tràn lề trang in.

---

## Kế Hoạch Chi Tiết Từng Nhiệm Vụ (Task Breakdown)

### Task 1: Chuẩn Hóa Hồ Sơ Học Sinh Đa Trường & Lưu Trữ Dữ Liệu (Multi-School Profile & Persistence Engine)

**Files:**
- Modify: `index.html` (Thêm trường THCS, Lớp, Năm học và các nút Lưu/Mở hồ sơ)
- Modify: `css/style.css` (Tạo kiểu dáng thanh hồ sơ học sinh, modal nhập thông tin trường, huy hiệu trạng thái lưu trữ)
- Modify: `js/app.js` (Tích hợp State Storage tự động lưu vào LocalStorage, hàm Export JSON, Import JSON)
- Test: `tests/test_profile_persistence.spec.js`

**Interfaces:**
- Consumes: `studentProfile` hiện tại trong `EduPathApp`.
- Produces: `saveProfileToStorage()`, `loadProfileFromStorage()`, `exportProfileJSON()`, `importProfileJSON(fileData)`.
- Metadata: `{ name, school, grade, academicYear, code, scores, percentages, targetMajorId, assessmentMatches, selfTraits, threeQuestionsAnswers }`.

- [ ] **Step 1: Viết kịch bản kiểm thử Playwright cho lưu trữ hồ sơ học sinh**
- [ ] **Step 2: Chạy kiểm thử để xác nhận trạng thái hiện tại (FAIL vì chưa có thông tin trường và cơ chế export/import)**
- [ ] **Step 3: Cập nhật giao diện `index.html` và `css/style.css` với thanh hồ sơ đa trường (Trường, Lớp, Tên, nút Xuất/Nhập file hồ sơ JSON)**
- [ ] **Step 4: Cập nhật `js/app.js` với logic lưu tự động vào LocalStorage, xử lý xuất JSON và nhập JSON an toàn**
- [ ] **Step 5: Chạy lại kịch bản kiểm thử Playwright và xác nhận PASS 100%**
- [ ] **Step 6: Kiểm tra qua Alibaba OCR và Commit Task 1**

---

### Task 2: Chuẩn Hóa Trắc Nghiệm Holland RIASEC & Lưới Điều Hướng Câu Hỏi (Holland Survey Standardization)

**Files:**
- Modify: `index.html` (Bổ sung Question Grid Palette 1..18 / 1..60, bộ lọc nhóm RIASEC, khu vực biểu đồ phân tích 6 nhóm)
- Modify: `css/style.css` (Tạo kiểu cho Question Grid, thanh trạng thái câu đã làm/chưa làm, biểu đồ thanh trực quan 6 nhóm)
- Modify: `js/holland-engine.js` (Bổ sung mô tả chi tiết từng nhóm, tính điểm chuẩn hóa từng nhóm và lời khuyên hòa giải cặp đối lập)
- Modify: `js/app.js` (Điều hướng nhảy câu trực tiếp, cảnh báo câu chưa làm, kết xuất biểu đồ 6 nhóm tính cách RIASEC, hiển thị Top ngành đào tạo kèm nút chọn sang Bài 5)
- Test: `tests/test_holland_standardization.spec.js`

**Interfaces:**
- Consumes: `window.EduPathData.holland.questions`, `HollandEngine.calculateScores`, `HollandEngine.matchMajors`.
- Produces: `jumpToQuestion(idx)`, `renderQuestionPalette()`, `renderDetailedHollandAnalytics(results)`, `selectMajorForProject(majorId)`.

- [ ] **Step 1: Viết kịch bản kiểm thử Playwright cho trắc nghiệm Holland (chuyển câu qua Grid, tính toán 6 nhóm, hiển thị biểu đồ và phân tích cặp đối lập)**
- [ ] **Step 2: Chạy kiểm thử để xác nhận điểm cần hoàn thiện**
- [ ] **Step 3: Nâng cấp `index.html` và `css/style.css` với Question Palette (1..18 / 1..60) và khu vực biểu đồ RIASEC 6 nhóm**
- [ ] **Step 4: Hoàn thiện `js/holland-engine.js` và `js/app.js` cho phép nhảy câu tự do, lưu câu trả lời vào LocalStorage, phân tích sâu 6 nhóm**
- [ ] **Step 5: Chạy lại kiểm thử Playwright và xác nhận PASS 100%**
- [ ] **Step 6: Kiểm tra qua Alibaba OCR và Commit Task 2**

---

### Task 3: Kết Nối Chặt Chẽ Khảo Sát Holland Với Dự Án Bài 5 SGK (Seamless Lesson 5 Integration)

**Files:**
- Modify: `index.html` (Bổ sung Dropdown chọn nghề linh hoạt, ô chỉnh sửa đặc điểm bản thân Cột 1, khu vực trả lời 3 câu hỏi định hướng tr. 35 SGK)
- Modify: `css/style.css` (Tạo kiểu bảng 10 tiêu chí trực quan, ô nhập liệu 3 câu hỏi định hướng, giao diện A4 print stylesheet)
- Modify: `js/project-assessment.js` (Tự động thích ứng Cột 1 và Cột 2 theo ngành nghề và điểm số Holland; tính điểm 3 mức SGK tr. 34; sinh bản in chuẩn Bộ GD&ĐT có 3 câu hỏi định hướng và 3 chữ ký)
- Modify: `js/app.js` (Liên kết sự kiện chuyển nghề từ Holland sang Bài 5; đồng bộ điểm số; cho phép học sinh tự sửa đặc điểm cá nhân và lưu trữ)
- Test: `tests/test_lesson5_integration.spec.js`

**Interfaces:**
- Consumes: Kết quả Holland (`code`, `percentages`), danh sách ngành nghề `EduPathData.majors`.
- Produces: `syncProjectFromHolland(majorId)`, `updateSelfTrait(criterionIdx, text)`, `calculateProjectResult()`, `printOfficialReport()`.

- [ ] **Step 1: Viết kịch bản kiểm thử Playwright kiểm tra kết nối từ Holland sang Bài 5, tự nạp tiêu chí, tính điểm 3 mức và xuất báo cáo in**
- [ ] **Step 2: Chạy kiểm thử để xác nhận trạng thái cần triển khai**
- [ ] **Step 3: Cập nhật `index.html` và `css/style.css` cho Tab 4 với bộ chọn ngành nghề, bảng 10 tiêu chí tương tác và khu vực 3 câu hỏi định hướng SGK**
- [ ] **Step 4: Cập nhật `js/project-assessment.js` và `js/app.js` để kết nối logic tự động từ điểm Holland sang tiêu chí Bài 5 và sinh bản in A4 hoàn hảo**
- [ ] **Step 5: Chạy lại kiểm thử Playwright và xác nhận PASS 100%**
- [ ] **Step 6: Kiểm tra qua Alibaba OCR và Commit Task 3**

---

### Task 4: Nâng Cấp Bảng Điều Khiển Giáo Viên & Thu Thập Minh Chứng (Teacher Dashboard & Evidence Collection)

**Files:**
- Modify: `index.html` (Thêm nút Import Hồ Sơ Học Sinh JSON, bảng thống kê theo Trường/Lớp)
- Modify: `css/style.css` (Định dạng giao diện bảng phân tích giáo viên)
- Modify: `js/teacher-analytics.js` (Hỗ trợ thêm học sinh thật từ LocalStorage hoặc file JSON, tính toán tỷ lệ phân luồng, xuất file CSV đầy đủ trường lớp)
- Modify: `js/app.js` (Kết nối sự kiện nhập học sinh và đồng bộ hồ sơ)
- Test: `tests/test_teacher_analytics.spec.js`

**Interfaces:**
- Consumes: Danh sách học sinh thật đã lưu trữ hoặc file JSON minh chứng.
- Produces: `importStudentToTeacherRoster(studentObj)`, `exportClassCSV()`, `renderClassHeatmap()`.

- [ ] **Step 1: Viết kịch bản kiểm thử Playwright cho tính năng import hồ sơ học sinh và xuất CSV giáo viên**
- [ ] **Step 2: Chạy kiểm thử để xác nhận trạng thái**
- [ ] **Step 3: Cập nhật `js/teacher-analytics.js`, `index.html`, `js/app.js` cho phép nạp học sinh thật và xuất CSV đầy đủ thông tin trường lớp**
- [ ] **Step 4: Chạy lại kiểm thử Playwright và xác nhận PASS 100%**
- [ ] **Step 5: Kiểm tra qua Alibaba OCR và Commit Task 4**

---

### Task 5: Giai Đoạn 5: Kiểm Thử Toàn Hệ Thống Toàn Diện & Nghiệm Thu Zero-Bug (System-Wide Verification)

**Files:**
- Create: `tests/full_system_verification.spec.js` (Bao phủ toàn bộ 5 tab, Responsive, LocalStorage, Báo cáo in, Xuất CSV, F12 console trace)
- Modify: `tests/f12_error_log.js`
- Modify: `tests/f12_diagnostic_report.json`
- Test: Chạy Playwright full suite không dùng RAM ảo, giám sát F12 0 lỗi.

- [ ] **Step 1: Xây dựng kịch bản kiểm thử toàn diện `full_system_verification.spec.js`**
- [ ] **Step 2: Chạy kiểm thử trên trình duyệt Chromium thật (headless: true)**
- [ ] **Step 3: Đo đạc các chỉ số định lượng: 0 lỗi Console, độ trễ chuyển tab < 100ms, không tràn ngang (`scrollWidth === clientWidth`)**
- [ ] **Step 4: Cập nhật báo cáo nghiệm thu kỹ thuật và nhật ký F12**
- [ ] **Step 5: Kiểm duyệt qua Alibaba Open-Code-Review và commit toàn bộ hệ thống**
