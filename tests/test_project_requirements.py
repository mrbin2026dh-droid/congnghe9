# -*- coding: utf-8 -*-
"""
Kiểm thử thật Dự án Bài 5: cột "Đặc điểm và yêu cầu của nghề (2)" phải THAY ĐỔI THEO NGÀNH được chọn
(trước đây luôn hiện 10 câu cố định cho mọi ngành). Chromium + Firebase Emulator.

 1. Mọi ngành trong dữ liệu đều sinh đủ 10 yêu cầu, không còn chỗ trống {name}/{careers}.
 2. Đổi ngành nhóm R -> nhóm S: cột (2) đổi nội dung, tiêu đề cột ghi đúng tên ngành, có hồ sơ ngành.
 3. Tiêu chí 10 (gia đình) đổi theo trình độ đào tạo (trung cấp 9+ khác đại học).
 4. Báo cáo in PDF dùng đúng yêu cầu của ngành đang chọn; nội dung học sinh nhập được escape.
 5. Không có lỗi JavaScript.

Chạy:  python tests/test_project_requirements.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from playwright.sync_api import sync_playwright  # noqa: E402
from test_emulator_survey_resume import PASSED, check, db_request, start_processes, stop_processes  # noqa: E402
from test_offline_devices import open_app, try_student_login  # noqa: E402


def requirement_cells(page):
    return page.evaluate('() => [...document.querySelectorAll("#assessment-matrix-body .assessment-requirement-cell")].map(td => td.textContent.trim())')


def choose_major(page, major_id):
    page.select_option('#assessment-major-select', major_id)
    page.wait_for_timeout(250)


def run():
    db_request('PUT', '', {'settings': {'teacherPin': '2026'}, 'students': {
        '9K-01': {'studentCode': '9K-01', 'name': 'Phan Gia Bảo', 'grade': '9K', 'school': 'THCS Test'}}})
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(viewport={'width': 1366, 'height': 900})
        page = open_app(ctx, errors)

        print('\n[1] Toàn bộ dữ liệu ngành')
        audit = page.evaluate('''() => {
            const majors = window.EduPathData.majors;
            const bad = [];
            majors.forEach(m => {
                const r = ProjectAssessment.getMajorRequirements(m);
                if (r.length !== 10 || r.some(t => !t || /[{}]/.test(t) || t.includes('undefined'))) bad.push(m.name);
            });
            return { total: majors.length, bad };
        }''')
        check(f'Cả {audit["total"]} ngành đều sinh đủ 10 yêu cầu hợp lệ', not audit['bad'], str(audit['bad']))
        dirty = page.evaluate('''() => window.EduPathData.majors.concat(window.EduPathData.aiducationMajors)
            .flatMap(m => (m.careers || []).filter(c => c.length > 45 || /[.!?]$/.test(c)))''')
        check('Tên nghề tiêu biểu sạch (không dính câu bình luận)', not dirty, str(dirty[:3]))

        ok, _, err = try_student_login(page, '9K-01')
        check('Học sinh đăng nhập', ok, err)
        page.locator('.tab-btn[data-tab="project"]').click()
        page.wait_for_selector('#assessment-matrix-body tr')

        picks = page.evaluate('''() => {
            const ms = window.EduPathData.majors;
            const by = (pred) => (ms.find(pred) || {}).id;
            return {
                R: by(m => (m.primaryType || m.code[0]) === 'R'),
                S: by(m => (m.primaryType || m.code[0]) === 'S'),
                voc: by(m => /9\\+/.test(m.level || '') && !/đại học/i.test(m.level || '')),
                uni: by(m => /^Đại học/i.test(m.level || '') && !/9\\+/.test(m.level || ''))
            };
        }''')
        check('Dữ liệu có ngành nhóm R, nhóm S, ngành học nghề 9+ và ngành đại học', all(picks.values()), str(picks))

        print('\n[2] Đổi ngành R -> S')
        choose_major(page, picks['R'])
        r_cells = requirement_cells(page)
        r_name = page.evaluate('(id) => window.EduPathData.majors.find(m => m.id === id).name', picks['R'])
        check('Ngành R: đủ 10 yêu cầu', len(r_cells) == 10)
        check('Ngành R: yêu cầu nhắc đúng tên ngành', r_name in r_cells[0], r_cells[0])
        check('Tiêu đề cột (2) ghi tên ngành R', r_name in page.locator('#assessment-requirement-major').inner_text())
        check('Có hồ sơ ngành (trình độ đào tạo)', 'Trình độ đào tạo' in page.locator('#assessment-major-profile').inner_text())

        choose_major(page, picks['S'])
        s_cells = requirement_cells(page)
        s_name = page.evaluate('(id) => window.EduPathData.majors.find(m => m.id === id).name', picks['S'])
        changed = sum(1 for a, b in zip(r_cells, s_cells) if a != b)
        check(f'Đổi sang ngành S: cột (2) đổi nội dung ({changed}/10 tiêu chí khác)', changed >= 9, f'{changed}')
        check('Ngành S: yêu cầu nhắc đúng tên ngành mới', s_name in s_cells[0], s_cells[0])
        check('Tiêu đề cột (2) cập nhật tên ngành S', s_name in page.locator('#assessment-requirement-major').inner_text())

        print('\n[3] Tiêu chí 10 theo trình độ đào tạo')
        choose_major(page, picks['voc'])
        voc10 = requirement_cells(page)[9]
        choose_major(page, picks['uni'])
        uni10 = requirement_cells(page)[9]
        check('Ngành học nghề 9+: nêu lộ trình trung cấp sau lớp 9', '9+' in voc10, voc10)
        check('Ngành đại học: nêu lộ trình THPT → cao đẳng/đại học', 'đại học' in uni10 and voc10 != uni10, uni10)

        print('\n[4] Báo cáo in PDF')
        page.evaluate('() => { window.app.studentProfile.selfTraits = { 0: "<img src=x onerror=window.__xss=1>" }; }')
        report = page.evaluate('''() => {
            const major = window.EduPathData.majors.find(m => m.id === window.app.studentProfile.targetMajorId);
            return ProjectAssessment.generatePrintableHTML(window.app.studentProfile, major, window.app.assessmentMatches,
                ProjectAssessment.calculateProjectResult(window.app.assessmentMatches));
        }''')
        uni_cells = requirement_cells(page)
        check('Báo cáo dùng đúng yêu cầu của ngành đang chọn', all(c.replace('–', '–') in report for c in uni_cells[:9]))
        check('Báo cáo không còn câu yêu cầu cố định cũ', 'quy trình hoạt động cơ bản của máy móc hoặc hệ thống phần mềm' not in report)
        check('Nội dung học sinh nhập được escape trong báo cáo', '<img src=x' not in report and '&lt;img' in report)
        ctx.close()
        browser.close()

    print('\n[5] Lỗi console F12')
    real = [e for e in errors if not any(x in e for x in ('favicon', 'Failed to load resource', 'net::ERR'))]
    for e in real:
        print('   ', e)
    check('Không có lỗi JavaScript trong console', not real, f'{len(real)} lỗi')


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    procs = start_processes()
    try:
        run()
        print(f'\n🎉 ĐẠT {len(PASSED)}/{len(PASSED)} kiểm tra Dự án Bài 5 theo ngành.')
    except Exception as exc:
        print(f'\n❌ {exc}')
        print(f'Đã đạt {len(PASSED)} kiểm tra trước khi lỗi.')
        sys.exit(1)
    finally:
        stop_processes(procs)
