const APP_VERSION = 'V1.0.1';

// ==================== 캐시 초기화 함수 ====================
async function clearClientCache() {
    if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ 캐시 초기화 완료');
    }
}

// ==================== 버전 토스트 ====================
function showVersionToast(version) {
    const toast = document.createElement('div');
    toast.textContent = `🚀 ${version} 업데이트되었습니다!`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, #2196F3, #1565C0);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 4px 16px rgba(33,150,243,0.4);
        z-index: 99999;
        opacity: 0;
        transition: opacity 0.4s ease;
        white-space: nowrap;
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 400);
    }, 2500);
}

// ==================== Service Worker 등록 ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const savedVersion = localStorage.getItem('app_version');
            if (savedVersion !== APP_VERSION) {
                console.log('🔄 앱 버전 변경 감지. 캐시를 초기화합니다.');
                showVersionToast(APP_VERSION);
                await clearClientCache();
                localStorage.setItem('app_version', APP_VERSION);
                if (!window.location.search.includes('cache_bust=')) {
                    const separator = window.location.search ? '&' : '?';
                    window.location.replace(`${window.location.pathname}${window.location.search}${separator}cache_bust=${Date.now()}`);
                    return;
                }
            }
            const registration = await navigator.serviceWorker.register(`./sw.js?v=${APP_VERSION}`);
            await registration.update();
            console.log('✅ Service Worker 등록 성공:', registration.scope);
        } catch (error) {
            console.log('❌ Service Worker 등록 실패:', error);
        }
    });
}

// 전역 변수
let members = [];
let filteredMembers = [];
let settings = {
    clubName: '',
    feePresets: [40000, 70000, 100000, 200000, 300000],
    coaches: ['', '', '', ''],
    bankAccount: { bank: '', accountNumber: '' },
    allowGuestRegistration: false, // 비로그인 회원 등록 허용 (기본: 불허)
    showMemberDetails: true, // 회원 기본정보 팝업 표시 (기본: 표시)
    themeColor: 'default' // 전체 색상 테마
};

let isSavingMembers = false;

// 요일 배열
const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
const dayNames = {
    '월': '월요일',
    '화': '화요일',
    '수': '수요일',
    '목': '목요일',
    '금': '금요일',
    '토': '토요일',
    '일': '일요일'
};

const THEME_COLORS = {
    default: { body: ['#667eea', '#764ba2'], header: ['#2196F3', '#1976D2'], accent: '#2196F3', meta: '#2196F3' },
    dark: { body: ['#232526', '#414345'], header: ['#2c3e50', '#1a1a1a'], accent: '#455A64', meta: '#2c3e50' },
    white: { body: ['#fdfbfb', '#ebedee'], header: ['#ece9e6', '#ffffff'], accent: '#9E9E9E', meta: '#9E9E9E' },
    gold: { body: ['#F7E9A0', '#F0C14B'], header: ['#D4AF37', '#B8860B'], accent: '#B8860B', meta: '#D4AF37' },
    orange: { body: ['#f2994a', '#f2c94c'], header: ['#FF9800', '#F57C00'], accent: '#FF9800', meta: '#FF9800' }
};

function applyThemeColor(themeKey) {
    const normalizedTheme = THEME_COLORS[themeKey] ? themeKey : 'default';
    const theme = THEME_COLORS[normalizedTheme];

    document.documentElement.style.setProperty('--body-gradient-start', theme.body[0]);
    document.documentElement.style.setProperty('--body-gradient-end', theme.body[1]);
    document.documentElement.style.setProperty('--header-gradient-start', theme.header[0]);
    document.documentElement.style.setProperty('--header-gradient-end', theme.header[1]);
    document.documentElement.style.setProperty('--primary-color', theme.accent);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
        metaThemeColor.setAttribute('content', theme.meta);
    }

    settings.themeColor = normalizedTheme;
}

function normalizeMember(member) {
    const cleaned = { ...member };

    if (!cleaned.photo) cleaned.photo = '';
    if (!cleaned.attendanceHistory) cleaned.attendanceHistory = [];
    if (!cleaned.coach) cleaned.coach = '';
    if (!cleaned.paymentHistory) cleaned.paymentHistory = [];
    if (!cleaned.phone) cleaned.phone = '';
    if (!cleaned.schedules) cleaned.schedules = [];
    if (!cleaned.awards) cleaned.awards = [];

    return cleaned;
}

/**
 * API 회원 데이터 → 앱 회원 객체 변환
 */
