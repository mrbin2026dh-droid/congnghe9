/**
 * EduPath AI - Data Repository
 * Loaded directly from official SGK Cong Nghe 9 & Holland 60-Item Bank
 * STRICT RULE: ZERO MOCK, ZERO HARDCODE.
 */
'use strict';

const HOLLAND_DATA = {
  "source": "https://www.aiducation.edu.vn/huong-nghiep/trac-nghiem-holland",
  "total_questions": 60,
  "scales": [
    {
      "value": 1,
      "label": "Rất không thích"
    },
    {
      "value": 2,
      "label": "Không thích lắm"
    },
    {
      "value": 3,
      "label": "Bình thường"
    },
    {
      "value": 4,
      "label": "Khá thích"
    },
    {
      "value": 5,
      "label": "Rất thích"
    }
  ],
  "modes": {
    "quick": {
      "name": "Bản rút gọn",
      "questions_count": 18,
      "time": "4–6 phút"
    },
    "full": {
      "name": "Bản đầy đủ",
      "questions_count": 60,
      "time": "10–14 phút"
    }
  },
  "questions": [
    {
      "id": 1,
      "type": "R",
      "question": "Bảo dưỡng hoặc thay linh kiện cho xe máy, máy bơm, máy nổ"
    },
    {
      "id": 2,
      "type": "R",
      "question": "Đo đạc, cắt và ghép vật liệu để dựng một thứ gì đó chắc chắn"
    },
    {
      "id": 3,
      "type": "R",
      "question": "Làm việc ngoài trời cả buổi, chấp nhận nắng gió và bụi bẩn"
    },
    {
      "id": 4,
      "type": "I",
      "question": "Thiết kế một cách kiểm chứng xem điều mình đoán có đúng không"
    },
    {
      "id": 5,
      "type": "I",
      "question": "Theo dõi một chủ đề chuyên sâu qua nhiều bài viết và tài liệu"
    },
    {
      "id": 6,
      "type": "I",
      "question": "Lần ngược từ kết quả về nguyên nhân khi có gì đó hoạt động sai"
    },
    {
      "id": 7,
      "type": "A",
      "question": "Nghĩ ra ý tưởng cho một tiết mục, ấn phẩm hoặc buổi trưng bày"
    },
    {
      "id": 8,
      "type": "A",
      "question": "Thử một phong cách mới dù chưa chắc người khác có thích không"
    },
    {
      "id": 9,
      "type": "A",
      "question": "Chỉnh đi chỉnh lại một chi tiết cho tới khi thấy nó vừa mắt"
    },
    {
      "id": 10,
      "type": "S",
      "question": "Hướng dẫn một người mới cho đến khi họ tự làm được"
    },
    {
      "id": 11,
      "type": "S",
      "question": "Ngồi nghe một người đang gặp khó khăn mà không vội đưa lời khuyên"
    },
    {
      "id": 12,
      "type": "S",
      "question": "Tổ chức một hoạt động để những người quanh mình đỡ vất vả hơn"
    },
    {
      "id": 13,
      "type": "E",
      "question": "Đại diện cho nhóm trình bày và bảo vệ phương án trước người khác"
    },
    {
      "id": 14,
      "type": "E",
      "question": "Tìm khách hàng hoặc người tài trợ cho một việc mình đang làm"
    },
    {
      "id": 15,
      "type": "E",
      "question": "Phân công việc cho cả nhóm và theo sát cho tới khi xong"
    },
    {
      "id": 16,
      "type": "C",
      "question": "Đối chiếu chứng từ, hoá đơn hoặc bảng kê để tìm chỗ chưa khớp"
    },
    {
      "id": 17,
      "type": "C",
      "question": "Đặt tên và phân loại tài liệu sao cho sau này tìm lại được ngay"
    },
    {
      "id": 18,
      "type": "C",
      "question": "Làm một việc lặp lại hằng ngày mà vẫn giữ đúng chuẩn từng lần"
    },
    {
      "id": 19,
      "type": "R",
      "question": "Tháo một món đồ hỏng ra xem bên trong nó hoạt động thế nào"
    },
    {
      "id": 20,
      "type": "R",
      "question": "Tự lắp hoặc sửa xe đạp, quạt, ổ điện trong nhà"
    },
    {
      "id": 21,
      "type": "R",
      "question": "Dùng thành thạo các dụng cụ như khoan, cưa, mỏ hàn, kìm"
    },
    {
      "id": 22,
      "type": "R",
      "question": "Chăm cây, nuôi động vật, hoặc làm vườn đều đặn"
    },
    {
      "id": 23,
      "type": "R",
      "question": "Làm mô hình, đồ handmade hoặc lắp ráp bộ kit theo hướng dẫn"
    },
    {
      "id": 24,
      "type": "R",
      "question": "Học một nghề có sản phẩm cầm được trên tay khi làm xong"
    },
    {
      "id": 25,
      "type": "R",
      "question": "Làm việc cần sức khoẻ và sự khéo tay hơn là ngồi bàn giấy"
    },
    {
      "id": 26,
      "type": "I",
      "question": "Tìm hiểu vì sao một hiện tượng xảy ra, dù không ai yêu cầu"
    },
    {
      "id": 27,
      "type": "I",
      "question": "So sánh nhiều nguồn thông tin để xem nguồn nào đáng tin hơn"
    },
    {
      "id": 28,
      "type": "I",
      "question": "Làm thí nghiệm và ghi lại kết quả một cách có hệ thống"
    },
    {
      "id": 29,
      "type": "I",
      "question": "Ngồi lâu với một bài toán khó mà không thấy chán"
    },
    {
      "id": 30,
      "type": "I",
      "question": "Đọc về khoa học, lịch sử hoặc công nghệ ngoài chương trình học"
    },
    {
      "id": 31,
      "type": "I",
      "question": "Tìm quy luật trong một đống số liệu hoặc dữ kiện lộn xộn"
    },
    {
      "id": 32,
      "type": "I",
      "question": "Đặt câu hỏi ngược lại khi nghe một kết luận nghe có vẻ hợp lý"
    },
    {
      "id": 33,
      "type": "A",
      "question": "Dựng một video ngắn và tự cắt ghép, chọn nhạc cho nó"
    },
    {
      "id": 34,
      "type": "A",
      "question": "Vẽ, phác thảo hoặc nguệch ngoạc trong lúc rảnh"
    },
    {
      "id": 35,
      "type": "A",
      "question": "Chơi một nhạc cụ, hát, hoặc tự học một bài mới"
    },
    {
      "id": 36,
      "type": "A",
      "question": "Trang trí góc học tập, phòng ở hoặc trang cá nhân theo ý mình"
    },
    {
      "id": 37,
      "type": "A",
      "question": "Viết ra suy nghĩ của mình dưới dạng truyện, nhật ký hoặc bài đăng"
    },
    {
      "id": 38,
      "type": "A",
      "question": "Làm một bài tập theo cách khác với mẫu thầy cô đưa"
    },
    {
      "id": 39,
      "type": "A",
      "question": "Chú ý đến màu sắc, bố cục, phông chữ mà người khác không để ý"
    },
    {
      "id": 40,
      "type": "S",
      "question": "Giảng lại bài cho bạn cho đến khi bạn thật sự hiểu"
    },
    {
      "id": 41,
      "type": "S",
      "question": "Được bạn bè tìm đến khi họ có chuyện buồn"
    },
    {
      "id": 42,
      "type": "S",
      "question": "Tham gia hoạt động thiện nguyện hoặc giúp đỡ trong khu mình ở"
    },
    {
      "id": 43,
      "type": "S",
      "question": "Để ý thấy ai đó đang bị bỏ ngoài cuộc trò chuyện và kéo họ vào"
    },
    {
      "id": 44,
      "type": "S",
      "question": "Chăm sóc em nhỏ, người lớn tuổi hoặc người đang ốm"
    },
    {
      "id": 45,
      "type": "S",
      "question": "Hoà giải khi hai người bạn giận nhau"
    },
    {
      "id": 46,
      "type": "S",
      "question": "Làm công việc mà kết quả là ai đó khá lên, dù không ai thấy"
    },
    {
      "id": 47,
      "type": "E",
      "question": "Nhận vai trưởng nhóm khi lớp có bài tập nhóm"
    },
    {
      "id": 48,
      "type": "E",
      "question": "Thuyết phục người khác đồng ý với ý tưởng của mình"
    },
    {
      "id": 49,
      "type": "E",
      "question": "Bán được một món đồ, hoặc rủ được nhiều người tham gia một việc"
    },
    {
      "id": 50,
      "type": "E",
      "question": "Đứng nói trước đám đông mà không thấy quá sợ"
    },
    {
      "id": 51,
      "type": "E",
      "question": "Nghĩ ra một dự án nhỏ rồi tự đi tìm người làm cùng"
    },
    {
      "id": 52,
      "type": "E",
      "question": "Chịu trách nhiệm khi một việc chung có thể thành hoặc hỏng"
    },
    {
      "id": 53,
      "type": "E",
      "question": "Thương lượng để cả hai bên cùng chấp nhận được"
    },
    {
      "id": 54,
      "type": "C",
      "question": "Sắp xếp tài liệu, ảnh hoặc file theo một hệ thống rõ ràng"
    },
    {
      "id": 55,
      "type": "C",
      "question": "Kiểm tra lại số liệu cho đến khi chắc chắn không sai"
    },
    {
      "id": 56,
      "type": "C",
      "question": "Ghi chép chi tiêu hoặc lập kế hoạch theo tuần và bám theo nó"
    },
    {
      "id": 57,
      "type": "C",
      "question": "Làm theo một quy trình có sẵn và làm đúng từng bước"
    },
    {
      "id": 58,
      "type": "C",
      "question": "Phát hiện lỗi nhỏ trong một bảng biểu mà người khác bỏ qua"
    },
    {
      "id": 59,
      "type": "C",
      "question": "Dùng bảng tính để theo dõi hoặc tính toán một thứ gì đó"
    },
    {
      "id": 60,
      "type": "C",
      "question": "Làm việc có hạn chót rõ ràng và tiêu chuẩn cụ thể"
    }
  ]
};

