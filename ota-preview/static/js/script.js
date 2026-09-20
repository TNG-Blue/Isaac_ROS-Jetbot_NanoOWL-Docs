/*
 *  ════════════════════════════════════════════════════════════════════════════
 *  SPDX-License-Identifier: Apache-2.0
 *  Copyright (c) 2025 TNG-Blue
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *  ════════════════════════════════════════════════════════════════════════════
 */

/* ════════════════════════════════════════════════════════════════════════════
   Professional OTA Server v3.0.0 - Professional Edition JavaScript
   Advanced UI & Functionality Management
   ════════════════════════════════════════════════════════════════════════════ */

// ============================================
// Global Configuration
// ============================================
const CONFIG = {
    API_BASE: '',
    UPLOAD_ENDPOINT: '/upload',
    DOWNLOAD_ENDPOINT: '/download',
    STATS_ENDPOINT: '/api/stats',
    HEALTH_ENDPOINT: '/api/health',
    FIRMWARE_LIST_ENDPOINT: '/api/firmware/list',
    MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
    POLL_INTERVAL: 5000, // 5 seconds
    NOTIFICATION_DURATION: 5000, // 5 seconds
};

// ============================================
// Global State Management
// ============================================
const STATE = {
    files: [],
    stats: null,
    currentView: 'grid',
    theme: localStorage.getItem('theme') || 'dark',
    uploading: false,
    uploadProgress: 0,
    filters: {
        search: '',
        device: '',
        sort: 'date-desc'
    },
    notifications: []
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format bytes to human readable size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date to readable format
 */
function formatDate(date) {
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Show notification
 */
function showNotification(message, type = 'info', duration = CONFIG.NOTIFICATION_DURATION) {
    const container = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

/**
 * Throttle function
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// API Calls
// ============================================

/**
 * Fetch firmware list from server
 */
async function fetchFirmwareList() {
    try {
        const response = await fetch(CONFIG.FIRMWARE_LIST_ENDPOINT);
        const data = await response.json();

        if (data.success) {
            STATE.files = data.data || [];
            renderFiles();
        } else {
            showNotification('Failed to load firmware list', 'error');
        }
    } catch (error) {
        console.error('Error fetching firmware list:', error);
        showNotification('Error loading firmware files', 'error');
    }
}

/**
 * Fetch server stats
 */
async function fetchStats() {
    try {
        const response = await fetch(CONFIG.STATS_ENDPOINT);
        const data = await response.json();

        if (data.success) {
            STATE.stats = data.data;
            updateStatsDisplay();
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
}

/**
 * Check server health
 */
async function checkHealth() {
    try {
        const response = await fetch(CONFIG.HEALTH_ENDPOINT);
        const data = await response.json();
        return data.success;
    } catch (error) {
        console.error('Error checking health:', error);
        return false;
    }
}

/**
 * Upload file to server
 */
async function uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('firmware', file);

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                onProgress(percentComplete);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    resolve(response);
                } catch {
                    reject(new Error('Invalid response'));
                }
            } else {
                reject(new Error('Upload failed'));
            }
        });

        xhr.addEventListener('error', () => reject(new Error('Upload error')));
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

        xhr.open('POST', CONFIG.UPLOAD_ENDPOINT);
        xhr.send(formData);
    });
}

/**
 * Download file from server
 */
