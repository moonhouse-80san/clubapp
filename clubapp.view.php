<?php
/**
 * Club App View
 */
class clubappView extends clubapp
{
    public function init()
    {
        $this->setTemplatePath($this->module_path . 'tpl');
    }
    
    /**
     * 메인 페이지
     */
    public function dispClubappIndex()
    {
        $this->setTemplateFile('index');
    }
}