# Kế Hoạch Thiết Kế Giao Diện Đăng Nhập & Đồng Bộ Firebase Realtime EduPath AI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ thống đăng nhập chuẩn hóa cho Học sinh và Giáo viên bằng Mã số; giải phóng hoàn toàn thanh điều hướng Topbar khỏi tình trạng chật chội; tích hợp Firebase Realtime Database đồng bộ dữ liệu thật 100% (cấm hardcode); cung cấp tính năng Giáo viên quản lý học sinh (Thêm, Sửa, Xóa, Cấp mã) và tổng hợp kết quả cả lớp theo thời gian thực; kèm hướng dẫn chi tiết cách tạo và lấy cấu hình Firebase miễn phí.

**Architecture:** 
- **Lớp Giao diện (Presentation Layer)**: Thiết kế Modal Đăng nhập 2 phân hệ (Học sinh: Mã truy cập / Giáo viên: Mã quản lý PIN); loại bỏ toàn bộ 3 ô input gõ tay và 2 nút tải/nạp hồ sơ đang làm vỡ thanh Topbar; Topbar sau khi đăng nhập chỉ hiển thị Huy hiệu gọn gàng (`Mã HS · Họ tên · Lớp`), nút Đăng xuất và nút Giao diện.
- **Lớp Dữ liệu & Đồng bộ (Data & Realtime Sync Layer)**: Tích hợp Firebase Realtime Database SDK (Client-side Web SDK). Dữ liệu học sinh, khảo sát Holland, đánh giá Bài 5 được lưu trữ phân tầng theo Cây dữ liệu `/classes/{classId}` và `/students/{studentCode}`. 
- **Cơ chế Dự phòng Thông minh (Offline/Fallback Resilience)**: Tự động phát hiện trạng thái kết nối Firebase; nếu chưa dán cấu hình hoặc mất mạng, hệ thống chuyển sang chế độ LocalStorage an toàn kèm thông báo nhắc nhở, đảm bảo ứng dụng không bao giờ bị trắng màn hình.
- **Lớp Quản trị Giáo viên (Teacher Administration Layer)**: Bổ sung thanh công cụ quản lý tài khoản học sinh trong Tab 5 (Thêm học sinh mới, Sửa thông tin, Xóa học sinh, Tự động cấp mã theo định dạng `Lớp-STT` như `9A1-01`).

**Tech Stack:** HTML5 Semantic, CSS3 Modern (WCAG AAA, Touch Target $\ge 44\text{px}$, Zero Overflow), JavaScript ES6 Modular, Firebase Realtime Database SDK v10 (Compat/Modular via CDN), Playwright Dual-Context E2E Testing, Alibaba Open-Code-Review v1.12.5.

**Spec:** SGK Công nghệ 9 - Bài 4 (Cây nghề nghiệp & Trắc nghiệm Holland) và Bài 5 (Dự án Tự đánh giá năng lực nghề nghiệp); Yêu cầu người dùng về Đăng nhập bằng mã, Quản lý tài khoản học sinh, Đồng bộ Firebase Realtime và Tinh gọn giao diện không dùng icon/từ ngữ rườm rà.

---

## Global Constraints

- **Cấm hardcode dữ liệu học sinh**: Mọi học sinh, kết quả làm bài trắc nghiệm Holland, ma trận Bài 5 và số liệu bảng giáo viên phải được đọc và ghi trực tiếp từ Firebase Realtime Database.
- **Chuẩn hóa Giao diện Tối giản**: Cấm các icon rườm rà, nhồi nhét biểu tượng cảm xúc không cần thiết; loại bỏ hoàn toàn tình trạng cắt cụt chữ các Tab (`Dự...`) trên Topbar.
- **Chuẩn Responsive**: $1920 \times 1080$, $1366 \times 768$ và Mobile ($375 \times 812$), đảm bảo 0 bẫy tràn ngang (`scrollWidth === clientWidth`), nút bấm $\ge 44\text{px}$.
- **Quy chuẩn Alibaba Open-Code-Review**: Cấm `var`, cấm so sánh lỏng `==`, cấm nuốt lỗi rỗng `catch (e) {}`, cấm dữ liệu giả mạo vô nghĩa.
- **Console F12**: Tuyệt đối sạch 0 error, 0 warning.

---

## Review Focus

