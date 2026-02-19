<?php
/**
 * Club App Admin Controller
 */
class clubappAdminController extends clubapp
{
    private function _checkAdmin()
    {
        $logged_info = Context::get('logged_info');
        if (empty($logged_info->member_srl) || ($logged_info->is_admin ?? 'N') !== 'Y') {
            return false;
        }
        return true;
    }

    /**
     * 모듈 인스턴스(mid) 저장 — 등록 또는 수정
     */
    public function procClubappAdminSaveInstance()
    {
        if (!$this->_checkAdmin()) {
            return new BaseObject(-1, 'msg_not_permitted');
        }

        $vars       = Context::getRequestVars();
        $mid        = preg_replace('/[^a-zA-Z0-9_]/', '', trim($vars->module_mid ?? ''));
        $title      = trim($vars->module_title ?? '');
        $module_srl = (int)($vars->module_srl ?? 0);

        if (empty($mid)) {
            return new BaseObject(-1, '모듈 주소(mid)를 입력해 주세요.');
        }
        if (empty($title)) {
            $title = $mid;
        }

        $oModuleController = getController('module');

        if ($module_srl > 0) {
            // 수정 — 기존 인스턴스 정보 가져와서 업데이트
            $oModuleModel = getModel('module');
            $module_info  = $oModuleModel->getModuleInfoByModuleSrl($module_srl);

            if (!$module_info || $module_info->module !== 'clubapp') {
                return new BaseObject(-1, '잘못된 접근입니다.');
            }

            $args                = new stdClass();
            $args->module_srl    = $module_srl;
            $args->mid           = $mid;
            $args->browser_title = $title;
            $args->module        = 'clubapp';
            $args->skin          = $module_info->skin ?: 'default';
            $args->layout_srl    = (int)($module_info->layout_srl ?? 0);

            $output = $oModuleController->updateModule($args);
            if (!$output->toBool()) {
                return new BaseObject(-1, '수정에 실패했습니다: ' . $output->getMessage());
            }

        } else {
            // 신규 등록 — mid 중복 체크
            $oModuleModel = getModel('module');
            $chk = $oModuleModel->getModuleInfoByMid($mid);
            if ($chk && !empty($chk->module_srl)) {
                return new BaseObject(-1, "이미 사용 중인 주소입니다: {$mid}");
            }

            $args                        = new stdClass();
            $args->module                = 'clubapp';
            $args->mid                   = $mid;
            $args->browser_title         = $title;
            $args->skin                  = 'default';
            $args->layout_srl            = 0;
            $args->mobile_layout_srl     = 0;
            $args->is_default            = 'N';
            $args->site_srl              = 0;

            $output = $oModuleController->insertModule($args);
            if (!$output->toBool()) {
                return new BaseObject(-1, '등록에 실패했습니다: ' . $output->getMessage());
            }
        }

        FileHandler::removeDir('./files/cache/module/');

        $this->setMessage('저장되었습니다.');
        $this->setRedirectUrl(getNotEncodedUrl('', 'module', 'admin', 'act', 'dispClubappAdminIndex'));
    }

    /**
     * 모듈 인스턴스 삭제
     */
    public function procClubappAdminDeleteInstance()
    {
        if (!$this->_checkAdmin()) {
            return new BaseObject(-1, 'msg_not_permitted');
        }

        $vars = Context::getRequestVars();
        $srls = $vars->module_srl ?? [];

        if (empty($srls)) {
            $this->setMessage('삭제할 항목을 선택해 주세요.');
            $this->setRedirectUrl(getNotEncodedUrl('', 'module', 'admin', 'act', 'dispClubappAdminIndex'));
            return;
        }

        if (!is_array($srls)) {
            $srls = [$srls];
        }

        $oModuleController = getController('module');
        foreach ($srls as $srl) {
            $srl = (int)$srl;
            if ($srl <= 0) continue;
            $oModuleController->deleteModule($srl);
        }

        FileHandler::removeDir('./files/cache/module/');

        $this->setMessage('삭제되었습니다.');
        $this->setRedirectUrl(getNotEncodedUrl('', 'module', 'admin', 'act', 'dispClubappAdminIndex'));
    }
}