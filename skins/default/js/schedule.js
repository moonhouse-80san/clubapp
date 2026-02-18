/**
 * 스케줄 관리 - 3단계 상태 구분
 * regular: 일반 레슨 (고정 스케줄 있음)
 * irregular: 불규칙 레슨 (개별 예약)
 * none: 스케줄 없음 (레슨 미참여)
 */

// ========== 전역 변수 ==========
let schedules = [
    { id: 1, day: '', startTime: '12:00', endTime: '12:20' },
    { id: 2, day: '', startTime: '12:00', endTime: '12:20' }
];
let nextScheduleId = 3;
let scheduleStatus = 'regular'; // 'regular', 'irregular', 'none'

// ========== 스케줄 상태 관리 ==========
/**
 * 스케줄 상태 설정
 */
function setScheduleStatus(status) {
    scheduleStatus = status;
    
    // 상태에 따라 스케줄 데이터 초기화
    if (status === 'regular') {
        if (schedules.length === 0) {
            schedules = [
                { id: 1, day: '', startTime: '12:00', endTime: '12:20' },
                { id: 2, day: '', startTime: '12:00', endTime: '12:20' }
            ];
            nextScheduleId = 3;
        }
    } else {
        // 불규칙 또는 없음 모드에서는 스케줄 데이터 비움
        schedules = [];
        nextScheduleId = 1;
    }
    
    renderSchedules();
    updateScheduleStatusField();
}

/**
 * 스케줄 상태 hidden 필드 업데이트
 */
function updateScheduleStatusField() {
    let statusField = document.getElementById('scheduleStatusField');
    if (!statusField) {
        statusField = document.createElement('input');
        statusField.type = 'hidden';
        statusField.id = 'scheduleStatusField';
        statusField.name = 'scheduleStatus';
        
        const formBody = document.querySelector('.form-body');
        if (formBody) {
            formBody.appendChild(statusField);
        }
    }
    statusField.value = scheduleStatus;
}

// ========== 스케줄 UI 렌더링 ==========
/**
 * 스케줄 전체 렌더링
 */
function renderSchedules() {
    const container = document.getElementById('schedulesContainer');
    if (!container) return;
    
    // 스케줄 상태 선택 UI
    const statusSelector = renderScheduleStatusSelector();
    
    let contentHtml = '';
    
    if (scheduleStatus === 'regular') {
        contentHtml = renderRegularScheduleUI();
    } else if (scheduleStatus === 'irregular') {
        contentHtml = renderIrregularScheduleUI();
    } else {
        contentHtml = renderNoScheduleUI();
    }
    
    container.innerHTML = statusSelector + contentHtml;
    
    if (scheduleStatus === 'regular') {
        attachScheduleEventListeners();
    }
}

/**
 * 스케줄 상태 선택기 렌더링
 */
function renderScheduleStatusSelector() {
    return `
        <div class="schedule-status-selector">
            <div style="font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center; gap: 6px;">
                <span>📋 레슨 유형 선택</span>
            </div>
            <div class="schedule-status-options">
                <label class="schedule-status-label ${scheduleStatus === 'regular' ? 'regular-active' : ''}" 
                       style="border: 2px solid ${scheduleStatus === 'regular' ? '#2196F3' : '#e0e0e0'}; background: ${scheduleStatus === 'regular' ? '#e3f2fd' : 'white'};">
                    <input type="radio" name="scheduleStatus" value="regular" 
                           ${scheduleStatus === 'regular' ? 'checked' : ''} 
                           onchange="setScheduleStatus('regular')"
                           style="accent-color: #2196F3;">
                    <span style="font-weight: 600; color: ${scheduleStatus === 'regular' ? '#2196F3' : '#666'};">📅 일반 레슨</span>
                    <span style="font-size: 12px; color: #999;">(고정 스케줄)</span>
                </label>
                <label class="schedule-status-label ${scheduleStatus === 'irregular' ? 'irregular-active' : ''}"
                       style="border: 2px solid ${scheduleStatus === 'irregular' ? '#9C27B0' : '#e0e0e0'}; background: ${scheduleStatus === 'irregular' ? '#f3e5f5' : 'white'};">
                    <input type="radio" name="scheduleStatus" value="irregular" 
                           ${scheduleStatus === 'irregular' ? 'checked' : ''} 
                           onchange="setScheduleStatus('irregular')"
                           style="accent-color: #9C27B0;">
                    <span style="font-weight: 600; color: ${scheduleStatus === 'irregular' ? '#9C27B0' : '#666'};">⚡ 불규칙 레슨</span>
                    <span style="font-size: 12px; color: #999;">(개별 레슨)</span>
                </label>
                <label class="schedule-status-label ${scheduleStatus === 'none' ? 'none-active' : ''}"
                       style="border: 2px solid ${scheduleStatus === 'none' ? '#9E9E9E' : '#e0e0e0'}; background: ${scheduleStatus === 'none' ? '#eeeeee' : 'white'};">
                    <input type="radio" name="scheduleStatus" value="none" 
                           ${scheduleStatus === 'none' ? 'checked' : ''} 
                           onchange="setScheduleStatus('none')"
                           style="accent-color: #9E9E9E;">
                    <span style="font-weight: 600; color: ${scheduleStatus === 'none' ? '#616161' : '#666'};">🚫 스케줄 없음</span>
                    <span style="font-size: 12px; color: #999;">(레슨 미참여)</span>
                </label>
            </div>
        </div>
    `;
}