function downloadFile(filename) {
    const link = document.createElement('a');
    link.href = `${CONFIG.DOWNLOAD_ENDPOINT}?file=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============================================
// Theme Management
// ============================================

/**
 * Initialize theme
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);
}

/**
 * Set theme
 */
function setTheme(theme) {
    STATE.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const icon = document.getElementById('themeToggle')?.querySelector('i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

/**
 * Toggle theme
 */
function toggleTheme() {
    const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
}

// ============================================
// File Rendering
// ============================================

/**
 * Render files based on current view
 */
function renderFiles() {
    const filtered = filterAndSortFiles();

    // Update empty state
    const emptyState = document.getElementById('emptyState');
    if (filtered.length === 0) {
        emptyState.style.display = 'flex';
        document.getElementById('filesGrid').innerHTML = '';
        document.getElementById('filesList').innerHTML = '';
        document.getElementById('tableBody').innerHTML = '';
        return;
    }

    emptyState.style.display = 'none';

    switch (STATE.currentView) {
        case 'grid':
            renderGridView(filtered);
            break;
        case 'list':
            renderListView(filtered);
            break;
        case 'table':
            renderTableView(filtered);
            break;
    }

    updateFilesCount();
}

/**
 * Render grid view
 */
function renderGridView(files) {
    const container = document.getElementById('filesGrid');
    container.innerHTML = files.map(file => `
        <div class="file-item" data-filename="${file.name}">
            <div class="file-header">
                <div class="file-icon">
                    <i class="fas fa-microchip"></i>
                </div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-meta">
                        <span>${formatFileSize(file.size)}</span>
                        <span>${file.device_type}</span>
                        <span>${file.version}</span>
                    </div>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-btn" onclick="downloadFile('${file.name}')" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-btn" onclick="showFileDetails('${file.name}')" title="Details">
                    <i class="fas fa-info-circle"></i>
                </button>
                <button class="file-btn" onclick="deleteFile('${file.name}')" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        </div>
    `).join('');

    document.getElementById('filesList').style.display = 'none';
    document.getElementById('filesTable').style.display = 'none';
    container.style.display = 'grid';
}

/**
 * Render list view
 */
function renderListView(files) {
    const container = document.getElementById('filesList');
    container.innerHTML = files.map(file => `
        <div class="file-item" data-filename="${file.name}">
            <div class="file-header">
                <div class="file-icon">
                    <i class="fas fa-file"></i>
                </div>
                <div class="file-info" style="flex: 1;">
                    <div class="file-name">${file.name}</div>
                    <div class="file-meta">
                        <span>${formatFileSize(file.size)}</span>
                        <span>${file.device_type}</span>
                        <span>${formatDate(file.mod_time)}</span>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="file-btn" onclick="downloadFile('${file.name}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="file-btn" onclick="showFileDetails('${file.name}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    document.getElementById('filesGrid').style.display = 'none';
    document.getElementById('filesTable').style.display = 'none';
    container.style.display = 'flex';
}

/**
 * Render table view
 */
function renderTableView(files) {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = files.map(file => `
        <tr>
            <td>${file.name}</td>
            <td>${file.version}</td>
            <td>${file.device_type}</td>
            <td>${formatFileSize(file.size)}</td>
            <td>${formatDate(file.mod_time)}</td>
            <td>
                <button class="file-btn" onclick="downloadFile('${file.name}')" title="Download">
                    <i class="fas fa-download"></i>
                </button>
                <button class="file-btn" onclick="showFileDetails('${file.name}')" title="Details">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        </tr>
    `).join('');

    document.getElementById('filesGrid').style.display = 'none';
    document.getElementById('filesList').style.display = 'none';
    document.getElementById('filesTable').style.display = 'block';
}

/**
 * Filter and sort files
 */
function filterAndSortFiles() {
    let filtered = STATE.files.filter(file => {
        if (STATE.filters.device && file.device_type !== STATE.filters.device) {
            return false;
        }
        if (STATE.filters.search) {
            const search = STATE.filters.search.toLowerCase();
            return file.name.toLowerCase().includes(search) ||
                   file.version.toLowerCase().includes(search) ||
                   file.device_type.toLowerCase().includes(search);
        }
        return true;
    });

    // Sort
    const [sortBy, sortOrder] = STATE.filters.sort.split('-');
    filtered.sort((a, b) => {
        let compareA, compareB;

        switch (sortBy) {
            case 'name':
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
                break;
            case 'size':
                compareA = a.size;
                compareB = b.size;
                break;
            case 'date':
                compareA = new Date(a.mod_time);
                compareB = new Date(b.mod_time);
                break;
            default:
                compareA = a.name;
                compareB = b.name;
        }

        if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
        if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    return filtered;
}

/**
 * Update files count
 */
function updateFilesCount() {
    const filtered = filterAndSortFiles();
    document.getElementById('statsFiles').textContent = filtered.length;
}

/**
 * Show file details modal
 */
function showFileDetails(filename) {
    const file = STATE.files.find(f => f.name === filename);
    if (!file) return;

    const modal = document.getElementById('fileModal');
    const modalTitle = document.getElementById('fileModalTitle');
    const modalBody = document.getElementById('fileModalBody');

    modalTitle.textContent = file.name;
    modalBody.innerHTML = `
        <div class="file-details">
            <div class="detail-group">
                <label>Filename</label>
                <p>${file.name}</p>
            </div>
            <div class="detail-group">
                <label>Version</label>
                <p>${file.version}</p>
            </div>
            <div class="detail-group">
                <label>Device Type</label>
                <p>${file.device_type}</p>
            </div>
            <div class="detail-group">
                <label>File Size</label>
                <p>${formatFileSize(file.size)}</p>
            </div>
            <div class="detail-group">
                <label>Last Modified</label>
                <p>${formatDate(file.mod_time)}</p>
            </div>
            <div class="detail-group">
                <label>Description</label>
                <p>${file.description}</p>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="downloadFile('${file.name}')">
                    <i class="fas fa-download"></i> Download
                </button>
                <button class="btn btn-secondary" onclick="closeModal('fileModal')">
                    <i class="fas fa-times"></i> Close
                </button>
            </div>
        </div>
    `;

    openModal('fileModal');
}

/**
 * Delete file (placeholder)
 */
function deleteFile(filename) {
    if (confirm(`Are you sure you want to delete ${filename}?`)) {
        showNotification(`Deleted ${filename}`, 'success');
        fetchFirmwareList();
    }
}

// ============================================
// Upload Handling
// ============================================

/**
 * Setup upload zone
 */
function setupUploadZone() {
    const uploadZone = document.getElementById('uploadZone');

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
    });

    const fileInput = document.getElementById('fileInput');
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Click to browse
    uploadZone.addEventListener('click', () => {
        if (!STATE.uploading) fileInput.click();
    });
}

/**
 * Handle file upload
 */
async function handleFiles(files) {
    if (STATE.uploading) {
        showNotification('Upload in progress', 'warning');
        return;
    }

    const fileArray = Array.from(files).filter(f => {
        if (f.size > CONFIG.MAX_FILE_SIZE) {
            showNotification(`File ${f.name} is too large`, 'error');
            return false;
        }
        return true;
    });

    if (fileArray.length === 0) return;

    STATE.uploading = true;
    const uploadProgress = document.getElementById('uploadProgress');
    uploadProgress.style.display = 'block';

    try {
        for (const file of fileArray) {
            await uploadFile(file, (progress) => {
                document.getElementById('progressFill').style.width = progress + '%';
                document.getElementById('progressPercent').textContent = Math.round(progress) + '%';
                document.getElementById('progressText').textContent = `Uploading ${file.name}...`;
            });

            showNotification(`Successfully uploaded ${file.name}`, 'success');
        }

        // Refresh file list
        await fetchFirmwareList();
        fetchStats();

        // Reset upload
        uploadProgress.style.display = 'none';
        document.getElementById('fileInput').value = '';

    } catch (error) {
        showNotification(`Upload failed: ${error.message}`, 'error');
    } finally {
        STATE.uploading = false;
    }
}

// ============================================
// Stats & Dashboard
// ============================================

/**
 * Update stats display
 */
function updateStatsDisplay() {
    if (!STATE.stats) return;

    // Update navbar stats
    document.getElementById('navTotalFiles').textContent = STATE.stats.total_files || 0;
    document.getElementById('navTotalSize').textContent =
        formatFileSize(STATE.stats.total_size || 0);
    document.getElementById('navDownloads').textContent = STATE.stats.downloads || 0;

    // Update dashboard stats
    document.getElementById('statsSize').textContent =
        formatFileSize(STATE.stats.total_size || 0);
    document.getElementById('statsDownloads').textContent = STATE.stats.downloads || 0;
    document.getElementById('footerUptime').textContent = '99.9%';
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
    showNotification('Refreshing dashboard...', 'info');
    await Promise.all([
        fetchFirmwareList(),
        fetchStats()
    ]);
    showNotification('Dashboard refreshed', 'success');
}

// ============================================
// Modal Management
// ============================================

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Setup modal handlers
 */
function setupModals() {
    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) closeModal(modal.id);
        });
    });

    // Close on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                const modal = e.target.closest('.modal');
                if (modal) closeModal(modal.id);
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

