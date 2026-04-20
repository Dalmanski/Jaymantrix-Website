function getDeviceInfo() {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : {};
    return {
      userAgent: nav.userAgent || '',
      platform: nav.platform || '',
      language: nav.language || '',
      vendor: nav.vendor || '',
      maxTouchPoints: nav.maxTouchPoints || 0,
      hardwareConcurrency: nav.hardwareConcurrency || 0
    };
  } catch (e) {
    return { userAgent: '', platform: '', language: '' };
  }
}

function getDeviceId() {
  try {
    const info = getDeviceInfo();
    const base = [info.userAgent || '', info.platform || '', info.language || ''].join('|');
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = ((hash << 5) - hash) + base.charCodeAt(i);
      hash |= 0;
    }
    return 'dev_' + Math.abs(hash);
  } catch (e) {
    return 'dev_unknown';
  }
}

async function fetchFirebaseData() {
  try {
    if (typeof window !== 'undefined' && window.firebaseDb) {
      const firestore = await import('firebase/firestore');
      const { doc, getDoc } = firestore;
      const deviceId = getDeviceId();
      const docRef = doc(window.firebaseDb, 'User Data', deviceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { deviceId, data: snap.data() };
      }
    }
  } catch (e) {
    console.error('Error fetching Firebase data:', e);
  }
  return { deviceId: getDeviceId(), data: null };
}

async function deleteLogEntry(logIndex) {
  const confirmed = confirm('Are you sure you want to delete this log entry?');
  if (!confirmed) return;
  
  try {
    if (typeof window !== 'undefined' && window.firebaseDb) {
      const firestore = await import('firebase/firestore');
      const { doc, getDoc, setDoc } = firestore;
      const deviceId = getDeviceId();
      const docRef = doc(window.firebaseDb, 'User Data', deviceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        let data = snap.data();
        if (Array.isArray(data.log)) {
          data.log = data.log.filter((_, idx) => idx !== logIndex);
          await setDoc(docRef, data, { merge: true });
          if (window.renderUserInfoSection) {
            await window.renderUserInfoSection();
          }
        }
      }
    }
  } catch (e) {
    console.error('Error deleting log entry:', e);
  }
}

async function deleteAllLogs() {
  const confirmed = confirm('Are you sure you want to remove all logs? This action cannot be undone.');
  if (!confirmed) return;
  
  try {
    if (typeof window !== 'undefined' && window.firebaseDb) {
      const firestore = await import('firebase/firestore');
      const { doc, getDoc, setDoc } = firestore;
      const deviceId = getDeviceId();
      const docRef = doc(window.firebaseDb, 'User Data', deviceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        let data = snap.data();
        data.log = [];
        await setDoc(docRef, data, { merge: true });
        if (window.renderUserInfoSection) {
          await window.renderUserInfoSection();
        }
      }
    }
  } catch (e) {
    console.error('Error deleting all logs:', e);
  }
}

