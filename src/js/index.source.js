let map;
let allSessions = [];
let markers = [];

// 地図の初期化
function initMap() {
    map = L.map('map').setView([35.680, 139.750], 11);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
}

// セッションデータの読み込み（APIから取得）
async function loadSessions() {
    try {
        // 本番環境のAPI URL
        const apiUrl = 'https://kurouzu-setsuna.com/sites/photo-session-map/server/api/sessions.php';

        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('API読み込み失敗');
        }

        allSessions = await response.json();

        // フィルタ用のドロップダウンを初期化
        initializeFilters();

        // デフォルトで次の土日を表示
        const nextWeekend = getNextWeekendDate();
        document.getElementById('dateInput').value = nextWeekend;
        applyFilters();

        // 撮影会一覧を読み込み
        loadPhotoSessions();
    } catch (error) {
        console.error('Error loading sessions:', error);
        document.getElementById('sessionCount').textContent =
            'データの読み込みに失敗しました。しばらくしてから再度お試しください。';
    }
}

// 撮影会一覧の読み込み
async function loadPhotoSessions() {
    try {
        const apiUrl = 'https://kurouzu-setsuna.com/sites/photo-session-map/server/api/photo_sessions.php';
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('撮影会一覧の読み込み失敗');
        }

        const photoSessions = await response.json();
        displayPhotoSessions(photoSessions);
    } catch (error) {
        console.error('Error loading photo sessions:', error);
        document.getElementById('sessions-container').innerHTML =
            '<p style="text-align: center; color: #D4A5A5;">撮影会一覧の読み込みに失敗しました。</p>';
    }
}

// 撮影会一覧を表示（ドロワー内）
function displayPhotoSessions(photoSessions) {
    const container = document.getElementById('drawerContent');

    if (!photoSessions || photoSessions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #9B8B7E;">登録されている撮影会はありません。</p>';
        return;
    }

    container.innerHTML = photoSessions.map(session => `
        <div class="session-card">
            <h3>${escapeHtml(session.name)}</h3>
            <span class="session-badge ${session.is_freelance ? 'freelance' : 'company'}">
                ${session.is_freelance ? 'フリーランス' : '企業'}
            </span>
            <div class="session-links">
                ${session.url ?
                    `<a href="${escapeHtml(session.url)}" target="_blank" rel="noopener noreferrer" class="session-link">🌐 公式サイト</a>` :
                    ''
                }
                ${session.twitter_url ?
                    `<a href="${escapeHtml(session.twitter_url)}" target="_blank" rel="noopener noreferrer" class="session-link">𝕏 Twitter</a>` :
                    ''
                }
            </div>
            ${!session.url && !session.twitter_url ?
                '<div style="color: #9B8B7E; font-size: 0.85rem; margin-top: 8px;">リンク未登録</div>' :
                ''
            }
        </div>
    `).join('');
}

// ドロワーの開閉
function toggleDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const menuButton = document.getElementById('menuButton');

    drawer.classList.toggle('open');
    overlay.classList.toggle('active');
    menuButton.classList.toggle('active');
}

function closeDrawer() {
    const drawer = document.getElementById('sideDrawer');
    const overlay = document.getElementById('drawerOverlay');
    const menuButton = document.getElementById('menuButton');

    drawer.classList.remove('open');
    overlay.classList.remove('active');
    menuButton.classList.remove('active');
}

// HTMLエスケープ関数
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// フィルタ用のドロップダウンを初期化
function initializeFilters() {
    // 撮影会の一覧を取得
    const organizers = [...new Set(allSessions.map(s => s.organizer))].sort();
    const organizerSelect = document.getElementById('organizerFilter');
    organizers.forEach(org => {
        const option = document.createElement('option');
        option.value = org;
        option.textContent = org;
        organizerSelect.appendChild(option);
    });

    // スタジオの一覧を取得
    const studios = [...new Set(allSessions.map(s => s.studioName))].sort();
    const studioSelect = document.getElementById('studioFilter');
    studios.forEach(studio => {
        const option = document.createElement('option');
        option.value = studio;
        option.textContent = studio;
        studioSelect.appendChild(option);
    });

    // 日付入力のバリデーションを設定
    setupDateValidation();
}

// 日付入力のバリデーションを設定
function setupDateValidation() {
    const dateInput = document.getElementById('dateInput');

    // セッションがある日付のセットを取得
    const availableDates = new Set(allSessions.map(s => s.date));
    const enabledDates = Array.from(availableDates).sort();

    // flatpickrでカレンダーを初期化
    flatpickr(dateInput, {
        locale: 'ja',
        dateFormat: 'Y-m-d',
        enable: enabledDates, // この日付のみ選択可能
        onChange: function(selectedDates, dateStr, instance) {
            // 日付が選択されたら自動的に絞り込みを実行
            if (dateStr) {
                applyFilters();
            }
        }
    });
}