function mapMemberFromApi(member) {
    return normalizeMember({
        id: member.id,
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        registerDate: member.register_date || '',
        fee: member.fee || 0,
        coach: member.coach || '',
        targetCount: member.target_count || 0,
        currentCount: member.current_count || 0,
        gender: member.gender || '',
        birthYear: member.birth_year,
        skillLevel: member.skill_level,
        etc: member.etc || '',
        privateMemo: member.private_memo || '',
        photo: member.photo || '',
        schedules: (member.schedules || []).map(s => ({
            day: s.day,
            startTime: s.start_time || s.startTime,
            endTime: s.end_time || s.endTime
        })),
        scheduleStatus: member.schedule_status || 
        (member.schedules && member.schedules.length > 0 ? 'regular' : 'none'),
        awards: member.awards || [],
        attendanceDates: member.attendanceDates || [],
        attendanceHistory: member.attendanceHistory || [],
        paymentHistory: member.paymentHistory || []
    });
}

/**
 * 앱 회원 객체 → API 전송 객체 변환
 */
function mapMemberToApi(member) {
    return {
        id: member.id,
        name: member.name || '',
        phone: member.phone || '',
        email: member.email || '',
        address: member.address || '',
        register_date: member.registerDate || '',
        fee: member.fee || 0,
        coach: member.coach || '',
        target_count: member.targetCount || 0,
        current_count: member.currentCount || 0,
        gender: member.gender || '',
        birth_year: member.birthYear || null,
        skill_level: member.skillLevel || null,
        etc: member.etc || '',
        private_memo: member.privateMemo || '',
        photo: member.photo || '',
        schedules: (member.schedules || []).map(s => ({ 
            day: s.day, 
            startTime: s.startTime, 
            endTime: s.endTime 
        })),
        // 🔥 스케줄 상태 저장 (DB 필드 추가 필요)
        schedule_status: member.scheduleStatus || 'regular',
        awards: member.awards || [],
        paymentHistory: member.paymentHistory || []
    };
}

async function loadFromApi() {
    try {
        const [settingsResult, membersResult] = await Promise.all([
            SettingsAPI.get(),
            MembersAPI.getList()
        ]);

        if (settingsResult.success && settingsResult.settings) {
            settings = {
                ...settings,
                ...settingsResult.settings,
                bankAccount: settingsResult.settings.bankAccount || settings.bankAccount,
                allowGuestRegistration: settingsResult.settings.allowGuestRegistration ?? false,
                showMemberDetails: settingsResult.settings.showMemberDetails ?? true,
                themeColor: settingsResult.settings.themeColor || settings.themeColor
            };
        }

        if (membersResult.success && membersResult.members) {
            members = membersResult.members.map(mapMemberFromApi);
            filteredMembers = [...members];
        }

        applyThemeColor(settings.themeColor);
        document.getElementById('clubNameDisplay').textContent = settings.clubName || '구장명을 설정하세요';
        updateFeePresetButtons();
        renderCoachButtons();
        renderMembers();
        renderSchedule();
        
        // 폼 토글 상태 업데이트
        if (typeof initFormToggle === 'function') {
            setTimeout(() => {
                initFormToggle();
            }, 300);
        }
        
    } catch (error) {
        console.log('ℹ️ 초기 데이터 로드 실패(비로그인 상태 가능):', error.message);
        
        // 에러 발생 시에도 폼 토글 초기화
        if (typeof initFormToggle === 'function') {
            setTimeout(() => {
                initFormToggle();
            }, 300);
        }
    }
}

async function saveToFirebase() {
    if (isSavingMembers) return;

    isSavingMembers = true;
    try {
        const isGuestCreateOnly = !hasEditPermission() && settings.allowGuestRegistration;

        if (isGuestCreateOnly) {
            let createdCount = 0;
            for (const member of members) {
                if (member.id) continue;

                const payload = mapMemberToApi(member);
                const created = await MembersAPI.create(payload);
                member.id = created.member_id;
                createdCount += 1;
            }

            filteredMembers = [...members];
            console.log(`✅ 비로그인 회원 등록 저장 완료 (${createdCount}건)`);
            return;
        }

        const remoteData = await MembersAPI.getList();
        const remoteMembers = remoteData.members || [];
        const localIdSet = new Set(members.filter(m => m.id).map(m => Number(m.id)));

        for (const member of members) {
            const payload = mapMemberToApi(member);
            if (member.id) {
                await MembersAPI.update(payload);
            } else {
                const created = await MembersAPI.create(payload);
                member.id = created.member_id;
            }
        }

        for (const remoteMember of remoteMembers) {
            if (!localIdSet.has(Number(remoteMember.id))) {
                await MembersAPI.delete(remoteMember.id);
            }
        }

        filteredMembers = [...members];
        console.log('✅ 회원 데이터 저장 완료');
    } catch (error) {
        console.error('❌ 데이터 저장 실패:', error);
        showAlert('데이터 저장에 실패했습니다: ' + error.message);
    } finally {
        isSavingMembers = false;
    }
}