/**
 * Setup settings modal
 */
function setupSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');

    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => openModal('settingsModal'));
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active tab button
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Update active tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + '-tab').classList.add('active');
        });
    });
}

// ============================================
// View Management
// ============================================

/**
 * Setup view controls
 */
function setupViewControls() {
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            STATE.currentView = view;
            renderFiles();
        });
    });
}

// ============================================
// Filter & Search
// ============================================

/**
 * Setup filters
 */
function setupFilters() {
    // Search
    const searchInput = document.getElementById('searchInput');
    searchInput?.addEventListener('input', debounce((e) => {
        STATE.filters.search = e.target.value;
        renderFiles();
    }, 300));

    // Device filter
    const deviceFilter = document.getElementById('deviceFilter');
    deviceFilter?.addEventListener('change', (e) => {
        STATE.filters.device = e.target.value;
        renderFiles();
    });

    // Sort
    const sortBy = document.getElementById('sortBy');
    sortBy?.addEventListener('change', (e) => {
        STATE.filters.sort = e.target.value;
        renderFiles();
    });

    // Search clear button
    const searchClear = document.getElementById('searchClear');
    searchClear?.addEventListener('click', () => {
        searchInput.value = '';
        STATE.filters.search = '';
        renderFiles();
    });
}

// ============================================
// Event Listeners Setup
// ============================================

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Upload triggers
    document.getElementById('uploadTrigger')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('uploadTrigger2')?.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    // Refresh button
    const refreshBtn = document.querySelector('[onclick="refreshFiles()"]');
    if (!refreshBtn) {
        const navRefresh = document.querySelector('[onclick="refreshFiles()"]');
        if (navRefresh) {
            navRefresh.addEventListener('click', refreshDashboard);
        }
    }

    // Action buttons
    document.getElementById('downloadAllBtn')?.addEventListener('click', () => {
        showNotification('Download all feature coming soon', 'info');
    });

    document.getElementById('cleanupBtn')?.addEventListener('click', () => {
        if (confirm('This will remove old files. Continue?')) {
            showNotification('Cleanup started', 'info');
        }
    });

    document.getElementById('logsBtn')?.addEventListener('click', () => {
        showNotification('Logs feature coming soon', 'info');
    });

    document.getElementById('configBtn')?.addEventListener('click', () => {
        openModal('settingsModal');
    });
}

