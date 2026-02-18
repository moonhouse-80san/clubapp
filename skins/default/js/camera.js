// currentPhotoData, currentPhotoPath, isPhotoRemoved 는 form.js 에서 선언됨
let cameraStream = null;
let currentCameraType = 'environment';

// =====================================================
// 이미지를 서버에 업로드하고 저장된 경로를 반환
// old_path: 교체 시 기존 파일 삭제용 (선택)
// =====================================================
async function uploadImageToServer(base64Data, oldPath = '') {
    try {
        const response = await fetch('/api/upload_image.php?action=upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Data, old_path: oldPath })
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || '이미지 업로드 실패');
        }
        return result.path;   // e.g. "/etc/images/member_xxx.jpg"
    } catch (err) {
        console.error('이미지 업로드 오류:', err);
        showAlert('이미지 업로드에 실패했습니다: ' + err.message);
        return null;
    }
}

// =====================================================
// 서버에서 이미지 파일 삭제
// =====================================================
async function deleteImageFromServer(path) {
    if (!path || !path.startsWith('/etc/images/')) return;
    try {
        await fetch('/api/upload_image.php?action=delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path })
        });
    } catch (err) {
        console.error('이미지 삭제 오류:', err);
    }
}

// =====================================================
// 카메라 전환
// =====================================================
function switchCamera(cameraType) {
    currentCameraType = cameraType;

    document.getElementById('frontCameraBtn').classList.toggle('active', cameraType === 'user');
    document.getElementById('rearCameraBtn').classList.toggle('active', cameraType === 'environment');

    restartCamera();
}

async function restartCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    try {
        const constraints = {
            video: {
                facingMode: currentCameraType,
                width: { ideal: 1280 },
                height: { ideal: 1280 }
            },
            audio: false
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('cameraVideo');
        video.srcObject = cameraStream;

        if (currentCameraType === 'user') {
            video.style.transform = 'scaleX(-1)';
        } else {
            video.style.transform = 'none';
        }

    } catch (error) {
        console.error('카메라 재시작 실패:', error);
        showAlert('카메라에 접근할 수 없습니다.');
    }
}

async function openCamera() {
    try {
        const constraints = {
            video: {
                facingMode: currentCameraType,
                width: { ideal: 1280 },
                height: { ideal: 1280 }
            },
            audio: false
        };

        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        const video = document.getElementById('cameraVideo');
        video.srcObject = cameraStream;

        if (currentCameraType === 'user') {
            video.style.transform = 'scaleX(-1)';
        }

        document.getElementById('cameraModal').classList.add('active');

    } catch (error) {
        console.error('카메라 접근 실패:', error);
        showAlert('카메라에 접근할 수 없습니다. 갤러리에서 사진을 선택해주세요.');
        document.getElementById('photoInput').click();
    }
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const video = document.getElementById('cameraVideo');
    video.srcObject = null;
    video.style.transform = '';
    document.getElementById('cameraModal').classList.remove('active');
}

// =====================================================
// 사진 촬영 → 서버 업로드
// =====================================================
function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    // 400×400 크롭
    const TARGET = 400;
    canvas.width  = TARGET;
    canvas.height = TARGET;

    const videoAspect  = video.videoWidth / video.videoHeight;
    const canvasAspect = 1;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (videoAspect > canvasAspect) {
        drawHeight = video.videoHeight;
        drawWidth  = video.videoHeight * canvasAspect;
        offsetX    = (video.videoWidth - drawWidth) / 2;
        offsetY    = 0;
    } else {
        drawWidth  = video.videoWidth;
        drawHeight = video.videoWidth / canvasAspect;
        offsetX    = 0;
        offsetY    = (video.videoHeight - drawHeight) / 2;
    }

    context.drawImage(
        video,
        offsetX, offsetY, drawWidth, drawHeight,
        0, 0, TARGET, TARGET
    );

    // 전면 카메라 좌우 반전 보정
    if (currentCameraType === 'user') {
        const tempCanvas  = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width  = TARGET;
        tempCanvas.height = TARGET;

        tempContext.translate(TARGET, 0);
        tempContext.scale(-1, 1);
        tempContext.drawImage(canvas, 0, 0);

        context.clearRect(0, 0, TARGET, TARGET);
        context.drawImage(tempCanvas, 0, 0);
    }

    // Canvas → Base64 (JPEG 80%)
    const base64 = canvas.toDataURL('image/jpeg', 0.8);

    // 기존 파일 경로 (교체용)
    const oldPath = currentPhotoPath || '';

    // 서버 업로드
    uploadImageToServer(base64, oldPath).then(path => {
        if (path) {
            currentPhotoData = base64;   // 미리보기용
            currentPhotoPath = path;     // 저장 경로
            isPhotoRemoved   = false;
            displayPhotoPreview();
            closeCamera();
            showAlert('사진이 촬영되었습니다!');
        }
    });
}

