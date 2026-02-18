<?php
/**
 * Club App Admin View
 */
class clubappAdminView extends clubapp
{
    public function init()
    {
        $this->setTemplatePath($this->module_path . 'tpl');
    }

    /**
     * 관리자 메인 (대시보드)
     */
    public function dispClubappAdminIndex()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();
        Context::set('settings', $settings);

        // ── 회원 수 ──
        $members = $oModel->getMembers();
        Context::set('member_count', count($members));

        // ── 코치 수 (비어있지 않은 코치 필드 개수) ──
        $coach_count = 0;
        foreach (['coach_1','coach_2','coach_3','coach_4'] as $f) {
            if (!empty($settings->$f)) $coach_count++;
        }
        Context::set('coach_count', $coach_count);

        // ── 이번달 입금 합계 ──
        $monthly_payment = 0;
        $recent_payments = [];

        $output = executeQuery('clubapp.getRecentPayments');
        if ($output && $output->toBool() && !empty($output->data)) {
            $rows = is_array($output->data) ? $output->data : [$output->data];

            // 이름 매핑 (member_id → name)
            $memberMap = [];
            foreach ($members as $m) {
                $memberMap[$m->id] = $m->name;
            }

            $thisMonth = date('Ym');
            foreach ($rows as $row) {
                $row->member_name = $memberMap[$row->member_id] ?? '(알수없음)';
                // 이번달 합계
                if (substr(str_replace('-', '', $row->payment_date), 0, 6) === $thisMonth) {
                    $monthly_payment += (int)$row->amount;
                }
            }
            // 최근 10건만
            $recent_payments = array_slice($rows, 0, 10);
        }
        Context::set('monthly_payment', $monthly_payment);
        Context::set('recent_payments', $recent_payments);

        // ── 오늘 출석 인원 ──
        $today = date('Y-m-d');
        $today_attendance = 0;
        $attOutput = executeQuery('clubapp.getTodayAttendanceCount', (object)['attendance_date' => $today]);
        if ($attOutput && $attOutput->toBool() && !empty($attOutput->data)) {
            $today_attendance = (int)($attOutput->data->count ?? 0);
        }
        Context::set('today_attendance', $today_attendance);

        $this->setTemplateFile('admin_index');
    }

    /**
     * 설정 페이지
     */
    public function dispClubappAdminConfig()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();

        if (!$settings) {
            $settings = new stdClass();
            $settings->club_name                = '';
            $settings->coach_1                  = '';
            $settings->coach_2                  = '';
            $settings->coach_3                  = '';
            $settings->coach_4                  = '';
            $settings->fee_preset_1             = 40000;
            $settings->fee_preset_2             = 70000;
            $settings->fee_preset_3             = 100000;
            $settings->fee_preset_4             = 200000;
            $settings->fee_preset_5             = 300000;
            $settings->bank_name                = '';
            $settings->account_number           = '';
            $settings->allow_guest_registration = 'N';
            $settings->show_member_details      = 'Y';
            $settings->theme_color              = 'default';
        }

        Context::set('settings', $settings);
        $this->setTemplateFile('admin_config');
    }
}