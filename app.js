// ==========================================
// SKIP SMALL. FLEX BIG. (잔지름 모아 플렉스)
// Main Application Logic
// ==========================================

// Global Application State
let appState = {
    wishName: '',
    wishPrice: 0,
    wishImage: null,
    savedTotal: 0,
    history: []
};

// LocalStorage Key
const STORAGE_KEY = 'flex_big_data';

// DOM Elements
const setupSection = document.getElementById('setup-section');
const dashboardSection = document.getElementById('dashboard-section');

// Setup form elements
const setupForm = document.getElementById('setup-form');
const inputWishName = document.getElementById('wish-name');
const inputWishPrice = document.getElementById('wish-price');
const photoToggle = document.getElementById('photo-toggle');
const uploadWrapper = document.getElementById('upload-wrapper');
const fileInput = document.getElementById('wish-image');
const dropZone = document.getElementById('drop-zone');
const previewWrap = document.getElementById('preview-wrap');
const imagePreview = document.getElementById('image-preview');
const btnRemoveImage = document.getElementById('btn-remove-image');
const uploaderPrompt = document.getElementById('uploader-prompt');

// Dashboard elements
const dashImageContainer = document.getElementById('dash-image-container');
const dashPlaceholder = document.getElementById('dash-placeholder');
const dashImage = document.getElementById('dash-image');
const dashWishName = document.getElementById('dash-wish-name');
const dashRemainingPrice = document.getElementById('dash-remaining-price');
const dashProgressPercent = document.getElementById('dash-progress-percent');
const dashProgressRatio = document.getElementById('dash-progress-ratio');
const dashProgressFill = document.getElementById('dash-progress-fill');
const celebrationBanner = document.getElementById('celebration-banner');
const btnReset = document.getElementById('btn-reset');

// Savings form elements
const savingsForm = document.getElementById('savings-form');
const inputSavingsAmount = document.getElementById('savings-amount');
const historyList = document.getElementById('history-list');
const historyCount = document.getElementById('history-count');

// Helper: Format Number with commas (1000 -> "1,000")
function formatComma(num) {
    return new Intl.NumberFormat('ko-KR').format(num);
}

// Helper: Unformat Number (remove commas, "1,000" -> 1000)
function unformatComma(str) {
    return parseInt(str.replace(/,/g, ''), 10) || 0;
}

// Format Input fields in real-time as users type
function attachCommaFormatter(inputElement) {
    inputElement.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
        if (value) {
            e.target.value = formatComma(parseInt(value, 10));
        } else {
            e.target.value = '';
        }
    });
}

// Initial Configuration Setup
document.addEventListener('DOMContentLoaded', () => {
    attachCommaFormatter(inputWishPrice);
    attachCommaFormatter(inputSavingsAmount);
    
    // Drag & Drop event bindings
    setupDragAndDrop();
    
    // Load existing state
    loadState();
});

// Load state from LocalStorage
function loadState() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
        try {
            appState = JSON.parse(savedData);
            // Default history array if not present
            if (!appState.history) appState.history = [];
            showDashboard();
        } catch (e) {
            console.error("데이터 로드 실패, 초기화합니다.", e);
            showSetup();
        }
    } else {
        showSetup();
    }
}

// Save state to LocalStorage
function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

// Screen Transitions
function showSetup() {
    setupSection.classList.add('active');
    dashboardSection.classList.remove('active');
    setupForm.reset();
    resetImageUploader();
}

function showDashboard() {
    setupSection.classList.remove('active');
    dashboardSection.classList.add('active');
    updateDashboardUI();
}

// === Image Uploader Functions ===

// Toggle image upload area visibility
photoToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        uploadWrapper.classList.remove('hidden');
    } else {
        uploadWrapper.classList.add('hidden');
        resetImageUploader();
    }
});

// Drag & Drop functionality
function setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length) {
            fileInput.files = files;
            handleFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFileSelect(e.target.files[0]);
        }
    });
    
    btnRemoveImage.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageUploader();
    });
}

