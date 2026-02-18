// 리포트 관련 전역 변수
let currentReportYear = new Date().getFullYear();
let currentReportMonth = new Date().getMonth() + 1;
let currentReportView = 'monthly'; // 'monthly' 또는 'yearly'

// 리포트 모달 열기
function openReportModal() {
    console.log('📊 openReportModal 호출됨');
    
    // 권한 확인
    if (!hasEditPermission()) {
        showAlert('리포트 기능은 로그인이 필요합니다.');
        openLoginModal();
        return;
    }
    
    // 현재 연도/월 설정
    const now = new Date();
    currentReportYear = now.getFullYear();
    currentReportMonth = now.getMonth() + 1;
    currentReportView = 'monthly';
    
    // 모달 표시
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        console.error('reportModal 요소를 찾을 수 없습니다');
        return;
    }
    
    // 연도/월 선택기 초기화
    initReportPeriodSelector();
    
    // 리포트 생성
    generateReport();
}

// 리포트 모달 닫기
function closeReportModal() {
    const modal = document.getElementById('reportModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// 연도/월 선택기 초기화
function initReportPeriodSelector() {
    const yearSelect = document.getElementById('reportYear');
    const monthSelect = document.getElementById('reportMonth');
    
    if (!yearSelect || !monthSelect) {
        console.error('reportYear 또는 reportMonth 요소를 찾을 수 없습니다');
        return;
    }
    
    // 연도 옵션 생성 (현재 연도 기준 ±2년)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '년';
        if (year === currentReportYear) {
            option.selected = true;
        }
        yearSelect.appendChild(option);
    }
    
    // 월 옵션 선택
    monthSelect.value = currentReportMonth;
}

// 리포트 기간 변경
function changeReportPeriod() {
    currentReportYear = parseInt(document.getElementById('reportYear').value);
    if (currentReportView === 'monthly') {
        currentReportMonth = parseInt(document.getElementById('reportMonth').value);
    }
    generateReport();
}

// 리포트 뷰 전환 (월별/년도별)
function switchReportView(view) {
    currentReportView = view;
    
    // 버튼 활성화 상태 변경
    document.querySelectorAll('.view-toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`.view-toggle-btn[data-view="${view}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    // 월 선택기 표시/숨김
    const monthSelectContainer = document.getElementById('monthSelectContainer');
    if (monthSelectContainer) {
        if (view === 'monthly') {
            monthSelectContainer.style.display = 'block';
        } else {
            monthSelectContainer.style.display = 'none';
        }
    }
    
    generateReport();
}

// 리포트 생성
function generateReport() {
    if (currentReportView === 'monthly') {
        generateMonthlyReport();
    } else {
        generateYearlyReport();
    }
}

// 월별 리포트 생성
function generateMonthlyReport() {
    // 섹션 표시/숨김
    const monthlySection = document.getElementById('monthlyReportSection');
    const yearlySection = document.getElementById('yearlyReportSection');
    
    if (monthlySection) monthlySection.style.display = 'block';
    if (yearlySection) yearlySection.style.display = 'none';
    
    // 전체 통계 생성
    generateOverallStats();
    
    // 월별 통계 테이블 생성
    generateMonthlyStatsTable();
    
    // 회원별 납부 현황 생성
    generateMemberPaymentStatus();
}

// 년도별 리포트 생성
function generateYearlyReport() {
    // 섹션 표시/숨김
    const monthlySection = document.getElementById('monthlyReportSection');
    const yearlySection = document.getElementById('yearlyReportSection');
    
    if (monthlySection) monthlySection.style.display = 'none';
    if (yearlySection) yearlySection.style.display = 'block';
    
    // 년도별 통계 생성
    generateYearlyStats();
    
    // 년도별 월별 상세 테이블
    generateYearlyMonthlyTable();
}

// 전체 통계 생성
function generateOverallStats() {
    const year = currentReportYear;
    const month = currentReportMonth;
    
    // 해당 월의 입금 데이터 수집
    let totalIncome = 0;
    let totalMembers = 0;
    let paidMembers = 0;
    let unpaidMembers = 0;
    
    members.forEach(member => {
        const fee = member.fee || 0;
        if (fee > 0) {
            totalMembers++;
            
            // 해당 월에 입금이 있는지 확인
            let hasPaid = false;
            if (member.paymentHistory && member.paymentHistory.length > 0) {
                member.paymentHistory.forEach(payment => {
                    const paymentDate = new Date(payment.date);
                    if (paymentDate.getFullYear() === year && 
                        paymentDate.getMonth() + 1 === month) {
                        totalIncome += payment.amount || 0;
                        hasPaid = true;
                    }
                });
            }
            
            if (hasPaid) {
                paidMembers++;
            } else {
                unpaidMembers++;
            }
        }
    });
    
    // 예상 수입 계산
    let expectedIncome = 0;
    members.forEach(member => {
        if (member.fee) {
            expectedIncome += member.fee;
        }
    });
    
    // 통계 카드 업데이트
    const totalIncomeEl = document.getElementById('totalIncomeValue');
    const expectedIncomeEl = document.getElementById('expectedIncomeValue');
    const paidMembersEl = document.getElementById('paidMembersValue');
    const paidMembersSubtextEl = document.getElementById('paidMembersSubtext');
    const unpaidMembersEl = document.getElementById('unpaidMembersValue');
    const unpaidMembersSubtextEl = document.getElementById('unpaidMembersSubtext');
    const collectionRateEl = document.getElementById('collectionRateValue');
    
    if (totalIncomeEl) totalIncomeEl.textContent = formatNumber(totalIncome) + '원';
    if (expectedIncomeEl) expectedIncomeEl.textContent = formatNumber(expectedIncome) + '원';
    if (paidMembersEl) paidMembersEl.textContent = paidMembers + '명';
    if (paidMembersSubtextEl) paidMembersSubtextEl.textContent = '전체 ' + totalMembers + '명 중';
    if (unpaidMembersEl) unpaidMembersEl.textContent = unpaidMembers + '명';
    if (unpaidMembersSubtextEl) unpaidMembersSubtextEl.textContent = '미납 회원';
    
    // 수납률 계산
    const collectionRate = totalMembers > 0 ? Math.round((paidMembers / totalMembers) * 100) : 0;
    if (collectionRateEl) collectionRateEl.textContent = collectionRate + '%';
}

// 월별 통계 테이블 생성
function generateMonthlyStatsTable() {
    const year = currentReportYear;
    const tbody = document.getElementById('monthlyStatsBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // 12개월 데이터 생성
    for (let month = 1; month <= 12; month++) {
        let monthIncome = 0;
        let monthPaidCount = 0;
        let monthExpected = 0;
        
        // 해당 월의 회비가 설정된 회원 수와 예상 수입
        members.forEach(member => {
            if (member.fee) {
                monthExpected += member.fee;
            }
        });
        
        // 해당 월에 입금한 회원 수와 총 입금액
        const paidMembersSet = new Set();
        members.forEach(member => {
            if (member.paymentHistory && member.paymentHistory.length > 0) {
                member.paymentHistory.forEach(payment => {
                    const paymentDate = new Date(payment.date);
                    if (paymentDate.getFullYear() === year && 
                        paymentDate.getMonth() + 1 === month) {
                        monthIncome += payment.amount || 0;
                        paidMembersSet.add(member.name);
                    }
                });
            }
        });
        
        monthPaidCount = paidMembersSet.size;
        
        const difference = monthIncome - monthExpected;
        const isCurrentMonth = (month === currentReportMonth);
        
        const row = document.createElement('tr');
        if (isCurrentMonth) {
            row.style.background = '#e3f2fd';
        }
        
        row.innerHTML = `
            <td><strong>${month}월</strong></td>
            <td class="amount-highlight">${formatNumber(monthIncome)}원</td>
            <td>${formatNumber(monthExpected)}원</td>
            <td class="${difference >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${difference >= 0 ? '+' : ''}${formatNumber(difference)}원
            </td>
            <td>${monthPaidCount}명</td>
        `;
        
        tbody.appendChild(row);
    }
}

// 회원별 납부 현황 생성
function generateMemberPaymentStatus() {
    const year = currentReportYear;
    const month = currentReportMonth;
    const container = document.getElementById('memberPaymentList');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 회비가 설정된 회원만 필터링
    const membersWithFee = members.filter(m => m.fee && m.fee > 0);
    
    if (membersWithFee.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #999;">회비가 설정된 회원이 없습니다.</div>';
        return;
    }
    
    // 회원별 납부 상태 분석
    const memberStatusList = membersWithFee.map(member => {
        const fee = member.fee;
        let totalPaid = 0;
        let lastPaymentDate = null;
        
        // 해당 월의 입금 내역 확인
        if (member.paymentHistory && member.paymentHistory.length > 0) {
            member.paymentHistory.forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate.getFullYear() === year && 
                    paymentDate.getMonth() + 1 === month) {
                    totalPaid += payment.amount || 0;
                    if (!lastPaymentDate || paymentDate > lastPaymentDate) {
                        lastPaymentDate = paymentDate;
                    }
                }
            });
        }
        
        const balance = totalPaid - fee;
        let status = 'danger'; // 미납
        if (balance >= 0) {
            status = 'good'; // 완납
        } else if (totalPaid > 0) {
            status = 'warning'; // 일부 납부
        }
        
        return {
            member: member,
            fee: fee,
            totalPaid: totalPaid,
            balance: balance,
            status: status,
            lastPaymentDate: lastPaymentDate
        };
    });
    
    // 상태별 정렬 (미납 > 일부납부 > 완납)
    const statusOrder = { 'danger': 1, 'warning': 2, 'good': 3 };
    memberStatusList.sort((a, b) => {
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.member.name.localeCompare(b.member.name);
    });
    
    // 렌더링
    memberStatusList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'member-payment-item';
        
        let statusText = '';
        let statusClass = '';
        if (item.status === 'good') {
            statusText = '✓ 완납';
            statusClass = 'status-good';
        } else if (item.status === 'warning') {
            statusText = '△ 일부납부';
            statusClass = 'status-warning';
        } else {
            statusText = '✗ 미납';
            statusClass = 'status-danger';
        }
        
        const lastPayment = item.lastPaymentDate ? 
            `최근 입금: ${formatDate(item.lastPaymentDate.toISOString().split('T')[0])}` : 
            '입금 내역 없음';
        
        div.innerHTML = `
            <div class="member-payment-header">
                <div class="member-payment-name">
                    ${item.member.name}
                    ${item.member.coach ? `<span style="font-size: 14px; color: #666; font-weight: normal; margin-left: 8px;">🏋️ ${item.member.coach}</span>` : ''}
                </div>
                <div class="member-payment-status ${statusClass}">${statusText}</div>
            </div>
            <div class="member-payment-details">
                <div class="member-payment-detail-item">
                    <span>💰 월회비:</span>
                    <strong>${formatNumber(item.fee)}원</strong>
                </div>
                <div class="member-payment-detail-item">
                    <span>📥 입금액:</span>
                    <strong style="color: ${item.totalPaid > 0 ? '#4CAF50' : '#999'};">
                        ${formatNumber(item.totalPaid)}원
                    </strong>
                </div>
                <div class="member-payment-detail-item">
                    <span>📊 잔액:</span>
                    <strong style="color: ${item.balance >= 0 ? '#4CAF50' : '#f44336'};">
                        ${item.balance >= 0 ? '+' : ''}${formatNumber(item.balance)}원
                    </strong>
                </div>
                <div class="member-payment-detail-item" style="color: #999; font-size: 13px;">
                    ${lastPayment}
                </div>
            </div>
        `;
        
        container.appendChild(div);
    });
}