/**
 * 일반 레슨 UI 렌더링
 */
function renderRegularScheduleUI() {
    const scheduleItemsHtml = schedules.map((schedule, index) => `
        <div class="schedule-item" data-schedule-id="${schedule.id}" 
             style="border-left: 4px solid #2196F3; border-radius: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span style="background: #2196F3; color: white; width: 26px; height: 26px; 
                               display: flex; align-items: center; justify-content: center; 
                               border-radius: 50%; font-size: 14px; font-weight: 600;">
                        ${index + 1}
                    </span>
                    <span style="font-weight: 600; color: #2196F3;">일반 스케줄</span>
                </div>
                ${schedules.length > 1 ? `
                    <button type="button" class="schedule-delete-btn" 
                            onclick="removeSchedule(${schedule.id})" title="삭제">
                        ×
                    </button>
                ` : ''}
            </div>
            <div class="form-grid" style="grid-template-columns: 1fr 2fr; margin-bottom: 0;">
                <div class="form-group">
                    <label for="day${schedule.id}">요일</label>
                    <select id="day${schedule.id}" data-schedule-id="${schedule.id}" data-field="day">
                        <option value="">요일 선택</option>
                        <option value="월" ${schedule.day === '월' ? 'selected' : ''}>월요일</option>
                        <option value="화" ${schedule.day === '화' ? 'selected' : ''}>화요일</option>
                        <option value="수" ${schedule.day === '수' ? 'selected' : ''}>수요일</option>
                        <option value="목" ${schedule.day === '목' ? 'selected' : ''}>목요일</option>
                        <option value="금" ${schedule.day === '금' ? 'selected' : ''}>금요일</option>
                        <option value="토" ${schedule.day === '토' ? 'selected' : ''}>토요일</option>
                        <option value="일" ${schedule.day === '일' ? 'selected' : ''}>일요일</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>시간</label>
                    <div class="time-group">
                        <input type="time" id="startTime${schedule.id}" 
                               value="${schedule.startTime}" 
                               data-schedule-id="${schedule.id}" 
                               data-field="startTime"
                               step="300">
                        <input type="time" id="endTime${schedule.id}" 
                               value="${schedule.endTime}" 
                               data-schedule-id="${schedule.id}" 
                               data-field="endTime"
                               step="300">
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    return `
        ${scheduleItemsHtml}
        <button type="button" class="schedule-add-btn" 
                onclick="if(hasEditPermission()) addSchedule(); else { showAlert('로그인이 필요합니다.'); openLoginModal(); }">
            ➕ 일반 스케줄 추가 (최대 7개)
        </button>
    `;
}

/**
 * 불규칙 레슨 UI 렌더링
 */
function renderIrregularScheduleUI() {
    return `
        <div class="irregular-guide">
            <div class="irregular-guide-icon">⚡</div>
            <div class="irregular-guide-title">불규칙 레슨 회원</div>
            <div class="irregular-guide-desc">
                고정 스케줄 없이 개별 예약으로 레슨이 진행됩니다.
            </div>
            <div class="irregular-guide-box">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                    <span style="background: #9C27B0; color: white; width: 26px; height: 26px; 
                               display: flex; align-items: center; justify-content: center; 
                               border-radius: 50%; font-size: 14px;">⏱️</span>
                    <span style="font-weight: 600; color: #333;">타이머 사용 방법</span>
                </div>
                <ul style="margin: 0 0 0 38px; color: #666; font-size: 14px; line-height: 1.8; padding-left: 0;">
                    <li style="list-style-type: disc;">① 회원 목록에서 <strong style="color: #9C27B0;">"⚡ 불규칙 레슨"</strong> 배지 클릭</li>
                    <li style="list-style-type: disc;">② 타이머 실행 후 레슨 시간 측정 (기본 20분)</li>
                    <li style="list-style-type: disc;">③ 완료 시 자동으로 레슨 체크</li>
                </ul>
            </div>
        </div>
    `;
}

/**
 * 스케줄 없음 UI 렌더링
 */
function renderNoScheduleUI() {
    return `
        <div class="no-schedule-guide">
            <div class="no-schedule-guide-icon">🚫</div>
            <div class="no-schedule-guide-title">스케줄 없음</div>
            <div class="no-schedule-guide-desc">
                이 회원은 레슨에 참여하지 않습니다.
            </div>
            <div class="no-schedule-guide-notice">
                ⓘ 레슨 타이머를 사용할 수 없습니다.<br>
                (일반 레슨 또는 불규칙 레슨을 선택해주세요)
            </div>
        </div>
    `;
}

// ========== 스케줄 데이터 관리 ==========
/**
 * 스케줄 데이터 가져오기
 */
function getSchedulesData() {
    if (scheduleStatus !== 'regular') {
        return []; // 불규칙 또는 없음 모드
    }
    
    const result = [];
    
    schedules.forEach(schedule => {
        const dayEl = document.getElementById(`day${schedule.id}`);
        const startTimeEl = document.getElementById(`startTime${schedule.id}`);
        const endTimeEl = document.getElementById(`endTime${schedule.id}`);
        
        if (dayEl && startTimeEl && endTimeEl) {
            const day = dayEl.value;
            const startTime = startTimeEl.value;
            const endTime = endTimeEl.value;
            
            if (day && startTime && endTime) {
                result.push({ day, startTime, endTime });
            }
        }
    });
    
    return result;
}

/**
 * 스케줄 데이터 설정 (기존 회원 로드 시)
 */
function setSchedulesData(memberSchedules) {
    // 회원의 스케줄 상태 결정
    if (!memberSchedules || memberSchedules.length === 0) {
        scheduleStatus = 'none'; // 스케줄이 없으면 '없음'으로 기본 설정
        schedules = [];
        nextScheduleId = 1;
    } else {
        scheduleStatus = 'regular'; // 스케줄이 있으면 '일반'으로 설정
        schedules = memberSchedules.map((s, index) => ({
            id: index + 1,
            day: s.day || '',
            startTime: s.startTime || '12:00',
            endTime: s.endTime || '12:20'
        }));
        nextScheduleId = schedules.length + 1;
    }
    
    renderSchedules();
    updateScheduleStatusField();
}

// ========== 스케줄 CRUD ==========
/**
 * 스케줄 추가
 */
function addSchedule() {
    if (scheduleStatus !== 'regular') {
        setScheduleStatus('regular');
        setTimeout(() => addSchedule(), 100);
        return;
    }
    
    if (schedules.length >= 7) {
        showAlert('최대 7개의 스케줄까지 추가할 수 있습니다!');
        return;
    }
    
    schedules.push({
        id: nextScheduleId++,
        day: '',
        startTime: '12:00',
        endTime: '12:20'
    });
    
    renderSchedules();
    showAlert(`스케줄 ${schedules.length}개 (일반 레슨)`);
}

/**
 * 스케줄 삭제
 */
function removeSchedule(scheduleId) {
    if (schedules.length <= 1) {
        showAlert('최소 1개의 스케줄은 있어야 합니다!');
        return;
    }
    
    const index = schedules.findIndex(s => s.id === scheduleId);
    if (index !== -1) {
        schedules.splice(index, 1);
        renderSchedules();
    }
}

/**
 * 스케줄 초기화
 */
function resetSchedules() {
    scheduleStatus = 'regular';
    schedules = [
        { id: 1, day: '', startTime: '12:00', endTime: '12:20' },
        { id: 2, day: '', startTime: '12:00', endTime: '12:20' }
    ];
    nextScheduleId = 3;
    renderSchedules();
    updateScheduleStatusField();
}

// ========== 이벤트 리스너 ==========
function attachScheduleEventListeners() {
    document.querySelectorAll('[data-schedule-id]').forEach(element => {
        if (element.tagName === 'SELECT' || element.tagName === 'INPUT') {
            element.removeEventListener('change', updateScheduleData);
            element.addEventListener('change', updateScheduleData);
        }
    });
}

function updateScheduleData(event) {
    const scheduleId = parseInt(event.target.dataset.scheduleId);
    const field = event.target.dataset.field;
    const value = event.target.value;
    
    const schedule = schedules.find(s => s.id === scheduleId);
    if (schedule) {
        schedule[field] = value;
    }
}

// ========== 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    renderSchedules();
    updateScheduleStatusField();
});