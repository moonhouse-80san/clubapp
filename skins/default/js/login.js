// ==================== 로그인 시스템 ====================
const USER_ROLES = {
    GUEST: 'guest',
    SUB_ADMIN: 'sub_admin',
    ADMIN: 'admin'
};

const SESSION_STORAGE_KEY = 'clubapp_session';
let sessionHeartbeatTimer = null;

function convertToInternalEmail(username) {
    if (username.includes('@')) return username;
    return username + '@clubapp.internal';
}

function convertToUsername(email) {
    if (!email) return '';
    if (email.endsWith('@clubapp.internal')) {
        return email.replace('@clubapp.internal', '');
    }
    return email;
}

// ──────────────────────────────────────────────
// localStorage 기반 세션 저장/복원/삭제
// ──────────────────────────────────────────────
function saveSessionToStorage(user, rememberMe) {
    if (!rememberMe) return; // '로그인 상태 유지' 체크 시에만 저장
    try {
        const payload = {
            role: user.role,
            username: user.username,
            email: user.email,
            id: user.id,
            savedAt: Date.now()
        };
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('세션 저장 실패:', e);
    }
}

function loadSessionFromStorage() {
    try {
        const raw = localStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        const payload = JSON.parse(raw);
        // 30일 이상 된 캐시는 무효 처리
        const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - payload.savedAt > MAX_AGE_MS) {
            clearSessionFromStorage();
            return null;
        }
        return payload;
    } catch (e) {
        clearSessionFromStorage();
        return null;
    }
}

function clearSessionFromStorage() {
    try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
        console.warn('세션 삭제 실패:', e);
    }
}

// ──────────────────────────────────────────────
// 세션 heartbeat – 서버 세션 만료 방지
// ──────────────────────────────────────────────
function startSessionHeartbeat() {
    stopSessionHeartbeat();
    // 10분마다 서버 세션 갱신
    sessionHeartbeatTimer = setInterval(async () => {
        try {
            const session = await AuthAPI.checkSession();
            if (!session.logged_in) {
                // 서버 세션이 만료됐지만 localStorage에 저장된 경우 재로그인 불가 → 상태 초기화
                console.warn('⚠️ 서버 세션 만료 감지');
                clearSessionFromStorage();
                currentUser = { role: USER_ROLES.GUEST, username: '', email: '', id: '' };
                updateUIByRole();
                showAlert('세션이 만료되었습니다. 다시 로그인해주세요.');
                stopSessionHeartbeat();
            }
        } catch (e) {
            console.warn('Heartbeat 체크 실패:', e.message);
        }
    }, 10 * 60 * 1000);
}

function stopSessionHeartbeat() {
    if (sessionHeartbeatTimer) {
        clearInterval(sessionHeartbeatTimer);
        sessionHeartbeatTimer = null;
    }
}

// ──────────────────────────────────────────────
// 초기화 – 서버 세션 → localStorage 순으로 복원
// ──────────────────────────────────────────────
async function initializeLoginSystem() {
    let restored = false;

    // 1순위: 서버 세션 확인
    try {
        const session = await AuthAPI.checkSession();
        if (session.logged_in && session.user) {
            currentUser = {
                role: session.user.role,
                username: session.user.username,
                email: session.user.username,
                id: session.user.id
            };
            restored = true;
        }
    } catch (error) {
        console.log('ℹ️ 서버 세션 없음:', error.message);
    }

    // 2순위: localStorage 캐시 복원 (rememberMe 저장 시에만)
    if (!restored) {
        const saved = loadSessionFromStorage();
        if (saved && saved.role && saved.role !== USER_ROLES.GUEST) {
            // localStorage에 정보가 있으면 서버에 재인증 시도
            try {
                const session = await AuthAPI.checkSession();
                if (session.logged_in && session.user) {
                    currentUser = {
                        role: session.user.role,
                        username: session.user.username,
                        email: session.user.username,
                        id: session.user.id
                    };
                    restored = true;
                } else {
                    // 서버 세션은 없지만 저장된 정보로 UI만 임시 복원
                    currentUser = {
                        role: saved.role,
                        username: saved.username,
                        email: saved.email,
                        id: saved.id
                    };
                    restored = true;
                    console.log('ℹ️ localStorage에서 세션 복원됨');
                }
            } catch (e) {
                // 오프라인 등으로 서버 확인 불가 → 저장된 정보로 임시 복원
                currentUser = {
                    role: saved.role,
                    username: saved.username,
                    email: saved.email,
                    id: saved.id
                };
                restored = true;
                console.log('ℹ️ 오프라인 상태, localStorage에서 임시 복원됨');
            }
        }
    }

    if (!restored) {
        console.log('ℹ️ 비로그인 상태로 시작');
    } else {
        startSessionHeartbeat();
    }

    await loadFromApi();
    updateUIByRole();
}

