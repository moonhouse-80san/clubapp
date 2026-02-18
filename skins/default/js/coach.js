/**
 * 코치 pill 버튼 렌더링
 */
function renderCoachButtons() {
    const container = document.getElementById('coachBtnGroup');
    if (!container) return;
    
    container.innerHTML = '';

    const activeCoaches = settings.coaches.filter(name => name && name.trim() !== '');

    if (activeCoaches.length === 0) {
        container.innerHTML = '<div style="font-size: 13px; color: #999; padding: 8px 0;">코치가 등록되지 않았습니다. 관리자 설정에서 코치를 추가해주세요.</div>';
        return;
    }

    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'coach-btn active';
    noneBtn.dataset.value = '';
    noneBtn.textContent = '미선택';
    noneBtn.onclick = () => selectCoachBtn(noneBtn);
    container.appendChild(noneBtn);

    activeCoaches.forEach((name) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'coach-btn';
        btn.dataset.value = name;
        btn.textContent = name;
        btn.onclick = () => selectCoachBtn(btn);
        container.appendChild(btn);
    });
}

/**
 * 코치 버튼 선택 처리
 */
function selectCoachBtn(clickedBtn) {
    document.querySelectorAll('.coach-btn').forEach(btn => btn.classList.remove('active'));
    clickedBtn.classList.add('active');
}

/**
 * 선택된 코치 값 가져오기
 */
function getSelectedCoach() {
    const active = document.querySelector('.coach-btn.active');
    return active ? active.dataset.value : '';
}

/**
 * 코치 버튼에 값 설정
 */
function setSelectedCoach(coachName) {
    document.querySelectorAll('.coach-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === coachName);
    });
    const hasMatch = document.querySelector(`.coach-btn[data-value="${coachName}"]`);
    if (!hasMatch) {
        const noneBtn = document.querySelector('.coach-btn[data-value=""]');
        if (noneBtn) noneBtn.classList.add('active');
    }
}

/**
 * 코치별 회원 수 계산
 */
function countMembersByCoach() {
    const coachCounts = {};
    const noCoachCount = { count: 0, name: '미선택' };
    
    members.forEach(member => {
        if (member.coach && member.coach.trim() !== '') {
            coachCounts[member.coach] = (coachCounts[member.coach] || 0) + 1;
        } else {
            noCoachCount.count++;
        }
    });
    
    return { coachCounts, noCoachCount };
}

/**
 * 코치 섹션 토글
 */
function toggleCoachSection(coachName) {
    const section = document.querySelector(`[data-coach-section="${coachName}"]`);
    if (section) {
        const isCollapsed = section.classList.contains('collapsed');
        section.classList.toggle('collapsed');
        
        const toggleIcon = section.querySelector('.toggle-icon');
        if (toggleIcon) {
            toggleIcon.textContent = isCollapsed ? '▼' : '▶';
        }
    }
}

/**
 * 시간 포맷팅
 */
function formatScheduleTime(time) {
    if (!time || typeof time !== 'string') {
        return time;
    }
    return time.replace(/^(\d{2}:\d{2})(:00)?$/, '$1');
}

/**
 * 입금 상태 아이콘 반환
 * 이번달 입금 여부에 따라 빨간색 체크 표시
 */
function getPaymentStatusIcon(member) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // 이번달 입금 여부 확인
    let hasPaidThisMonth = false;
    
    if (member.paymentHistory && member.paymentHistory.length > 0) {
        hasPaidThisMonth = member.paymentHistory.some(payment => {
            const paymentDate = new Date(payment.date);
            return paymentDate.getFullYear() === currentYear && 
                   paymentDate.getMonth() + 1 === currentMonth;
        });
    }
    
    if (hasPaidThisMonth) {
        return '<span style="color: #f44336; font-size: 14px; margin-left: 2px;" title="이번달 회비 입금 완료">✓</span>';
    }
    
    return ''; // 미입금자는 표시 없음
}

/**
 * 🔥 스케줄 상태별 배지 생성 헬퍼 함수
 */
