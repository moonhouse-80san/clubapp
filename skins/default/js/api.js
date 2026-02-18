/**
 * api.js - 라이믹스 통합 버전
 * API 요청을 /index.php?module=clubapp&act=procClubappApi 로 라우팅
 * → 라이믹스가 세션/권한을 자동으로 처리함
 */

// currentUser 안전 초기화 (index.html 인라인 스크립트보다 늦게 로드될 수 있으므로)
if (typeof window.currentUser === 'undefined') {
    window.currentUser = {
        isLogged: false, isAdmin: false,
        userId: '', userName: '', memberSrl: 0
    };
}

// 라이믹스 모듈 act 방식 → 세션 자동 포함
const API_BASE_URL = '/index.php?module=clubapp&act=procClubappApi';

async function apiCall(action, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const url = API_BASE_URL + '&api_action=' + action;
    const fetchOp = {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }
    };
    if (options.body) fetchOp.body = options.body;

    const response = await fetch(url, fetchOp);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || 'API 요청 실패');
    return data;
}

const AuthAPI = {
    checkSession: () => Promise.resolve({
        logged_in: currentUser.isLogged,
        user: currentUser.isLogged ? {
            role:     currentUser.isAdmin ? 'admin' : 'sub_admin',
            username: currentUser.userId,
            id:       currentUser.memberSrl
        } : null
    }),
    logout: () => {
        const link = document.querySelector('a[href*="dispMemberLogout"]');
        window.location.href = link ? link.href : '/index.php?act=dispMemberLogout';
        return Promise.resolve();
    }
};

const MembersAPI = {
    getList: ()     => apiCall('getMembers'),
    get:     (id)   => apiCall('getMember&id=' + id),
    create:  (data) => apiCall('insertMember',  { method: 'POST', body: JSON.stringify(data) }),
    update:  (data) => apiCall('updateMember',  { method: 'POST', body: JSON.stringify(data) }),
    delete:  (id)   => apiCall('deleteMember',  { method: 'POST', body: JSON.stringify({ id }) })
};

const SettingsAPI = {
    get:         ()  => apiCall('getSettings'),
    update:      (s) => apiCall('updateSettings', { method: 'POST', body: JSON.stringify(s) }),
    getAdmins:   ()  => Promise.resolve({ success: true, admins: [] }),
    createAdmin: ()  => Promise.resolve({ success: false, message: '라이믹스 관리자 페이지에서 관리하세요.' }),
    deleteAdmin: ()  => Promise.resolve({ success: false, message: '라이믹스 관리자 페이지에서 관리하세요.' }),
    updateAdmin: ()  => Promise.resolve({ success: false, message: '라이믹스 관리자 페이지에서 관리하세요.' })
};

const AttendanceAPI = {
    toggle:        (memberId, date)       => apiCall('toggleAttendance',       { method: 'POST', body: JSON.stringify({ member_id: memberId, date }) }),
    reset:         (memberId)             => apiCall('resetAttendance',         { method: 'POST', body: JSON.stringify({ member_id: memberId }) }),
    getDates:      (memberId)             => apiCall('getAttendanceDates&member_id=' + memberId),
    deleteDate:    (memberId, date, type) => apiCall('deleteAttendanceDate',    { method: 'POST', body: JSON.stringify({ member_id: memberId, date, type: type || 'current' }) }),
    deleteHistory: (memberId)             => apiCall('deleteAttendanceHistory', { method: 'POST', body: JSON.stringify({ member_id: memberId }) })
};

const PaymentsAPI = {
    add:        (memberId, date, amount)            => apiCall('insertPayment', { method: 'POST', body: JSON.stringify({ member_id: memberId, date, amount }) }),
    delete:     (paymentId, memberId)               => apiCall('deletePayment', { method: 'POST', body: JSON.stringify({ payment_id: paymentId, member_id: memberId }) }),
    getHistory: (memberId)                          => apiCall('getPaymentHistory&member_id=' + memberId),
    update:     (paymentId, memberId, date, amount) => apiCall('updatePayment',  { method: 'POST', body: JSON.stringify({ payment_id: paymentId, member_id: memberId, date, amount }) })
};

const ReportsAPI = {
    getMonthly: (year, month) => apiCall('getMonthlyReport&year=' + year + '&month=' + month),
    getYearly:  (year)        => apiCall('getYearlyReport&year=' + year)
};

const LocalStorage = {
    get:    (key, def = null) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch(e) { return def; } },
    set:    (key, val)        => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) {} },
    remove: (key)             => { try { localStorage.removeItem(key); } catch(e) {} }
};

function formatDate(date, format = 'YYYY-MM-DD') {
    const d = new Date(date);
    const y = d.getFullYear(), mo = String(d.getMonth()+1).padStart(2,'0'), dy = String(d.getDate()).padStart(2,'0');
    if (format === 'YYYY-MM') return y + '-' + mo;
    if (format === 'YYYY')    return String(y);
    return y + '-' + mo + '-' + dy;
}
function formatNumber(num) { return String(num).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
function showError(m)   { alert(m); }
function showSuccess(m) { alert(m); }