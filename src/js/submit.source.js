// 地図とマーカーの変数
let map, marker;

// ページ読み込み時に地図を初期化
window.addEventListener('load', initMap);

function initMap() {
    // 地図の初期化（日本の中心付近）
    map = L.map('map').setView([35.681236, 139.767125], 11);

    // OpenStreetMapタイルレイヤーを追加
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 地図クリック時の処理
    map.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // 緯度経度の入力欄に値を設定
        document.getElementById('latitude').value = lat.toFixed(7);
        document.getElementById('longitude').value = lng.toFixed(7);

        // 既存のマーカーがあれば削除
        if (marker) {
            map.removeLayer(marker);
        }

        // 新しいマーカーを追加
        marker = L.marker([lat, lng]).addTo(map);
    });
}

// フォーム送信処理
document.getElementById('submitForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // 会期のバリデーション（開始日 <= 終了日）
    const startDate = document.getElementById('start_date').value;
    const endDate = document.getElementById('end_date').value;
    if (startDate > endDate) {
        showAlert('error', '会期の終了日は開始日以降の日付を指定してください。');
        return;
    }

    // フォームデータを収集
    const data = {
        submitter_name: document.getElementById('submitter_name').value,
        submitter_social_url: document.getElementById('submitter_social_url').value,
        submitter_email: document.getElementById('submitter_email').value,
        exhibition_name: document.getElementById('exhibition_name').value,
        address: document.getElementById('address').value,
        start_date: startDate,
        end_date: endDate,
        latitude: parseFloat(document.getElementById('latitude').value),
        longitude: parseFloat(document.getElementById('longitude').value),
        url: document.getElementById('url').value || null
    };

    try {
        // APIにPOSTリクエストを送信
        const response = await fetch('https://kurouzu-setsuna.com/sites/photo-session-map/server/api/submit_exhibition.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            // 成功時
            showAlert('success', result.message);
            document.getElementById('submitForm').reset();

            // マーカーをリセット
            if (marker) {
                map.removeLayer(marker);
                marker = null;
            }
        } else {
            // エラー時
            showAlert('error', result.error);
        }
    } catch (error) {
        console.log('error', error);
        showAlert('error', '送信に失敗しました。もう一度お試しください。');
    }
});

// アラート表示関数
function showAlert(type, message) {
    const alertContainer = document.getElementById('alertContainer');
    const alertClass = type === 'success' ? 'alert-success' : 'alert-error';

    alertContainer.innerHTML = '<div class="alert ' + alertClass + '">' + message + '</div>';

    // 5秒後にアラートを消す
    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 5000);

    // ページトップにスクロール
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