function renderScheduleBadgeByStatus(member, originalIndex) {
    const isLoggedIn = hasEditPermission();
    const scheduleStatus = member.scheduleStatus || 
                          (member.schedules && member.schedules.length > 0 ? 'regular' : 'none');
    const hasTimerPermission = canEditMember(member);
    
    let badgeHtml = '';
    
    if (scheduleStatus === 'regular' && member.schedules && member.schedules.length > 0) {
        // 1️⃣ 일반 레슨 - 고정 스케줄 표시
        member.schedules.forEach((schedule, sIndex) => {
            if (schedule.day && schedule.startTime && schedule.endTime) {
                if (isLoggedIn && hasTimerPermission) {
                    badgeHtml += `<span class="schedule-badge regular schedule-badge-clickable" 
                        onclick="openStopwatchModal(${originalIndex}, ${sIndex}); event.stopPropagation();"
                        title="⏱️ 클릭하여 레슨 타이머 실행 (${formatScheduleTime(schedule.startTime)}~${formatScheduleTime(schedule.endTime)})">
                        📅 ${dayNames[schedule.day]} ${formatScheduleTime(schedule.startTime)}~${formatScheduleTime(schedule.endTime)} ⏱️
                    </span>`;
                } else {
                    badgeHtml += `<span class="schedule-badge regular" 
                        title="${dayNames[schedule.day]} ${formatScheduleTime(schedule.startTime)}~${formatScheduleTime(schedule.endTime)}">
                        📅 ${dayNames[schedule.day]} ${formatScheduleTime(schedule.startTime)}~${formatScheduleTime(schedule.endTime)}
                    </span>`;
                }
            }
        });
    } else if (scheduleStatus === 'irregular') {
        // 2️⃣ 🔥 불규칙 레슨 - 타이머 실행 배지
        if (isLoggedIn && hasTimerPermission) {
            badgeHtml = `<span class="schedule-badge irregular schedule-badge-clickable" 
                onclick="openIrregularStopwatchModal(${originalIndex}); event.stopPropagation();"
                title="⏱️ 불규칙 레슨 - 클릭하여 타이머 실행 (시간 조절 가능)">
                ⚡ 불규칙 레슨 ⏱️
            </span>`;
        } else {
            badgeHtml = `<span class="schedule-badge irregular" 
                title="불규칙 레슨 회원">
                ⚡ 불규칙 레슨
            </span>`;
        }
    } else {
        // 3️⃣ 스케줄 없음 - 레슨 미참여
        badgeHtml = `<span class="schedule-badge none" 
            title="레슨 미참여 회원 (스케줄 없음)">
            🚫 스케줄 없음
        </span>`;
    }
    
    return badgeHtml;
}

/**
 * 🔥 코치별 회원 목록 렌더링 헬퍼 함수 - 모든 스케줄 상태 표시
 */
