# Firebase Emulator dùng cho kiểm thử

Thư mục này CHỈ dùng để chạy Firebase Realtime Database Emulator trên máy khi kiểm thử.
Quy tắc trong `database.rules.emulator.json` mở hoàn toàn và **không được deploy** lên Firebase thật.

Chạy kiểm thử kịch bản khảo sát dở / mất mạng (tự khởi động Emulator và máy chủ trang web):

```bash
python tests/test_emulator_survey_resume.py
```

Ứng dụng chỉ kết nối Emulator khi mở với tham số `?emulator=1`.
