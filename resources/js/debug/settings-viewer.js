(function() {
    // Use same plain key style as the app ("settings")
    // "minimized" or "expanded" - stored in localStorage so it persists across refreshes
    // "removed" state is NOT stored - panel always comes back on refresh
    var PANEL_STATE_KEY = 'settings-viewer-state';

    var state = localStorage.getItem(PANEL_STATE_KEY) || 'expanded';

    var panel = document.createElement('div');
    panel.id = 'debug-settings-panel';
    if (state === 'minimized') panel.className = 'minimized';

    panel.innerHTML = '<div id="debug-settings-header">' +
                        '<span>localStorage</span>' +
                        '<span id="debug-settings-btns">' +
                          '<span id="debug-settings-toggle" title="Minimize / Expand">' + (state === 'minimized' ? '+' : '_') + '</span>' +
                          '<span id="debug-settings-close" title="Remove from page (comes back on refresh)">x</span>' +
                        '</span>' +
                      '</div>' +
                      '<div id="debug-settings-actions">' +
                        '<button id="debug-settings-refresh">Refresh</button>' +
                        '<button id="debug-settings-copy">Copy JSON</button>' +
                        '<button id="debug-settings-clear">Clear Settings</button>' +
                      '</div>' +
                      '<input id="debug-settings-search" type="text" placeholder="Filter keys..." />' +
                      '<div id="debug-settings-tree"></div>';

    var style = document.createElement('style');
    style.textContent = '' +
        '#debug-settings-panel { position: fixed; bottom: 0; right: 0; width: 420px; max-height: 70vh; ' +
            'background: #111; color: #ccc; font-family: monospace; font-size: 12px; border: 1px solid #444; ' +
            'border-radius: 6px 0 0 0; z-index: 999999; display: flex; flex-direction: column; }' +
        '#debug-settings-panel.minimized { max-height: 28px; overflow: hidden; }' +
        '#debug-settings-header { padding: 6px 10px; background: #222; font-weight: bold; ' +
            'color: #7affae; display: flex; justify-content: space-between; border-bottom: 1px solid #333; }' +
        '#debug-settings-btns { display: flex; gap: 10px; }' +
        '#debug-settings-toggle { color: #888; cursor: pointer; }' +
        '#debug-settings-toggle:hover { color: #fff; }' +
        '#debug-settings-close { color: #ff6347; cursor: pointer; }' +
        '#debug-settings-close:hover { color: #ff4444; }' +
        '#debug-settings-actions { padding: 6px 10px; display: flex; gap: 6px; border-bottom: 1px solid #333; }' +
        '#debug-settings-actions button { background: #333; color: #ccc; border: 1px solid #555; padding: 3px 10px; ' +
            'border-radius: 3px; cursor: pointer; font-family: monospace; font-size: 11px; }' +
        '#debug-settings-actions button:hover { background: #444; }' +
        '#debug-settings-clear { color: #ff6347 !important; }' +
        '#debug-settings-search { margin: 6px 10px; padding: 4px 8px; background: #1a1a1a; color: #ccc; ' +
            'border: 1px solid #444; border-radius: 3px; font-family: monospace; font-size: 12px; }' +
        '#debug-settings-tree { overflow-y: auto; padding: 6px 10px; flex: 1; }' +
        '.ds-key { color: #8ce6ff; cursor: pointer; }' +
        '.ds-key:hover { text-decoration: underline; }' +
        '.ds-val-string { color: #ce9178; }' +
        '.ds-val-number { color: #b5cea8; }' +
        '.ds-val-bool { color: #569cd6; }' +
        '.ds-val-null { color: #888; }' +
        '.ds-node { margin-left: 16px; }' +
        '.ds-row { line-height: 1.6; white-space: nowrap; }' +
        '.ds-toggle { color: #888; cursor: pointer; user-select: none; margin-right: 4px; }' +
        '.ds-hidden { display: none; }' +
        '.ds-storage-key { background: #222; border: 1px solid #444; border-radius: 4px; margin: 6px 0; padding: 8px; }' +
        '.ds-storage-key-header { color: #7affae; font-weight: bold; font-size: 13px; cursor: pointer; margin-bottom: 4px; }';

    document.body.appendChild(style);
    document.body.appendChild(panel);

    function setMinimized(minimized) {
        state = minimized ? 'minimized' : 'expanded';
        panel.className = minimized ? 'minimized' : '';
        document.getElementById('debug-settings-toggle').textContent = minimized ? '+' : '_';
        localStorage.setItem(PANEL_STATE_KEY, state);
    }

    // Toggle minimize/expand
    document.getElementById('debug-settings-toggle').addEventListener('click', function(e) {
        e.stopPropagation();
        setMinimized(state !== 'minimized');
    });

    // Header click also toggles
    document.getElementById('debug-settings-header').addEventListener('click', function(e) {
        if (e.target.id === 'debug-settings-close' || e.target.id === 'debug-settings-toggle') return;
        setMinimized(state !== 'minimized');
    });

    // Close button - remove from DOM, don't persist removal
    document.getElementById('debug-settings-close').addEventListener('click', function(e) {
        e.stopPropagation();
        panel.remove();
    });

    function renderValue(val) {
        if (val === null || val === undefined) return '<span class="ds-val-null">null</span>';
        if (typeof val === 'string') return '<span class="ds-val-string">"' + escHtml(val) + '"</span>';
        if (typeof val === 'number') return '<span class="ds-val-number">' + val + '</span>';
        if (typeof val === 'boolean') return '<span class="ds-val-bool">' + val + '</span>';
        return escHtml(String(val));
    }

    function escHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function renderTree(obj, filter, path) {
        if (!obj || typeof obj !== 'object') return renderValue(obj);
        var html = '';
        var keys = Object.keys(obj);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var fullPath = path ? path + '.' + key : key;
            var val = obj[key];
            var matchesFilter = !filter || fullPath.toLowerCase().indexOf(filter) !== -1;

            if (val && typeof val === 'object' && !Array.isArray(val)) {
                var childHtml = renderTree(val, filter, fullPath);
                if (!filter || childHtml) {
                    html += '<div class="ds-row">' +
                        '<span class="ds-toggle" data-path="' + escHtml(fullPath) + '">-</span>' +
                        '<span class="ds-key">' + escHtml(key) + '</span>: {' +
                        '</div>' +
                        '<div class="ds-node" data-node="' + escHtml(fullPath) + '">' + childHtml + '</div>' +
                        '<div class="ds-row">}</div>';
                }
            } else if (Array.isArray(val)) {
                var childHtml = '';
                for (var j = 0; j < val.length; j++) {
                    var itemPath = fullPath + '[' + j + ']';
                    var itemVal = val[j];
                    if (itemVal && typeof itemVal === 'object') {
                        childHtml += '<div class="ds-row">' +
                            '<span class="ds-toggle" data-path="' + escHtml(itemPath) + '">-</span>' +
                            '<span class="ds-key">' + j + '</span>: {' +
                            '</div>' +
                            '<div class="ds-node" data-node="' + escHtml(itemPath) + '">' + renderTree(itemVal, filter, itemPath) + '</div>' +
                            '<div class="ds-row">}</div>';
                    } else {
                        var itemMatch = !filter || itemPath.toLowerCase().indexOf(filter) !== -1;
                        if (itemMatch) {
                            childHtml += '<div class="ds-row"><span class="ds-key">' + j + '</span>: ' + renderValue(itemVal) + '</div>';
                        }
                    }
                }
                if (!filter || childHtml) {
                    html += '<div class="ds-row">' +
                        '<span class="ds-toggle" data-path="' + escHtml(fullPath) + '">-</span>' +
                        '<span class="ds-key">' + escHtml(key) + '</span>: [' + val.length + ']' +
                        '</div>' +
                        '<div class="ds-node" data-node="' + escHtml(fullPath) + '">' + childHtml + '</div>';
                }
            } else {
                if (matchesFilter) {
                    html += '<div class="ds-row"><span class="ds-key">' + escHtml(key) + '</span>: ' + renderValue(val) + '</div>';
                }
            }
        }
        return html;
    }

    function renderStorageKey(storageKey, filter) {
        if (storageKey === PANEL_STATE_KEY) return '';
        var raw = localStorage.getItem(storageKey);
        if (raw === null) return '';
        var parsed = null;
        try { parsed = JSON.parse(raw); } catch(e) { parsed = null; }

        // For "settings" key, show "state" sub-key first
        if (storageKey === 'settings' && parsed && typeof parsed === 'object' && parsed.state) {
            var reordered = { state: parsed.state };
            Object.keys(parsed).forEach(function(k) {
                if (k !== 'state') reordered[k] = parsed[k];
            });
            parsed = reordered;
        }

        var html = '';
        if (parsed && typeof parsed === 'object') {
            var childHtml = renderTree(parsed, filter, storageKey);
            if (!filter || childHtml) {
                html = '<div class="ds-storage-key">' +
                    '<div class="ds-storage-key-header">' +
                        '<span class="ds-toggle" data-path="' + escHtml(storageKey) + '">-</span> ' +
                        escHtml(storageKey) +
                    '</div>' +
                    '<div class="ds-node" data-node="' + escHtml(storageKey) + '">' + childHtml + '</div>' +
                    '</div>';
            }
        } else {
            var matchesFilter = !filter || storageKey.toLowerCase().indexOf(filter) !== -1 ||
                (raw && raw.toLowerCase().indexOf(filter) !== -1);
            if (matchesFilter) {
                html = '<div class="ds-storage-key">' +
                    '<div class="ds-storage-key-header">' + escHtml(storageKey) + '</div>' +
                    '<div class="ds-row">' +
                        (parsed !== null ? renderValue(parsed) : '<span class="ds-val-string">"' + escHtml(raw.length > 200 ? raw.substring(0, 200) + '...' : raw) + '"</span>') +
                    '</div>' +
                    '</div>';
            }
        }
        return html;
    }

    function refresh(filter) {
        var tree = document.getElementById('debug-settings-tree');
        if (!tree) return;
        var html = '';
        var count = localStorage.length;

        if (count === 0) {
            tree.innerHTML = '<div style="color:#888;padding:10px;">localStorage is empty</div>';
            return;
        }

        // Show "settings" key first
        if (localStorage.getItem('settings') !== null) {
            html += renderStorageKey('settings', filter);
        }

        // Then all other keys
        for (var i = 0; i < count; i++) {
            var storageKey = localStorage.key(i);
            if (storageKey === 'settings' || storageKey === PANEL_STATE_KEY) continue;
            html += renderStorageKey(storageKey, filter);
        }

        tree.innerHTML = html || '<div style="color:#888;padding:10px;">No matches</div>';
    }

    // Toggle collapse/expand nodes
    document.getElementById('debug-settings-tree').addEventListener('click', function(e) {
        if (e.target.classList.contains('ds-toggle')) {
            var path = e.target.getAttribute('data-path');
            var node = document.querySelector('[data-node="' + path + '"]');
            if (node) {
                var isHidden = node.classList.contains('ds-hidden');
                node.classList.toggle('ds-hidden');
                e.target.textContent = isHidden ? '-' : '+';
            }
        }
    });

    document.getElementById('debug-settings-refresh').addEventListener('click', function() {
        var filter = document.getElementById('debug-settings-search').value.toLowerCase();
        refresh(filter);
    });

    document.getElementById('debug-settings-copy').addEventListener('click', function() {
        var all = {};
        for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key === PANEL_STATE_KEY) continue;
            var val = localStorage.getItem(key);
            try { all[key] = JSON.parse(val); } catch(e) { all[key] = val; }
        }
        navigator.clipboard.writeText(JSON.stringify(all, null, 2));
    });

    document.getElementById('debug-settings-clear').addEventListener('click', function() {
        if (confirm('Clear "settings" from localStorage?')) {
            localStorage.removeItem('settings');
            refresh('');
        }
    });

    document.getElementById('debug-settings-search').addEventListener('input', function() {
        refresh(this.value.toLowerCase());
    });

    // Initial render after a short delay to let settings load
    setTimeout(function() { refresh(''); }, 1000);
})();