function renderCoachMembersList(membersList) {
    return membersList.map((member, index) => {
        const originalIndex = members.indexOf(member);
        const phoneLink = member.phone ? 
            `<div><a href="tel:${String(member.phone).replace(/-/g, '')}" class="phone-link">📞 ${member.phone}</a></div>` : '';

        // 🔥 스케줄 배지 생성 (통합 헬퍼 함수 사용)
        const scheduleBadges = renderScheduleBadgeByStatus(member, originalIndex);
        
        // 로그인 여부
        const isLoggedIn = hasEditPermission();

        const currentCount = member.currentCount || 0;
        const targetCount = member.targetCount || 0;

        let attendanceCount = '';
        if (targetCount > 0) {
            attendanceCount = `
                <span class="attendance-count" style="margin-left: 8px;">
                    📊 ${currentCount}/${targetCount}회
                </span>
            `;
        }

        const hasPermission = canEditMember(member);
        const editBtnClass = hasPermission ? 'btn-edit' : 'btn-edit btn-edit-disabled btn-hidden';
        const deleteBtnClass = hasPermission ? 'btn-delete' : 'btn-delete btn-delete-disabled btn-hidden';

        // 팝업 표시 설정
        const nameClickable = (settings.showMemberDetails !== false || isLoggedIn);
        const nameStyle = nameClickable ? 'cursor: pointer; color: #000; text-decoration: none;' : 'cursor: default; color: #000;';
        const nameOnClick = nameClickable ? `onclick="showMemberDetails(${originalIndex})"` : '';

        // 코치 배지 - 로그인한 사용자에게만 표시
        let coachBadgeHtml = '';
        if (member.coach && isLoggedIn) {
            coachBadgeHtml = '<span class="coach-badge">🏋️ ' + member.coach + '</span>';
        }

        return `
        <div class="member-card">
            <div class="member-content">
                <div class="member-header">
                    <div class="member-name" style="${nameStyle}" ${nameOnClick}>
                        ${member.name}
                        ${attendanceCount}
                    </div>
                    <div class="member-actions">
                        <button class="${editBtnClass}" data-index="${originalIndex}" onclick="editMember(${originalIndex});">
                            수정
                        </button>
                        <button class="${deleteBtnClass}" data-index="${originalIndex}" onclick="checkPermissionBeforeDelete(${originalIndex});">
                            삭제
                        </button>
                    </div>
                </div>
                <div class="member-info">
                    <div class="phone-fee-row">
                        ${phoneLink}
                        ${member.fee !== null && member.fee !== undefined ? 
                            `<span class="member-fee">💰 월회비:${formatNumber(member.fee)}원</span>` + 
                            getPaymentStatusIcon(member)  // 🔴 입금 상태 아이콘 추가
                        : ''}
                    </div>
                    <div class="member-meta-row">
                        ${coachBadgeHtml}
                        ${scheduleBadges ? `<div class="schedule-container">${scheduleBadges}</div>` : ''}
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

/**
 * 🔥 코치별 회원 목록 렌더링 (불규칙 레슨/스케줄 없음 완전 지원)
 */
function renderMembersByCoach() {
    const listEl = document.getElementById('listSection');
    const countEl = document.getElementById('memberCount');
    
    // 코치별 회원 수 계산
    const { coachCounts, noCoachCount } = countMembersByCoach();
    
    // 총회원수 옆에 코치별 회원수 표시
    let countText = `${members.length}명`;
    
    const activeCoaches = Object.keys(coachCounts);
    if (activeCoaches.length > 0) {
        const coachCountTexts = activeCoaches.map(coach => 
            `${coach}:${coachCounts[coach]}`
        );
        
        if (noCoachCount.count > 0) {
            coachCountTexts.push(`미선택:${noCoachCount.count}`);
        }
        
        countText += ` (${coachCountTexts.join(', ')})`;
    }
    
    countEl.textContent = countText;
    
    // 검색어 가져오기
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    // 코치별로 회원 그룹화
    const membersByCoach = {};
    const noCoachMembers = [];
    
    // 검색어 필터링
    let targetMembers = filteredMembers.length > 0 ? filteredMembers : members;
    if (searchTerm) {
        targetMembers = members.filter(member => {
            return member.name.toLowerCase().includes(searchTerm) ||
                   (member.phone && String(member.phone).includes(searchTerm));
        });
    }
    
    // 🔥 코치별 그룹화 (스케줄 상태와 무관하게 모든 회원 표시)
    targetMembers.forEach(member => {
        if (member.coach && member.coach.trim() !== '') {
            if (!membersByCoach[member.coach]) {
                membersByCoach[member.coach] = [];
            }
            membersByCoach[member.coach].push(member);
        } else {
            noCoachMembers.push(member);
        }
    });
    
    // 빈 상태 처리
    if (targetMembers.length === 0) {
        listEl.innerHTML = `
            <div class="empty-state">
                <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
                </svg>
                <p>${searchTerm ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // 🔥 코치별 섹션 생성 (모든 회원 표시)
    const sortedCoaches = Object.keys(membersByCoach).sort();
    
    sortedCoaches.forEach(coach => {
        const coachMembers = membersByCoach[coach];
        if (coachMembers.length === 0) return;
        
        // 🔥 스케줄 상태별 회원 수 계산
        const regularCount = coachMembers.filter(m => 
            (m.scheduleStatus === 'regular' || (m.schedules && m.schedules.length > 0))
        ).length;
        const irregularCount = coachMembers.filter(m => 
            m.scheduleStatus === 'irregular'
        ).length;
        const noneCount = coachMembers.filter(m => 
            m.scheduleStatus === 'none' || (!m.schedules || m.schedules.length === 0)
        ).length;
        
        html += `
            <div class="coach-section" data-coach-section="${coach}">
                <div class="coach-section-header" onclick="toggleCoachSection('${coach}')">
                    <div class="coach-title">
                        <span class="toggle-icon">▼</span>
                        <span class="coach-badge">🏋️ ${coach}</span>
                        <span class="coach-count">${coachMembers.length}명</span>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px; font-size: 12px;">
                        ${regularCount > 0 ? `<span style="color: #2196F3;">📅 ${regularCount}</span>` : ''}
                        ${irregularCount > 0 ? `<span style="color: #9C27B0;">⚡ ${irregularCount}</span>` : ''}
                        ${noneCount > 0 ? `<span style="color: #9E9E9E;">🚫 ${noneCount}</span>` : ''}
                    </div>
                </div>
                <div class="coach-members-list">
                    ${renderCoachMembersList(coachMembers)}
                </div>
            </div>
        `;
    });
    
    // 🔥 미선택 회원 섹션 (스케줄 상태 포함)
    if (noCoachMembers.length > 0) {
        const regularCount = noCoachMembers.filter(m => 
            (m.scheduleStatus === 'regular' || (m.schedules && m.schedules.length > 0))
        ).length;
        const irregularCount = noCoachMembers.filter(m => 
            m.scheduleStatus === 'irregular'
        ).length;
        const noneCount = noCoachMembers.filter(m => 
            m.scheduleStatus === 'none' || (!m.schedules || m.schedules.length === 0)
        ).length;
        
        html += `
            <div class="coach-section" data-coach-section="none">
                <div class="coach-section-header" onclick="toggleCoachSection('none')">
                    <div class="coach-title">
                        <span class="toggle-icon">▼</span>
                        <span class="coach-badge">👤 미선택</span>
                        <span class="coach-count">${noCoachMembers.length}명</span>
                    </div>
                    <div style="display: flex; gap: 8px; margin-left: 12px; font-size: 12px;">
                        ${regularCount > 0 ? `<span style="color: #2196F3;">📅 ${regularCount}</span>` : ''}
                        ${irregularCount > 0 ? `<span style="color: #9C27B0;">⚡ ${irregularCount}</span>` : ''}
                        ${noneCount > 0 ? `<span style="color: #9E9E9E;">🚫 ${noneCount}</span>` : ''}
                    </div>
                </div>
                <div class="coach-members-list">
                    ${renderCoachMembersList(noCoachMembers)}
                </div>
            </div>
        `;
    }
    
    listEl.innerHTML = html;
}