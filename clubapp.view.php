<?php
/**
 * Club App View - 통합 테스트 버전
 */
class clubappView extends clubapp
{
    public function init()
    {
        $this->setTemplatePath($this->module_path . 'tpl');
    }
    
   /**
     * 메뉴 별칭 액션 (info.xml의 index 대응)
     */
    public function index()
    {
        return $this->dispClubappIndex();
    }

	public function dispClubappIndex()
    {
        // 파라미터로 페이지 구분
        $page = Context::get('page');
        
        if ($page == 'admin') {
            // 관리자 페이지처럼 표시
            $this->setTemplateFile('admin_index');
        } elseif ($page == 'config') {
            // 설정 페이지처럼 표시
            $oModuleModel = getModel('module');
            $config = $oModuleModel->getModuleConfig('clubapp');
            Context::set('config', $config);
            $this->setTemplateFile('admin_config');
        } else {
            // 일반 메인 페이지
            $this->setTemplateFile('index');
        }
    }
}