1. **Giao diện Topbar sau đăng nhập**: Khi học sinh đăng nhập, thanh Topbar phải có độ cao thoáng, hiển thị đầy đủ 5 tab (không bị co cụm hay cắt ngắn tên tab như trong ảnh chụp người dùng gửi).
2. **Xác thực mã Học sinh & Giáo viên**: Nhập sai mã học sinh phải thông báo lỗi rõ ràng; nhập đúng mã học sinh lập tức nạp đúng dữ liệu của học sinh đó từ Firebase. Giáo viên nhập đúng mã quản trị sẽ mở khóa quyền Thêm, Sửa, Xóa học sinh và xem toàn bộ dữ liệu lớp.
3. **Đồng bộ Realtime 2 chiều**: Khi học sinh làm bài ở máy A, màn hình Giáo viên ở máy B phải tự động cập nhật ngay lập tức mà không cần bấm F5.
4. **Tính năng Thêm, Sửa, Xóa tài khoản học sinh**: Giáo viên có thể thêm học sinh mới (cấp mã tự động hoặc tự đặt), sửa tên/lớp, xóa tài khoản học sinh khỏi Firebase.
5. **Hướng dẫn cấu hình Firebase**: Cung cấp tài liệu hướng dẫn từng bước rõ ràng, dễ hiểu nhất để giáo viên không chuyên CNTT vẫn có thể tự tạo dự án Firebase miễn phí và dán vào là chạy được ngay.

---

## Kế Hoạch Chi Tiết Từng Nhiệm Vụ (Task Breakdown)

### Task 1: Tinh Gọn Thanh Điều Hướng Topbar & Thiết Kế Modal Đăng Nhập Chuẩn Sư Phạm

**Files:**
- Modify: `index.html` (Loại bỏ 3 input và 2 nút rườm rà trên Topbar; thêm Modal Đăng nhập 2 phân hệ Học sinh / Giáo viên; thêm huy hiệu tài khoản hiện tại)
- Modify: `css/style.css` (Tạo kiểu dáng cho Modal đăng nhập tối giản, huy hiệu tài khoản tinh gọn, căn chỉnh lại độ co giãn thoáng của Topbar)
- Modify: `js/app.js` (Quản lý trạng thái phiên đăng nhập: `currentUser`, `userRole`, sự kiện mở/đóng modal và đăng xuất)
- Test: `tests/test_auth_modal_ui.py`

**Interfaces:**
- Consumes: Phiên đăng nhập từ `localStorage` hoặc Firebase Auth State.
- Produces: `showAuthModal()`, `hideAuthModal()`, `handleStudentLogin(code)`, `handleTeacherLogin(code, pin)`, `handleLogout()`.

- [x] **Step 1: Viết test Playwright kiểm tra Modal đăng nhập, kiểm tra Topbar không còn 3 input chật chội và không bị cắt chữ các Tab**
- [x] **Step 2: Chạy test để xác nhận trạng thái (FAIL do chưa có Modal đăng nhập mới)**
- [x] **Step 3: Cập nhật `index.html` và `css/style.css` với Topbar thoáng sạch và Modal đăng nhập 2 phân hệ tinh gọn**
- [x] **Step 4: Cập nhật `js/app.js` xử lý mở Modal khi chưa đăng nhập, hiển thị thông tin tài khoản và đăng xuất**
- [x] **Step 5: Chạy lại test Playwright và xác nhận PASS 100%**
- [x] **Step 6: Kiểm tra qua Alibaba OCR và commit Task 1**

---

### Task 2: Xây Dựng Động Cơ Firebase Realtime Database & Hướng Dẫn Cấu Hình Chi Tiết

**Files:**
- Create: `js/firebase-config.js` (Bộ khung kết nối Firebase Realtime Database, phương thức đọc/ghi dữ liệu, hỗ trợ cấu hình động và chế độ Local Fallback khi chưa cấu hình)
- Create: `HUONG_DAN_TAO_FIREBASE_MIEN_PHI.md` (Tài liệu hướng dẫn trực quan 4 bước có hình ảnh/minh họa tạo Firebase Project miễn phí trong 3 phút)
- Modify: `index.html` (Nạp Firebase SDK từ CDN và nạp `js/firebase-config.js`)
- Test: `tests/test_firebase_engine.py`

**Interfaces:**
- Consumes: Cấu hình `window.EduPathFirebaseConfig`.
- Produces: `EduPathFirebase.getStudent(code)`, `EduPathFirebase.saveStudentProgress(code, data)`, `EduPathFirebase.onClassStudentsChange(className, callback)`, `EduPathFirebase.addStudent(student)`, `EduPathFirebase.updateStudent(code, data)`, `EduPathFirebase.deleteStudent(code)`.

- [x] **Step 1: Viết test kiểm tra các hàm CRUD của Firebase Engine (xử lý cả khi online và chế độ fallback an toàn)**
- [x] **Step 2: Chạy test để xác nhận FAIL (chưa có `js/firebase-config.js`)**
- [x] **Step 3: Triển khai `js/firebase-config.js` chuẩn hóa ES6, không hardcode, bảo đảm an toàn dữ liệu**
- [x] **Step 4: Viết tài liệu hướng dẫn `HUONG_DAN_TAO_FIREBASE_MIEN_PHI.md` chi tiết từng bước**
- [x] **Step 5: Chạy lại test Playwright và xác nhận PASS 100%**
- [x] **Step 6: Kiểm tra qua Alibaba OCR và commit Task 2**