// 리포트 엑셀 내보내기
function exportReportToExcel() {
    const year = currentReportYear;
    
    try {
        const wb = XLSX.utils.book_new();
        
        if (currentReportView === 'monthly') {
            // 월별 리포트 엑셀
            const month = currentReportMonth;
            
            // 월별 통계 시트
            const monthlyData = [
                ['월', '실제 수입', '예상 수입', '차액', '납부 인원']
            ];
            
            for (let m = 1; m <= 12; m++) {
                let monthIncome = 0;
                let monthExpected = 0;
                
                members.forEach(member => {
                    if (member.fee) {
                        monthExpected += member.fee;
                    }
                });
                
                const paidMembersSet = new Set();
                members.forEach(member => {
                    if (member.paymentHistory && member.paymentHistory.length > 0) {
                        member.paymentHistory.forEach(payment => {
                            const paymentDate = new Date(payment.date);
                            if (paymentDate.getFullYear() === year && 
                                paymentDate.getMonth() + 1 === m) {
                                monthIncome += payment.amount || 0;
                                paidMembersSet.add(member.name);
                            }
                        });
                    }
                });
                
                const monthPaidCount = paidMembersSet.size;
                const difference = monthIncome - monthExpected;
                
                monthlyData.push([
                    m + '월',
                    monthIncome,
                    monthExpected,
                    difference,
                    monthPaidCount
                ]);
            }
            
            // 회원별 납부 현황 시트
            const memberData = [
                ['회원명', '담당코치', '월회비', '입금액', '잔액', '상태', '최근 입금일']
            ];
            
            const membersWithFee = members.filter(m => m.fee && m.fee > 0);
            
            membersWithFee.forEach(member => {
                const fee = member.fee;
                let totalPaid = 0;
                let lastPaymentDate = '';
                
                if (member.paymentHistory && member.paymentHistory.length > 0) {
                    member.paymentHistory.forEach(payment => {
                        const paymentDate = new Date(payment.date);
                        if (paymentDate.getFullYear() === year && 
                            paymentDate.getMonth() + 1 === month) {
                            totalPaid += payment.amount || 0;
                            if (!lastPaymentDate || payment.date > lastPaymentDate) {
                                lastPaymentDate = payment.date;
                            }
                        }
                    });
                }
                
                const balance = totalPaid - fee;
                let status = '미납';
                if (balance >= 0) {
                    status = '완납';
                } else if (totalPaid > 0) {
                    status = '일부납부';
                }
                
                memberData.push([
                    member.name,
                    member.coach || '-',
                    fee,
                    totalPaid,
                    balance,
                    status,
                    lastPaymentDate || '-'
                ]);
            });
            
            const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
            const wsMember = XLSX.utils.aoa_to_sheet(memberData);
            
            XLSX.utils.book_append_sheet(wb, wsMonthly, '월별통계');
            XLSX.utils.book_append_sheet(wb, wsMember, '회원별납부현황');
            
            const clubName = settings.clubName ? `_${settings.clubName}` : '';
            const fileName = `입금리포트${clubName}_${year}년${month}월.xlsx`;
            XLSX.writeFile(wb, fileName);
            
        } else {
            // 년도별 리포트 엑셀
            const yearlyData = [
                ['월', '실제 수입', '예상 수입', '차액', '수납률', '납부 인원']
            ];
            
            let yearTotalIncome = 0;
            let yearTotalExpected = 0;
            
            for (let month = 1; month <= 12; month++) {
                let monthIncome = 0;
                let monthExpected = 0;
                
                members.forEach(member => {
                    if (member.fee) {
                        monthExpected += member.fee;
                    }
                });
                
                const paidMembersSet = new Set();
                members.forEach(member => {
                    if (member.paymentHistory && member.paymentHistory.length > 0) {
                        member.paymentHistory.forEach(payment => {
                            const paymentDate = new Date(payment.date);
                            if (paymentDate.getFullYear() === year && 
                                paymentDate.getMonth() + 1 === month) {
                                monthIncome += payment.amount || 0;
                                paidMembersSet.add(member.name);
                            }
                        });
                    }
                });
                
                yearTotalIncome += monthIncome;
                yearTotalExpected += monthExpected;
                
                const monthPaidCount = paidMembersSet.size;
                const difference = monthIncome - monthExpected;
                const collectionRate = monthExpected > 0 ? Math.round((monthIncome / monthExpected) * 100) : 0;
                
                yearlyData.push([
                    month + '월',
                    monthIncome,
                    monthExpected,
                    difference,
                    collectionRate + '%',
                    monthPaidCount
                ]);
            }
            
            // 합계 행
            const totalDifference = yearTotalIncome - yearTotalExpected;
            const totalCollectionRate = yearTotalExpected > 0 ? Math.round((yearTotalIncome / yearTotalExpected) * 100) : 0;
            
            yearlyData.push([
                '합계',
                yearTotalIncome,
                yearTotalExpected,
                totalDifference,
                totalCollectionRate + '%',
                '-'
            ]);
            
            const wsYearly = XLSX.utils.aoa_to_sheet(yearlyData);
            XLSX.utils.book_append_sheet(wb, wsYearly, '년도별통계');
            
            const clubName = settings.clubName ? `_${settings.clubName}` : '';
            const fileName = `입금리포트${clubName}_${year}년.xlsx`;
            XLSX.writeFile(wb, fileName);
        }
        
        showAlert('리포트가 엑셀 파일로 내보내졌습니다!');
        
    } catch (error) {
        console.error('엑셀 내보내기 오류:', error);
        showAlert('엑셀 내보내기 중 오류가 발생했습니다.');
    }
}