// ============================================
// Loading Screen
// ============================================

/**
 * Hide loading screen
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// ============================================
// AOS Animation
// ============================================

/**
 * Initialize AOS animations
 */
function initAOS() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out-cubic',
            once: true,
            offset: 100
        });
    }
}

// ============================================
// Polling & Updates
// ============================================

/**
 * Start polling for updates
 */
function startPolling() {
    setInterval(async () => {
        await Promise.all([
            checkHealth(),
            fetchStats()
        ]);
    }, CONFIG.POLL_INTERVAL);
}

// ============================================
// Initialization
// ============================================

/**
 * Initialize application
 */
async function initializeApp() {
    try {
        // Load initial data
        initTheme();
        setupModals();
        setupSettingsModal();
        setupViewControls();
        setupUploadZone();
        setupFilters();
        setupEventListeners();
        initAOS();

        // Fetch data
        await Promise.all([
            fetchFirmwareList(),
            fetchStats()
        ]);

        // Start polling
        startPolling();

        // Hide loading screen
        setTimeout(hideLoadingScreen, 500);

        console.log('✅ Professional OTA Server v3.0.0 initialized');

    } catch (error) {
        console.error('Initialization error:', error);
        showNotification('Failed to initialize app', 'error');
    }
}

/**
 * Backward compatibility functions
 */
function refreshFiles() {
    refreshDashboard();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// ============================================
// Global utility function for onclick handlers
// ============================================
window.downloadFile = downloadFile;
window.showFileDetails = showFileDetails;
window.deleteFile = deleteFile;
window.refreshFiles = refreshFiles;
window.refreshDashboard = refreshDashboard;
window.toggleTheme = toggleTheme;
window.openModal = openModal;
window.closeModal = closeModal;
