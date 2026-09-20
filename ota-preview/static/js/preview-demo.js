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
   OTA Server UI - Static Preview Shim
   ────────────────────────────────────────────────────────────────────────────
   Loaded ONLY by the documentation preview build (Server_OTA/scripts/
   build_preview.sh injects the tag and sets window.OTA_PREVIEW_MODE = true).
   It is inert when served by the real Go server, because that server never
   references this file from web/templates/index.html.

   Purpose: the preview is published on a static host (GitHub Pages), where
   /api/stats, /api/health and /api/firmware/list do not exist. This shim
   answers those three GET endpoints with demo payloads that follow the exact
   contract of the Go server:

     utils.RespondSuccess  -> {"data": <payload>, "message": string,
                               "success": true}          (models.APIResponse)
     /api/stats            -> {total_files, total_size, downloads,
                               server_version}            (handlers.HandleStats)
     /api/health           -> {status, memory_mb, goroutines, timestamp}
                                                        (models.HealthStatus)
     /api/firmware/list    -> [{size, mod_time, name, version, device_type,
                               description}]            (models.FirmwareInfo)

   The payload SHAPES match the handlers exactly. Two health values are
   illustrative rather than reproductions: the current server returns
   goroutines = 0 (the struct feeding it is never populated) and
   timestamp = 0 (services.GetUnixTime is a TODO stub). The firmware entries,
   by contrast, carry exactly the version, device_type and description the
   server's own metadata derivation would produce for those file names.

   Write paths (upload / download / delete) have no static equivalent, so they
   are replaced by an explanatory notification instead of a failing request.
   ════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    if (!window.OTA_PREVIEW_MODE) {
        return;
    }

    // ============================================
    // Demo Dataset (models.FirmwareInfo)
    // ============================================

    const DAY_MS = 24 * 60 * 60 * 1000;

    /**
     * Build an ISO-8601 timestamp `days` days before now.
     * Keeps the preview dashboard from showing permanently stale dates.
     */
    function daysAgo(days) {
        return new Date(Date.now() - days * DAY_MS).toISOString();
    }

    // File names, versions, device types and descriptions below are exactly what
    // services.ListFirmwareFiles() would derive for these files: extractVersion()
    // reads the text after "_v" up to the next "." or "_", detectDeviceType()
    // matches esp32/esp8266/arduino/stm32 in the name (otherwise "Generic"), and
    // generateDescription() returns "Firmware for <device type>".
    const DEMO_FILES = [
        {
            name: 'jetson_orin_nano_super_perception_v241.img',
            size: 268435456,
            mod_time: daysAgo(2),
            version: 'v241',
            device_type: 'Generic',
            description: 'Firmware for Generic'
        },
        {
            name: 'stm32f407_motor_control_v183.bin',
            size: 262144,
            mod_time: daysAgo(6),
            version: 'v183',
            device_type: 'STM32',
            description: 'Firmware for STM32'
        },
        {
            name: 'openmv_rt1062_vision_v120.bin',
            size: 1572864,
            mod_time: daysAgo(11),
            version: 'v120',
            device_type: 'Generic',
            description: 'Firmware for Generic'
        },
        {
            name: 'esp32_sensor_bridge_v210.bin',
            size: 1048576,
            mod_time: daysAgo(15),
            version: 'v210',
            device_type: 'ESP32',
            description: 'Firmware for ESP32'
        },
        {
            name: 'arduino_portenta_h7_flight_v095.bin',
            size: 786432,
            mod_time: daysAgo(19),
            version: 'v095',
            device_type: 'Arduino',
            description: 'Firmware for Arduino'
        }
    ];

    // Statistics are derived from the dataset above so the preview stays
    // internally consistent (no hand-written totals that can drift).
    const DEMO_DOWNLOAD_COUNT = 128;

    function demoStats() {
        return {
            total_files: DEMO_FILES.length,
            total_size: DEMO_FILES.reduce(function (sum, file) {
                return sum + file.size;
            }, 0),
            downloads: DEMO_DOWNLOAD_COUNT,
            server_version: '3.0.0'
        };
    }

    function demoHealth() {
        return {
            status: 'operational',
            memory_mb: 24,
            goroutines: 12,
            timestamp: Math.floor(Date.now() / 1000)
        };
    }

    /** Wrap a payload in the server's models.APIResponse envelope. */
    function apiResponse(data, message) {
        return { data: data, message: message, success: true };
    }

    const ROUTES = {
        '/api/stats': function () {
            return apiResponse(demoStats(), 'Server statistics');
        },
        '/api/health': function () {
            return apiResponse(demoHealth(), 'Server is healthy');
        },
        '/api/firmware/list': function () {
            return apiResponse(DEMO_FILES.slice(), 'Firmware list');
        }
    };

    // ============================================
    // Fetch Interception
    // ============================================

    /**
     * Resolve a fetch() input to the pathname the Go server would route on.
     */
    function routeKeyOf(input) {
        const raw = typeof input === 'string' ? input : (input && input.url) || '';
        if (!raw) {
            return null;
        }

        let pathname;
        try {
            pathname = new URL(raw, window.location.href).pathname;
        } catch (error) {
            return null;
        }

        // The preview is published under a sub-path (…/ota-preview/), so match
        // on the endpoint suffix rather than on an exact absolute path.
        const keys = Object.keys(ROUTES);
        for (let i = 0; i < keys.length; i += 1) {
            if (pathname === keys[i] || pathname.endsWith(keys[i])) {
                return keys[i];
            }
        }
        return null;
    }

    const originalFetch = window.fetch ? window.fetch.bind(window) : null;

    window.fetch = function (input, init) {
        const key = routeKeyOf(input);

        if (key) {
            const body = JSON.stringify(ROUTES[key]());
            return Promise.resolve(new Response(body, {
                status: 200,
                statusText: 'OK',
                headers: { 'Content-Type': 'application/json' }
            }));
        }

        if (originalFetch) {
            return originalFetch(input, init);
        }
        return Promise.reject(new Error('fetch is unavailable in this browser'));
    };

    // ============================================
    // Preview Banner
    // ============================================

    const DOCS_URL = 'https://tng-blue.github.io/Isaac_ROS-Jetbot_NanoOWL/' +
        'documentation/deployment/ota-web-ui/';

    function injectBanner() {
        if (document.getElementById('otaPreviewBanner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'otaPreviewBanner';
        banner.setAttribute('role', 'note');
        banner.innerHTML =
            '<span class="ota-preview-banner__badge">PREVIEW</span>' +
            '<span class="ota-preview-banner__text">Static UI preview with demo ' +
            'data &mdash; read-only. Upload, download and delete need a running ' +
            'OTA server.</span>' +
            '<a class="ota-preview-banner__link" href="' + DOCS_URL + '">' +
            'How to run it locally</a>';

        const style = document.createElement('style');
        style.textContent = [
            '#otaPreviewBanner{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
            'display:flex;flex-wrap:wrap;gap:.75rem;align-items:center;',
            'justify-content:center;padding:.6rem 1rem;',
            'background:rgba(15,23,42,.94);color:#e2e8f0;',
            'border-top:1px solid rgba(99,102,241,.55);',
            'font:500 .82rem/1.35 Inter,system-ui,sans-serif;',
            'backdrop-filter:blur(8px);text-align:center}',
            '#otaPreviewBanner .ota-preview-banner__badge{padding:.15rem .5rem;',
            'border-radius:999px;background:linear-gradient(135deg,#6366f1,#8b5cf6);',
            'color:#fff;font-weight:700;letter-spacing:.08em;font-size:.68rem}',
            '#otaPreviewBanner .ota-preview-banner__link{color:#a5b4fc;',
            'text-decoration:underline;white-space:nowrap}',
            'body{padding-bottom:3.25rem}'
        ].join('');

        document.head.appendChild(style);
        document.body.appendChild(banner);
    }

    // ============================================
    // Read-Only Guards
    // ============================================

    const READ_ONLY_MESSAGE =
        'Preview mode: this is a static copy of the UI, so there is no server ' +
        'to accept the request.';

    function notify(message) {
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, 'info');
        } else {
            console.info('[ota-preview] ' + message);
        }
    }

    /**
     * Replace a node with a listener-free clone and return the clone.
     * cloneNode(true) copies markup but not event listeners, which is how the
     * upload handlers installed by script.js are detached.
     */
    function detachListeners(node) {
        if (!node || !node.parentNode) {
            return null;
        }
        const clone = node.cloneNode(true);
        node.parentNode.replaceChild(clone, node);
        return clone;
    }

    function applyReadOnlyGuards() {
        const uploadZone = detachListeners(document.getElementById('uploadZone'));
        if (uploadZone) {
            uploadZone.style.cursor = 'not-allowed';
            uploadZone.addEventListener('click', function () {
                notify(READ_ONLY_MESSAGE);
            });
            uploadZone.addEventListener('dragover', function (event) {
                event.preventDefault();
            });
            uploadZone.addEventListener('drop', function (event) {
                event.preventDefault();
                notify(READ_ONLY_MESSAGE);
            });
        }

        detachListeners(document.getElementById('fileInput'));

        window.downloadFile = function (filename) {
            notify('Preview mode: "' + filename + '" is demo metadata only, ' +
                'there is no firmware binary to download.');
        };

        window.deleteFile = function (filename) {
            notify('Preview mode: "' + filename + '" cannot be deleted, the ' +
                'dataset is static.');
        };
    }

    // script.js assigns its public helpers (downloadFile, deleteFile, …) while
    // it is parsed and starts the app on DOMContentLoaded. The `load` event
    // fires after both, so the overrides below always win.
    window.addEventListener('load', function () {
        injectBanner();
        applyReadOnlyGuards();
    });
}());
