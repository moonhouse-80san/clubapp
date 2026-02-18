<?php
/**
 * Club App module
 */
class clubapp extends ModuleObject
{
    /** 관리되는 테이블 목록 (접두사 제외) */
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
     * 모듈 설치: schema XML로 테이블 생성
     */
    public function moduleInstall()
    {
        $this->_createOrUpdateTables();
        return new BaseObject();
    }

    /**
     * 업데이트 필요 여부 확인
     *
     * PDO로 직접 SHOW TABLES를 실행해 테이블 존재를 확인합니다.
     * 이 방식이 라이믹스 버전과 무관하게 가장 확실합니다.
     */
    public function checkUpdate()
    {
        $dbInfo = Context::getDBInfo();
        $prefix = $dbInfo->master_db['db_table_prefix'] ?? 'rx_';

        foreach (self::$managedTables as $table) {
            $fullName = $prefix . $table;

            // executeQuery로 INFORMATION_SCHEMA 조회 (PDO 바인딩 안전)
            $oDB = DB::getInstance();
            $result = $oDB->executeQuery(
                "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.TABLES " .
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '" . addslashes($fullName) . "'"
            );

            $cnt = 0;
            if ($result && !empty($result->data)) {
                $row = is_array($result->data) ? $result->data[0] : $result->data;
                $cnt = (int)($row->cnt ?? 0);
            }

            if ($cnt === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * 업데이트 실행: 없는 테이블을 schema XML로 생성
     */
    public function moduleUpdate()
    {
        $this->_createOrUpdateTables();
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

        foreach (self::$managedTables as $table) {
            $xmlFile = $schemaPath . $table . '.xml';
            if (file_exists($xmlFile)) {
                $oDB->createTableByXmlFile($xmlFile);
            }
        }
    }
}
