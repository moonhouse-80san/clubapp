<?php
/**
 * Club App API Proxy
 *
 * 라이믹스 외부에서 API 호출을 받아 컨트롤러로 전달합니다.
 * 반드시 HTTPS 환경에서 운영하고, 신뢰할 수 있는 Origin만 허용하십시오.
 */

// 라이믹스 부트스트랩 로드 (세션/Context 초기화 포함)
$rxRoot = dirname(dirname(dirname(dirname(__DIR__))));
if (!file_exists($rxRoot . '/config/config.inc.php')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuration error']);
    exit;
}
require_once $rxRoot . '/config/config.inc.php';

// --- CORS 설정 ---
// 운영환경에서는 '*' 대신 실제 도메인을 지정하세요.
$allowedOrigins = defined('CLUBAPP_ALLOWED_ORIGINS')
    ? CLUBAPP_ALLOWED_ORIGINS
    : [Context::getRequestUri()]; // 기본: 동일 출처만

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
} else {
    // Origin이 없거나 허용 목록 외: 동일 출처 요청만 허용
    if (!empty($origin)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Origin not allowed']);
        exit;
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

// OPTIONS (preflight) 처리
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// 허용된 HTTP 메서드 제한
if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// 로그인 체크 (라이믹스 세션 기반)
$logged_info = Context::get('logged_info');
if (empty($logged_info->member_srl)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '로그인이 필요합니다.']);
    exit;
}

// 허용된 action 화이트리스트
$allowedActions = ['getMembers', 'getSettings'];

$action = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
} else {
    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? ($_POST['action'] ?? '');
}

if (!in_array($action, $allowedActions, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '잘못된 요청입니다.']);
    exit;
}

// Context에 파라미터 설정 후 컨트롤러 실행
Context::set('act', 'procClubappApi');
Context::set('action', $action);

try {
    $oController = getController('clubapp');
    $output = $oController->procClubappApi();

    $result = Context::get('result') ?? [];
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '서버 오류가 발생했습니다.']);
}
