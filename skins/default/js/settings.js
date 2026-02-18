function openSettings() {
    console.log('🔧 openSettings 호출됨');
    console.log('현재 사용자:', currentUser);
    console.log('hasSettingsPermission():', hasSettingsPermission());
    
    // 관리자만 접근 가능
    if (!hasSettingsPermission()) {
        console.warn('⚠️ 설정 접근 거부 - 관리자 권한 없음');
        showAlert('설정 메뉴는 관리자만 접근 가능합니다!');
        return;
    }
    
    console.log('✅ 설정 접근 허용 - openSettingsDialog 호출');
    openSettingsDialog();
}

function openSettingsDialog() {
    console.log('🔧 설정 모달 열기 - 현재 사용자:', currentUser);
    
    document.getElementById('clubNameInput').value = settings.clubName || '';
    document.getElementById('feePreset1').value = settings.feePresets[0] || '';
    document.getElementById('feePreset2').value = settings.feePresets[1] || '';
    document.getElementById('feePreset3').value = settings.feePresets[2] || '';
    document.getElementById('feePreset4').value = settings.feePresets[3] || '';
    document.getElementById('feePreset5').value = settings.feePresets[4] || '';

    document.getElementById('coachName1').value = settings.coaches[0] || '';
    document.getElementById('coachName2').value = settings.coaches[1] || '';
    document.getElementById('coachName3').value = settings.coaches[2] || '';
    document.getElementById('coachName4').value = settings.coaches[3] || '';
    
    // 계좌번호 설정
    if (settings.bankAccount) {
        document.getElementById('bankName').value = settings.bankAccount.bank || '';
        document.getElementById('accountNumber').value = settings.bankAccount.accountNumber || '';
    }
    
    // 비로그인 회원 등록 허용 설정
    const allowGuestCheckbox = document.getElementById('allowGuestRegistration');
    if (allowGuestCheckbox) {
        allowGuestCheckbox.checked = settings.allowGuestRegistration || false;
    }
    
    // 회원 기본정보 팝업 표시 설정
    const showDetailsCheckbox = document.getElementById('showMemberDetails');
    if (showDetailsCheckbox) {
        showDetailsCheckbox.checked = settings.showMemberDetails !== false; // 기본값 true
    }

    // 전체 색상 테마 설정
    const themeColorSelect = document.getElementById('themeColorSelect');
    if (themeColorSelect) {
        themeColorSelect.value = settings.themeColor || 'default';
    }

    // 관리자/부관리자 목록 로드 및 표시
    loadAdminsList();

    document.getElementById('settingsModal').classList.add('active');
    console.log('✅ 설정 모달 표시 완료');
}

// 관리자/부관리자 목록 로드
async function loadAdminsList() {
    try {
        const result = await SettingsAPI.getAdmins();
        renderAdminsList(result.admins || []);
    } catch (error) {
        console.error('❌ 관리자 목록 로드 실패:', error);
    }
}