// 리포트 인쇄
function printReport() {
    window.print();
}

// ==================== 년도별 리포트 함수 ====================

// 년도별 통계 생성
function generateYearlyStats() {
    const year = currentReportYear;
    
    // 해당 연도의 입금 데이터 수집
    let totalYearIncome = 0;
    let totalYearExpected = 0;
    const monthlyIncome = new Array(12).fill(0);
    const monthlyExpected = new Array(12).fill(0);
    
    members.forEach(member => {
        const fee = member.fee || 0;
        
        // 월별 예상 수입 계산 (12개월)
        if (fee > 0) {
            for (let month = 1; month <= 12; month++) {
                monthlyExpected[month - 1] += fee;
            }
            totalYearExpected += fee * 12;
        }
        
        // 실제 입금 데이터
        if (member.paymentHistory && member.paymentHistory.length > 0) {
            member.paymentHistory.forEach(payment => {
                const paymentDate = new Date(payment.date);
                if (paymentDate.getFullYear() === year) {
                    const month = paymentDate.getMonth();
                    monthlyIncome[month] += payment.amount || 0;
                    totalYearIncome += payment.amount || 0;
                }
            });
        }
    });
    
    // 평균 계산
    const avgMonthlyIncome = Math.round(totalYearIncome / 12);
    const avgMonthlyExpected = Math.round(totalYearExpected / 12);
    
    // 최고/최저 수입 월 찾기
    let maxIncome = 0;
    let maxMonth = 1;
    let minIncome = Infinity;
    let minMonth = 1;
    
    for (let i = 0; i < 12; i++) {
        if (monthlyIncome[i] > maxIncome) {
            maxIncome = monthlyIncome[i];
            maxMonth = i + 1;
        }
        if (monthlyIncome[i] < minIncome) {
            minIncome = monthlyIncome[i];
            minMonth = i + 1;
        }
    }
    
    if (minIncome === Infinity) minIncome = 0;
    
    // 통계 카드 업데이트
    const yearTotalIncomeEl = document.getElementById('yearTotalIncomeValue');
    const yearTotalExpectedEl = document.getElementById('yearTotalExpectedValue');
    const yearAvgIncomeEl = document.getElementById('yearAvgIncomeValue');
    const yearAvgIncomeSubtextEl = document.getElementById('yearAvgIncomeSubtext');
    const yearMaxIncomeEl = document.getElementById('yearMaxIncomeValue');
    const yearMaxIncomeSubtextEl = document.getElementById('yearMaxIncomeSubtext');
    const yearMinIncomeEl = document.getElementById('yearMinIncomeValue');
    const yearMinIncomeSubtextEl = document.getElementById('yearMinIncomeSubtext');
    const yearDifferenceEl = document.getElementById('yearDifferenceValue');
    const yearDifferenceSubtextEl = document.getElementById('yearDifferenceSubtext');
    
    if (yearTotalIncomeEl) yearTotalIncomeEl.textContent = formatNumber(totalYearIncome) + '원';
    if (yearTotalExpectedEl) yearTotalExpectedEl.textContent = formatNumber(totalYearExpected) + '원';
    if (yearAvgIncomeEl) yearAvgIncomeEl.textContent = formatNumber(avgMonthlyIncome) + '원';
    if (yearAvgIncomeSubtextEl) yearAvgIncomeSubtextEl.textContent = '월평균 실제 수입';
    if (yearMaxIncomeEl) yearMaxIncomeEl.textContent = formatNumber(maxIncome) + '원';
    if (yearMaxIncomeSubtextEl) yearMaxIncomeSubtextEl.textContent = maxMonth + '월 최고 수입';
    if (yearMinIncomeEl) yearMinIncomeEl.textContent = formatNumber(minIncome) + '원';
    if (yearMinIncomeSubtextEl) yearMinIncomeSubtextEl.textContent = minMonth + '월 최저 수입';
    
    const yearDifference = totalYearIncome - totalYearExpected;
    if (yearDifferenceEl) yearDifferenceEl.textContent = 
        (yearDifference >= 0 ? '+' : '') + formatNumber(yearDifference) + '원';
    if (yearDifferenceSubtextEl) yearDifferenceSubtextEl.textContent = '연간 차액';
}