function formatJsonForDisplay(obj, indent = 0) {
  if (obj === null) return '<span class="firebase-json-null">null</span>';
  if (typeof obj === 'boolean') return `<span class="firebase-json-boolean">${obj}</span>`;
  if (typeof obj === 'number') return `<span class="firebase-json-number">${obj}</span>`;
  if (typeof obj === 'string') return `<span class="firebase-json-string">"${obj.replace(/"/g, '\\"')}"</span>`;
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(item => {
      const itemStr = formatJsonForDisplay(item, indent + 1);
      return '  '.repeat(indent + 1) + itemStr;
    }).join(',\n');
    return `[\n${items}\n${'  '.repeat(indent)}]`;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys.map(key => {
      const value = formatJsonForDisplay(obj[key], indent + 1);
      return `${'  '.repeat(indent + 1)}<span class="firebase-json-key">"${key}"</span>: ${value}`;
    }).join(',\n');
    return `{\n${items}\n${'  '.repeat(indent)}}`;
  }
  
  return String(obj);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(text).replace(/[&<>"']/g, m => map[m]);
}

export async function renderUserInfoSection() {
  try {
    let userInfoSection = document.getElementById('user-info-section');
    if (!userInfoSection) {
      return;
    }

    const userName = localStorage.getItem('userName') || 'User';
    const userEmail = localStorage.getItem('userEmail') || 'user@email.com';
    const userPFP = localStorage.getItem('userPFP') || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%2300ffff%22%3E%3Ccircle cx=%2212%22 cy=%228%22 r=%224%22/%3E%3Cpath d=%22M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z%22/%3E%3C/svg%3E';
    
    const deviceInfo = getDeviceInfo();
    const deviceId = getDeviceId();
    const { data: firebaseData } = await fetchFirebaseData();

    const allLogs = firebaseData?.log || [];
    
    let htmlContent = `
      <div class="user-info-header">
        <img src="${escapeHtml(userPFP)}" alt="User profile" class="user-info-avatar" />
        <div class="user-info-details">
          <div class="user-info-name">${escapeHtml(userName)}</div>
          <div class="user-info-email">${escapeHtml(userEmail)}</div>
          <div class="user-info-device-id">Device ID: ${escapeHtml(deviceId)}</div>
        </div>
      </div>

      <div class="user-info-container">
        <div class="user-info-card">
          <div class="user-info-card-title">Device Information</div>
          <div class="device-info-grid">
            <div class="device-info-item">
              <span class="device-info-label">User Agent:</span>
              <span class="device-info-value">${escapeHtml(deviceInfo.userAgent || 'N/A')}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Platform:</span>
              <span class="device-info-value">${escapeHtml(deviceInfo.platform || 'N/A')}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Language:</span>
              <span class="device-info-value">${escapeHtml(deviceInfo.language || 'N/A')}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Vendor:</span>
              <span class="device-info-value">${escapeHtml(deviceInfo.vendor || 'N/A')}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Hardware Concurrency:</span>
              <span class="device-info-value">${deviceInfo.hardwareConcurrency || 'N/A'}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Max Touch Points:</span>
              <span class="device-info-value">${deviceInfo.maxTouchPoints || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div class="user-info-card">
          <div class="user-info-card-title">Account Summary</div>
          <div class="device-info-grid">
            <div class="device-info-item">
              <span class="device-info-label">Total Sessions:</span>
              <span class="device-info-value">${allLogs.length || 0}</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Account Status:</span>
              <span class="device-info-value">Active</span>
            </div>
            <div class="device-info-item">
              <span class="device-info-label">Last Visit:</span>
              <span class="device-info-value">${allLogs.length > 0 ? 'Today' : 'First Visit'}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="log-section">
        <div class="log-section-header">
          <h3 class="log-section-title">Activity Log</h3>
          ${allLogs.length > 0 ? `<button class="log-delete-all-btn" onclick="window.deleteAllLogs()"><i class="fas fa-trash"></i> Delete All</button>` : ''}
        </div>
        <div class="log-entries">
          ${allLogs.length > 0 ? allLogs.map((log, index) => `
            <div class="log-entry">
              <span class="log-entry-text">${escapeHtml(log)}</span>
              <button class="log-entry-delete-btn" onclick="window.deleteLogEntry(${index})" title="Delete this log entry">×</button>
            </div>
          `).join('') : '<div class="log-entry" style="text-align: center; border-left: none;">No activity logs yet</div>'}
        </div>
        ${allLogs.length > 10 ? '<div class="scroll-indicator">Scroll to see more logs</div>' : ''}
      </div>
    `;

    userInfoSection.innerHTML = htmlContent;
  } catch (e) {
    console.error('Error rendering user info section:', e);
  }
}

if (typeof window !== 'undefined') {
  window.renderUserInfoSection = renderUserInfoSection;
  window.deleteLogEntry = deleteLogEntry;
  window.deleteAllLogs = deleteAllLogs;
}

export default renderUserInfoSection;