// =====================================================
// 갤러리에서 사진 선택 → 서버 업로드
// =====================================================
function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        showAlert('사진 크기는 5MB 이하여야 합니다.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const TARGET = 400;
            const canvas = document.createElement('canvas');
            const ctx    = canvas.getContext('2d');

            canvas.width  = TARGET;
            canvas.height = TARGET;

            const scale    = Math.max(TARGET / img.width, TARGET / img.height);
            const newWidth = img.width  * scale;
            const newHeight= img.height * scale;
            const x        = (TARGET - newWidth)  / 2;
            const y        = (TARGET - newHeight) / 2;

            ctx.drawImage(img, x, y, newWidth, newHeight);

            const base64  = canvas.toDataURL('image/jpeg', 0.8);
            const oldPath = currentPhotoPath || '';

            uploadImageToServer(base64, oldPath).then(path => {
                if (path) {
                    currentPhotoData = base64;
                    currentPhotoPath = path;
                    isPhotoRemoved   = false;
                    displayPhotoPreview();
                    showAlert('사진이 업로드되었습니다!');
                }
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// =====================================================
// 미리보기 렌더링
// =====================================================
function displayPhotoPreview() {
    const container = document.getElementById('photoPreviewContainer');
    const preview   = document.getElementById('photoPreview');

    if (currentPhotoData) {
        // 방금 촬영/선택한 Base64 미리보기
        preview.src = currentPhotoData;
        container.style.display = 'block';
    } else if (currentPhotoPath) {
        // 기존 저장된 파일 경로 미리보기
        preview.src = currentPhotoPath;
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// =====================================================
// 사진 삭제
// =====================================================
function removePhoto() {
    // 실제 파일 삭제는 저장 확정 시(updateMember)에 처리
    // 여기서는 경로를 _pendingDeletePhotoPath 에 보관만 함
    if (currentPhotoPath) {
        window._pendingDeletePhotoPath = currentPhotoPath;
    }

    currentPhotoData = null;
    currentPhotoPath = null;
    isPhotoRemoved   = true;
    displayPhotoPreview();
    document.getElementById('photoInput').value = '';
    showAlert('사진이 삭제되었습니다. 수정 버튼을 눌러 저장하세요.');
}
// =====================================================
// 회원 편집 시 기존 사진 경로 복원
// (app.js 또는 main.js의 editMember() 에서 호출)
// =====================================================
function restorePhotoForEdit(member) {
    const photo = member.photo || '';

    if (photo.startsWith('/etc/images/')) {
        // 서버에 저장된 실제 파일
        currentPhotoData = null;
        currentPhotoPath = photo;
    } else if (photo.startsWith('data:image/')) {
        // 레거시: DB에 Base64로 저장된 경우 미리보기만
        currentPhotoData = photo;
        currentPhotoPath = null;
    } else {
        currentPhotoData = null;
        currentPhotoPath = null;
    }

    isPhotoRemoved = false;
    displayPhotoPreview();
}

// =====================================================
// 회원 저장 시 photo 값 결정
// createMember / updateMember 호출 전에 사용
// =====================================================
function getFinalPhotoValue(originalPhoto) {
    if (isPhotoRemoved) {
        return '';   // 삭제됨
    }
    if (currentPhotoPath) {
        return currentPhotoPath;   // 새로 업로드된 파일 경로
    }
    if (currentPhotoData && currentPhotoData.startsWith('data:image/')) {
        // 레거시 Base64 그대로 유지 (업로드 없이 편집만 한 경우)
        return currentPhotoData;
    }
    // 변경 없음 → 기존 값 유지
    return originalPhoto || '';
}