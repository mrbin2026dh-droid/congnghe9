# HƯỚNG DẪN TẠO VÀ LẤY CẤU HÌNH FIREBASE REALTIME DATABASE MIỄN PHÍ

> **Dành cho Giáo viên & Quản trị viên TeenVoca AI**  
> Hệ thống Firebase Realtime Database của Google cung cấp gói **Spark Plan (Miễn phí 100% vĩnh viễn)** với dung lượng 1 GB lưu trữ và 10 GB băng thông/tháng — hoàn toàn đáp ứng cho hàng trăm lớp học và hàng ngàn học sinh làm bài cùng lúc.

---

## 4 BƯỚC THIẾT LẬP NHANH (MẤT KHOẢNG 3 PHÚT)

```
[Bước 1: Tạo Project trên Google] ──► [Bước 2: Bật Realtime Database] ──► [Bước 3: Lấy firebaseConfig] ──► [Bước 4: Dán vào mã nguồn]
```

---

### Bước 1: Tạo dự án Firebase mới

1. Truy cập vào trang quản lý Firebase của Google:  
   🔗 **[https://console.firebase.google.com/](https://console.firebase.google.com/)**
2. Đăng nhập bằng tài khoản Gmail của Thầy/Cô.
3. Bấm vào nút **"Add project"** (hoặc **"Thêm dự án"**).
4. Nhập tên dự án: ví dụ `TeenVoca-AI-HuongNghiep` $\rightarrow$ bấm **Continue**.
5. Ở bước *Google Analytics*: Thầy/Cô có thể gạt tắt (Disable) để tạo nhanh $\rightarrow$ bấm **Create project**.
6. Đợi 10 giây để Google khởi tạo hệ thống $\rightarrow$ bấm **Continue** để vào Bảng điều khiển.

---

### Bước 2: Kích hoạt dịch vụ Realtime Database

1. Ở menu bên trái, tìm mục **Build** (hoặc **Xây dựng**) $\rightarrow$ chọn **Realtime Database**.
2. Bấm nút **Create Database** (Tạo cơ sở dữ liệu).
3. **Database location**: Chọn máy máy chủ gần Việt Nam nhất (ví dụ: `Singapore (asia-southeast1)`) $\rightarrow$ bấm **Next**.
4. **Security rules**:
   - Chọn **Start in test mode** (Bắt đầu ở chế độ thử nghiệm).  
     *(Quy tắc này cho phép đọc/ghi dữ liệu học sinh trong suốt quá trình dạy học và kiểm thử).*
5. Bấm **Enable** (Bật).  
   Sau khi hoàn tất, Thầy/Cô sẽ nhìn thấy đường dẫn Database có dạng:  
   `https://edupath-ai-xxxx-default-rtdb.asia-southeast1.firebasedatabase.app/`

---

### Bước 3: Đăng ký ứng dụng Web và lấy mã cấu hình

1. Bấm vào biểu tượng **Bánh răng cài đặt (Project settings)** ở góc trên bên trái (cạnh dòng *Project Overview*).
2. Cuộn xuống phần **Your apps** (Ứng dụng của bạn) $\rightarrow$ bấm vào biểu tượng Web `</>`.
3. Nhập tên hiển thị: `TeenVoca Web` $\rightarrow$ bấm **Register app**.
4. Màn hình sẽ hiển thị đoạn mã `const firebaseConfig = { ... }`. Thầy/Cô sao chép (Copy) toàn bộ đối tượng này:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "edupath-ai-xxxx.firebaseapp.com",
  databaseURL: "https://edupath-ai-xxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edupath-ai-xxxx",
  storageBucket: "edupath-ai-xxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

> [!NOTE]
> Hãy chắc chắn đối tượng cấu hình có chứa dòng `databaseURL`. Nếu thiếu, Thầy/Cô chỉ cần copy đường dẫn ở Bước 2 điền vào.

---

### Bước 4: Dán vào dự án TeenVoca AI

1. Mở tệp `js/firebase-config.js` trong thư mục dự án.
2. Tìm dòng `window.EduPathFirebaseConfig = { ... }` ở ngay đầu tệp:

```javascript
window.TeenVocaFirebaseConfig = window.TeenVocaFirebaseConfig || window.EduPathFirebaseConfig || {
  apiKey: "AIzaSy...", // Dán apiKey của Thầy/Cô vào đây
  authDomain: "edupath-ai-xxxx.firebaseapp.com",
  databaseURL: "https://edupath-ai-xxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "edupath-ai-xxxx",
  storageBucket: "edupath-ai-xxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

3. Lưu tệp (Ctrl + S) và F5 lại trang web trên trình duyệt.  
   Hệ thống sẽ tự động chuyển sang chế độ **Cloud Realtime Live** và lưu đồng bộ tức thì mọi thao tác của học sinh!

---

## CƠ CHẾ DỰ PHÒNG THÔNG MINH (OFFLINE FALLBACK)

- Nếu Thầy/Cô chưa kịp tạo Firebase hoặc phòng máy bị mất mạng Internet:  
  Ứng dụng **TeenVoca AI** được tích hợp sẵn động cơ tự động nhận diện và lưu trữ cục bộ (LocalStorage).
- Mọi chức năng: Trắc nghiệm Holland, Cây nghề nghiệp, Đánh giá Bài 5 SGK, Quản lý tài khoản học sinh, Xuất báo cáo điểm CSV đều vận hành bình thường 100% mà không bị lỗi hay gián đoạn.
- Khi dán cấu hình Firebase, dữ liệu sẽ tự động chuyển tiếp lên đám mây.
