<?php
/**
 * Club App API Proxy
 * 라이믹스 세션 기반 인증, 라이믹스 루트 경로 수정
 */

// 라이믹스 루트: modules/clubapp/api/ 기준으로 3단계 위
// __DIR__ = .../modules/clubapp/api
// dirname x1 = .../modules/clubapp
// dirname x2 = .../modules
// dirname x3 = ... (라이믹스 루트) ← 올바름
$rxRoot = dirname(dirname(dirname(__DIR__)));

if (!file_exists($rxRoot . '/config/config.inc.php')) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server configuration error: ' . $rxRoot]);
    exit;
}
require_once $rxRoot . '/config/config.inc.php';

// --- CORS 설정 ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!empty($origin)) {
    $allowedOrigins = defined('CLUBAPP_ALLOWED_ORIGINS')
        ? CLUBAPP_ALLOWED_ORIGINS
        : [];
    if (in_array($origin, $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Origin not allowed']);
        exit;
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!in_array($_SERVER['REQUEST_METHOD'], ['GET', 'POST'], true)) {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// 로그인 체크
$logged_info = Context::get('logged_info');
if (empty($logged_info->member_srl)) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => '로그인이 필요합니다.']);
    exit;
}

// action 파라미터 수신
$action = '';
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $action = $_GET['action'] ?? '';
} else {
    $raw   = file_get_contents('php://input');
    $input = json_decode($raw, true) ?? [];
    $action = $input['action'] ?? ($_POST['action'] ?? '');
    // POST body를 Context에 주입
    if (!empty($input)) {
        foreach ($input as $k => $v) {
            Context::set($k, $v);
        }
    }
}

// 허용 action 목록
$allowedActions = [
    // 조회
    'getMembers', 'getMember', 'getSettings',
    'getAttendanceDates', 'getPaymentHistory',
    // 회원 CUD
    'insertMember', 'updateMember', 'deleteMember',
    // 출석
    'toggleAttendance', 'resetAttendance',
    'deleteAttendanceDate', 'deleteAttendanceHistory',
    // 입금
    'insertPayment', 'updatePayment', 'deletePayment',
    // 리포트
    'getMonthlyReport', 'getYearlyReport',
];

if (!in_array($action, $allowedActions, true)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => '잘못된 요청: ' . htmlspecialchars($action)]);
    exit;
}

Context::set('act', 'procClubappApi');
Context::set('action', $action);

// GET 파라미터도 Context에 반영
foreach ($_GET as $k => $v) {
    if ($k !== 'action') {
        Context::set($k, $v);
    }
}

try {
    $oController = getController('clubapp');
    $oController->procClubappApi();

    $result = Context::get('result') ?? [];
    echo json_encode($result, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => '서버 오류: ' . $e->getMessage()]);
}