// 次の土日を取得する関数
function getNextWeekendDate() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0: 日, 1: 月, ..., 6: 土

    let targetDate = new Date(today);

    if (dayOfWeek === 6) {
        // 今日が土曜日 → そのまま土曜日を返す
        // targetDate = today
    } else if (dayOfWeek === 0) {
        // 今日が日曜日 → そのまま日曜日を返す
        // targetDate = today
    } else {
        // 月曜〜金曜 → 次の土曜日を返す
        const daysUntilSaturday = 6 - dayOfWeek;
        targetDate.setDate(today.getDate() + daysUntilSaturday);
    }

    // YYYY-MM-DD形式で返す
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// フィルタをリセット
function resetFilters() {
    document.getElementById('dateInput').value = '';
    document.getElementById('eventTypeFilter').value = '';
    document.getElementById('organizerFilter').value = '';
    document.getElementById('studioFilter').value = '';
    clearMarkers();
    displaySessions(allSessions);
    updateSessionCount(allSessions.length);
}

// フィルタを適用
function applyFilters() {
    const selectedDate = document.getElementById('dateInput').value;
    const selectedEventType = document.getElementById('eventTypeFilter').value;
    const selectedOrganizer = document.getElementById('organizerFilter').value;
    const selectedStudio = document.getElementById('studioFilter').value;

    clearMarkers();

    let filtered = allSessions;

    // 日付でフィルタリング
    if (selectedDate) {
        filtered = filtered.filter(session => session.date === selectedDate);
    }

    // 種別でフィルタリング
    if (selectedEventType) {
        filtered = filtered.filter(session => session.eventType === selectedEventType);
    }

    // 撮影会でフィルタリング
    if (selectedOrganizer) {
        filtered = filtered.filter(session => session.organizer === selectedOrganizer);
    }

    // スタジオでフィルタリング
    if (selectedStudio) {
        filtered = filtered.filter(session => session.studioName === selectedStudio);
    }

    displaySessions(filtered);

    // カウント表示を更新
    let filterDesc = '';
    if (selectedDate) filterDesc += selectedDate + ' ';
    if (selectedOrganizer) filterDesc += selectedOrganizer + ' ';
    if (selectedStudio) filterDesc += selectedStudio + ' ';

    if (filterDesc) {
        updateSessionCount(filtered.length, filterDesc.trim());
    } else {
        updateSessionCount(filtered.length);
    }
}

// セッションを地図に表示
function displaySessions(sessions) {
    // スタジオごとにセッションをグループ化
    const groupedByStudio = {};

    sessions.forEach(session => {
        const key = `${session.latitude},${session.longitude}`;
        if (!groupedByStudio[key]) {
            groupedByStudio[key] = {
                studioName: session.studioName,
                address: session.address,
                latitude: session.latitude,
                longitude: session.longitude,
                studioUrl: session.studioUrl,
                sessions: []
            };
        }
        groupedByStudio[key].sessions.push(session);
    });

    // マーカーを追加
    Object.values(groupedByStudio).forEach(studio => {
        // スタジオ内のセッション種別を確認
        const hasPhotoSession = studio.sessions.some(s => s.eventType === 'photo_session');
        const hasPhotoExhibition = studio.sessions.some(s => s.eventType === 'photo_exhibition');

        // 種別に応じてマーカーの色を決定
        let markerColor;
        if (hasPhotoSession && hasPhotoExhibition) {
            markerColor = '#9B59B6'; // 紫（両方）
        } else if (hasPhotoExhibition) {
            markerColor = '#3498DB'; // 青（写真展）
        } else {
            markerColor = '#D4A5A5'; // ピンク（撮影会）
        }

        // カスタムアイコンを作成
        const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
                background-color: ${markerColor};
                width: 25px;
                height: 25px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                border: 2px solid white;
                box-shadow: 0 2px 5px rgba(0,0,0,0.3);
            "></div>`,
            iconSize: [25, 25],
            iconAnchor: [12, 24]
        });

        const marker = L.marker([studio.latitude, studio.longitude], {icon: customIcon}).addTo(map);

        // ポップアップコンテンツの作成
        let popupContent = `
            <div class="popup-title">${studio.studioName}</div>
            <div class="popup-info">${studio.address}</div>
        `;

        // スタジオのURLがあれば表示
        if (studio.studioUrl) {
            popupContent += `
                <div class="popup-info">
                    <a href="${studio.studioUrl}" target="_blank" class="popup-link">スタジオ公式サイト</a>
                </div>
            `;
        }

        popupContent += '<div class="popup-sessions">';

        studio.sessions.forEach(session => {
            const eventTypeLabel = session.eventType === 'photo_exhibition' ? '📷 写真展' : '📸 撮影会';
            popupContent += `
                <div class="popup-session-item">
                    <strong>${eventTypeLabel}</strong><br>
                    ${session.date} - ${session.organizer}<br>
                    <a href="${session.url}" target="_blank" class="popup-link">詳細を見る</a>
                </div>
            `;
        });

        popupContent += '</div>';

        marker.bindPopup(popupContent);
        markers.push(marker);
    });

    // 地図の表示範囲を調整
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

// マーカーをクリア
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
}

// セッション数の表示を更新
function updateSessionCount(count, date = null) {
    const countEl = document.getElementById('sessionCount');
    if (date) {
        countEl.textContent = `${date} の開催: ${count} 件`;
    } else {
        countEl.textContent = `総セッション数: ${count} 件`;
    }
}

// 初期化
initMap();
loadSessions();