// 관리자/부관리자 목록 렌더링
// convertToUsername 함수는 login.js에 정의되어 있음
function renderAdminsList(adminsData) {
    const adminListContainer = document.getElementById('adminAccountsList');
    if (!adminListContainer) {
        console.error('❌ adminAccountsList 요소를 찾을 수 없습니다');
        return;
    }
    
    adminListContainer.innerHTML = '';
    
    if (!adminsData) {
        adminListContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">등록된 관리자가 없습니다</div>';
        return;
    }
    
    const admins = [];
    const subAdmins = [];
        const escapeAttr = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

	// 역할별로 분류
    adminsData.forEach(admin => {
        const adminId = String(admin.id);
        const email = admin.email || 'Unknown';
        const username = admin.username || (typeof convertToUsername === 'function' ? convertToUsername(email) : email);
        
        const item = {
            uid: adminId,
            email: email,
            username: username,
            role: admin.role || 'unknown'
        };
        
        if (admin.role === 'admin') {
            admins.push(item);
        } else if (admin.role === 'sub_admin') {
            subAdmins.push(item);
        }
    });
    
    // 관리자 섹션
    if (admins.length > 0) {
        adminListContainer.innerHTML += '<div style="margin-bottom: 10px;">' +
            '<h4 style="color: #FF9800; margin-bottom: 5px;">👑 관리자</h4>';
        
        admins.forEach(admin => {
            const isCurrentUser = admin.uid === currentUser.id;
            const usernameAttr = escapeAttr(admin.username);
            const actionButtons = '<div style="display: flex; gap: 6px; align-items: center;">' +
                '<button onclick="openEditAdminModalFromButton(this)" data-uid="' + admin.uid + '" data-username="' + usernameAttr + '" style="padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer;">수정</button>' +
                (isCurrentUser
                    ? '<span style="color: #999; font-size: 12px;">(현재 로그인)</span>'
                    : '<button onclick="removeAdmin(\'' + admin.uid + '\')" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">삭제</button>') +
            '</div>';
            
            adminListContainer.innerHTML += '<div style="display: flex; gap: 10px; margin-bottom: 10px; padding: 10px; background: #fff3e0; border-radius: 8px; align-items: center;">' +
                '<div style="flex: 1;">' +
                    '<div style="font-weight: 600; color: #FF9800;">👤 ' + admin.username + '</div>' +
                    '<div style="font-size: 12px; color: #666;">UID: ' + admin.uid.substring(0, 8) + '...</div>' +
                '</div>' +
                actionButtons +
            '</div>';
        });
        
        adminListContainer.innerHTML += '</div>';
    }
    
    // 부관리자 섹션
    if (subAdmins.length > 0) {
        adminListContainer.innerHTML += '<div style="margin-bottom: 10px;">' +
            '<h4 style="color: #2196F3; margin-bottom: 5px;">🔰 부관리자</h4>';
        
        subAdmins.forEach(admin => {
            const usernameAttr = escapeAttr(admin.username);
            adminListContainer.innerHTML += '<div style="display: flex; gap: 10px; margin-bottom: 10px; padding: 10px; background: #e3f2fd; border-radius: 8px; align-items: center;">' +
                '<div style="flex: 1;">' +
                    '<div style="font-weight: 600; color: #2196F3;">👤 ' + admin.username + '</div>' +
                    '<div style="font-size: 12px; color: #666;">UID: ' + admin.uid.substring(0, 8) + '...</div>' +
                '</div>' +
                '<div style="display: flex; gap: 6px;">' +
                    '<button onclick="openEditAdminModalFromButton(this)" data-uid="' + admin.uid + '" data-username="' + usernameAttr + '" style="padding: 6px 12px; background: #2196F3; color: white; border: none; border-radius: 6px; cursor: pointer;">수정</button>' +
                    '<button onclick="removeAdmin(\'' + admin.uid + '\')" style="padding: 6px 12px; background: #f44336; color: white; border: none; border-radius: 6px; cursor: pointer;">삭제</button>' +
                '</div>' +
            '</div>';
        });
        
        adminListContainer.innerHTML += '</div>';
    }
    
    if (admins.length === 0 && subAdmins.length === 0) {
        adminListContainer.innerHTML = '<div style="padding: 10px; text-align: center; color: #999;">등록된 관리자가 없습니다</div>';
    }
}

