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
     * 관리자 메인 — 모듈 인스턴스 목록
     */
    public function dispClubappAdminIndex()
    {
        // 라이믹스 module 모델의 공식 메서드로 인스턴스 목록 조회
        $oModuleModel = getModel('module');

        $args = new stdClass();
        $args->module = 'clubapp';
        $output = executeQueryArray('module.getMidList', $args);

        $module_instances = [];
        if ($output && $output->toBool() && !empty($output->data)) {
            $rows = $output->data;
            $total = count($rows);
            foreach ($rows as $idx => $row) {
                $r = $row->regdate ?? '';
                $u = $row->last_update ?? $r;
                $row->regdate_fmt     = $r ? substr($r,0,4).'-'.substr($r,4,2).'-'.substr($r,6,2).' '.substr($r,8,2).':'.substr($r,10,2).':'.substr($r,12,2) : '';
                $row->last_update_fmt = $u ? substr($u,0,4).'-'.substr($u,4,2).'-'.substr($u,6,2).' '.substr($u,8,2).':'.substr($u,10,2).':'.substr($u,12,2) : '';
                $row->display_title   = ($row->browser_title ?? '') ?: ($row->mid ?? '');
                $row->title_esc       = htmlspecialchars($row->browser_title ?? '', ENT_QUOTES, 'UTF-8');
                $row->no              = $total - $idx;
                $module_instances[]   = $row;
            }
        }

        Context::set('module_instances',      $module_instances);
        Context::set('module_instance_count', count($module_instances));

        $this->setTemplateFile('admin_index');
    }
}