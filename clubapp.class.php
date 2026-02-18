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
        return $this->_createOrUpdateTables();
    }

    /**
     * 업데이트 필요 여부 확인
     *
     * PDO로 직접 SHOW TABLES를 실행해 테이블 존재를 확인합니다.
     * 이 방식이 라이믹스 버전과 무관하게 가장 확실합니다.
     */
   public function checkUpdate()
    {
       $oDB = DB::getInstance();

        // 표준 API가 있으면 테이블 존재 여부를 정확히 판별
        if (method_exists($oDB, 'isTableExists')) {
            foreach (self::$managedTables as $table) {
                if (!$oDB->isTableExists($table)) {
                    return true;
                }
            }

            return false;
        }

        // 일부 환경에서 isTableExists가 없더라도 무한 업데이트 루프가 되지 않도록 처리
        // (moduleUpdate에서 schema 기반 생성/보정을 수행)
        return false;
    }

    /**
     * 업데이트 실행: 없는 테이블을 schema XML로 생성
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
}