// 새 관리자 추가 모달 열기
function openAddAdminModal() {
    const modal = document.createElement('div');
    modal.id = 'addAdminModal';
    modal.className = 'modal active';
    modal.style.zIndex = '10005';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>➕ 새 관리자 계정 생성</h2>
                <button class="close-btn" onclick="closeAddAdminModal()">×</button>
            </div>
            <div style="padding: 20px 0;">
                <div class="form-group">
                    <label for="newAdminUsername">아이디</label>
                    <input type="text" id="newAdminUsername" placeholder="admin, coach1 등" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">※ 간단한 아이디를 입력하세요 (이메일 형식 불필요)</div>
                </div>
                <div class="form-group" style="margin-top: 15px;">
                    <label for="newAdminPassword">비밀번호</label>
                    <input type="password" id="newAdminPassword" placeholder="6자 이상 입력" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">※ 최소 6자 이상이어야 합니다</div>
                </div>
                <div class="form-group" style="margin-top: 15px;">
                    <label>역할</label>
                    <div style="display: flex; gap: 10px; margin-top: 8px;">
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="newAdminRole" value="admin" checked>
                            <span>👑 관리자</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 5px; cursor: pointer;">
                            <input type="radio" name="newAdminRole" value="sub_admin">
                            <span>🔰 부관리자</span>
                        </label>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 8px;">
                        • 관리자: 모든 권한 (설정 변경 가능)<br>
                        • 부관리자: 회원 관리 및 레슨 체크 가능
                    </div>
                </div>
            </div>
            <div class="modal-buttons">
                <button style="background: #2196F3;" onclick="createNewAdmin()">계정 생성</button>
                <button style="background: #9E9E9E;" onclick="closeAddAdminModal()">취소</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeAddAdminModal() {
    const modal = document.getElementById('addAdminModal');
    if (modal) {
        modal.remove();
    }
}

function openEditAdminModalFromButton(button) {
    if (!button) {
        return;
    }

    openEditAdminModal(button.dataset.uid, button.dataset.username || '');
}

function openEditAdminModal(uid, username) {
    const modal = document.createElement('div');
    modal.id = 'editAdminModal';
    modal.className = 'modal active';
    modal.style.zIndex = '10006';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h2>✏️ 관리자 계정 수정</h2>
                <button class="close-btn" onclick="closeEditAdminModal()">×</button>
            </div>
            <div style="padding: 20px 0;">
                <input type="hidden" id="editAdminId" value="${uid}">
                <div class="form-group">
                    <label for="editAdminUsername">아이디</label>
                    <input type="text" id="editAdminUsername" value="${username}" placeholder="admin, coach1 등" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                </div>
                <div class="form-group" style="margin-top: 15px;">
                    <label for="editAdminPassword">새 비밀번호 (선택)</label>
                    <input type="password" id="editAdminPassword" placeholder="변경 시 6자 이상 입력" style="width: 100%; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;">
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">※ 비워두면 기존 비밀번호를 유지합니다</div>
                </div>
            </div>
            <div class="modal-buttons">
                <button style="background: #2196F3;" onclick="updateAdminAccount()">수정 저장</button>
                <button style="background: #9E9E9E;" onclick="closeEditAdminModal()">취소</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeEditAdminModal() {
    const modal = document.getElementById('editAdminModal');
    if (modal) {
        modal.remove();
    }
}

async function updateAdminAccount() {
    const adminId = document.getElementById('editAdminId').value;
    const username = document.getElementById('editAdminUsername').value.trim();
    const password = document.getElementById('editAdminPassword').value;

    if (!username) {
        showAlert('아이디를 입력해주세요!');
        return;
    }

    if (password && password.length < 6) {
        showAlert('비밀번호는 최소 6자 이상이어야 합니다!');
        return;
    }

    try {
        await SettingsAPI.updateAdmin(adminId, username, password);
        closeEditAdminModal();
        await loadAdminsList();

        if (currentUser && String(currentUser.id) === String(adminId)) {
            currentUser.username = username;
        }

        showAlert('관리자 계정 정보가 수정되었습니다.');
    } catch (error) {
        console.error('❌ 관리자 계정 수정 실패:', error);
        showAlert(error.message || '계정 수정에 실패했습니다.');
    }
}

// 새 관리자 계정 생성
// convertToInternalEmail 함수는 login.js에 정의되어 있음
async function createNewAdmin() {
    const usernameInput = document.getElementById('newAdminUsername').value.trim();
    const password = document.getElementById('newAdminPassword').value;
    const role = document.querySelector('input[name="newAdminRole"]:checked').value;
    
    if (!usernameInput || !password) {
        showAlert('아이디와 비밀번호를 입력해주세요!');
        return;
    }
    
    if (password.length < 6) {
        showAlert('비밀번호는 최소 6자 이상이어야 합니다!');
        return;
    }
    
    console.log('🔧 새 관리자 계정 생성 시작');
    console.log('  - 입력된 아이디:', usernameInput);
    console.log('  - 역할:', role);

    try {
        await SettingsAPI.createAdmin(usernameInput, password, role);
        closeAddAdminModal();
        await loadAdminsList();
        const roleText = role === 'admin' ? '관리자' : '부관리자';
        showAlert('새 ' + roleText + ' 계정이 생성되었습니다!\n\n아이디: ' + usernameInput + '\n\n해당 계정으로 로그인할 수 있습니다.');
    } catch (error) {
        console.error('❌ 계정 생성 실패:', error);
        showAlert(error.message || '계정 생성에 실패했습니다.');
    }
}

// 관리자 삭제
function removeAdmin(uid) {
    // 현재 로그인한 사용자는 삭제 불가
    if (uid === currentUser.id) {
        showAlert('현재 로그인한 계정은 삭제할 수 없습니다!');
        return;
    }
    
    // showConfirm 함수가 존재하는지 확인
    if (typeof window.showConfirm === 'function') {
        window.showConfirm(
            '이 관리자 계정을 삭제하시겠습니까?',
            async function() {
                try {
                    await SettingsAPI.deleteAdmin(uid);
                    console.log('✅ 관리자 삭제 완료:', uid);
                    await loadAdminsList();
                    showAlert('관리자 계정이 삭제되었습니다.');
                } catch (error) {
                    console.error('❌ 관리자 삭제 실패:', error);
                    showAlert('삭제에 실패했습니다: ' + error.message);
                }
            }
        );
    } else {
        // 기본 confirm 사용
        if (confirm('이 관리자 계정을 삭제하시겠습니까?')) {
            (async function() {
                try {
                    await SettingsAPI.deleteAdmin(uid);
                    console.log('✅ 관리자 삭제 완료:', uid);
                    await loadAdminsList();
                    showAlert('관리자 계정이 삭제되었습니다.');
                } catch (error) {
                    console.error('❌ 관리자 삭제 실패:', error);
                    showAlert('삭제에 실패했습니다: ' + error.message);
                }
            })();
        }
    }
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('active');
}

async function saveSettings() {
    settings.clubName = document.getElementById('clubNameInput').value.trim();

    settings.coaches = [
        document.getElementById('coachName1').value.trim(),
        document.getElementById('coachName2').value.trim(),
        document.getElementById('coachName3').value.trim(),
        document.getElementById('coachName4').value.trim()
    ];

    settings.feePresets = [
        parseInt(document.getElementById('feePreset1').value) || 0,
        parseInt(document.getElementById('feePreset2').value) || 0,
        parseInt(document.getElementById('feePreset3').value) || 0,
        parseInt(document.getElementById('feePreset4').value) || 0,
        parseInt(document.getElementById('feePreset5').value) || 0
    ];
    
    // 계좌번호 설정 저장
    settings.bankAccount = {
        bank: document.getElementById('bankName').value.trim() || '',
        accountNumber: document.getElementById('accountNumber').value.trim() || ''
    };
    
    // 비로그인 회원 등록 허용 설정
    const allowGuestCheckbox = document.getElementById('allowGuestRegistration');
    settings.allowGuestRegistration = allowGuestCheckbox ? allowGuestCheckbox.checked : false;
    
    // 회원 기본정보 팝업 표시 설정
    const showDetailsCheckbox = document.getElementById('showMemberDetails');
    settings.showMemberDetails = showDetailsCheckbox ? showDetailsCheckbox.checked : true;

    // 전체 색상 테마 설정
    const themeColorSelect = document.getElementById('themeColorSelect');
    settings.themeColor = themeColorSelect ? themeColorSelect.value : 'default';
    if (typeof applyThemeColor === 'function') {
        applyThemeColor(settings.themeColor);
    }

    try {
        await SettingsAPI.update(settings);
        if (settings.clubName) {
            document.getElementById('clubNameDisplay').textContent = settings.clubName;
        }
        updateFeePresetButtons();
        renderCoachButtons();
        closeSettings();
        showAlert('설정이 저장되었습니다!');
    } catch (error) {
        showAlert('설정 저장에 실패했습니다: ' + error.message);
    }
}

// 데이터 엑셀 내보내기
function exportData() {
    if (members.length === 0) {
        showAlert('내보낼 회원 데이터가 없습니다!');
        return;
    }
    
    try {
        const membersData = members.map(member => {
            const scheduleData = [];
            
            if (member.schedules && member.schedules.length > 0) {
                for (let i = 0; i < 7; i++) {
                    if (i < member.schedules.length) {
                        const schedule = member.schedules[i];
                        scheduleData.push(
                            schedule.day || '',
                            schedule.startTime || '',
                            schedule.endTime || ''
                        );
                    } else {
                        scheduleData.push('', '', '');
                    }
                }
            } else {
                for (let i = 0; i < 21; i++) {
                    scheduleData.push('');
                }
            }
            
            return [
                member.name || '',
                member.phone || '',
                member.email || '',
                member.address || '',
                member.registerDate || '',
                member.fee || '',
                member.coach || '',
                member.targetCount || 0,
                member.currentCount || 0,
                ...scheduleData,
                member.gender || '',
                member.birthYear || '',
                member.skillLevel !== undefined && member.skillLevel !== null ? 
                    (member.skillLevel === -1 ? '희망' : 
                     member.skillLevel === 0 ? '0부' : 
                     `${member.skillLevel}부`) : '',
                member.awards ? member.awards.join('; ') : '',
                member.etc || ''
            ];
        });
        
        const headers = [
            '이름', '전화번호', '이메일', '주소', '등록일(YYYY-MM-DD)', 
            '월회비', '담당코치', '스케줄목표횟수', '현재스케줄횟수',
            '스케줄1_요일', '스케줄1_시작시간', '스케줄1_종료시간',
            '스케줄2_요일', '스케줄2_시작시간', '스케줄2_종료시간',
            '스케줄3_요일', '스케줄3_시작시간', '스케줄3_종료시간',
            '스케줄4_요일', '스케줄4_시작시간', '스케줄4_종료시간',
            '스케줄5_요일', '스케줄5_시작시간', '스케줄5_종료시간',
            '스케줄6_요일', '스케줄6_시작시간', '스케줄6_종료시간',
            '스케줄7_요일', '스케줄7_시작시간', '스케줄7_종료시간',
            '성별', '생년', '부수', '수상경력', '기타'
        ];
        
        const wsData = [headers, ...membersData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        const wscols = [
            {wch: 10}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 12},
            {wch: 10}, {wch: 10}, {wch: 12}, {wch: 12},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 8}, {wch: 8}, {wch: 12}, {wch: 30}, {wch: 30}
        ];
        ws['!cols'] = wscols;
        
        const settingsData = [
            ['구장명', settings.clubName || ''],
            ['코치1', settings.coaches[0] || ''],
            ['코치2', settings.coaches[1] || ''],
            ['코치3', settings.coaches[2] || ''],
            ['코치4', settings.coaches[3] || ''],
            ['월회비 기본값1', settings.feePresets[0] || 0],
            ['월회비 기본값2', settings.feePresets[1] || 0],
            ['월회비 기본값3', settings.feePresets[2] || 0],
            ['월회비 기본값4', settings.feePresets[3] || 0],
            ['월회비 기본값5', settings.feePresets[4] || 0],
            ['은행명', settings.bankAccount?.bank || ''],
            ['계좌번호', settings.bankAccount?.accountNumber || ''],
            ['비로그인 회원 등록 허용', settings.allowGuestRegistration ? '예' : '아니오'],
            ['회원 기본정보 팝업 표시', settings.showMemberDetails ? '예' : '아니오']
        ];
        
        const wsSettings = XLSX.utils.aoa_to_sheet(settingsData);
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "회원데이터");
        XLSX.utils.book_append_sheet(wb, wsSettings, "설정");
        
        const clubName = settings.clubName ? `_${settings.clubName}` : '';
        const fileName = `회원관리_데이터${clubName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
        showAlert(`${members.length}명의 회원 데이터를 엑셀 파일로 내보냈습니다!`);
        
    } catch (error) {
        console.error('엑셀 내보내기 오류:', error);
        showAlert(`엑셀 내보내기 중 오류가 발생했습니다: ${error.message}`);
    }
}

// 엑셀 템플릿 다운로드
function downloadTemplate() {
    try {
        const templateData = [
            [
                '이름', '전화번호', '이메일', '주소', '등록일(YYYY-MM-DD)', '월회비', '담당코치', '스케줄목표횟수', '현재스케줄횟수',
                '스케줄1_요일', '스케줄1_시작시간', '스케줄1_종료시간',
                '스케줄2_요일', '스케줄2_시작시간', '스케줄2_종료시간',
                '스케줄3_요일', '스케줄3_시작시간', '스케줄3_종료시간',
                '스케줄4_요일', '스케줄4_시작시간', '스케줄4_종료시간',
                '스케줄5_요일', '스케줄5_시작시간', '스케줄5_종료시간',
                '스케줄6_요일', '스케줄6_시작시간', '스케줄6_종료시간',
                '스케줄7_요일', '스케줄7_시작시간', '스케줄7_종료시간',
                '성별', '생년', '부수', '수상경력', '기타'
            ],
            [
                '홍길동', '010-1234-5678', 'hong@email.com', '서울시 강남구', '2024-01-15', '100000', '김코치', '8', '0',
                '월', '13:00', '13:20',
                '수', '15:00', '15:20',
                '', '', '',
                '', '', '',
                '', '', '',
                '', '', '',
                '', '', '',
                '남', '1990', '5부', '2023년 탁구대회 우승; 2022년 개인전 준우승', '특이사항 없음'
            ],
            ['※ 참고:', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['※ 요일: 월,화,수,목,금,토,일 중 선택', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['※ 시간 형식: 13:00, 14:30 등', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['※ 성별: 남 또는 여', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['※ 부수: 희망, 0부, 1부, 2부, ... 10부 중 선택', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['※ 수상경력: 여러 개일 경우 세미콜론(;)으로 구분', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(templateData);
        
        const wscols = [
            {wch: 10}, {wch: 15}, {wch: 20}, {wch: 25}, {wch: 12},
            {wch: 10}, {wch: 10}, {wch: 12}, {wch: 12},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 10}, {wch: 10}, {wch: 10},
            {wch: 8}, {wch: 8}, {wch: 12}, {wch: 30}, {wch: 30}
        ];
        ws['!cols'] = wscols;
        
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "회원등록템플릿");
        
        XLSX.writeFile(wb, "회원등록_템플릿_스케줄7개.xlsx");
        showAlert('엑셀 템플릿이 다운로드되었습니다!');
        
    } catch (error) {
        console.error('템플릿 생성 오류:', error);
        showAlert('템플릿 생성 중 오류가 발생했습니다.');
    }
}

// 데이터 엑셀 가져오기
function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
        showAlert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다!');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            const headers = jsonData[0];
            const rows = jsonData.slice(1);
            
            const importedMembers = [];
            
            rows.forEach(row => {
                if (row.length === 0 || !row[0]) return;
                
                let phone = row[1] || '';
                if (typeof phone === 'number') {
                    phone = phone.toString();
                    if (phone.length === 11 && phone.startsWith('010')) {
                        phone = phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
                    } else if (phone.length === 10) {
                        phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
                    }
                }
                
                let skillLevel = null;
                const skillColumnIndex = 9 + (7 * 3) + 2;
                if (row[skillColumnIndex] !== undefined && row[skillColumnIndex] !== '') {
                    const skillText = String(row[skillColumnIndex]).trim();
                    if (skillText === '희망') {
                        skillLevel = -1;
                    } else if (skillText === '0부' || skillText === '선출') {
                        skillLevel = 0;
                    } else if (skillText.endsWith('부')) {
                        const level = parseInt(skillText.replace('부', ''));
                        if (!isNaN(level)) {
                            skillLevel = level;
                        }
                    }
                }
                
                let awards = [];
                const awardsColumnIndex = skillColumnIndex + 1;
                if (row[awardsColumnIndex] !== undefined && row[awardsColumnIndex] !== '') {
                    const awardsText = String(row[awardsColumnIndex]);
                    awards = awardsText.split(';').map(a => a.trim()).filter(a => a !== '');
                }
                
                const schedules = [];
                for (let i = 0; i < 7; i++) {
                    const baseIndex = 9 + (i * 3);
                    const day = row[baseIndex] ? String(row[baseIndex]) : '';
                    const startTime = row[baseIndex + 1] ? String(row[baseIndex + 1]) : '';
                    const endTime = row[baseIndex + 2] ? String(row[baseIndex + 2]) : '';
                    
                    if (day && startTime && endTime) {
                        schedules.push({ day, startTime, endTime });
                    }
                }
                
                const etcColumnIndex = awardsColumnIndex + 1;
                
                const member = {
                    name: String(row[0] || ''),
                    phone: phone,
                    email: String(row[2] || ''),
                    address: String(row[3] || ''),
                    registerDate: row[4] ? String(row[4]) : new Date().toISOString().split('T')[0],
                    fee: row[5] ? parseInt(row[5]) : null,
                    coach: String(row[6] || ''),
                    targetCount: row[7] ? parseInt(row[7]) : 0,
                    currentCount: row[8] ? parseInt(row[8]) : 0,
                    schedules: schedules,
                    gender: row[9 + (7 * 3)] ? String(row[9 + (7 * 3)]) : '',
                    birthYear: row[9 + (7 * 3) + 1] ? parseInt(row[9 + (7 * 3) + 1]) : null,
                    skillLevel: skillLevel,
                    awards: awards,
                    etc: row[etcColumnIndex] ? String(row[etcColumnIndex]) : '',
                    photo: '',
                    attendanceDates: [],
                    attendanceHistory: [],
                    paymentHistory: []
                };
                
                importedMembers.push(member);
            });
            
            if (workbook.SheetNames.length > 1) {
                const settingsSheetName = workbook.SheetNames[1];
                const settingsWorksheet = workbook.Sheets[settingsSheetName];
                const settingsJson = XLSX.utils.sheet_to_json(settingsWorksheet, { header: 1 });
                
                settingsJson.forEach(row => {
                    if (row.length >= 2) {
                        const key = row[0];
                        const value = row[1];
                        
                        if (key === '구장명') {
                            settings.clubName = String(value || '');
                            document.getElementById('clubNameDisplay').textContent = settings.clubName || '구장명을 설정하세요';
                        }
                        else if (key === '코치1') settings.coaches[0] = String(value || '');
                        else if (key === '코치2') settings.coaches[1] = String(value || '');
                        else if (key === '코치3') settings.coaches[2] = String(value || '');
                        else if (key === '코치4') settings.coaches[3] = String(value || '');
                        else if (key === '월회비 기본값1') settings.feePresets[0] = parseInt(value) || 0;
                        else if (key === '월회비 기본값2') settings.feePresets[1] = parseInt(value) || 0;
                        else if (key === '월회비 기본값3') settings.feePresets[2] = parseInt(value) || 0;
                        else if (key === '월회비 기본값4') settings.feePresets[3] = parseInt(value) || 0;
                        else if (key === '월회비 기본값5') settings.feePresets[4] = parseInt(value) || 0;
                        else if (key === '은행명') {
                            if (!settings.bankAccount) settings.bankAccount = {};
                            settings.bankAccount.bank = String(value || '');
                        }
                        else if (key === '계좌번호') {
                            if (!settings.bankAccount) settings.bankAccount = {};
                            settings.bankAccount.accountNumber = String(value || '');
                        }
                        else if (key === '비로그인 회원 등록 허용') {
                            settings.allowGuestRegistration = (value === '예' || value === true || value === 1);
                        }
                        else if (key === '회원 기본정보 팝업 표시') {
                            settings.showMemberDetails = (value === '예' || value === true || value === 1);
                        }
                    }
                });
                
                updateFeePresetButtons();
                renderCoachButtons();
            }
            
            // ✅ 수정: confirm() 대신 showConfirm() 사용
            if (importedMembers.length > 0) {
                if (members.length === 0) {
                    // 기존 데이터가 없으면 바로 추가
                    members = importedMembers;
                    filteredMembers = [...members];
                    saveToFirebase();
                    renderMembers();
                    renderSchedule();
                    showAlert(`${importedMembers.length}명의 회원 데이터를 성공적으로 가져왔습니다!`);
                    closeSettings();
                } else {
                    // 기존 데이터가 있으면 확인 모달 사용
                    showConfirm(
                        `현재 ${members.length}명의 회원이 있습니다.\n엑셀 파일의 ${importedMembers.length}명으로 교체하시겠습니까?\n\n⚠️ 주의: 기존 데이터는 모두 삭제됩니다`,
                        function() {
                            // 확인 버튼 클릭 시
                            members = importedMembers;
                            filteredMembers = [...members];
                            saveToFirebase();
                            renderMembers();
                            renderSchedule();
                            showAlert(`${importedMembers.length}명의 회원 데이터를 성공적으로 가져왔습니다!`);
                            closeSettings();
                        },
                        function() {
                            // 취소 버튼 클릭 시
                            event.target.value = '';
                        }
                    );
                }
            } else {
                showAlert('가져올 회원 데이터가 없습니다!');
                closeSettings();
            }
            
        } catch (error) {
            console.error('엑셀 가져오기 오류:', error);
            showAlert(`엑셀 파일 처리 중 오류가 발생했습니다: ${error.message}`);
        }
        
        event.target.value = '';
    };
    
    reader.readAsArrayBuffer(file);
}