async function login() {
    // 라이믹스 통합: 라이믹스 로그인 페이지로 이동
    const returnUrl = encodeURIComponent(window.location.href);
    window.location.href = '/index.php?act=dispMemberLoginForm&success_return_url=' + returnUrl;
    return;
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberLogin')?.checked || false;

    if (!username || !password) {
        showAlert('아이디와 비밀번호를 입력해주세요!');
        return;
    }

    try {
        const result = await AuthAPI.login(username, password, rememberMe);
        currentUser = {
            role: result.user.role,
            username: result.user.username,
            email: convertToInternalEmail(result.user.username),
            id: result.user.id
        };

        // 로그인 상태 유지 체크 시 localStorage에 저장
        saveSessionToStorage(currentUser, rememberMe);
        startSessionHeartbeat();

        closeLoginModal();
        updateUIByRole();
        await loadFromApi();

        const roleText = currentUser.role === USER_ROLES.ADMIN ? '관리자' : '부관리자';
        showAlert(`환영합니다, ${currentUser.username}님! (${roleText})`);
    } catch (error) {
        showAlert(error.message || '로그인에 실패했습니다.');
    }
}

async function logout() {
    try {
        await AuthAPI.logout(); return;
        clearSessionFromStorage();   // localStorage 세션 삭제
        stopSessionHeartbeat();      // heartbeat 중지
        currentUser = { role: USER_ROLES.GUEST, username: '', email: '', id: '' };
        await loadFromApi();
        updateUIByRole();
        closeSettings();
        showAlert('로그아웃되었습니다.');
    } catch (error) {
        showAlert('로그아웃에 실패했습니다.');
    }
}

function handleLogout() {
    logout();
}

