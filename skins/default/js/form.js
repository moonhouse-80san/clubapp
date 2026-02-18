/**
 * 회원 등록/수정 폼 관리
 */

// ========== 전역 변수 ==========
let currentEditIndex = null;
let deleteIndex = null;
let currentPaymentList = [];
let currentAwards = [];
let isPhotoRemoved = false;
let currentPhotoPath = null;  // 서버에 저장된 실제 파일 경로
let isFormCollapsed = false;

// ========== DOM 로드 시 초기화 ==========
document.addEventListener('DOMContentLoaded', function() {
    // 성별 버튼 이벤트 리스너
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // 수상경력 입력창 엔터 키 이벤트
    const awardInput = document.getElementById('awardInput');
    if (awardInput) {
        awardInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                addAward();
            }
        });
    }
    
    // 현재 스케줄 횟수 입력란 초기 상태
    const currentCountInput = document.getElementById('currentCount');
    if (currentCountInput) {
        if (!hasEditPermission()) {
            currentCountInput.setAttribute('readonly', true);
            currentCountInput.style.background = '#f0f0f0';
        }
    }

    // ★ 전화번호 자동 하이픈 이벤트 리스너
    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
        phoneInput.addEventListener('input', function(e) {
            const cursorPos = e.target.selectionStart;
            const prevLength = e.target.value.length;
            e.target.value = formatPhoneNumber(e.target.value);
            const diff = e.target.value.length - prevLength;
            try {
                e.target.setSelectionRange(cursorPos + diff, cursorPos + diff);
            } catch(err) {}
        });
    }
    
    // 폼 토글 초기화
    setTimeout(() => {
        initFormToggle();
    }, 500);
});