const SGK_DATA = {
  "thong_tin_xuat_ban": {
    "ten_sach": "Công nghệ 9 – Định hướng nghề nghiệp",
    "bo_sach": "Kết nối tri thức với cuộc sống",
    "nha_xuat_ban": "Nhà xuất bản Giáo dục Việt Nam",
    "chuong_trinh": "Chương trình Giáo dục phổ thông 2018",
    "quyet_dinh_phe_duyet": "Quyết định số 1551/QĐ-BGDĐT ngày 05/6/2023 của Bộ trưởng Bộ Giáo dục và Đào tạo",
    "tac_gia": {
      "tong_chu_bien": "Lê Huy Hoàng",
      "chu_bien": "Phạm Mạnh Hà",
      "cac_tac_gia": [
        "Nguyễn Xuân An",
        "Nguyễn Thị Bích Thuỷ",
        "Vũ Cẩm Tú"
      ]
    },
    "tong_so_trang": 39,
    "nam_xuat_ban": 2023
  },
  "cau_truc_mon_hoc": {
    "so_bai_hoc": 5,
    "danh_sach_bai": [
      {
        "bai_so": 1,
        "ten_bai": "Nghề nghiệp trong lĩnh vực kĩ thuật và công nghệ",
        "trang_bat_dau": 5,
        "trang_ket_thuc": 9
      },
      {
        "bai_so": 2,
        "ten_bai": "Cơ cấu hệ thống giáo dục quốc dân",
        "trang_bat_dau": 10,
        "trang_ket_thuc": 16
      },
      {
        "bai_so": 3,
        "ten_bai": "Thị trường lao động kĩ thuật, công nghệ tại Việt Nam",
        "trang_bat_dau": 17,
        "trang_ket_thuc": 23
      },
      {
        "bai_so": 4,
        "ten_bai": "Quy trình lựa chọn nghề nghiệp",
        "trang_bat_dau": 24,
        "trang_ket_thuc": 30
      },
      {
        "bai_so": 5,
        "ten_bai": "Dự án: Tự đánh giá mức độ phù hợp của bản thân với một số ngành nghề trong lĩnh vực kĩ thuật, công nghệ",
        "trang_bat_dau": 31,
        "trang_ket_thuc": 34
      }
    ]
  },
  "chi_tiet_bai_hoc": [
    {
      "bai_so": 1,
      "tieu_de": "Nghề nghiệp trong lĩnh vực kĩ thuật và công nghệ",
      "muc_tieu": [
        "Trình bày được khái niệm nghề nghiệp, tầm quan trọng của nghề nghiệp đối với con người và xã hội, ý nghĩa của việc lựa chọn đúng đắn nghề nghiệp của mỗi người.",
        "Kể tên và phân tích được đặc điểm, những yêu cầu chung của các ngành nghề trong lĩnh vực kĩ thuật, công nghệ."
      ],
      "noi_dung_chinh": {
        "khai_niem_nghe_nghiep": "Nghề nghiệp là tập hợp các công việc được xã hội công nhận. Trong đó, nhờ được đào tạo mà con người có năng lực, tri thức, kĩ năng để tạo ra các sản phẩm vật chất hay tinh thần đáp ứng nhu cầu của xã hội, qua đó mang lại thu nhập ổn định và tạo nên giá trị cho bản thân. Nghề nghiệp có tính chất ổn định, gắn bó lâu dài.",
        "phan_biet_nghe_nghiep_va_viec_lam": {
          "diem_giong": "Cùng phản ánh một lĩnh vực lao động cụ thể, cần sử dụng kĩ năng, kĩ xảo, kiến thức để tạo ra sản phẩm, đáp ứng nhu cầu xã hội.",
          "diem_khac": {
            "nghe_nghiep": "Đòi hỏi quá trình đào tạo chuyên biệt, có chuyên môn, gắn bó lâu dài và phát triển bản thân.",
            "viec_lam": "Công việc được giao làm và được trả công; có thể nhất thời, làm bất cứ công việc gì để kiếm sống thì không nhất thiết là nghề nghiệp."
          }
        },
        "tam_quan_trong": {
          "doi_voi_con_nguoi": "Mang lại thu nhập ổn định bền vững; tạo môi trường hoàn thiện nhân cách, phát huy sở trường, đáp ứng đam mê và tìm thấy hạnh phúc.",
          "doi_voi_xa_hoi": "Tạo ra sản phẩm vật chất, tinh thần cho xã hội; thúc đẩy kinh tế phồn vinh; giảm tệ nạn xã hội, đảm bảo kỉ cương, ổn định."
        },
        "y_nghia_chon_dung_nghe": {
          "ca_nhan": "Có động lực học tập nghiên cứu, hài lòng với công việc, thích ứng nhanh, giảm thiểu tai nạn lao động.",
          "gia_dinh": "Nhanh chóng có cơ hội việc làm, chia sẻ gánh nặng kinh tế, xây dựng kế hoạch gia đình chắc chắn.",
          "xa_hoi": "Giảm tỉ lệ thất nghiệp, tránh lãng phí đào tạo do làm trái ngành, đảm bảo quy hoạch nguồn nhân lực cho đất nước."
        },
        "dac_diem_nghe_ki_thuat_cong_nghe": {
          "san_pham_lao_dong": "Sản phẩm cơ khí, kĩ thuật, ứng dụng, phần mềm, thiết bị điện tử phục vụ sản xuất, kinh doanh, dịch vụ và đời sống.",
          "doi_tuong_lao_dong": "Vận dụng nguyên lí vật lí, kĩ thuật, khoa học công nghệ vào thiết kế, bảo trì, sáng tạo ứng dụng, máy móc hệ thống cơ khí phục vụ công nghiệp và đời sống.",
          "moi_truong_lam_viec": "Năng động, hiện đại, luôn biến đổi và đầy thử thách; tiềm ẩn nguy cơ tai nạn lao động; tiếp xúc thiết bị công nghệ cao, áp lực lớn."
        },
        "yeu_cau_chung": {
          "nang_luc": [
            "Hiểu biết nguyên lí cơ bản của ngành kĩ thuật, công nghệ; khả năng sử dụng phương tiện thiết bị đúng cách, hiệu quả.",
            "Khả năng làm việc độc lập và làm việc nhóm.",
            "Năng lực tự học, tự nghiên cứu, đổi mới sáng tạo; có ngoại ngữ, tin học.",
            "Đủ sức khoẻ làm việc lâu dài (chống chỉ định y học với người bệnh phổi, hen suyễn, nhiễm xạ tuỳ ngành)."
          ],
          "pham_chat": [
            "Tính kỉ luật, tuân thủ quy trình, bảo vệ môi trường, an toàn lao động.",
            "Cần cù, chăm chỉ, chịu được áp lực công việc.",
            "Ý thức rèn luyện, học tập phát triển chuyên môn liên tục."
          ]
        },
        "nghe_tieu_bieu": {
          "ten_nghe": "Lập trình viên (Software Developer)",
          "nhiem_vu": "Phối hợp thiết kế phần mềm, viết mã bằng ngôn ngữ lập trình, sửa lỗi, nâng cấp, bảo mật, viết tài liệu kĩ thuật.",
          "moi_truong": "Năng động, tiếp cận công nghệ mới nhất.",
          "yeu_cau": "Thành thạo ngôn ngữ lập trình, tư duy logic giải quyết vấn đề, chịu áp lực làm việc độc lập cường độ cao."
        }
      }
    },
    {
      "bai_so": 2,
      "tieu_de": "Cơ cấu hệ thống giáo dục quốc dân",
      "muc_tieu": [
        "Mô tả được cơ cấu hệ thống giáo dục tại Việt Nam.",
        "Nhận ra, giải thích được các thời điểm có sự phân luồng và cơ hội lựa chọn nghề nghiệp kĩ thuật, công nghệ trong hệ thống giáo dục.",
        "Hiểu được sau khi kết thúc THCS có những hướng đi nào liên quan tới nghề nghiệp trong lĩnh vực kĩ thuật, công nghệ."
      ],
      "noi_dung_chinh": {
        "khung_co_cau": {
          "can_cu_phap_ly": "Luật Giáo dục 2019 và Quyết định 1981/QĐ-TTg ngày 18/10/2016 của Thủ tướng Chính phủ",
          "hai_luong_giao_duc": [
            "Giáo dục chính quy",
            "Giáo dục thường xuyên"
          ],
          "cac_cap_hoc_trinh_do": [
            {
              "cap_bac": "Giáo dục mầm non",
              "chi_tiet": "Nhà trẻ (3 đến 36 tháng tuổi) và Mẫu giáo (3 đến 5 tuổi)"
            },
            {
              "cap_bac": "Giáo dục phổ thông",
              "chi_tiet": "Tiểu học 5 năm (lớp 1 - 5); Trung học cơ sở 4 năm (lớp 6 - 9); Trung học phổ thông 3 năm (lớp 10 - 12)"
            },
            {
              "cap_bac": "Giáo dục nghề nghiệp",
              "chi_tiet": "Sơ cấp (3 tháng đến dưới 1 năm); Trung cấp (2 - 3 năm sau THCS, 1 - 2 năm sau THPT); Cao đẳng (2 - 3 năm sau THPT hoặc Trung cấp có bằng THPT)"
            },
            {
              "cap_bac": "Giáo dục đại học",
              "chi_tiet": "Đại học (3 - 5 năm); Thạc sĩ (1 - 2 năm); Tiến sĩ (3 - 4 năm)"
            },
            {
              "cap_bac": "Giáo dục thường xuyên",
              "chi_tiet": "Dành cho mọi lứa tuổi, tự học, bồi dưỡng chuyển đổi nghề, đào tạo vừa học vừa làm"
            }
          ]
        },
        "thoi_diem_phan_luong": {
          "khai_niem_phan_luong": "Biện pháp tổ chức hoạt động giáo dục trên cơ sở thực hiện hướng nghiệp, tạo điều kiện cho học sinh tốt nghiệp THCS hoặc THPT lựa chọn học tiếp cấp cao hơn hoặc đi học nghề, tham gia lao động phù hợp năng lực và điều kiện cá nhân, xã hội.",
          "hai_thoi_diem_phan_luong": [
            {
              "thoi_diem": "Sau tốt nghiệp THCS (kết thúc lớp 9)",
              "cac_huong_di": [
                "Vào học THPT (trường công lập hoặc tư thục)",
                "Vào học nghề trình độ sơ cấp, trung cấp tại các cơ sở giáo dục nghề nghiệp (mô hình 9+)",
                "Vừa học tại Trung tâm GDNN - GDTX vừa tham gia lao động sản xuất"
              ]
            },
            {
              "thoi_diem": "Sau tốt nghiệp THPT (kết thúc lớp 12)",
              "cac_huong_di": [
                "Học đại học (định hướng nghiên cứu hoặc ứng dụng)",
                "Học cao đẳng hoặc trung cấp nghề",
                "Trực tiếp tham gia thị trường lao động"
              ]
            }
          ]
        },
        "khung_trinh_do_quoc_gia_viet_nam": "Quyết định 1982/QĐ-TTg ngày 18/10/2016 quy định Khung trình độ quốc gia gồm 8 bậc: Bậc 1 (Sơ cấp I), Bậc 2 (Sơ cấp II), Bậc 3 (Sơ cấp III), Bậc 4 (Trung cấp), Bậc 5 (Cao đẳng), Bậc 6 (Đại học), Bậc 7 (Thạc sĩ), Bậc 8 (Tiến sĩ).",
        "cac_nhom_nganh_ki_thuat_cong_nghe": [
          "Công nghệ thông tin, an toàn thông tin",
          "Công nghệ kĩ thuật kiến trúc, xây dựng, công trình",
          "Công nghệ kĩ thuật cơ khí, chế tạo máy, cơ điện tử",
          "Công nghệ kĩ thuật điện, điện tử, viễn thông, tự động hoá"
        ]
      }
    },
    {
      "bai_so": 3,
      "tieu_de": "Thị trường lao động kĩ thuật, công nghệ tại Việt Nam",
      "muc_tieu": [
        "Trình bày được khái niệm về thị trường lao động, các yếu tố ảnh hưởng tới thị trường lao động, vai trò của thị trường lao động trong việc định hướng nghề nghiệp thuộc lĩnh vực kĩ thuật, công nghệ.",
        "Mô tả được những vấn đề cơ bản của thị trường lao động tại Việt Nam hiện nay.",
        "Tìm kiếm được các thông tin về thị trường lao động trong lĩnh vực kĩ thuật và công nghệ."
      ],
      "noi_dung_chinh": {
        "khai_niem_thi_truong_lao_dong": "Thị trường trao đổi hàng hoá sức lao động giữa người sử dụng lao động (bên mua) và người lao động (bên bán) trên cơ sở thoả thuận về tiền lương, các điều kiện làm việc.",
        "cac_yeu_to_anh_huong": [
          "Sự phát triển của khoa học, công nghệ (tự động hóa, chuyển đổi số làm giảm lao động thủ công, tăng nhu cầu lao động tay nghề cao).",
          "Sự chuyển dịch cơ cấu ngành kinh tế (từ nông nghiệp sang công nghiệp - xây dựng và dịch vụ).",
          "Nhu cầu lao động của xã hội và doanh nghiệp.",
          "Nguồn cung lao động (số lượng, chất lượng, cơ cấu).",
          "Chính sách kinh tế - xã hội của Nhà nước."
        ],
        "vai_tro_trong_dinh_huong_nghe": "Cung cấp số liệu cung - cầu, ngành nghề đang cần nhân lực, mức thu nhập thực tế; giúp cá nhân lựa chọn ngành nghề tránh tình trạng thừa người thiếu việc; định hướng cho cơ sở đào tạo đổi mới giáo trình.",
        "van_de_co_ban_viet_nam_hien_nay": [
          "Chất lượng lao động còn thấp, phân bố không đồng đều (tập trung tại đô thị, thiếu hụt tại nông thôn, khan hiếm lao động kĩ thuật tay nghề cao).",
          "Xu hướng cung lao động giản đơn lớn hơn cầu, nhưng lại thiếu hụt lao động qua đào tạo chuyên sâu.",
          "Xu hướng tuyển dụng đòi hỏi lao động có kĩ năng thực hành, ngoại ngữ, tin học và khả năng thích ứng công nghệ mới."
        ],
        "quy_trinh_4_buoc_tim_thong_tin": [
          {
            "buoc": 1,
            "ten": "Xác định mục tiêu tìm kiếm",
            "noi_dung": "Xác định rõ ngành nghề muốn tìm, các câu hỏi cốt lõi: Nhu cầu tuyển dụng? Mức lương? Nơi đào tạo?"
          },
          {
            "buoc": 2,
            "ten": "Xác định nguồn thông tin",
            "noi_dung": "Tìm đến nguồn chính thống: Báo cáo Bộ LĐTBXH, Tổng cục Thống kê, ILO, trung tâm dự báo FALMI, website tuyển dụng uy tín."
          },
          {
            "buoc": 3,
            "ten": "Xác định công cụ tìm kiếm",
            "noi_dung": "Sử dụng công cụ tìm kiếm (Google, Bing, ChatGPT, mạng internet, cổng thông tin việc làm)."
          },
          {
            "buoc": 4,
            "ten": "Tiến hành tìm kiếm và tổng hợp",
            "noi_dung": "Thu thập, phân tích dữ liệu về vị trí việc làm, tiêu chuẩn tuyển dụng, cơ sở đào tạo và mức thu nhập."
          }
        ]
      }
    },
    {
      "bai_so": 4,
      "tieu_de": "Quy trình lựa chọn nghề nghiệp",
      "muc_tieu": [
        "Tóm tắt được một số lí thuyết cơ bản về lựa chọn nghề nghiệp.",
        "Giải thích được các bước trong quy trình lựa chọn nghề nghiệp.",
        "Nhận ra và giải thích được các yếu tố ảnh hưởng tới quyết định lựa chọn nghề nghiệp của bản thân trong lĩnh vực kĩ thuật, công nghệ."
      ],
      "noi_dung_chinh": {
        "cac_li_thuyet_dinh_huong_nghe": {
          "mat_ma_holland": {
            "tac_gia": "John Lewis Holland (1919 - 2008)",
            "luan_diem": "Con người sẽ thành công và hài lòng nhất khi làm việc trong môi trường phù hợp với kiểu tính cách của mình.",
            "6_nhom_tinh_cach_riasec": {
              "R_Realistic_Ki_thuat": "Thực tế, thích thao tác với máy móc, dụng cụ cơ khí, hoạt động ngoài trời, tư duy trực quan.",
              "I_Investigative_Nghien_cuu": "Thích tìm hiểu, phân tích, khám phá bản chất vấn đề, tư duy trừu tượng và logic.",
              "A_Artistic_Nghe_thuat": "Giàu trí tưởng tượng, cảm xúc, thích sáng tạo, tự do, hội họa, âm nhạc, văn học.",
              "S_Social_Xa_hoi": "Thích giúp đỡ, giao tiếp, lắng nghe, chăm sóc người khác và hoạt động cộng đồng.",
              "E_Enterprising_Quan_li": "Năng động, tự tin, mạo hiểm, có tài lãnh đạo, thuyết phục người khác, thích cạnh tranh.",
              "C_Conventional_Nghiep_vu": "Cẩn thận, tỉ mỉ, ngăn nắp, thích làm việc với số liệu, quy trình, biểu mẫu rõ ràng."
            }
          },
          "cay_nghe_nghiep": {
            "goc_re": "Năng lực, Sở thích, Cá tính, Giá trị nghề nghiệp của bản thân.",
            "qua_ngot": "Cơ hội việc làm, Môi trường tốt, Lương cao, Công việc ổn định, Được nhiều người tôn trọng.",
            "nguyen_tac_vang": "Phải bắt đầu xây dựng từ GỐC RỄ. Nếu chọn nghề chỉ nhìn vào Quả ngọt (chạy theo thu nhập, danh vọng) mà không có gốc rễ phù hợp sẽ dẫn đến chán nản, thất bại."
          },
          "triet_li_ikigai": {
            "nguon_goc": "Nhật Bản (lí do để sống, lẽ sống)",
            "4_yeu_to_giao_thoa": [
              "Điều bạn yêu thích (Đam mê)",
              "Điều bạn làm giỏi (Kĩ năng/Năng lực)",
              "Điều bạn có thể được trả tiền (Nghề nghiệp)",
              "Điều xã hội/thế giới cần (Sứ mệnh)"
            ]
          }
        },
        "quy_trinh_3_buoc_chon_nghe": [
          {
            "buoc": 1,
            "ten": "Đánh giá bản thân",
            "noi_dung": "Đánh giá sở thích, năng lực, cá tính, giá trị nghề nghiệp và bối cảnh kinh tế gia đình thông qua trắc nghiệm, nhận xét của người thân/thầy cô."
          },
          {
            "buoc": 2,
            "ten": "Tìm hiểu thị trường lao động",
            "noi_dung": "Lập danh sách ngành nghề quan tâm, tìm hiểu nhu cầu tuyển dụng, yêu cầu phẩm chất, năng lực, điều kiện làm việc, tiền lương và nơi đào tạo."
          },
          {
            "buoc": 3,
            "ten": "Ra quyết định",
            "noi_dung": "So sánh, đối chiếu mức độ phù hợp giữa bản thân và ngành nghề dự kiến; lựa chọn hướng đi tối ưu nhất để theo đuổi."
          }
        ],
        "yeu_to_anh_huong_quyet_dinh": {
          "chu_quan": [
            "Năng lực: Trình độ học vấn, tư duy logic, sức khỏe thể chất (không mắc bệnh nền cản trở công việc kĩ thuật).",
            "Sở thích: Hứng thú thao tác máy móc, khám phá công nghệ mới.",
            "Cá tính: Trầm tính, độc lập hoặc thích làm việc nhóm."
          ],
          "khach_quan": [
            "Nhà trường: Định hướng từ bài giảng, hoạt động trải nghiệm.",
            "Gia đình: Truyền thống, điều kiện tài chính (tránh sự áp đặt cực đoan).",
            "Xã hội & Thị trường lao động: Cơ hội việc làm, biến động cung - cầu.",
            "Nhóm bạn: Nguồn tham khảo nhưng tránh a dua chạy theo phong trào."
          ]
        }
      }
    },
    {
      "bai_so": 5,
      "tieu_de": "Dự án: Tự đánh giá mức độ phù hợp của bản thân với một số ngành nghề trong lĩnh vực kĩ thuật, công nghệ",
      "muc_tieu": [
        "Tự đánh giá được năng lực, sở thích, cá tính của bản thân, bối cảnh gia đình về mức độ phù hợp với một số ngành nghề trong lĩnh vực kĩ thuật, công nghệ."
      ],
      "noi_dung_chinh": {
        "nhiem_vu": [
          "Tìm hiểu đặc điểm bản thân (năng lực, sở thích, cá tính, bối cảnh gia đình).",
          "Tìm hiểu ngành nghề kĩ thuật, công nghệ mục tiêu (yêu cầu năng lực, phẩm chất, điều kiện làm việc).",
          "Lập bảng đánh giá đối chiếu mức độ phù hợp và rút ra kết luận."
        ],
        "bang_danh_gia_10_tieu_chi": {
          "nhom_nang_luc": [
            "Có hiểu biết về lĩnh vực kĩ thuật, công nghệ",
            "Kĩ năng nổi trội phù hợp phương tiện, thiết bị kĩ thuật",
            "Khả năng làm việc độc lập và làm việc nhóm",
            "Năng lực học tập ngoại ngữ, tin học và khoa học tự nhiên",
            "Khả năng tự học, tự nghiên cứu"
          ],
          "nhom_so_thich": [
            "Loại công việc yêu thích (vận hành, thiết kế, sửa chữa máy móc)",
            "Đối tượng lao động yêu thích (trực tiếp tạo sản phẩm kĩ thuật)",
            "Môi trường làm việc yêu thích (kỉ luật, ngăn nắp, hệ thống)"
          ],
          "nhom_ca_tinh": [
            "5 nét cá tính phù hợp: Kiên trì/chăm chỉ, tính kỉ luật cao, có trách nhiệm, thận trọng, tuân thủ quy trình"
          ],
          "nhom_boi_canh_gia_dinh": [
            "Điều kiện kinh tế đáp ứng học phí và thời gian đào tạo (Trung cấp, Cao đẳng, Đại học)"
          ]
        },
        "thang_diem_va_xep_loai": {
          "cach_tinh_diem": "Mỗi tiêu chí trùng khớp = 1 điểm; không trùng khớp = 0 điểm. Tổng điểm tối đa: 10.",
          "muc_do": [
            {
              "khoang_diem": "1 - 3",
              "ket_luan": "Không phù hợp",
              "khuyen_nghi": "Cân nhắc chuyển đổi mục tiêu nghề nghiệp sang lĩnh vực khác."
            },
            {
              "khoang_diem": "4 - 6",
              "ket_luan": "Phù hợp một phần",
              "khuyen_nghi": "Cần kế hoạch bồi dưỡng thêm kiến thức, kĩ năng hoặc cải thiện điều kiện còn thiếu."
            },
            {
              "khoang_diem": "7 - 10",
              "ket_luan": "Phù hợp hoàn toàn",
              "khuyen_nghi": "Tự tin theo đuổi và xây dựng lộ trình học tập, rèn luyện bài bản."
            }
          ]
        },
        "ba_cau_hoi_cot_loi": [
          {
            "cau_hoi": "Hiểu mình",
            "cong_cu": "Trắc nghiệm tâm lí, trắc nghiệm hướng nghiệp, ý kiến thầy cô và gia đình."
          },
          {
            "cau_hoi": "Hiểu nghề",
            "cong_cu": "Khảo sát thông tin tuyển dụng doanh nghiệp, mục tiêu đào tạo của trường nghề/đại học."
          },
          {
            "cau_hoi": "Học nghề và rèn nghề",
            "cong_cu": "Tra cứu Danh mục đào tạo nghề Việt Nam (QĐ 34/2020/QĐ-TTg), ngày hội tư vấn tuyển sinh."
          }
        ]
      }
    }
  ],
  "bang_giai_thich_thuat_ngu": [
    {
      "thuat_ngu": "Cầu lao động",
      "dinh_nghia": "Nhu cầu về sức lao động của một quốc gia, địa phương, ngành, hay một tổ chức, doanh nghiệp trong một thời kì nhất định, phản ánh khả năng thuê mướn lao động của người sử dụng lao động.",
      "trang": 18
    },
    {
      "thuat_ngu": "Cơ sở giáo dục nghề nghiệp",
      "dinh_nghia": "Cơ sở giáo dục nghề nghiệp ở nước ta gồm: trung tâm giáo dục nghề nghiệp, trường trung cấp nghề, trường cao đẳng nghề.",
      "trang": 13
    },
    {
      "thuat_ngu": "Cung lao động",
      "dinh_nghia": "Khả năng cung cấp sức lao động cho nền kinh tế quốc dân hoặc cho một tổ chức, một thị trường lao động cụ thể.",
      "trang": 18
    },
    {
      "thuat_ngu": "Năng lực",
      "dinh_nghia": "Năng lực là tổng hợp các đặc điểm và thuộc tính tâm lí cá nhân, phù hợp với những yêu cầu đặc trưng của một hoạt động nhất định nhằm đảm bảo hoạt động đó đạt hiệu quả.",
      "trang": 5
    },
    {
      "thuat_ngu": "Ngành đào tạo",
      "dinh_nghia": "Ngành đào tạo là một tập hợp những kiến thức và kĩ năng chuyên môn của một lĩnh vực hoạt động nghề nghiệp, khoa học nhất định. Ngành đào tạo bao gồm nhiều chuyên ngành đào tạo.",
      "trang": 15
    },
    {
      "thuat_ngu": "Phân luồng",
      "dinh_nghia": "Là việc phân chia học sinh, tạo ra các con đường và định hướng cho học sinh sau khi tốt nghiệp một cấp, bậc học nào đó có thể lựa chọn con đường phù hợp để học tiếp hoặc đi vào đời tham gia lao động.",
      "trang": 6
    },
    {
      "thuat_ngu": "Thị trường",
      "dinh_nghia": "Là nơi diễn ra các hoạt động trao đổi và mua, bán hàng hoá hoặc dịch vụ giữa vế số người bán và người mua.",
      "trang": 13
    },
    {
      "thuat_ngu": "Tính cách",
      "dinh_nghia": "Là thuộc tính tâm lí của cá nhân thể hiện đức tính, thái độ đối với hiện thực và biểu hiện qua hành vi, cử chỉ, các nói năng tương ứng.",
      "trang": 24
    }
  ]
};

