<?php
/**
 * Club App Admin Controller
 */
class clubappAdminController extends clubapp  // ModuleObject 대신 clubapp 상속
{
    /**
     * @brief 관리자 설정 저장
     */
    public function procClubappAdminInsertConfig()
    {
        // 관리자 권한 체크
        $logged_info = Context::get('logged_info');
        if (empty($logged_info->member_srl) || ($logged_info->is_admin ?? 'N') !== 'Y') {
            return new BaseObject(-1, 'msg_not_permitted');
        }

        $vars = Context::getRequestVars();

        // 입력값 검증 및 정제
        $config = new stdClass();
        $config->club_name            = htmlspecialchars(trim($vars->club_name ?? ''), ENT_QUOTES, 'UTF-8');
        $config->coach_1              = htmlspecialchars(trim($vars->coach_1 ?? ''), ENT_QUOTES, 'UTF-8');
        $config->coach_2              = htmlspecialchars(trim($vars->coach_2 ?? ''), ENT_QUOTES, 'UTF-8');
        $config->coach_3              = htmlspecialchars(trim($vars->coach_3 ?? ''), ENT_QUOTES, 'UTF-8');
        $config->coach_4              = htmlspecialchars(trim($vars->coach_4 ?? ''), ENT_QUOTES, 'UTF-8');
        $config->fee_preset_1         = (int)($vars->fee_preset_1 ?? 40000);
        $config->fee_preset_2         = (int)($vars->fee_preset_2 ?? 70000);
        $config->fee_preset_3         = (int)($vars->fee_preset_3 ?? 100000);
        $config->fee_preset_4         = (int)($vars->fee_preset_4 ?? 200000);
        $config->fee_preset_5         = (int)($vars->fee_preset_5 ?? 300000);
        $config->bank_name            = htmlspecialchars(trim($vars->bank_name ?? ''), ENT_QUOTES, 'UTF-8');
        $config->account_number       = htmlspecialchars(trim($vars->account_number ?? ''), ENT_QUOTES, 'UTF-8');
        $config->allow_guest_registration = ($vars->allow_guest_registration === 'Y') ? 'Y' : 'N';
        $config->show_member_details  = ($vars->show_member_details === 'N') ? 'N' : 'Y';

        // theme_color 화이트리스트 검증
        $allowedThemes = ['default', 'blue', 'green', 'red', 'dark'];
        $config->theme_color = in_array($vars->theme_color ?? '', $allowedThemes, true)
            ? $vars->theme_color
            : 'default';

        // 라이믹스 모듈 설정으로 저장
        $oModuleController = getController('module');
        $output = $oModuleController->insertModuleConfig('clubapp', $config);

        if (!$output->toBool()) {
            return $output;
        }

        // DB 테이블에 설정 저장
        $existingCount = executeQuery('clubapp.getSettings');
        $hasRecord = $existingCount && !empty($existingCount->data);

        $args = clone $config;
        if ($hasRecord) {
            $output = executeQuery('clubapp.updateSettings', $args);
        } else {
            $args->regdate = date('YmdHis');
            $output = executeQuery('clubapp.insertSettings', $args);
        }

        if (!$output->toBool()) {
            return $output;
        }

        $this->setMessage('success_registed');
        
        // 리다이렉트 URL 수정
        $this->setRedirectUrl(getNotEncodedUrl('', 'module', 'admin', 'act', 'dispClubappAdminConfig'));
    }
}