function updateUIByRole() {
    const role = currentUser.role;

    const syncStatus = document.getElementById('syncStatus');
    const logoutIcon = document.getElementById('logoutIcon');
    const settingsUserStatus = document.getElementById('settingsUserStatus');
    const settingsLogoutBtn = document.getElementById('settingsLogoutBtn');
    const updateBtn = document.querySelector('.btn-update, .btn-disabled');
    const currentCountInput = document.getElementById('currentCount');
    const privateMemoSection = document.getElementById('privateMemoSection');
    const reportSection = document.getElementById('reportSection');
    const lessonManagementSection = document.getElementById('lessonManagementSection');

    // 폼 토글 상태 업데이트
    if (typeof updateFormHeaderBadge === 'function') {
        updateFormHeaderBadge();
    }
    
    // 권한이 생겼을 때 폼 자동 열기 (선택사항)
    if (hasEditPermission() && typeof openFormSection === 'function') {
        const formSection = document.querySelector('.form-section');
        if (formSection && formSection.classList.contains('collapsed')) {
            // 로그인 성공 시 폼 자동 열기
            openFormSection(false);
        }
    }

    if (reportSection) {
        reportSection.style.display = (role === USER_ROLES.ADMIN || role === USER_ROLES.SUB_ADMIN) ? 'block' : 'none';
    }

    if (lessonManagementSection) {
        lessonManagementSection.style.display = (role === USER_ROLES.ADMIN || role === USER_ROLES.SUB_ADMIN) ? 'block' : 'none';
    }

    if (syncStatus) syncStatus.style.display = role === USER_ROLES.GUEST ? 'none' : 'block';
    if (logoutIcon) logoutIcon.style.display = role === USER_ROLES.GUEST ? 'none' : 'flex';

    if (settingsUserStatus) {
        if (role === USER_ROLES.GUEST) {
            settingsUserStatus.textContent = '👤 손님';
            settingsUserStatus.style.color = '#999';
        } else {
            const roleText = role === USER_ROLES.ADMIN ? '👑 관리자' : '🔰 부관리자';
            settingsUserStatus.innerHTML = `${roleText} ${currentUser.username}`;
            settingsUserStatus.style.color = role === USER_ROLES.ADMIN ? '#FFD700' : '#4FC3F7';
        }
    }

    if (settingsLogoutBtn) settingsLogoutBtn.style.display = role === USER_ROLES.GUEST ? 'none' : 'block';

    if (updateBtn) {
        if (role === USER_ROLES.GUEST) {
            updateBtn.classList.add('btn-disabled');
            updateBtn.classList.remove('btn-update');
        } else {
            updateBtn.classList.remove('btn-disabled');
            updateBtn.classList.add('btn-update');
        }
    }

    if (currentCountInput) {
        if (role === USER_ROLES.GUEST) {
            currentCountInput.setAttribute('readonly', true);
            currentCountInput.style.background = '#f0f0f0';
        } else {
            currentCountInput.removeAttribute('readonly');
            currentCountInput.style.background = '#ffffff';
        }
    }

    if (privateMemoSection) {
        privateMemoSection.style.display = role === USER_ROLES.GUEST ? 'none' : 'block';
    }

    if (typeof renderMembers === 'function') renderMembers();
}

function openLoginModal() {
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    const rememberCheckbox = document.getElementById('rememberLogin');
    if (rememberCheckbox) rememberCheckbox.checked = true;
    document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.remove('active');
}

function handleSettingsClick() {
    if (!hasEditPermission()) {
        openLoginModal();
    } else {
        openSettings();
    }
}

function hasEditPermission() {
    return !!(currentUser && currentUser.isLogged);
}

function canRegisterMember() {
    return hasEditPermission() || !!settings.allowGuestRegistration;
}

function canEditMember(member) {
    if (!member) return false;
    if (currentUser.role === USER_ROLES.ADMIN) return true;
    if (currentUser.role === USER_ROLES.SUB_ADMIN) {
        const coachName = (currentUser.username || '').trim();
        return coachName !== '' && member.coach === coachName;
    }
    return false;
}

function canEditMemberByIndex(index) {
    return canEditMember(members[index]);
}

function hasSettingsPermission() {
    return currentUser.role === USER_ROLES.ADMIN;
}

function hasLessonManagementPermission() {
    return currentUser.role === USER_ROLES.ADMIN || currentUser.role === USER_ROLES.SUB_ADMIN;
}

function checkPermissionBeforeUpdate() {
    if (!hasEditPermission()) {
        showAlert('수정 권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return false;
    }
    return updateMember();
}

function checkPermissionBeforeDelete(index) {
    if (!hasEditPermission()) {
        showAlert('삭제 권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return false;
    }
    if (!canEditMemberByIndex(index)) {
        showAlert('이 회원을 삭제할 권한이 없습니다.');
        return false;
    }
    showDeleteModal(index);
    return true;
}

function checkPermissionBeforeSettings() {
    if (!hasSettingsPermission()) {
        showAlert('설정 메뉴는 관리자만 접근 가능합니다!');
        return false;
    }
    return true;
}

document.addEventListener('DOMContentLoaded', initializeLoginSystem);