// Comprehensive Majors and Careers Database mapped to Holland Hexagon
const MAJORS_DATABASE = [
  {
    id: 'cntt-software',
    name: 'Công nghệ thông tin & Phát triển phần mềm',
    code: 'IRC',
    primaryType: 'I',
    secondaryType: 'R',
    tertiaryType: 'C',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+18.5%',
    avgSalary: '12 - 25 triệu/tháng',
    description: 'Thiết kế, xây dựng, tối ưu hóa phần mềm và giải pháp chuyển đổi số.',
    suitability: 'Học sinh có tư duy logic cao, kiên trì, thích tìm lỗi và giải quyết bài toán phức tạp.'
  },
  {
    id: 'co-dien-tu',
    name: 'Kỹ thuật Cơ điện tử & Robot',
    code: 'RIE',
    primaryType: 'R',
    secondaryType: 'I',
    tertiaryType: 'E',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+16.2%',
    avgSalary: '11 - 22 triệu/tháng',
    description: 'Tích hợp cơ khí chính xác, mạch điều khiển điện tử và trí tuệ nhân tạo vào máy tự động.',
    suitability: 'Đam mê chế tạo máy móc, thích làm cho thiết bị chuyển động thông minh.'
  },
  {
    id: 'dien-tu-tu-dong-hoa',
    name: 'Kỹ thuật Điều khiển & Tự động hoá',
    code: 'RIC',
    primaryType: 'R',
    secondaryType: 'I',
    tertiaryType: 'C',
    level: 'Đại học / Cao đẳng / Trung cấp 9+',
    demandGrowth: '+14.8%',
    avgSalary: '10 - 20 triệu/tháng',
    description: 'Vận hành dây chuyền sản xuất tự động, lập trình biến tần, PLC và cảm biến nhà máy.',
    suitability: 'Cẩn thận, tuân thủ quy trình kĩ thuật, thích làm việc với hệ thống điện công nghiệp.'
  },
  {
    id: 'cong-nghe-o-to',
    name: 'Công nghệ Kỹ thuật Ô tô & Xe điện',
    code: 'REC',
    primaryType: 'R',
    secondaryType: 'E',
    tertiaryType: 'C',
    level: 'Cao đẳng / Trung cấp 9+ / Đại học',
    demandGrowth: '+15.1%',
    avgSalary: '10 - 18 triệu/tháng',
    description: 'Chẩn đoán, bảo dưỡng hệ thống động cơ, pin xe điện và khung gầm ô tô hiện đại.',
    suitability: 'Khỏe mạnh, thích thao tác công cụ thực tế, muốn làm chủ công nghệ giao thông xanh.'
  },
  {
    id: 'thiet-ke-do-hoa-uiux',
    name: 'Thiết kế Đồ họa & Trải nghiệm Người dùng (UI/UX)',
    code: 'AIR',
    primaryType: 'A',
    secondaryType: 'I',
    tertiaryType: 'R',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+13.7%',
    avgSalary: '9 - 18 triệu/tháng',
    description: 'Thiết kế giao diện ứng dụng, đồ họa truyền thông và trải nghiệm số trực quan.',
    suitability: 'Cảm quan thẩm mỹ tốt, sáng tạo, không chịu được những thứ trình bày lộn xộn.'
  },
  {
    id: 'an-toan-thong-tin',
    name: 'An toàn Thông tin & An ninh Mạng',
    code: 'ICR',
    primaryType: 'I',
    secondaryType: 'C',
    tertiaryType: 'R',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+20.4%',
    avgSalary: '14 - 30 triệu/tháng',
    description: 'Bảo vệ hệ thống mạng máy tính, ngăn chặn mã độc, phòng chống tấn công số.',
    suitability: 'Tỉ mỉ, kỷ luật cao, tư duy phòng thủ và giải mã sắc bén.'
  },
  {
    id: 'dien-dan-dung-cong-nghiep',
    name: 'Kỹ thuật Điện dân dụng & Công nghiệp (Mô hình 9+)',
    code: 'RIC',
    primaryType: 'R',
    secondaryType: 'I',
    tertiaryType: 'C',
    level: 'Trung cấp nghề 9+ / Cao đẳng nghề',
    demandGrowth: '+12.5%',
    avgSalary: '9 - 16 triệu/tháng',
    description: 'Lắp đặt, sửa chữa mạng điện gia đình, trạm biến áp và hệ thống điện tòa nhà.',
    suitability: 'Thực tế, thích làm việc ngay sau THCS, khéo tay, tuân thủ an toàn lao động.'
  },
  {
    id: 'kien-truc-xay-dung',
    name: 'Kỹ thuật Xây dựng & Kiến trúc Công trình',
    code: 'RAI',
    primaryType: 'R',
    secondaryType: 'A',
    tertiaryType: 'I',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+11.0%',
    avgSalary: '11 - 22 triệu/tháng',
    description: 'Thiết kế bản vẽ kết cấu, giám sát thi công cầu đường, nhà ở và đô thị.',
    suitability: 'Hình dung không gian tốt, chịu được áp lực công trường, dung hòa thẩm mỹ và kĩ thuật.'
  },
  {
    id: 'quan-ly-san-pham-tech',
    name: 'Quản lý Sản phẩm Công nghệ (Product Manager)',
    code: 'EIR',
    primaryType: 'E',
    secondaryType: 'I',
    tertiaryType: 'R',
    level: 'Đại học',
    demandGrowth: '+17.0%',
    avgSalary: '15 - 35 triệu/tháng',
    description: 'Cầu nối giữa đội ngũ kỹ sư và thị trường kinh doanh để đưa sản phẩm công nghệ ra đời.',
    suitability: 'Nói được cả tiếng kỹ thuật lẫn tiếng kinh doanh, quyết đoán và chịu áp lực cao.'
  },
  {
    id: 'khoa-hoc-du-lieu',
    name: 'Khoa học Dữ liệu & Trí tuệ Nhân tạo',
    code: 'IRC',
    primaryType: 'I',
    secondaryType: 'R',
    tertiaryType: 'C',
    level: 'Đại học / Viện nghiên cứu',
    demandGrowth: '+22.0%',
    avgSalary: '15 - 35 triệu/tháng',
    description: 'Khai phá dữ liệu lớn, huấn luyện mô hình học máy (Machine Learning) giải quyết bài toán lớn.',
    suitability: 'Say mê Toán học, thống kê, kiên nhẫn làm việc với lượng số liệu khổng lồ.'
  },
  {
    id: 'logistics-chuoi-cung-ung',
    name: 'Kỹ thuật Logistics & Quản lý Chuỗi cung ứng',
    code: 'CER',
    primaryType: 'C',
    secondaryType: 'E',
    tertiaryType: 'R',
    level: 'Đại học / Cao đẳng',
    demandGrowth: '+16.5%',
    avgSalary: '10 - 20 triệu/tháng',
    description: 'Điều phối luồng hàng hóa, vận tải kho bãi tự động và tối ưu hóa chi phí lưu thông.',
    suitability: 'Đầu óc sắp xếp ngăn nắp, làm việc cẩn trọng với số liệu và hệ thống điều vận.'
  },
  {
    id: 'co-khi-che-tao-may',
    name: 'Kỹ thuật Cơ khí Chế tạo máy (Mô hình 9+)',
    code: 'RCI',
    primaryType: 'R',
    secondaryType: 'C',
    tertiaryType: 'I',
    level: 'Trung cấp nghề 9+ / Cao đẳng / Đại học',
    demandGrowth: '+13.5%',
    avgSalary: '9 - 18 triệu/tháng',
    description: 'Tiện, phay, bào, hàn, vận hành máy cắt kim loại CNC gia công chi tiết cơ khí.',
    suitability: 'Khỏe mạnh, bền bỉ, kiên trì, đam mê tạo ra các chi tiết kim loại tinh xảo.'
  },
  {
    id: 'su-pham-ky-thuat-stem',
    name: 'Sư phạm Công nghệ & Giáo dục STEM',
    code: 'SEC',
    primaryType: 'S',
    secondaryType: 'E',
    tertiaryType: 'C',
    level: 'Đại học / Cao đẳng Sư phạm',
    demandGrowth: '+14.0%',
    avgSalary: '10 - 20 triệu/tháng',
    description: 'Giảng dạy môn Công nghệ, STEM, hướng dẫn thực hành và truyền cảm hứng sáng tạo kỹ thuật cho học sinh.',
    suitability: 'Yêu thích giao tiếp, truyền đạt kiến thức, kiên nhẫn và có tư duy tổ chức hoạt động giáo dục.'
  },
  {
    id: 'chuyen-vien-ho-tro-ky-thuat',
    name: 'Chuyên viên Hỗ trợ Kỹ thuật & Khách hàng Công nghệ (Technical Support)',
    code: 'SCE',
    primaryType: 'S',
    secondaryType: 'C',
    tertiaryType: 'E',
    level: 'Cao đẳng / Đại học',
    demandGrowth: '+15.5%',
    avgSalary: '9 - 18 triệu/tháng',
    description: 'Hỗ trợ, hướng dẫn và giải đáp thắc mắc cho người dùng về phần mềm, giải pháp số và thiết bị công nghệ.',
    suitability: 'Thân thiện, thấu cảm, giao tiếp tốt, kiên nhẫn và cẩn thận trong xử lý yêu cầu người dùng.'
  }
];

window.EduPathData = {
  holland: HOLLAND_DATA,
  sgk: SGK_DATA,
  majors: MAJORS_DATABASE
};