function updateFeePresetButtons() {
    const feePresetsEl = document.getElementById('feePresets');
    if (!feePresetsEl) return;

    feePresetsEl.innerHTML = '';
    settings.feePresets.forEach(fee => {
        if (!fee) return;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'fee-preset-btn';
        button.textContent = `${formatNumber(fee)}원`;
        button.onclick = () => {
            document.getElementById('fee').value = fee;
        };
        feePresetsEl.appendChild(button);
    });
}

function formatNumber(num) {
    if (num === null || num === undefined || num === '') return '0';
    const number = typeof num === 'number' ? num : parseFloat(num);
    if (isNaN(number)) return '0';
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatDate(dateString) {
    if (!dateString) return '';
    
    // 문자열에서 숫자만 추출하여 날짜 형식으로 변환
    if (typeof dateString === 'string') {
        // YYYY-MM-DD 형식인 경우
        if (dateString.includes('-')) {
            const [y, m, d] = dateString.split('-');
            if (y && m && d) {
                return `${y}.${m}.${d}`;
            }
        }
        // YYYY.MM.DD 형식인 경우
        else if (dateString.includes('.')) {
            return dateString;
        }
    }
    
    // Date 객체인 경우
    if (dateString instanceof Date) {
        const year = dateString.getFullYear();
        const month = String(dateString.getMonth() + 1).padStart(2, '0');
        const day = String(dateString.getDate()).padStart(2, '0');
        return `${year}.${month}.${day}`;
    }
    
    return dateString;
}

/**
 * API 날짜 포맷 헬퍼 (YYYY-MM-DD)
 */
function formatDateForAPI(dateString) {
    if (!dateString) return '';
    
    if (dateString instanceof Date) {
        const year = dateString.getFullYear();
        const month = String(dateString.getMonth() + 1).padStart(2, '0');
        const day = String(dateString.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // 이미 YYYY-MM-DD 형식이면 그대로 반환
    if (typeof dateString === 'string' && dateString.includes('-')) {
        return dateString;
    }
    
    // YYYY.MM.DD 형식을 YYYY-MM-DD로 변환
    if (typeof dateString === 'string' && dateString.includes('.')) {
        return dateString.replace(/\./g, '-');
    }
    
    return dateString;
}

document.addEventListener('DOMContentLoaded', function() {
    const registerDateEl = document.getElementById('registerDate');
    const targetCountEl = document.getElementById('targetCount');
    const currentCountEl = document.getElementById('currentCount');

    if (registerDateEl) registerDateEl.valueAsDate = new Date();
    if (targetCountEl) targetCountEl.value = '0';
    if (currentCountEl) currentCountEl.value = '0';

    updateFeePresetButtons();
    renderCoachButtons();
});

// ==================== 화면 꺼짐 방지 (간단 버전) ====================
(async function enableScreenWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            const wakeLock = await navigator.wakeLock.request('screen');
            console.log('✅ 화면 꺼짐 방지 활성화');
            
            document.addEventListener('visibilitychange', async () => {
                if (wakeLock && document.visibilityState === 'visible') {
                    await navigator.wakeLock.request('screen');
                }
            });
        } else {
            console.log('⚠️ 이 브라우저는 화면 유지를 지원하지 않습니다.');
        }
    } catch (err) {
        console.error('❌ 화면 꺼짐 방지 실패:', err);
    }
})();

/**
 * 전화번호 자동 하이픈 포맷
 * 010-1234-5678 / 02-123-4567 / 031-1234-5678 형식 지원
 */
function formatPhoneNumber(value) {
    // 숫자만 추출
    const digits = value.replace(/\D/g, '');

    if (digits.startsWith('02')) {
        // 서울 지역번호 (02)
        if (digits.length <= 2)  return digits;
        if (digits.length <= 5)  return digits.slice(0,2) + '-' + digits.slice(2);
        if (digits.length <= 9)  return digits.slice(0,2) + '-' + digits.slice(2,5) + '-' + digits.slice(5);
        return digits.slice(0,2) + '-' + digits.slice(2,6) + '-' + digits.slice(6,10);
    } else if (digits.length <= 10) {
        // 3자리 지역번호 + 6~7자리 (031, 032 등)
        if (digits.length <= 3)  return digits;
        if (digits.length <= 6)  return digits.slice(0,3) + '-' + digits.slice(3);
        if (digits.length <= 9)  return digits.slice(0,3) + '-' + digits.slice(3,6) + '-' + digits.slice(6);
        return digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7);
    } else {
        // 010-xxxx-xxxx 등 11자리 이상
        if (digits.length <= 3)  return digits;
        if (digits.length <= 7)  return digits.slice(0,3) + '-' + digits.slice(3);
        return digits.slice(0,3) + '-' + digits.slice(3,7) + '-' + digits.slice(7,11);
    }
}