// ========== 폼 토글 함수 ==========
function toggleFormSection() {
    const formSection = document.querySelector('.form-section');
    
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('회원 등록/수정 권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    isFormCollapsed = !isFormCollapsed;
    
    if (isFormCollapsed) {
        formSection.classList.add('collapsed');
    } else {
        formSection.classList.remove('collapsed');
        setTimeout(() => {
            const formHeader = document.querySelector('.form-header');
            if (formHeader) {
                formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
    
    updateFormHeaderIcon();
}

function openFormSection(editMode = false) {
    const formSection = document.querySelector('.form-section');
    
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('회원 등록/수정 권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return false;
    }
    
    isFormCollapsed = false;
    formSection.classList.remove('collapsed');
    formSection.classList.remove('no-permission');
    
    setTimeout(() => {
        const formHeader = document.querySelector('.form-header');
        if (formHeader) {
            formHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
    
    if (editMode) {
        formSection.classList.add('mode-edit');
        formSection.classList.remove('mode-add');
        document.getElementById('formHeaderTitle').textContent = '회원 정보 수정';
    } else {
        formSection.classList.add('mode-add');
        formSection.classList.remove('mode-edit');
        document.getElementById('formHeaderTitle').textContent = '회원 등록';
    }
    
    updateFormHeaderIcon();
    updateFormHeaderBadge();
    
    return true;
}

function closeFormSection() {
    const formSection = document.querySelector('.form-section');
    isFormCollapsed = true;
    formSection.classList.add('collapsed');
    updateFormHeaderIcon();
}

function updateFormHeaderIcon() {
    const icon = document.getElementById('formHeaderIcon');
    if (icon) {
        icon.textContent = isFormCollapsed ? '▶' : '▼';
    }
}

function updateFormHeaderBadge() {
    const badge = document.getElementById('formHeaderBadge');
    const lockIcon = document.getElementById('formHeaderLock');
    const formSection = document.querySelector('.form-section');
    
    if (!badge || !lockIcon) return;
    
    if (hasEditPermission()) {
        const roleText = currentUser.role === USER_ROLES.ADMIN ? '관리자' : '부관리자';
        badge.textContent = `${roleText} 모드`;
        badge.style.background = 'rgba(255,255,255,0.3)';
        lockIcon.style.display = 'none';
        formSection.classList.remove('no-permission');
    } else if (settings.allowGuestRegistration) {
        badge.textContent = '비로그인 등록 허용';
        badge.style.background = 'rgba(255,193,7,0.3)';
        lockIcon.style.display = 'flex';
        formSection.classList.add('no-permission');
    } else {
        badge.textContent = '권한 없음 (로그인 필요)';
        badge.style.background = 'rgba(244,67,54,0.3)';
        lockIcon.style.display = 'flex';
        formSection.classList.add('no-permission');
        
        if (!isFormCollapsed) {
            isFormCollapsed = true;
            formSection.classList.add('collapsed');
            updateFormHeaderIcon();
        }
    }
}

function initFormToggle() {
    const formSection = document.querySelector('.form-section');
    isFormCollapsed = true;
    formSection.classList.add('collapsed');
    formSection.classList.add('mode-add');
    document.getElementById('formHeaderTitle').textContent = '회원 등록';
    
    updateFormHeaderIcon();
    updateFormHeaderBadge();
    
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        formSection.classList.add('no-permission');
    }
}

// ========== 성별 관련 함수 ==========
function getSelectedGender() {
    const activeBtn = document.querySelector('.gender-btn.active');
    return activeBtn ? activeBtn.dataset.value : '';
}

function setSelectedGender(gender) {
    document.querySelectorAll('.gender-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === gender);
    });
}

// ========== 수상경력 관련 함수 ==========
function addAward() {
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    const awardInput = document.getElementById('awardInput');
    const awardText = awardInput.value.trim();
    
    if (!awardText) {
        showAlert('수상경력을 입력해주세요!');
        return;
    }
    
    currentAwards.push(awardText);
    renderAwardsList();
    awardInput.value = '';
    awardInput.focus();
}

function deleteAward(index) {
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    currentAwards.splice(index, 1);
    renderAwardsList();
}

function renderAwardsList() {
    const container = document.getElementById('awardsList');
    
    if (currentAwards.length === 0) {
        container.innerHTML = '<div style="font-size:13px; color:#999; padding:8px 0; text-align:center;">수상경력이 없습니다</div>';
        return;
    }
    
    container.innerHTML = currentAwards.map((award, index) => `
        <div class="award-list-item">
            <div class="award-text">🏆 ${award}</div>
            <button class="award-delete-btn" onclick="deleteAward(${index})">×</button>
        </div>
    `).join('');
}

function setAwardsList(awards) {
    currentAwards = awards || [];
    renderAwardsList();
}

// ========== 회비 입금 내역 관리 ==========
function addPaymentEntry() {
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    const dateInput = document.getElementById('paymentDate');
    const amountInput = document.getElementById('paymentAmount');
    const date = dateInput.value;
    const amount = amountInput.value ? parseInt(amountInput.value) : null;

    if (!date) {
        showAlert('입금날을 입력해주세요!');
        return;
    }
    if (!amount || amount <= 0) {
        showAlert('입금금액을 올바르게 입력해주세요!');
        return;
    }

    currentPaymentList.push({ date: date, amount: amount });
    renderPaymentList(currentPaymentList);

    dateInput.value = new Date().toISOString().split('T')[0];
    const currentFee = (currentEditIndex !== null && members[currentEditIndex]) ? members[currentEditIndex].fee : null;
    amountInput.value = currentFee !== null && currentFee !== undefined ? currentFee : '';
}

function deletePaymentEntry(index) {
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    currentPaymentList.splice(index, 1);
    renderPaymentList(currentPaymentList);
}

function renderPaymentList(list) {
    currentPaymentList = list;
    const container = document.getElementById('paymentList');

    if (!list || list.length === 0) {
        container.innerHTML = '<div style="font-size:13px; color:#999; padding:8px 0; text-align:center;">입금 내역이 없습니다</div>';
        return;
    }

    const sorted = list.map((item, idx) => ({ ...item, originalIndex: idx }))
        .sort((a, b) => b.date.localeCompare(a.date));

    container.innerHTML = sorted.map(item => `
        <div class="payment-list-item">
            <div class="payment-info">
                <span class="payment-date">${formatDate(item.date)}</span>
                <span class="payment-amount">${formatNumber(item.amount)}원</span>
            </div>
            <button class="payment-delete-btn" onclick="deletePaymentEntry(${item.originalIndex})">×</button>
        </div>
    `).join('');
}

// ========== 안전한 숫자 변환 ==========
function safeParseInt(value) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? null : parsed;
}

// ========== 회원 추가 ==========
function addMember() {
    if (!hasEditPermission() && !settings.allowGuestRegistration) {
        showAlert('회원 추가 권한이 없습니다. 로그인해주세요!');
        openLoginModal();
        return;
    }
    
    if (!openFormSection(false)) {
        return;
    }
    
    const name = document.getElementById('name').value.trim();
    if (!name) {
        showAlert('이름을 입력해주세요!');
        document.getElementById('name').focus();
        return;
    }

    const phone = document.getElementById('phone').value.trim();
    const registerDate = document.getElementById('registerDate').value;
    const feeValue = document.getElementById('fee').value;
    const fee = safeParseInt(feeValue);
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    let coach = getSelectedCoach();
    
    if (currentUser.role === USER_ROLES.SUB_ADMIN) {
        const myCoachName = (currentUser.username || '').trim();
        if (myCoachName && settings.coaches.includes(myCoachName)) {
            coach = myCoachName;
            setSelectedCoach(coach);
        }
    }
    
    const gender = getSelectedGender();
    const birthYear = document.getElementById('birthYear').value ? parseInt(document.getElementById('birthYear').value) : null;
    const skillLevel = document.getElementById('skillLevel').value ? parseInt(document.getElementById('skillLevel').value) : null;
    const etc = document.getElementById('etc').value.trim();
    const privateMemo = document.getElementById('privateMemo').value.trim();
    const awards = [...currentAwards];

    const currentCountInput = document.getElementById('currentCount').value;
    const currentCount = currentCountInput === "" ? 0 : parseInt(currentCountInput) || 0;
    
    const targetCountInput = document.getElementById('targetCount').value;
    const targetCount = targetCountInput === "" ? 0 : parseInt(targetCountInput) || 0;

    const schedulesData = getSchedulesData();
    const currentScheduleStatus = scheduleStatus;
    
    if (currentScheduleStatus === 'regular' && schedulesData.length > 0 && coach) {
        const conflict = checkScheduleConflicts(schedulesData, coach);
        if (conflict.conflict) {
            showAlert(`코치 [${coach}] 시간 충돌!\n${conflict.memberName} 회원이 이미 ${conflict.existingTime}에 등록되어 있습니다.`);
            return;
        }
    }
    
    const validSchedules = currentScheduleStatus === 'regular' 
        ? schedulesData.filter(s => s.day && s.startTime && s.endTime)
        : [];
    
    if (currentScheduleStatus === 'regular') {
        for (let i = 0; i < validSchedules.length; i++) {
            const schedule = validSchedules[i];
            if (schedule.startTime >= schedule.endTime) {
                showAlert(`스케줄 ${i + 1}의 종료시간은 시작시간보다 커야 합니다!`);
                return;
            }
        }
    }

    // ★ 저장 전 전화번호 하이픈 포맷 적용
    const formattedPhone = formatPhoneNumber(phone);

    const member = {
        name,
        phone: formattedPhone,
        email,
        address,
        registerDate: registerDate || new Date().toISOString().split('T')[0],
        fee: fee,
        coach: coach,
        gender: gender || '',
        birthYear: birthYear,
        skillLevel: skillLevel,
        targetCount: targetCount,
        currentCount: currentCount,
        scheduleStatus: currentScheduleStatus,
        schedules: validSchedules,
        awards: awards,
        etc: etc,
        privateMemo: privateMemo,
        photo: currentPhotoPath || '',
        attendanceDates: [],
        attendanceHistory: [],
        paymentHistory: []
    };

    members.push(member);
    saveToFirebase();
    filteredMembers = [...members];
    renderMembers();
    renderSchedule();

	if (member.phone) {
		const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		if (isMobile) {
			saveVCard(member.name, member.phone);
			setTimeout(() => {
				showAlert('📇 다운로드된 파일을 열어서\n"연락처 추가"를 눌러주세요!');
			}, 800);
		}
	}

    if (member.phone) {
        showConfirm(
            `${member.name} 회원님께 환영 문자를 발송하시겠습니까?`,
            function() {
                sendWelcomeSMS(member.name, member.phone);
            }
        );
    }
    
    clearForm();
    
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    setTimeout(() => {
        showAlert('회원이 추가되었습니다!');
    }, 100);
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.classList.remove('form-edit-mode');
    }
    
    setTimeout(() => {
        closeFormSection();
    }, 500);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 회원 수정 ==========
function updateMember() {
    if (currentEditIndex === null) {
        showAlert('수정할 회원을 선택해주세요!');
        return;
    }
    if (!canEditMemberByIndex(currentEditIndex)) {
        showAlert('이 회원을 수정할 권한이 없습니다.');
        return;
    }

    const name = document.getElementById('name').value.trim();
    if (!name) {
        showAlert('이름을 입력해주세요!');
        document.getElementById('name').focus();
        return;
    }

    const phone = document.getElementById('phone').value.trim();
    const registerDate = document.getElementById('registerDate').value;
    const feeValue = document.getElementById('fee').value;
    const fee = safeParseInt(feeValue);
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    let coach = getSelectedCoach();
    
    if (currentUser.role === USER_ROLES.SUB_ADMIN) {
        coach = currentUser.username || coach;
    }
    
    const gender = getSelectedGender();
    const birthYear = document.getElementById('birthYear').value ? parseInt(document.getElementById('birthYear').value) : null;
    const skillLevel = document.getElementById('skillLevel').value ? parseInt(document.getElementById('skillLevel').value) : null;
    const etc = document.getElementById('etc').value.trim();
    const privateMemo = document.getElementById('privateMemo').value.trim();
    const awards = [...currentAwards];

    const currentCountInput = document.getElementById('currentCount').value;
    const currentCount = currentCountInput === "" ? 
                       members[currentEditIndex].currentCount || 0 : 
                       parseInt(currentCountInput) || 0;
    
    const targetCountInput = document.getElementById('targetCount').value;
    const targetCount = targetCountInput === "" ? 
                       members[currentEditIndex].targetCount || 0 : 
                       parseInt(targetCountInput) || 0;

    const schedulesData = getSchedulesData();
    const currentScheduleStatus = scheduleStatus;
    
    if (currentScheduleStatus === 'regular' && schedulesData.length > 0 && coach) {
        const conflict = checkScheduleConflicts(schedulesData, coach, currentEditIndex);
        if (conflict.conflict) {
            showAlert(`코치 [${coach}] 시간 충돌!\n${conflict.memberName} 회원이 이미 ${conflict.existingTime}에 등록되어 있습니다.`);
            return;
        }
    }
    
    const validSchedules = currentScheduleStatus === 'regular'
        ? schedulesData.filter(s => s.day && s.startTime && s.endTime)
        : [];
    
    if (currentScheduleStatus === 'regular') {
        for (let i = 0; i < validSchedules.length; i++) {
            const schedule = validSchedules[i];
            if (schedule.startTime >= schedule.endTime) {
                showAlert(`스케줄 ${i + 1}의 종료시간은 시작시간보다 커야 합니다!`);
                return;
            }
        }
    }

    const existingHistory = members[currentEditIndex].attendanceHistory || [];
    const paymentHistory = currentPaymentList || [];

    let newPhoto = '';
    if (isPhotoRemoved) {
        newPhoto = '';
        // 저장 확정 시점에 실제 파일 삭제
        if (window._pendingDeletePhotoPath) {
            deleteImageFromServer(window._pendingDeletePhotoPath);
            window._pendingDeletePhotoPath = null;
        }
    } else if (currentPhotoPath !== null) {
        newPhoto = currentPhotoPath;
    } else {
        newPhoto = members[currentEditIndex].photo || '';
    }

    // ★ 저장 전 전화번호 하이픈 포맷 적용
    const formattedPhone = formatPhoneNumber(phone);

    members[currentEditIndex] = {
        ...members[currentEditIndex],
        name,
        phone: formattedPhone,
        email,
        address,
        registerDate: registerDate || members[currentEditIndex].registerDate,
        fee: fee,
        coach: coach,
        gender: gender || '',
        birthYear: birthYear,
        skillLevel: skillLevel,
        targetCount: targetCount,
        currentCount: currentCount,
        scheduleStatus: currentScheduleStatus,
        schedules: validSchedules,
        awards: awards,
        etc: etc,
        privateMemo: privateMemo,
        photo: newPhoto,
        attendanceDates: members[currentEditIndex].attendanceDates || [],
        attendanceHistory: existingHistory,
        paymentHistory: paymentHistory
    };

    saveToFirebase();
    filteredMembers = [...members];
    renderMembers();
    renderSchedule();
    clearForm();
    
    if (document.activeElement) {
        document.activeElement.blur();
    }
    
    setTimeout(() => {
        showAlert('회원 정보가 수정되었습니다!');
    }, 100);
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.classList.remove('form-edit-mode');
    }
    
    setTimeout(() => {
        closeFormSection();
    }, 500);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    isPhotoRemoved = false;
}

// ========== 회원 편집 폼 채우기 ==========
function editMember(index) {
    const member = members[index];
    if (!canEditMember(member)) {
        showAlert('이 회원을 수정할 권한이 없습니다.');
        return;
    }
    
    if (!openFormSection(true)) {
        return;
    }
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.classList.add('form-edit-mode');
    }
    
    document.getElementById('name').value = member.name;
    // ★ 전화번호 하이픈 자동 적용
    document.getElementById('phone').value = formatPhoneNumber(member.phone || '');
    document.getElementById('registerDate').value = member.registerDate || '';
    document.getElementById('fee').value = member.fee !== null && member.fee !== undefined ? member.fee : '';
    document.getElementById('email').value = member.email || '';
    document.getElementById('address').value = member.address || '';
    
    const currentCountInput = document.getElementById("currentCount");
    currentCountInput.value = member.currentCount || 0;
    
    if (canEditMember(member)) {
        currentCountInput.removeAttribute('readonly');
        currentCountInput.style.background = '#ffffff';
    } else {
        currentCountInput.setAttribute('readonly', true);
        currentCountInput.style.background = '#f0f0f0';
    }
    
    document.getElementById("targetCount").value = member.targetCount || 0;

    setSelectedCoach(member.coach || '');
    setSelectedGender(member.gender || '');
    document.getElementById('birthYear').value = member.birthYear || '';
    document.getElementById('skillLevel').value = member.skillLevel !== null && member.skillLevel !== undefined ? member.skillLevel : '';
    document.getElementById('etc').value = member.etc || '';
    
    const privateMemoSection = document.getElementById('privateMemoSection');
    const privateMemoInput = document.getElementById('privateMemo');
    if (canEditMember(member)) {
        privateMemoSection.style.display = 'block';
        privateMemoInput.value = member.privateMemo || '';
    } else {
        privateMemoSection.style.display = 'none';
        privateMemoInput.value = '';
    }
    
    setAwardsList(member.awards || []);

    const memberScheduleStatus = member.scheduleStatus || 
                                (member.schedules && member.schedules.length > 0 ? 'regular' : 'none');
    
    setSchedulesData(member.schedules);
    
    setTimeout(() => {
        if (scheduleStatus !== memberScheduleStatus) {
            setScheduleStatus(memberScheduleStatus);
        }
    }, 50);

    document.getElementById('paymentSection').style.display = 'block';
    renderPaymentList(member.paymentHistory || []);
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentAmount').value = member.fee !== null && member.fee !== undefined ? member.fee : '';

    if (member.photo) {
        const photo = member.photo;
        if (photo.startsWith('/etc/images/')) {
            // 서버에 저장된 파일 경로
            currentPhotoPath = photo;
            currentPhotoData = null;
        } else {
            // 레거시 Base64
            currentPhotoData = photo;
            currentPhotoPath = null;
        }
        displayPhotoPreview();
    } else {
        currentPhotoData = null;
        currentPhotoPath = null;
        displayPhotoPreview();
    }

    isPhotoRemoved = false;
    currentEditIndex = index;
    
    setTimeout(() => {
        const nameInput = document.getElementById('name');
        if (nameInput) {
            nameInput.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setTimeout(() => {
                nameInput.setAttribute('readonly', 'readonly');
                nameInput.focus();
                nameInput.select();
                setTimeout(() => {
                    nameInput.removeAttribute('readonly');
                }, 100);
            }, 300);
        }
    }, 100);
}

// ========== 폼 초기화 ==========
function clearForm() {
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('registerDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('fee').value = '';
    document.getElementById('email').value = '';
    document.getElementById('address').value = '';
    document.getElementById("targetCount").value = "0";
    
    const currentCountInput = document.getElementById("currentCount");
    currentCountInput.value = "0";
    if (hasEditPermission()) {
        currentCountInput.removeAttribute('readonly');
        currentCountInput.style.background = '#ffffff';
    } else {
        currentCountInput.setAttribute('readonly', true);
        currentCountInput.style.background = '#f0f0f0';
    }

    setSelectedCoach('');
    setSelectedGender('');
    document.getElementById('birthYear').value = '';
    document.getElementById('skillLevel').value = '';
    document.getElementById('etc').value = '';
    
    const privateMemoSection = document.getElementById('privateMemoSection');
    const privateMemoInput = document.getElementById('privateMemo');
    if (hasEditPermission()) {
        privateMemoSection.style.display = 'block';
        privateMemoInput.value = '';
    } else {
        privateMemoSection.style.display = 'none';
        privateMemoInput.value = '';
    }
    
    currentAwards = [];
    renderAwardsList();
    resetSchedules();

    document.getElementById('paymentSection').style.display = 'none';
    document.getElementById('paymentDate').value = '';
    document.getElementById('paymentAmount').value = '';
    currentPaymentList = [];
    document.getElementById('paymentList').innerHTML = '';

    currentPhotoData = null;
    currentPhotoPath = null;
    isPhotoRemoved = false;
    window._pendingDeletePhotoPath = null;  // 취소 시 파일 삭제 보류 해제
    displayPhotoPreview();
    document.getElementById('photoInput').value = '';
    
    currentEditIndex = null;
    
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.classList.remove('form-edit-mode');
        formSection.classList.remove('mode-edit');
        formSection.classList.add('mode-add');
        document.getElementById('formHeaderTitle').textContent = '회원 등록';
    }
    
    const nameInput = document.getElementById('name');
    if (nameInput) {
        nameInput.focus();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========== 스케줄 충돌 체크 ==========
function checkScheduleConflicts(schedulesData, coach, excludeIndex = null) {
    if (!coach) return { conflict: false };

    for (let i = 0; i < members.length; i++) {
        if (excludeIndex !== null && i === excludeIndex) continue;

        const member = members[i];
        if (member.coach !== coach) continue;
        
        const memberScheduleStatus = member.scheduleStatus || 
                                    (member.schedules && member.schedules.length > 0 ? 'regular' : 'none');
        if (memberScheduleStatus !== 'regular') continue;

        const memberSchedules = member.schedules || [];

        for (const newSchedule of schedulesData) {
            for (const existingSchedule of memberSchedules) {
                if (newSchedule.day === existingSchedule.day) {
                    if (timesOverlap(
                        newSchedule.startTime,
                        newSchedule.endTime,
                        existingSchedule.startTime,
                        existingSchedule.endTime
                    )) {
                        return {
                            conflict: true,
                            memberName: member.name,
                            existingTime: `${dayNames[existingSchedule.day]} ${existingSchedule.startTime}~${existingSchedule.endTime}`
                        };
                    }
                }
            }
        }
    }
    return { conflict: false };
}

function timesOverlap(s1, e1, s2, e2) {
    return (s1 >= s2 && s1 < e2) ||
           (e1 > s2 && e1 <= e2) ||
           (s1 <= s2 && e1 >= e2);
}