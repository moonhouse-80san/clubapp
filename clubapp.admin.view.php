<?php
/**
 * Club App Admin View
 */
class clubappAdminView extends clubapp  // ModuleObject 대신 clubapp 상속
{
    /**
     * @brief 초기화
     */
    public function init()
    {
        // 템플릿 경로 설정
        $this->setTemplatePath($this->module_path . 'tpl');
    }

    /**
     * @brief 관리자 메인 페이지
     */
    public function dispClubappAdminIndex()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();
        Context::set('settings', $settings);
        Context::set('config', $settings);

        $members = $oModel->getMembers();
        Context::set('member_count', count($members));

        $this->setTemplateFile('admin_index');
    }

    /**
     * @brief 설정 페이지
     */
    public function dispClubappAdminConfig()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();
        
        // 설정이 없으면 기본값 설정
        if(!$settings) {
            $settings = new stdClass();
            $settings->club_name = '';
            $settings->coach_1 = '';
            $settings->coach_2 = '';
            $settings->coach_3 = '';
            $settings->coach_4 = '';
            $settings->fee_preset_1 = 40000;
            $settings->fee_preset_2 = 70000;
            $settings->fee_preset_3 = 100000;
            $settings->fee_preset_4 = 200000;
            $settings->fee_preset_5 = 300000;
            $settings->bank_name = '';
            $settings->account_number = '';
            $settings->allow_guest_registration = 'N';
            $settings->show_member_details = 'Y';
            $settings->theme_color = 'default';
        }
        
        Context::set('settings', $settings);

        $this->setTemplateFile('admin_config');
    }
}