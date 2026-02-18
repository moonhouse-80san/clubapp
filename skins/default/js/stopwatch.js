/**
 * 스탑워치 관리
 */

// ========== 전역 변수 ==========
let stopwatchInterval = null;
let stopwatchAudio = null;

// 알림음 선택 ('s' = s.mp3 기본, 'a' = a.mp3)
let stopwatchAlarmSound = localStorage.getItem('stopwatchAlarmSound') || 's';

let stopwatchTimer = {
    memberIndex: null,
    memberId: null,
    scheduleIndex: null,
    schedule: null,
    totalSeconds: 1200,
    remainingSeconds: 1200,
    isRunning: false,
    isCompleted: false,
    startTime: null,
    pauseTime: null,
    lessonDate: null
};

// ========== 유틸리티 함수 ==========
function calculateScheduleSeconds(startTime, endTime) {
    if (!startTime || !endTime) return 1200;
    try {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const startTotal = startHour * 60 + startMin;
        const endTotal = endHour * 60 + endMin;
        let diffMinutes = endTotal - startTotal;
        if (diffMinutes <= 0) diffMinutes = 20;
        return diffMinutes * 60;
    } catch (error) {
        console.error('시간 계산 오류:', error);
        return 1200;
    }
}

// ========== 알림음 선택 함수 ==========
/**
 * 알림음 변경 및 저장
 * @param {'a'|'s'} soundKey - 'a': a.mp3, 's': s.mp3
 */
function setStopwatchAlarmSound(soundKey) {
    stopwatchAlarmSound = soundKey;
    localStorage.setItem('stopwatchAlarmSound', soundKey);

    // 버튼 active 상태 갱신
    document.querySelectorAll('.alarm-sound-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sound === soundKey);
    });

    // 미리듣기 (짧게)
    previewAlarmSound(soundKey);
}

/**
 * 선택한 알림음 미리 듣기 (1.5초 후 자동 중지)
 */
function previewAlarmSound(soundKey) {
    stopAlarmSound();
    const audio = new Audio();
    audio.src = `/etc/${soundKey}.mp3`;
    audio.volume = 0.5;
    stopwatchAudio = audio;
    audio.play().catch(() => {});
    setTimeout(() => {
        if (stopwatchAudio === audio) {
            audio.pause();
            audio.currentTime = 0;
            stopwatchAudio = null;
        }
    }, 1500);
}

/**
 * 저장된 알림음 설정을 UI에 반영
 */
function initAlarmSoundUI() {
    document.querySelectorAll('.alarm-sound-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.sound === stopwatchAlarmSound);
    });
}

// ========== 알림음 함수 ==========
function playStopwatchAlarm() {
    try {
        stopAlarmSound();
        stopwatchAudio = new Audio();
        stopwatchAudio.src = `/etc/${stopwatchAlarmSound}.mp3`;
        stopwatchAudio.volume = 0.7;
        stopwatchAudio.loop = false;
        stopwatchAudio.play()
            .catch(e => {
                console.log('알림음 재생 실패:', e);
                showAlert('⏰ 레슨 시간이 완료되었습니다!');
                stopwatchAudio = null;
            });
    } catch (error) {
        console.log('알림음 재생 오류:', error);
        showAlert('⏰ 레슨 시간이 완료되었습니다!');
        stopwatchAudio = null;
    }
}

function stopAlarmSound() {
    if (stopwatchAudio) {
        try {
            stopwatchAudio.pause();
            stopwatchAudio.currentTime = 0;
            stopwatchAudio = null;
        } catch (error) {
            stopwatchAudio = null;
        }
    }
}

