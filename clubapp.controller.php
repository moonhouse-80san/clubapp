<?php
/**
 * Club App Controller
 */
class clubappController extends clubapp
{
    /**
     * API 요청 처리
     * module.xml 에서 procClubappApi 로 등록된 액션
     */
    public function procClubappApi()
    {
        Context::setResponseMethod('JSON');

        // 로그인 체크 (라이믹스 표준)
        $logged_info = Context::get('logged_info');
        if (empty($logged_info->member_srl)) {
            $this->add('result', ['success' => false, 'message' => '로그인이 필요합니다.']);
            return new BaseObject(-1, 'msg_not_logged');
        }

        $action = Context::get('action');

        try {
            switch ($action) {
                case 'getMembers':
                    $this->_apiGetMembers($logged_info);
                    break;

                case 'getSettings':
                    $this->_apiGetSettings();
                    break;

                default:
                    $this->add('result', ['success' => false, 'message' => '잘못된 요청입니다.']);
                    break;
            }
        } catch (Exception $e) {
            // 에러 메시지에 내부 정보 노출 금지
            $this->add('result', ['success' => false, 'message' => '처리 중 오류가 발생했습니다.']);
        }

        return new BaseObject();
    }

    /**
     * 회원 목록 API
     * 관리자만 전체 조회 가능, 일반 회원은 제한된 정보만 반환
     */
    private function _apiGetMembers($logged_info)
    {
        $isAdmin = $logged_info->is_admin === 'Y';

        $output = executeQuery('clubapp.getMembers');

        $members = [];
        if ($output && $output->data) {
            $data = is_array($output->data) ? $output->data : [$output->data];
            foreach ($data as $m) {
                if ($isAdmin) {
                    $members[] = $m;
                } else {
                    // 일반 회원: 민감 정보 제외
                    $members[] = (object)[
                        'id'            => $m->id,
                        'name'          => $m->name,
                        'coach'         => $m->coach,
                        'skill_level'   => $m->skill_level,
                        'photo'         => $m->photo,
                        'schedule_status' => $m->schedule_status,
                    ];
                }
            }
        }

        $this->add('result', ['success' => true, 'members' => $members]);
    }

    /**
     * 설정 조회 API
     */
    private function _apiGetSettings()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();

        $this->add('result', [
            'success'  => true,
            'settings' => [
                'clubName'   => $settings->club_name ?? '',
                'coaches'    => [
                    $settings->coach_1 ?? '',
                    $settings->coach_2 ?? '',
                    $settings->coach_3 ?? '',
                    $settings->coach_4 ?? '',
                ],
                'feePresets' => [
                    (int)($settings->fee_preset_1 ?? 40000),
                    (int)($settings->fee_preset_2 ?? 70000),
                    (int)($settings->fee_preset_3 ?? 100000),
                    (int)($settings->fee_preset_4 ?? 200000),
                    (int)($settings->fee_preset_5 ?? 300000),
                ],
                'bankAccount' => [
                    'bank'          => $settings->bank_name ?? '',
                    'accountNumber' => $settings->account_number ?? '',
                ],
                'allowGuestRegistration' => ($settings->allow_guest_registration ?? 'N') === 'Y',
                'showMemberDetails'      => ($settings->show_member_details ?? 'Y') !== 'N',
                'themeColor'             => $settings->theme_color ?? 'default',
            ],
        ]);
    }
}
