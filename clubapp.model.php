<?php
/**
 * Club App Model
 */
class clubappModel extends clubapp
{
    /**
     * 설정 조회
     */
    public function getSettings()
    {
        $output = executeQuery('clubapp.getSettings');

        if ($output && $output->toBool() && !empty($output->data)) {
            $data = $output->data;
            return is_array($data) ? $data[0] : $data;
        }

        // 기본 설정 반환
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

        return $settings;
    }

    /**
     * 회원 목록 조회
     */
    public function getMembers()
    {
        $output = executeQuery('clubapp.getMembers');

        if ($output && $output->toBool() && !empty($output->data)) {
            return is_array($output->data) ? $output->data : [$output->data];
        }

        return [];
    }

    /**
     * 회원 상세 조회
     */
    public function getMember($id)
    {
        $args = new stdClass();
        $args->id = (int)$id;

        $output = executeQuery('clubapp.getMember', $args);

        if ($output && $output->toBool() && !empty($output->data)) {
            return is_array($output->data) ? $output->data[0] : $output->data;
        }

        return null;
    }

    /**
     * 회원 스케줄 조회
     */
    public function getMemberSchedules($memberId)
    {
        $args = new stdClass();
        $args->member_id = (int)$memberId;

        $output = executeQuery('clubapp.getMemberSchedules', $args);

        if ($output && $output->toBool() && !empty($output->data)) {
            return is_array($output->data) ? $output->data : [$output->data];
        }

        return [];
    }

    /**
     * 회원 수상경력 조회
     */
    public function getMemberAwards($memberId)
    {
        $args = new stdClass();
        $args->member_id = (int)$memberId;

        $output = executeQuery('clubapp.getMemberAwards', $args);

        if ($output && $output->toBool() && !empty($output->data)) {
            return is_array($output->data) ? $output->data : [$output->data];
        }

        return [];
    }

    /**
     * 현재 출석 날짜 목록 조회
     */
    public function getAttendanceCurrent($memberId)
    {
        $args = new stdClass();
        $args->member_id = (int)$memberId;

        $output = executeQuery('clubapp.getAttendanceCurrent', $args);

        $dates = [];
        if ($output && $output->toBool() && !empty($output->data)) {
            $rows = is_array($output->data) ? $output->data : [$output->data];
            foreach ($rows as $row) {
                $dates[] = $row->attendance_date;
            }
        }

        return $dates;
    }

    /**
     * 출석 이력 날짜 목록 조회
     */
    public function getAttendanceHistory($memberId)
    {
        $args = new stdClass();
        $args->member_id = (int)$memberId;

        $output = executeQuery('clubapp.getAttendanceHistory', $args);

        $dates = [];
        if ($output && $output->toBool() && !empty($output->data)) {
            $rows = is_array($output->data) ? $output->data : [$output->data];
            foreach ($rows as $row) {
                $dates[] = $row->attendance_date;
            }
        }

        return $dates;
    }

    /**
     * 입금 내역 조회
     */
    public function getPaymentHistory($memberId)
    {
        $args = new stdClass();
        $args->member_id = (int)$memberId;

        $output = executeQuery('clubapp.getPaymentHistory', $args);

        if ($output && $output->toBool() && !empty($output->data)) {
            return is_array($output->data) ? $output->data : [$output->data];
        }

        return [];
    }
}