---

### Task 3: Chức Năng Quản Lý Học Sinh Của Giáo Viên (Thêm, Sửa, Xóa, Cấp Mã)

**Files:**
- Modify: `index.html` (Bổ sung bảng điều khiển Quản lý Học sinh trong Tab 5: Form thêm học sinh, modal chỉnh sửa, nút xóa có xác nhận)
- Modify: `css/style.css` (Tạo kiểu cho thanh công cụ quản lý tài khoản, form nhập liệu tinh giản, bảng danh sách mã học sinh)
- Modify: `js/teacher-analytics.js` & `js/app.js` (Kết nối trực tiếp các thao tác Thêm, Sửa, Xóa lên Firebase)
- Test: `tests/test_teacher_student_management.py`

**Interfaces:**
- Consumes: Quyền quản trị Giáo viên từ `app.userRole === 'teacher'`.
- Produces: `addStudentAccount(code, name, grade, school)`, `editStudentAccount(code, newName, newGrade)`, `deleteStudentAccount(code)`.

- [x] **Step 1: Viết test Playwright kiểm tra quy trình Giáo viên Thêm, Sửa, Xóa học sinh thật trên bảng điều khiển**
- [x] **Step 2: Chạy test để xác nhận trạng thái cần triển khai**
- [x] **Step 3: Cập nhật giao diện Tab 5 trong `index.html` và `css/style.css` với phân khu Quản lý học sinh chuyên nghiệp**
- [x] **Step 4: Cập nhật logic trong `js/teacher-analytics.js` và `js/app.js` để thực hiện thao tác Thêm/Sửa/Xóa thời gian thực**
- [x] **Step 5: Chạy lại test Playwright và xác nhận PASS 100%**
- [x] **Step 6: Kiểm tra qua Alibaba OCR và commit Task 3**

---

### Task 4: Đồng Bộ Thời Gian Thực Bài Làm Học Sinh (Holland & Bài 5) Về Bảng Giáo Viên

**Files:**
- Modify: `js/app.js` (Ghi nhận tiến độ làm bài trắc nghiệm Holland và Dự án Bài 5 trực tiếp lên Firebase theo `studentCode`)
- Modify: `js/teacher-analytics.js` (Lắng nghe sự kiện Realtime `.on('value')` từ Firebase để tự động cập nhật Heatmap, tỷ lệ phân luồng và danh sách điểm ngay khi học sinh hoàn thành bước)
- Test: `tests/test_realtime_sync_dual_context.py` (Mở 2 cửa sổ trình duyệt: 1 cửa sổ Học sinh làm bài, 1 cửa sổ Giáo viên quan sát dữ liệu tự nhảy live)

**Interfaces:**
- Consumes: Thao tác của học sinh khi chọn đáp án Holland, chọn nghề và đánh giá 10 tiêu chí Bài 5.
- Produces: Dữ liệu thời gian thực được đẩy lên Firebase và phản ánh ngay tức thì trên Bảng Giáo viên.

- [x] **Step 1: Viết test Dual-Context Playwright (mở song song 2 context: Học sinh làm bài $\rightarrow$ Giáo viên nhận dữ liệu live)**
- [x] **Step 2: Chạy test để xác nhận trạng thái**
- [x] **Step 3: Triển khai cơ chế đồng bộ tự động trong `js/app.js` và `js/teacher-analytics.js`**
- [x] **Step 4: Chạy lại test Dual-Context và xác nhận PASS 100%**
- [x] **Step 5: Kiểm tra qua Alibaba OCR và commit Task 4**

---

### Task 5: Kiểm Thử Toàn Diện Hệ Thống & Nghiệm Thu Zero-Bug

**Files:**
- Create: `tests/test_full_system_firebase_auth.py` (Kiểm thử toàn diện từ Đăng nhập $\rightarrow$ Học sinh làm bài $\rightarrow$ Giáo viên quản lý $\rightarrow$ Xuất CSV $\rightarrow$ Responsive $\rightarrow$ F12 Console)
- Update: `README.md` (Bổ sung mục Hướng dẫn đăng nhập bằng mã và liên kết tài liệu Firebase)

- [x] **Step 1: Viết kịch bản kiểm thử toàn diện toàn bộ các chức năng**
- [x] **Step 2: Chạy kiểm thử trên Chromium thật**
- [x] **Step 3: Giám sát F12 DevTools: 0 Error, 0 Warning**
- [x] **Step 4: Kiểm duyệt toàn bộ mã qua Alibaba Open-Code-Review Pre-Commit Gatekeeper**
- [x] **Step 5: Commit và tổng kết bàn giao**
