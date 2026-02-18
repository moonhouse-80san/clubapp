/**
 * 음성 검색 기능 (Speech Recognition)
 * 스마트폰에서 마이크로 말하면 검색어로 입력됩니다.
 */

let recognition = null;
let isVoiceSearchSupported = false;

// 음성 인식 지원 여부 확인
function checkVoiceSupport() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (!voiceBtn) return;
    
    // 브라우저별 SpeechRecognition 객체 확인
    window.SpeechRecognition = window.SpeechRecognition || 
                              window.webkitSpeechRecognition || 
                              window.mozSpeechRecognition || 
                              window.msSpeechRecognition;
    
    if (window.SpeechRecognition) {
        console.log('✅ 음성 검색 지원됨');
        voiceBtn.style.display = 'block';
        isVoiceSearchSupported = true;
        initVoiceSearch();
    } else {
        console.log('❌ 음성 검색 미지원 브라우저');
        voiceBtn.style.display = 'none';
    }
}

// 음성 검색 초기화
function initVoiceSearch() {
    try {
        recognition = new window.SpeechRecognition();
        recognition.lang = 'ko-KR'; // 한국어 설정
        recognition.continuous = false; // 한 번만 듣고 중지
        recognition.interimResults = false; // 최종 결과만 사용
        recognition.maxAlternatives = 1; // 최상위 결과 1개만
        
        // 음성 인식 결과 처리
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            console.log('🎤 인식된 음성:', transcript);
            
            // 검색창에 결과 입력
            const searchInput = document.getElementById('searchInput');
            searchInput.value = transcript;
            
            // 검색 실행
            searchMembers();
            
            // 마이크 버튼 원래대로
            resetVoiceButton();
        };
        
        recognition.onerror = function(event) {
            console.error('🎤 음성 인식 오류:', event.error);
            let errorMessage = '';
            
            switch(event.error) {
                case 'no-speech':
                    errorMessage = '음성이 감지되지 않았습니다.';
                    break;
                case 'audio-capture':
                    errorMessage = '마이크에 접근할 수 없습니다.';
                    break;
                case 'not-allowed':
                    errorMessage = '마이크 권한이 거부되었습니다.';
                    break;
                case 'network':
                    errorMessage = '네트워크 오류가 발생했습니다.';
                    break;
                default:
                    errorMessage = '음성 인식에 실패했습니다.';
            }
            
            showAlert('🎤 ' + errorMessage);
            resetVoiceButton();
        };
        
        recognition.onend = function() {
            console.log('🎤 음성 인식 종료');
            resetVoiceButton();
        };
        
    } catch (error) {
        console.error('음성 인식 초기화 오류:', error);
        isVoiceSearchSupported = false;
        const voiceBtn = document.getElementById('voiceSearchBtn');
        if (voiceBtn) voiceBtn.style.display = 'none';
    }
}

// 음성 검색 시작
function startVoiceSearch() {
    if (!recognition || !isVoiceSearchSupported) {
        showAlert('이 브라우저는 음성 검색을 지원하지 않습니다.');
        return;
    }
    
    try {
        // 마이크 권한 확인 및 요청
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(function(stream) {
                // 권한 획득 성공 - 스트림 정리
                stream.getTracks().forEach(track => track.stop());
                
                // 음성 인식 시작
                recognition.start();
                
                // UI 변경
                const voiceBtn = document.getElementById('voiceSearchBtn');
                voiceBtn.style.color = '#f44336';
                voiceBtn.style.transform = 'translateY(-50%) scale(1.2)';
                voiceBtn.title = '듣는 중... 말씀하세요';
                
                // 10초 타임아웃 (자동 종료)
                setTimeout(() => {
                    if (recognition) {
                        try {
                            recognition.stop();
                        } catch(e) {}
                        resetVoiceButton();
                    }
                }, 10000);
                
            })
            .catch(function(error) {
                console.error('마이크 권한 오류:', error);
                if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                    showAlert('🎤 마이크 접근 권한이 필요합니다.\n브라우저 설정에서 권한을 허용해주세요.');
                } else {
                    showAlert('🎤 마이크에 접근할 수 없습니다.');
                }
                resetVoiceButton();
            });
            
    } catch (error) {
        console.error('음성 검색 시작 오류:', error);
        showAlert('🎤 음성 검색을 시작할 수 없습니다.');
        resetVoiceButton();
    }
}

// 음성 버튼 원래대로
function resetVoiceButton() {
    const voiceBtn = document.getElementById('voiceSearchBtn');
    if (voiceBtn) {
        voiceBtn.style.color = '#666';
        voiceBtn.style.transform = 'translateY(-50%)';
        voiceBtn.title = '음성으로 검색';
    }
}

// DOM 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 약간의 지연 후 음성 지원 확인
    setTimeout(checkVoiceSupport, 500);
});