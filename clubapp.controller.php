<?php
/**
 * Club App Controller
 * procClubappApi: JS에서 /index.php?module=clubapp&act=procClubappApi&api_action=xxx 로 호출
 */
class clubappController extends clubapp
{
    public function init() {}

    /**
     * API 엔드포인트 - 라이믹스 세션/권한 자동 처리
     */
    public function procClubappApi()
    {
        // JSON 응답 헤더
        header('Content-Type: application/json; charset=utf-8');

        // api_action 파라미터 수신 (GET 또는 POST body)
        $api_action = Context::get('api_action') ?? '';
        if (empty($api_action)) {
            $raw = file_get_contents('php://input');
            $body = json_decode($raw, true) ?? [];
            $api_action = $body['api_action'] ?? '';
        }

        // 허용 액션 목록
        $publicActions  = ['getSettings', 'getMembers']; // 비로그인도 허용
        $privateActions = [
            'getMember', 'insertMember', 'updateMember', 'deleteMember',
            'toggleAttendance', 'resetAttendance', 'getAttendanceDates',
            'deleteAttendanceDate', 'deleteAttendanceHistory',
            'insertPayment', 'updatePayment', 'deletePayment', 'getPaymentHistory',
            'updateSettings', 'getMonthlyReport', 'getYearlyReport',
        ];
        $allActions = array_merge($publicActions, $privateActions);

        if (!in_array($api_action, $allActions)) {
            echo json_encode(['success' => false, 'message' => '잘못된 요청: ' . htmlspecialchars($api_action)]);
            return;
        }

        // 비공개 액션은 로그인 필요
        $logged_info = Context::get('logged_info');
        $is_logged   = !empty($logged_info->member_srl);

        if (in_array($api_action, $privateActions) && !$is_logged) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => '로그인이 필요합니다.']);
            return;
        }

        // POST body 파싱
        $raw  = file_get_contents('php://input');
        $body = json_decode($raw, true) ?? [];

        // 라우팅
        try {
            $result = $this->handleApiAction($api_action, $body, $logged_info);
            echo json_encode($result, JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    private function handleApiAction($action, $body, $logged_info)
    {
        $oModel = getModel('clubapp');

        switch ($action) {

            // ── 설정 ──────────────────────────────────
            case 'getSettings':
                $result = executeQuery('clubapp.getSettings');
                $data   = ($result && $result->data)
                    ? (is_array($result->data) ? $result->data[0] : $result->data)
                    : null;
                if ($data) {
                    return ['success' => true, 'settings' => [
                        'clubName'               => $data->club_name ?? '',
                        'coachName1'             => $data->coach_name1 ?? '',
                        'coachName2'             => $data->coach_name2 ?? '',
                        'coachName3'             => $data->coach_name3 ?? '',
                        'coachName4'             => $data->coach_name4 ?? '',
                        'bankName'               => $data->bank_name ?? '',
                        'accountNumber'          => $data->account_number ?? '',
                        'feePreset1'             => $data->fee_preset1 ?? '',
                        'feePreset2'             => $data->fee_preset2 ?? '',
                        'feePreset3'             => $data->fee_preset3 ?? '',
                        'feePreset4'             => $data->fee_preset4 ?? '',
                        'feePreset5'             => $data->fee_preset5 ?? '',
                        'themeColor'             => $data->theme_color ?? 'default',
                        'allowGuestRegistration' => (bool)($data->allow_guest_registration ?? false),
                        'showMemberDetails'      => (bool)($data->show_member_details ?? true),
                    ]];
                }
                return ['success' => true, 'settings' => (object)[]];

            case 'updateSettings':
                $is_admin = $logged_info && ($logged_info->is_admin === 'Y');
                if (!$is_admin) {
                    return ['success' => false, 'message' => '관리자 권한이 필요합니다.'];
                }
                $args = new stdClass();
                $args->club_name               = $body['clubName'] ?? '';
                $args->coach_name1             = $body['coachName1'] ?? '';
                $args->coach_name2             = $body['coachName2'] ?? '';
                $args->coach_name3             = $body['coachName3'] ?? '';
                $args->coach_name4             = $body['coachName4'] ?? '';
                $args->bank_name               = $body['bankName'] ?? '';
                $args->account_number          = $body['accountNumber'] ?? '';
                $args->fee_preset1             = $body['feePreset1'] ?? '';
                $args->fee_preset2             = $body['feePreset2'] ?? '';
                $args->fee_preset3             = $body['feePreset3'] ?? '';
                $args->fee_preset4             = $body['feePreset4'] ?? '';
                $args->fee_preset5             = $body['feePreset5'] ?? '';
                $args->theme_color             = $body['themeColor'] ?? 'default';
                $args->allow_guest_registration = ($body['allowGuestRegistration'] ?? false) ? 'Y' : 'N';
                $args->show_member_details      = ($body['showMemberDetails'] ?? true) ? 'Y' : 'N';

                $existing = executeQuery('clubapp.getSettings');
                if ($existing && $existing->data) {
                    $existingData = is_array($existing->data) ? $existing->data[0] : $existing->data;
                    $args->id = $existingData->id;
                    executeQuery('clubapp.updateSettings', $args);
                } else {
                    executeQuery('clubapp.insertSettings', $args);
                }
                return ['success' => true];

            // ── 회원 ──────────────────────────────────
            case 'getMembers':
                $result  = executeQuery('clubapp.getMembers');
                $members = [];
                if ($result && $result->data) {
                    $rows = is_array($result->data) ? $result->data : [$result->data];
                    foreach ($rows as $row) {
                        $members[] = $this->memberRowToArray($row);
                    }
                }
                return ['success' => true, 'members' => $members];

            case 'getMember':
                $id     = (int)($body['id'] ?? Context::get('id') ?? 0);
                $result = executeQuery('clubapp.getMember', (object)['id' => $id]);
                if ($result && $result->data) {
                    return ['success' => true, 'member' => $this->memberRowToArray($result->data)];
                }
                return ['success' => false, 'message' => '회원을 찾을 수 없습니다.'];

            case 'insertMember':
                $args = $this->bodyToMemberArgs($body);
                $result = executeQuery('clubapp.insertMember', $args);
                return ['success' => true, 'id' => $result->get('id') ?? 0];

            case 'updateMember':
                $args = $this->bodyToMemberArgs($body);
                $args->id = (int)($body['id'] ?? 0);
                executeQuery('clubapp.updateMember', $args);
                return ['success' => true];

            case 'deleteMember':
                $args     = new stdClass();
                $args->id = (int)($body['id'] ?? 0);
                executeQuery('clubapp.deleteMember', $args);
                return ['success' => true];

            // ── 출석 ──────────────────────────────────
            case 'toggleAttendance':
                $args            = new stdClass();
                $args->member_id = (int)($body['member_id'] ?? 0);
                $args->attendance_date = $body['date'] ?? date('Y-m-d');
                // 이미 있으면 삭제, 없으면 삽입
                $check = executeQuery('clubapp.getAttendanceByDate', $args);
                if ($check && $check->data) {
                    executeQuery('clubapp.deleteAttendanceByDate', $args);
                    return ['success' => true, 'checked' => false];
                } else {
                    executeQuery('clubapp.insertAttendance', $args);
                    return ['success' => true, 'checked' => true];
                }

            case 'resetAttendance':
                $args            = new stdClass();
                $args->member_id = (int)($body['member_id'] ?? 0);
                executeQuery('clubapp.deleteCurrentAttendance', $args);
                return ['success' => true];

            case 'getAttendanceDates':
                $args            = new stdClass();
                $args->member_id = (int)(Context::get('member_id') ?? $body['member_id'] ?? 0);
                $result          = executeQuery('clubapp.getAttendanceDates', $args);
                $dates           = [];
                if ($result && $result->data) {
                    $rows = is_array($result->data) ? $result->data : [$result->data];
                    foreach ($rows as $row) {
                        $dates[] = $row->attendance_date;
                    }
                }
                return ['success' => true, 'dates' => $dates];

            case 'deleteAttendanceDate':
                $args            = new stdClass();
                $args->member_id = (int)($body['member_id'] ?? 0);
                $args->attendance_date = $body['date'] ?? '';
                executeQuery('clubapp.deleteAttendanceByDate', $args);
                return ['success' => true];

            case 'deleteAttendanceHistory':
                $args            = new stdClass();
                $args->member_id = (int)($body['member_id'] ?? 0);
                executeQuery('clubapp.deleteAllAttendance', $args);
                return ['success' => true];

            // ── 입금 ──────────────────────────────────
            case 'insertPayment':
                $args            = new stdClass();
                $args->member_id = (int)($body['member_id'] ?? 0);
                $args->payment_date   = $body['date'] ?? date('Y-m-d');
                $args->payment_amount = (int)($body['amount'] ?? 0);
                $result = executeQuery('clubapp.insertPayment', $args);
                return ['success' => true, 'payment_id' => $result->get('payment_id') ?? 0];

            case 'updatePayment':
                $args               = new stdClass();
                $args->payment_id   = (int)($body['payment_id'] ?? 0);
                $args->member_id    = (int)($body['member_id'] ?? 0);
                $args->payment_date   = $body['date'] ?? '';
                $args->payment_amount = (int)($body['amount'] ?? 0);
                executeQuery('clubapp.updatePayment', $args);
                return ['success' => true];

            case 'deletePayment':
                $args             = new stdClass();
                $args->payment_id = (int)($body['payment_id'] ?? 0);
                executeQuery('clubapp.deletePayment', $args);
                return ['success' => true];

            case 'getPaymentHistory':
                $args            = new stdClass();
                $args->member_id = (int)(Context::get('member_id') ?? $body['member_id'] ?? 0);
                $result          = executeQuery('clubapp.getPaymentHistory', $args);
                $payments        = [];
                if ($result && $result->data) {
                    $rows = is_array($result->data) ? $result->data : [$result->data];
                    foreach ($rows as $row) {
                        $payments[] = [
                            'payment_id'     => $row->payment_id,
                            'payment_date'   => $row->payment_date,
                            'payment_amount' => $row->payment_amount,
                        ];
                    }
                }
                return ['success' => true, 'payments' => $payments];

            // ── 리포트 ────────────────────────────────
            case 'getMonthlyReport':
                $year  = (int)(Context::get('year') ?? date('Y'));
                $month = (int)(Context::get('month') ?? date('n'));
                // 간단한 집계 쿼리 (별도 XML 필요)
                return ['success' => true, 'year' => $year, 'month' => $month, 'data' => []];

            case 'getYearlyReport':
                $year = (int)(Context::get('year') ?? date('Y'));
                return ['success' => true, 'year' => $year, 'data' => []];

            default:
                return ['success' => false, 'message' => '알 수 없는 액션'];
        }
    }

    // ── 헬퍼 ────────────────────────────────────────
    private function memberRowToArray($row)
    {
        return [
            'id'           => $row->id,
            'name'         => $row->name ?? '',
            'phone'        => $row->phone ?? '',
            'coach'        => $row->coach ?? '',
            'fee'          => $row->fee ?? 0,
            'targetCount'  => $row->target_count ?? 0,
            'currentCount' => $row->current_count ?? 0,
            'gender'       => $row->gender ?? '',
            'birthYear'    => $row->birth_year ?? '',
            'skillLevel'   => $row->skill_level ?? '',
            'registerDate' => $row->register_date ?? '',
            'email'        => $row->email ?? '',
            'address'      => $row->address ?? '',
            'etc'          => $row->etc ?? '',
            'privateMemo'  => $row->private_memo ?? '',
            'photo'        => $row->photo ?? '',
            'schedules'    => json_decode($row->schedules ?? '[]', true),
            'awards'       => json_decode($row->awards ?? '[]', true),
            'payments'     => json_decode($row->payments ?? '[]', true),
            'scheduleStatus' => $row->schedule_status ?? 'regular',
        ];
    }

    private function bodyToMemberArgs($body)
    {
        $args = new stdClass();
        $args->name          = $body['name'] ?? '';
        $args->phone         = $body['phone'] ?? '';
        $args->coach         = $body['coach'] ?? '';
        $args->fee           = (int)($body['fee'] ?? 0);
        $args->target_count  = (int)($body['targetCount'] ?? 0);
        $args->current_count = (int)($body['currentCount'] ?? 0);
        $args->gender        = $body['gender'] ?? '';
        $args->birth_year    = $body['birthYear'] ?? '';
        $args->skill_level   = $body['skillLevel'] ?? '';
        $args->register_date = $body['registerDate'] ?? date('Y-m-d');
        $args->email         = $body['email'] ?? '';
        $args->address       = $body['address'] ?? '';
        $args->etc           = $body['etc'] ?? '';
        $args->private_memo  = $body['privateMemo'] ?? '';
        $args->photo         = $body['photo'] ?? '';
        $args->schedules     = json_encode($body['schedules'] ?? []);
        $args->awards        = json_encode($body['awards'] ?? []);
        $args->payments      = json_encode($body['payments'] ?? []);
        $args->schedule_status = $body['scheduleStatus'] ?? 'regular';
        return $args;
    }

    // ── 설정 저장 (admin) ───────────────────────────
    public function procClubappAdminInsertConfig()
    {
        $is_admin = (Context::get('logged_info')->is_admin === 'Y');
        if (!$is_admin) return $this->setError('권한이 없습니다.');

        $args = new stdClass();
        $args->club_name               = Context::get('club_name');
        $args->coach_name1             = Context::get('coach_name1');
        $args->coach_name2             = Context::get('coach_name2');
        $args->coach_name3             = Context::get('coach_name3');
        $args->coach_name4             = Context::get('coach_name4');
        $args->bank_name               = Context::get('bank_name');
        $args->account_number          = Context::get('account_number');
        $args->fee_preset1             = Context::get('fee_preset1');
        $args->fee_preset2             = Context::get('fee_preset2');
        $args->fee_preset3             = Context::get('fee_preset3');
        $args->fee_preset4             = Context::get('fee_preset4');
        $args->fee_preset5             = Context::get('fee_preset5');
        $args->theme_color             = Context::get('theme_color') ?: 'default';
        $args->allow_guest_registration = Context::get('allow_guest_registration') ? 'Y' : 'N';
        $args->show_member_details      = Context::get('show_member_details') !== 'N' ? 'Y' : 'N';

        $existing = executeQuery('clubapp.getSettings');
        if ($existing && $existing->data) {
            $existingData = is_array($existing->data) ? $existing->data[0] : $existing->data;
            $args->id = $existingData->id;
            executeQuery('clubapp.updateSettings', $args);
        } else {
            executeQuery('clubapp.insertSettings', $args);
        }

        $this->setRedirectUrl(getNotEncodedUrl('', 'module', 'admin', 'act', 'dispClubappAdminConfig'));
    }
}