// 년도별 월별 상세 테이블 생성
function generateYearlyMonthlyTable() {
    const year = currentReportYear;
    const tbody = document.getElementById('yearlyMonthlyBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    let yearTotalIncome = 0;
    let yearTotalExpected = 0;
    
    // 12개월 데이터 생성
    for (let month = 1; month <= 12; month++) {
        let monthIncome = 0;
        let monthPaidCount = 0;
        let monthExpected = 0;
        
        // 해당 월의 회비가 설정된 회원 수와 예상 수입
        members.forEach(member => {
            if (member.fee) {
                monthExpected += member.fee;
            }
        });
        
        // 해당 월에 입금한 회원 수와 총 입금액
        const paidMembersSet = new Set();
        members.forEach(member => {
            if (member.paymentHistory && member.paymentHistory.length > 0) {
                member.paymentHistory.forEach(payment => {
                    const paymentDate = new Date(payment.date);
                    if (paymentDate.getFullYear() === year && 
                        paymentDate.getMonth() + 1 === month) {
                        monthIncome += payment.amount || 0;
                        paidMembersSet.add(member.name);
                    }
                });
            }
        });
        
        monthPaidCount = paidMembersSet.size;
        yearTotalIncome += monthIncome;
        yearTotalExpected += monthExpected;
        
        const difference = monthIncome - monthExpected;
        const collectionRate = monthExpected > 0 ? Math.round((monthIncome / monthExpected) * 100) : 0;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${month}월</strong></td>
            <td class="amount-highlight">${formatNumber(monthIncome)}원</td>
            <td>${formatNumber(monthExpected)}원</td>
            <td class="${difference >= 0 ? 'amount-positive' : 'amount-negative'}">
                ${difference >= 0 ? '+' : ''}${formatNumber(difference)}원
            </td>
            <td>${collectionRate}%</td>
            <td>${monthPaidCount}명</td>
        `;
        
        tbody.appendChild(row);
    }
    
    // 합계 행 추가
    const totalDifference = yearTotalIncome - yearTotalExpected;
    const totalCollectionRate = yearTotalExpected > 0 ? Math.round((yearTotalIncome / yearTotalExpected) * 100) : 0;
    
    const totalRow = document.createElement('tr');
    totalRow.style.background = '#f0f0f0';
    totalRow.style.fontWeight = 'bold';
    totalRow.innerHTML = `
        <td>합계</td>
        <td class="amount-highlight">${formatNumber(yearTotalIncome)}원</td>
        <td>${formatNumber(yearTotalExpected)}원</td>
        <td class="${totalDifference >= 0 ? 'amount-positive' : 'amount-negative'}">
            ${totalDifference >= 0 ? '+' : ''}${formatNumber(totalDifference)}원
        </td>
        <td>${totalCollectionRate}%</td>
        <td>-</td>
    `;
    
    tbody.appendChild(totalRow);
}

// ==================== 입금 상태 아이콘 함수 (전역) ====================

/**
 * 입금 상태 아이콘 반환 (전역 함수)
 * 이번달 입금 여부에 따라 빨간색 체크 표시
 */
window.getPaymentStatusIcon = function(member) {
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
    
    return '';
};

// ==================== 초기화 함수 ====================

// 리포트 모듈 초기화
function initReportModule() {
    console.log('📊 리포트 모듈 초기화');
    
    // 리포트 버튼 이벤트 설정
    const reportBtn = document.querySelector('.tab-btn[onclick="openReportModal()"]');
    if (reportBtn) {
        reportBtn.onclick = function() {
            openReportModal();
            return false;
        };
    }
}

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 초기화
    setTimeout(initReportModule, 500);
});