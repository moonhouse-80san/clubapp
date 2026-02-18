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
     * 관리자 메인 페이지
     */
    public function dispClubappAdminIndex()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();
        Context::set('settings', $settings);

        $members = $oModel->getMembers();
        Context::set('member_count', count($members));

        $this->setTemplateFile('admin_index');
    }

    /**
     * 설정 페이지
     */
    public function dispClubappAdminConfig()
    {
        $oModel = getModel('clubapp');
        $settings = $oModel->getSettings();
        Context::set('settings', $settings);

        $this->setTemplateFile('admin_config');
    }
}
