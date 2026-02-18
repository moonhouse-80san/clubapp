// API_BASE_URL 수정
const API_BASE_URL = '/modules/clubapp/api/proxy.php';

// AuthAPI는 제거 (라이믹스 로그인 사용)
// 대신 로그인 상태 확인 함수 수정
async function getCurrentUser() {
    return currentUser;
}

function hasEditPermission() {
    return currentUser.isLogged;
}

function canEditMember(member) {
    if (!member) return false;
    if (currentUser.isAdmin) return true;
    return member.coach === currentUser.userId;
}