// Resizing & Compressing Image to keep LocalStorage small
function handleFileSelect(file) {
    if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // Compress Image using Canvas
            const canvas = document.createElement('canvas');
            const maxDimension = 600; // Resize to max 600px width/height
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxDimension) {
                    height = Math.round((height * maxDimension) / width);
                    width = maxDimension;
                }
            } else {
                if (height > maxDimension) {
                    width = Math.round((width * maxDimension) / height);
                    height = maxDimension;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            // Compress to JPEG with 0.7 quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            
            // Set App State Image & Update UI
            appState.wishImage = compressedBase64;
            imagePreview.src = compressedBase64;
            previewWrap.classList.remove('hidden');
            uploaderPrompt.classList.add('hidden');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function resetImageUploader() {
    fileInput.value = '';
    appState.wishImage = null;
    imagePreview.src = '';
    previewWrap.classList.add('hidden');
    uploaderPrompt.classList.remove('hidden');
}

// === Form Submission - Setup ===
setupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const wishName = inputWishName.value.trim();
    const wishPrice = unformatComma(inputWishPrice.value);
    
    if (!wishName) {
        alert('물건 이름을 입력해주세요.');
        return;
    }
    if (wishPrice <= 0) {
        alert('올바른 목표 금액을 입력해주세요.');
        return;
    }

    appState.wishName = wishName;
    appState.wishPrice = wishPrice;
    appState.savedTotal = 0;
    appState.history = [];
    
    // Image was not checked/selected -> force null
    if (!photoToggle.checked) {
        appState.wishImage = null;
    }
    
    saveState();
    showDashboard();
});


// === Dashboard Operations ===

// Update dashboard UI using appState
function updateDashboardUI() {
    dashWishName.textContent = appState.wishName;
    
    // Calculate remaining amount
    const remaining = Math.max(0, appState.wishPrice - appState.savedTotal);
    dashRemainingPrice.textContent = formatComma(remaining);
    
    // Image rendering
    if (appState.wishImage) {
        dashImage.src = appState.wishImage;
        dashImage.classList.remove('hidden');
        dashPlaceholder.classList.add('hidden');
    } else {
        dashImage.classList.add('hidden');
        dashPlaceholder.classList.remove('hidden');
    }
    
    // Progress calculation
    let percent = 0;
    if (appState.wishPrice > 0) {
        percent = Math.min(100, Math.floor((appState.savedTotal / appState.wishPrice) * 100));
    }
    
    // Smoothly animate progress bar
    dashProgressPercent.textContent = `${percent}%`;
    dashProgressRatio.textContent = `${formatComma(appState.savedTotal)}원 / ${formatComma(appState.wishPrice)}원`;
    
    // Ensure smooth animation triggered after rendering
    setTimeout(() => {
        dashProgressFill.style.width = `${percent}%`;
    }, 100);
    
    // Celebration Banner Toggle
    if (percent >= 100) {
        celebrationBanner.classList.remove('hidden');
    } else {
        celebrationBanner.classList.add('hidden');
    }
    
    // Render History
    renderHistory();
}

// === Savings Submission ===
savingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = unformatComma(inputSavingsAmount.value);
    
    if (amount <= 0) {
        alert('아낀 금액을 바르게 입력해주세요.');
        return;
    }
    
    // Format Date: "YYYY-MM-DD"
    const now = new Date();
    const dateStr = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Append to appState
    appState.savedTotal += amount;
    appState.history.unshift({
        date: dateStr,
        amount: amount
    });
    
    saveState();
    updateDashboardUI();
    
    // Clear Input and Trigger subtle button animation
    inputSavingsAmount.value = '';
    
    // Scroll list wrapper back to top to show new record
    const listWrapper = document.querySelector('.history-list-wrapper');
    if (listWrapper) {
        listWrapper.scrollTop = 0;
    }
});

// Render Savings History
function renderHistory() {
    historyList.innerHTML = '';
    
    const count = appState.history.length;
    historyCount.textContent = `총 ${count}회`;
    
    if (count === 0) {
        historyList.innerHTML = `
            <li class="history-empty">아직 아낀 내역이 없습니다.<br>오늘부터 작은 지출을 아껴보세요!</li>
        `;
        return;
    }
    
    appState.history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        li.innerHTML = `
            <span class="history-date">${item.date} 아낌</span>
            <span class="history-amount-val">+${formatComma(item.amount)}원</span>
        `;
        historyList.appendChild(li);
    });
}

// Reset Wishlist Data
btnReset.addEventListener('click', () => {
    const confirmReset = confirm(
        "정말 위시리스트를 초기화하시겠습니까?\n기존에 누적된 절약 기록과 설정 정보가 모두 사라집니다."
    );
    
    if (confirmReset) {
        localStorage.removeItem(STORAGE_KEY);
        appState = {
            wishName: '',
            wishPrice: 0,
            wishImage: null,
            savedTotal: 0,
            history: []
        };
        showSetup();
    }
});
