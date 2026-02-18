<?php
/**
 * Club App module
 */
class clubapp extends ModuleObject
{
    /** @var string 모듈 경로 */
    public $module_path;
    
    /** 관리되는 테이블 목록 */
    private static $managedTables = [
        'clubapp_settings',
        'clubapp_members',
        'clubapp_member_schedules',
        'clubapp_member_awards',
        'clubapp_attendance_current',
        'clubapp_attendance_history',
        'clubapp_payment_history',
    ];

    /**
     * 생성자
     */
    public function __construct()
    {
        // 모듈 경로 설정
        $this->module_path = _XE_PATH_ . 'modules/clubapp/';
    }

    /**
     * 모듈 설치
     */
    public function moduleInstall()
    {
        return $this->_createOrUpdateTables();
    }

    /**
     * 업데이트 필요 여부 확인
     */
    public function checkUpdate()
    {
        $oDB = DB::getInstance();

        if (method_exists($oDB, 'isTableExists')) {
            foreach (self::$managedTables as $table) {
                if (!$oDB->isTableExists($table)) {
                    return true;
                }
            }
            return false;
        }
        return false;
    }

    /**
     * 업데이트 실행
     */
    public function moduleUpdate()
    {
        $output = $this->_createOrUpdateTables();
        if (!$output->toBool()) {
            return $output;
        }
        return new BaseObject(0, 'success_updated');
    }

    /**
     * 캐시 파일 재생성
     */
    public function recompileCache()
    {
        return new BaseObject();
    }

    /**
     * schema/*.xml 파일을 읽어 테이블 생성/업데이트
     */
    private function _createOrUpdateTables()
    {
        $oDB = DB::getInstance();
        $schemaPath = $this->module_path . 'schema/';
        $failedTables = [];

        foreach (self::$managedTables as $table) {
            $xmlFile = $schemaPath . $table . '.xml';
            if (!file_exists($xmlFile)) {
                $failedTables[] = $table;
                continue;
            }

            try {
                $output = $oDB->createTableByXmlFile($xmlFile);
                if ($output instanceof BaseObject && !$output->toBool()) {
                    $failedTables[] = $table;
                }
            } catch (Exception $e) {
                $failedTables[] = $table;
            }
        }

        if (!empty($failedTables)) {
            return new BaseObject(-1, 'failed_to_create_tables:' . implode(',', $failedTables));
        }

        return new BaseObject();
    }
    
    /**
     * 관리자 메뉴 캐시 재생성 (선택사항)
     */
    public function recompileAdminMenu()
    {
        // 관리자 메뉴 캐시 파일 삭제
        FileHandler::removeFile('./files/cache/admin_menu/module_list.php');
        FileHandler::removeFile('./files/cache/admin_menu/' . __CLASS__ . '.php');
    }
}