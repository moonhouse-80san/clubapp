<?php
/**
 * Club App View
 */
class clubappView extends clubapp
{
    public function init()
    {
        $this->setTemplatePath($this->module_path . 'skins/default');
    }

    public function dispClubappIndex()
    {
        $logged_info = Context::get('logged_info');
        $is_logged   = !empty($logged_info->member_srl);
        $is_admin    = $is_logged && ($logged_info->is_admin === 'Y');

        // 템플릿에서 json_encode 필터 없이 쓸 수 있도록
        // PHP에서 미리 JSON 문자열로 만들어서 주입
        $current_user_json = json_encode([
            'isLogged'  => $is_logged,
            'isAdmin'   => $is_admin,
            'userId'    => $is_logged ? $logged_info->user_id   : '',
            'userName'  => $is_logged ? $logged_info->user_name : '',
            'memberSrl' => $is_logged ? (int)$logged_info->member_srl : 0,
        ], JSON_UNESCAPED_UNICODE);

        Context::set('current_user_json', $current_user_json);
        Context::set('logged_info', $logged_info);

        $this->setTemplateFile('index');
    }
}