// ========== UI 업데이트 ==========
function updateStopwatchUI() {
    const member = members[stopwatchTimer.memberIndex];
    const schedule = stopwatchTimer.schedule;
    if (!member || !schedule) return;
    
    const titleElement = document.getElementById('stopwatchTitle');
    const subtitleElement = document.getElementById('stopwatchSubtitle');
    
    if (schedule.isIrregular) {
        // 불규칙 레슨 UI
        const minutes = Math.floor(stopwatchTimer.totalSeconds / 60);
        
        if (titleElement) {
            titleElement.innerHTML = `<span style="color:#eee;">${member.name}</span> 회원 불규칙 레슨`;
        }
        if (subtitleElement) {
            subtitleElement.innerHTML = `<span style="color:#eee;">⏱️ ${minutes}분 (개별 예약)</span>`;
        }
    } else {
        // 일반 레슨 UI
        const formattedStartTime = String(schedule.startTime).replace(/:00$/, '');
        const formattedEndTime = String(schedule.endTime).replace(/:00$/, '');
        
        if (titleElement) {
            titleElement.innerHTML = `<span style="color:#2196F3;">📅 ${member.name}</span> 회원 일반 레슨`;
        }
        if (subtitleElement) {
            subtitleElement.innerHTML = `${dayNames[schedule.day]} ${formattedStartTime}~${formattedEndTime}`;
        }
    }
    
    const totalTimeElement = document.getElementById('stopwatchTotalTime');
    if (totalTimeElement) {
        const minutes = Math.floor(stopwatchTimer.totalSeconds / 60);
        totalTimeElement.textContent = `${minutes}분`;
    }
    
    const todayDateElement = document.getElementById('stopwatchTodayDate');
    if (todayDateElement) {
        if (!stopwatchTimer.lessonDate) {
            stopwatchTimer.lessonDate = new Date().toISOString().split('T')[0];
        }
        todayDateElement.textContent = formatDate(stopwatchTimer.lessonDate);
    }
    
    const lessonStatusElement = document.getElementById('stopwatchLessonStatus');
    if (lessonStatusElement) {
        const today = stopwatchTimer.lessonDate || new Date().toISOString().split('T')[0];
        const isCheckedToday = member.attendanceDates && member.attendanceDates.includes(today);
        
        if (stopwatchTimer.isCompleted) {
            lessonStatusElement.textContent = '✅ 완료됨';
            lessonStatusElement.style.color = '#4CAF50';
        } else if (isCheckedToday) {
            lessonStatusElement.textContent = '✓ 이미 체크됨';
            lessonStatusElement.style.color = '#2196F3';
        } else {
            lessonStatusElement.textContent = '⏳ 미완료';
            lessonStatusElement.style.color = '#FF9800';
        }
    }
}

function updateStopwatchDisplay() {
    const minutes = Math.floor(stopwatchTimer.remainingSeconds / 60);
    const seconds = Math.floor(stopwatchTimer.remainingSeconds % 60);
    const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const displayElement = document.getElementById('stopwatchDisplay');
    if (displayElement) displayElement.textContent = display;
}

// ========== 스탑워치 모달 제어 ==========
/**
 * 일반 레슨 타이머 실행
 */
function openStopwatchModal(memberIndex, scheduleIndex) {
    if (!hasEditPermission()) {
        showAlert('레슨 타이머는 로그인이 필요합니다.');
        openLoginModal();
        return;
    }
    
    const member = members[memberIndex];
    if (!member) {
        showAlert('회원 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 스케줄 상태 확인
    const scheduleStatus = member.scheduleStatus || 
                          (member.schedules && member.schedules.length > 0 ? 'regular' : 'none');
    
    if (scheduleStatus === 'none') {
        showAlert('🚫 스케줄 없음 회원은 레슨 타이머를 사용할 수 없습니다.\n회원 정보에서 "불규칙 레슨"으로 변경해주세요.');
        return;
    }
    
    if (scheduleStatus === 'irregular' || !member.schedules || member.schedules.length === 0) {
        openIrregularStopwatchModal(memberIndex);
        return;
    }
    
    // 스케줄 인덱스 유효성 검사
    if (scheduleIndex === undefined || scheduleIndex === null || 
        scheduleIndex < 0 || scheduleIndex >= member.schedules.length) {
        scheduleIndex = 0;
    }
    
    const schedule = member.schedules[scheduleIndex];
    if (!schedule) {
        openIrregularStopwatchModal(memberIndex);
        return;
    }
    
    stopAlarmSound();
    
    stopwatchTimer.memberIndex = memberIndex;
    stopwatchTimer.memberId = member.id;
    stopwatchTimer.scheduleIndex = scheduleIndex;
    stopwatchTimer.schedule = { ...schedule, isIrregular: false };
    stopwatchTimer.totalSeconds = calculateScheduleSeconds(schedule.startTime, schedule.endTime);
    stopwatchTimer.remainingSeconds = stopwatchTimer.totalSeconds;
    stopwatchTimer.isRunning = false;
    stopwatchTimer.isCompleted = false;
    stopwatchTimer.lessonDate = new Date().toISOString().split('T')[0];
    
    // UI 업데이트
    document.getElementById('stopwatchEditBtn').style.display = 'flex';
    document.getElementById('stopwatchTimeEditBtn').style.display = 'none';
    document.getElementById('stopwatchCompleteBtn').style.display = 'none';
    
    initAlarmSoundUI();
    updateStopwatchUI();
    document.getElementById('stopwatchModal').classList.add('active');
    stopwatchReset(false);
}

/**
 * 불규칙 레슨 타이머 실행
 */
function openIrregularStopwatchModal(memberIndex) {
    if (!hasEditPermission()) {
        showAlert('레슨 타이머는 로그인이 필요합니다.');
        openLoginModal();
        return;
    }
    
    const member = members[memberIndex];
    if (!member) {
        showAlert('회원 정보를 찾을 수 없습니다.');
        return;
    }
    
    // 스케줄 상태 확인
    const scheduleStatus = member.scheduleStatus || 
                          (member.schedules && member.schedules.length > 0 ? 'regular' : 'none');
    
    if (scheduleStatus === 'none') {
        showAlert('🚫 스케줄 없음 회원은 레슨 타이머를 사용할 수 없습니다.\n회원 정보에서 "불규칙 레슨"으로 변경해주세요.');
        return;
    }
    
    stopAlarmSound();
    
    // 기본 20분
    const defaultMinutes = 20;
    const defaultSeconds = defaultMinutes * 60;
    
    const irregularSchedule = {
        day: '불규칙',
        startTime: '00:00',
        endTime: '00:20',
        isIrregular: true
    };
    
    stopwatchTimer.memberIndex = memberIndex;
    stopwatchTimer.memberId = member.id;
    stopwatchTimer.scheduleIndex = -1;
    stopwatchTimer.schedule = irregularSchedule;
    stopwatchTimer.totalSeconds = defaultSeconds;
    stopwatchTimer.remainingSeconds = defaultSeconds;
    stopwatchTimer.isRunning = false;
    stopwatchTimer.isCompleted = false;
    stopwatchTimer.lessonDate = new Date().toISOString().split('T')[0];
    
    // UI 업데이트
    document.getElementById('stopwatchEditBtn').style.display = 'none';
    document.getElementById('stopwatchTimeEditBtn').style.display = 'flex';
    document.getElementById('stopwatchCompleteBtn').style.display = 'none';
    
    initAlarmSoundUI();
    updateStopwatchUI();
    document.getElementById('stopwatchModal').classList.add('active');
    stopwatchReset(false);
}

function closeStopwatchModal() {
    stopwatchStop();
    stopAlarmSound();
    document.getElementById('stopwatchModal').classList.remove('active');
}

// ========== 스탑워치 제어 ==========
function stopwatchStart() {
    if (stopwatchTimer.isCompleted) {
        showAlert('이미 완료된 레슨입니다. 초기화 후 다시 시작해주세요.');
        return;
    }
    if (stopwatchTimer.isRunning) return;
    if (!canEditMemberByIndex(stopwatchTimer.memberIndex)) {
        showAlert('이 회원의 레슨을 시작할 권한이 없습니다.');
        return;
    }
    
    stopwatchTimer.isRunning = true;
    stopwatchTimer.startTime = Date.now() - (stopwatchTimer.totalSeconds - stopwatchTimer.remainingSeconds) * 1000;
    
    document.getElementById('stopwatchStartBtn').style.display = 'none';
    document.getElementById('stopwatchPauseBtn').style.display = 'flex';
    
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    
    stopwatchInterval = setInterval(() => {
        if (!stopwatchTimer.isRunning) return;
        const now = Date.now();
        const elapsedSeconds = (now - stopwatchTimer.startTime) / 1000;
        stopwatchTimer.remainingSeconds = Math.max(0, stopwatchTimer.totalSeconds - elapsedSeconds);
        updateStopwatchDisplay();
        
        const progressPercent = ((stopwatchTimer.totalSeconds - stopwatchTimer.remainingSeconds) / stopwatchTimer.totalSeconds) * 100;
        const progressBar = document.getElementById('stopwatchProgressBar');
        if (progressBar) progressBar.style.width = `${progressPercent}%`;
        
        if (stopwatchTimer.remainingSeconds <= 0) {
            stopwatchComplete();
        }
    }, 100);
}

function stopwatchPause() {
    stopwatchTimer.isRunning = false;
    stopwatchTimer.pauseTime = Date.now();
    document.getElementById('stopwatchStartBtn').style.display = 'flex';
    document.getElementById('stopwatchPauseBtn').style.display = 'none';
    if (stopwatchInterval) clearInterval(stopwatchInterval);
}

function stopwatchStop() {
    stopwatchTimer.isRunning = false;
    if (stopwatchInterval) {
        clearInterval(stopwatchInterval);
        stopwatchInterval = null;
    }
}

function stopwatchReset(showConfirm = true) {
    if (showConfirm && typeof window.showConfirm === 'function') {
        window.showConfirm('타이머를 초기화하시겠습니까?', () => performStopwatchReset());
    } else if (showConfirm) {
        if (confirm('타이머를 초기화하시겠습니까?')) {
            performStopwatchReset();
        }
    } else {
        performStopwatchReset();
    }
}

function performStopwatchReset() {
    stopwatchStop();
    stopwatchTimer.remainingSeconds = stopwatchTimer.totalSeconds;
    stopwatchTimer.isRunning = false;
    stopwatchTimer.isCompleted = false;
    
    const startBtn = document.getElementById('stopwatchStartBtn');
    const pauseBtn = document.getElementById('stopwatchPauseBtn');
    const completeBtn = document.getElementById('stopwatchCompleteBtn');
    const progressBar = document.getElementById('stopwatchProgressBar');
    
    if (startBtn) startBtn.style.display = 'flex';
    if (pauseBtn) pauseBtn.style.display = 'none';
    if (completeBtn) completeBtn.style.display = 'none';
    if (progressBar) progressBar.style.width = '0%';
    
    updateStopwatchDisplay();
    updateStopwatchUI();
}

function stopwatchComplete() {
    if (stopwatchTimer.isCompleted) return;
    
    stopwatchStop();
    stopwatchTimer.isCompleted = true;
    stopwatchTimer.remainingSeconds = 0;
    
    updateStopwatchDisplay();
    
    const progressBar = document.getElementById('stopwatchProgressBar');
    if (progressBar) progressBar.style.width = '100%';
    
    const startBtn = document.getElementById('stopwatchStartBtn');
    const pauseBtn = document.getElementById('stopwatchPauseBtn');
    const completeBtn = document.getElementById('stopwatchCompleteBtn');
    
    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'none';
    if (completeBtn) completeBtn.style.display = 'flex';
    
    playStopwatchAlarm();
    
    const member = members[stopwatchTimer.memberIndex];
    const today = stopwatchTimer.lessonDate || new Date().toISOString().split('T')[0];
    
    if (member && canEditMember(member)) {
        if (!member.attendanceDates || !member.attendanceDates.includes(today)) {
            performLessonCheck(stopwatchTimer.memberIndex, today);
            
            const lessonType = stopwatchTimer.schedule.isIrregular ? '불규칙 레슨' : '일반 레슨';
            showAlert(`✅ ${member.name} 회원의 ${lessonType}이(가) 자동 체크되었습니다!`);
        }
    }
    
    updateStopwatchUI();
}

// ========== 레슨 체크 함수 ==========
async function performLessonCheck(memberIndex, date) {
    const member = members[memberIndex];
    if (!member) return;

    if (!member.attendanceDates) member.attendanceDates = [];
    if (member.attendanceDates.includes(date)) return;

    try {
        // DB 저장
        const result = await AttendanceAPI.toggle(member.id, date);

        // 서버 응답으로 최신 상태 반영
        if (result.attendance_dates   !== undefined) member.attendanceDates   = result.attendance_dates;
        if (result.attendance_history !== undefined) member.attendanceHistory = result.attendance_history;
        if (result.current_count      !== undefined) member.currentCount      = result.current_count;

        const targetCount = member.targetCount || 0;

        if (result.action === 'completed') {
            // 목표 달성 — 서버에서 이미 초기화됨
            if (member.phone) {
                sendAttendanceCompleteSMS(member.name, member.phone, targetCount);
            }
            showAttendanceCompleteModal(member.name, member.phone, targetCount);
        } else if (targetCount > 0 && member.currentCount === targetCount - 1) {
            showAttendanceAlert(member.name, member.currentCount, targetCount);
        }

    } catch (err) {
        showAlert('레슨 체크 저장 실패: ' + err.message);
        return;
    }

    renderMembers();

    const calendar = document.getElementById('formCalendar');
    if (calendar && calendar.style.display !== 'none') {
        renderFormCalendar();
    }
}

function completeLessonFromStopwatch() {
    const member = members[stopwatchTimer.memberIndex];
    const today = stopwatchTimer.lessonDate || new Date().toISOString().split('T')[0];
    const lessonType = stopwatchTimer.schedule.isIrregular ? '불규칙 레슨' : '일반 레슨';
    
    if (!member || !canEditMember(member)) {
        showAlert('레슨 체크 권한이 없습니다.');
        return;
    }
    
    if (member.attendanceDates && member.attendanceDates.includes(today)) {
        showAlert('이미 오늘 레슨이 체크되었습니다.');
        closeStopwatchModal();
        return;
    }
    
    if (typeof window.showConfirm === 'function') {
        window.showConfirm(
            `${member.name} 회원의 ${lessonType}을(를) 완료하고 체크하시겠습니까?\n\n📅 날짜: ${formatDate(today)}`,
            () => {
                performLessonCheck(stopwatchTimer.memberIndex, today);
                showAlert(`✅ ${member.name} 회원의 ${lessonType}이(가) 완료 및 체크되었습니다!`);
                closeStopwatchModal();
            }
        );
    } else {
        if (confirm(`${member.name} 회원의 ${lessonType}을(를) 완료하고 체크하시겠습니까?\n\n📅 날짜: ${formatDate(today)}`)) {
            performLessonCheck(stopwatchTimer.memberIndex, today);
            showAlert(`✅ ${member.name} 회원의 ${lessonType}이(가) 완료 및 체크되었습니다!`);
            closeStopwatchModal();
        }
    }
}

// ========== 일반 레슨 스케줄 수정 ==========
function openScheduleEditModal() {
    const member = members[stopwatchTimer.memberIndex];
    if (!canEditMember(member)) {
        showAlert('스케줄을 수정할 권한이 없습니다.');
        return;
    }
    
    if (stopwatchTimer.schedule.isIrregular) {
        showAlert('불규칙 레슨은 스케줄 수정이 불가능합니다.\n"시간 수정" 버튼을 사용해주세요.');
        return;
    }
    
    // 시간 값 포맷팅 (HH:MM)
    const startTime = stopwatchTimer.schedule.startTime || '12:00';
    const endTime = stopwatchTimer.schedule.endTime || '12:20';
    const formattedStartTime = startTime.length > 5 ? startTime.substring(0, 5) : startTime;
    const formattedEndTime = endTime.length > 5 ? endTime.substring(0, 5) : endTime;
    
    document.getElementById('editScheduleDay').value = stopwatchTimer.schedule.day || '월';
    document.getElementById('editScheduleStartTime').value = formattedStartTime;
    document.getElementById('editScheduleEndTime').value = formattedEndTime;
    document.getElementById('scheduleEditModal').classList.add('active');
}

function closeScheduleEditModal() {
    document.getElementById('scheduleEditModal').classList.remove('active');
}

function saveScheduleEdit() {
    const member = members[stopwatchTimer.memberIndex];
    if (!canEditMember(member)) {
        showAlert('스케줄을 수정할 권한이 없습니다.');
        closeScheduleEditModal();
        return;
    }
    
    const newDay = document.getElementById('editScheduleDay').value;
    const newStartTime = document.getElementById('editScheduleStartTime').value;
    const newEndTime = document.getElementById('editScheduleEndTime').value;
    
    if (!newDay || !newStartTime || !newEndTime) {
        showAlert('요일과 시간을 모두 입력해주세요.');
        return;
    }
    
    if (newStartTime >= newEndTime) {
        showAlert('종료시간은 시작시간보다 커야 합니다.');
        return;
    }
    
    const originalSchedule = member.schedules[stopwatchTimer.scheduleIndex];
    
    if (member.coach) {
        const tempSchedules = [...member.schedules];
        tempSchedules[stopwatchTimer.scheduleIndex] = { day: newDay, startTime: newStartTime, endTime: newEndTime };
        const validSchedules = tempSchedules.filter(s => s.day && s.startTime && s.endTime);
        const conflict = checkScheduleConflicts(validSchedules, member.coach, stopwatchTimer.memberIndex);
        
        if (conflict.conflict) {
            showAlert(`코치 [${member.coach}] 시간 충돌!\n${conflict.memberName} 회원이 이미 ${conflict.existingTime}에 등록되어 있습니다.`);
            return;
        }
    }
    
    originalSchedule.day = newDay;
    originalSchedule.startTime = newStartTime;
    originalSchedule.endTime = newEndTime;
    
    stopwatchTimer.schedule = { ...originalSchedule, isIrregular: false };
    stopwatchTimer.totalSeconds = calculateScheduleSeconds(newStartTime, newEndTime);
    stopwatchTimer.remainingSeconds = stopwatchTimer.totalSeconds;
    
    // DB 저장 (스케줄 수정)
    MembersAPI.update({
        ...member,
        id: member.id,
        register_date: member.registerDate,
        target_count: member.targetCount,
        current_count: member.currentCount,
        birth_year: member.birthYear,
        skill_level: member.skillLevel,
        private_memo: member.privateMemo,
        schedule_status: member.scheduleStatus || 'regular',
        schedules: member.schedules.map(s => ({
            day: s.day,
            startTime: s.startTime || s.start_time,
            endTime: s.endTime || s.end_time
        })),
        awards: member.awards || [],
        paymentHistory: member.paymentHistory || []
    }).catch(err => {
        showAlert('스케줄 저장 실패: ' + err.message);
    });

    updateStopwatchUI();
    stopwatchReset(false);
    renderMembers();
    renderSchedule();

    closeScheduleEditModal();
    showAlert('스케줄이 수정되었습니다. 타이머가 재설정되었습니다.');
}

// ========== 불규칙 레슨 시간 수정 ==========
/**
 * 불규칙 레슨 시간 수정 모달 열기
 */
function openIrregularTimeEditModal() {
    const member = members[stopwatchTimer.memberIndex];
    if (!canEditMember(member)) {
        showAlert('시간을 수정할 권한이 없습니다.');
        return;
    }
    
    if (!stopwatchTimer.schedule.isIrregular) {
        showAlert('일반 레슨은 스케줄 수정 모달을 사용하세요.');
        return;
    }
    
    // 현재 시간 값 설정 (분 단위)
    const currentMinutes = Math.floor(stopwatchTimer.totalSeconds / 60);
    
    document.getElementById('irregularMinutes').value = currentMinutes;
    document.getElementById('irregularTimeEditModal').classList.add('active');
}

/**
 * 불규칙 레슨 시간 저장
 */
function saveIrregularTimeEdit() {
    const member = members[stopwatchTimer.memberIndex];
    if (!canEditMember(member)) {
        showAlert('시간을 수정할 권한이 없습니다.');
        closeIrregularTimeEditModal();
        return;
    }
    
    const minutes = parseInt(document.getElementById('irregularMinutes').value);
    
    if (!minutes || minutes < 1) {
        showAlert('1분 이상 입력해주세요.');
        return;
    }
    
    if (minutes > 180) {
        showAlert('최대 180분(3시간)까지 설정 가능합니다.');
        return;
    }
    
    // 시간 업데이트
    const totalSeconds = minutes * 60;
    stopwatchTimer.totalSeconds = totalSeconds;
    stopwatchTimer.remainingSeconds = totalSeconds;
    
    // 종료 시간 계산 (HH:MM 형식)
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    stopwatchTimer.schedule.endTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    
    // UI 업데이트
    updateStopwatchUI();
    stopwatchReset(false);
    
    closeIrregularTimeEditModal();
    showAlert(`불규칙 레슨 시간이 ${minutes}분으로 설정되었습니다.`);
}

function closeIrregularTimeEditModal() {
    document.getElementById('irregularTimeEditModal').classList.remove('active');
}

// ========== 초기화 ==========
function initStopwatchModule() {
    console.log('⏱️ 스탑워치 모듈 초기화 (알림음 선택 지원)');
    initAlarmSoundUI();
}

// ========== 이벤트 리스너 ==========
document.addEventListener('DOMContentLoaded', function() {
    initStopwatchModule();
    
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeStopwatchModal();
            closeScheduleEditModal();
            closeIrregularTimeEditModal();
        }
    });
    
    window.addEventListener('beforeunload', function() {
        stopAlarmSound();
    });
});