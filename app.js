/**
 * VIDTOCONTENT PRO - MAIN APPLICATION
 * State management, DOM events, and Generation Orchestration.
 * Built with Opus-quality defensive engineering & iOS 26 Liquid Glass ergonomics.
 */

// ==========================================
// DEFENSIVE GLOBAL ERROR BOUNDARY
// ==========================================
window.onerror = function(msg, url, line, col, error) {
    console.error("Global Error Boundary Trapped:", msg, "at", url, ":", line, col, error);
    try {
        // Attempt to show a toast message gracefully
        showToastNotification("A minor interface error occurred. App recovered safely.", "error");
    } catch(e) {}
    return false; // Let browser standard logs proceed
};

window.onunhandledrejection = function(event) {
    console.error("Unhandled Promise Rejection Trapped:", event.reason);
    try {
        showToastNotification("Network operation failed or timed out. Check your connection.", "error");
    } catch(e) {}
};

// Defensive LocalStorage Wrappers
function safeGetLocalStorage(key, fallbackValue) {
    try {
        const val = localStorage.getItem(key);
        return val !== null ? val : fallbackValue;
    } catch(e) {
        console.warn("Storage read failed or blocked for:", key, e);
        return fallbackValue;
    }
}

function safeSetLocalStorage(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch(e) {
        console.warn("Storage write failed or blocked for:", key, e);
    }
}

function safeRemoveLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch(e) {
        console.warn("Storage removal failed or blocked for:", key, e);
    }
}

// Global scope toast proxy for error handlers
let showToastNotification = function(message, type) {
    console.log("Toast queued:", message, type);
};

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const defaultSettings = {
        language: 'Bengali',
        tone: 'Viral and Hype',
        audience: 'বাংলাদেশের ডিজিটাল মার্কেটার ও কন্টেন্ট ক্রিয়েটর',
        niche: '',
        brandVoice: '',
        contentLength: 'Standard',
        emojiDensity: 'Standard',
        ctaStyle: 'Question',
        model: 'gemini-2.5-flash',
        temperature: 0.8,
        maxTokens: 4096,
        safetyFilter: true,
        theme: 'System',
        autoSave: true,
        showWordCount: true
    };

    let initialSettings = defaultSettings;
    try {
        const rawSettings = safeGetLocalStorage('vtc_settings', null);
        if (rawSettings) {
            initialSettings = Object.assign({}, defaultSettings, JSON.parse(rawSettings));
        }
    } catch(e) {
        console.warn("Failed to parse settings from storage. Resetting to default.", e);
    }

    const AppState = {
        apiKey: safeGetLocalStorage('vtc_gemini_api_key', ''),
        activeInputTab: 'tab-transcript',
        audioData: null, // { mimeType, data }
        documentData: null, // { mimeType, data }
        outputs: {}, // Stores generated content for each platform
        lastContentContext: '', // Context string used for the last generation
        isGenerating: false,
        settings: initialSettings,
        history: [], // Stores past generations
        totalTokensSession: 0
    };

    // ==========================================
    // DOM ELEMENTS (WITH NULL GUARDS INSPIRED BY OPUS DEFENSIVE CODE)
    // ==========================================
    const DOM = {
        // API Setup
        apiIndicator: document.getElementById('api-status-indicator'),
        apiStatusText: document.querySelector('.status-text'),
        apiStatusDot: document.querySelector('.status-dot'),
        btnToggleApi: document.getElementById('btn-toggle-api'),
        apiSetupPanel: document.getElementById('api-setup'),
        apiKeyInput: document.getElementById('api-key-input'),
        btnSaveApi: document.getElementById('btn-save-api'),
        btnToggleVisibility: document.getElementById('btn-toggle-visibility'),

        // Settings Drawer
        btnToggleSettings: document.getElementById('btn-toggle-settings'),
        settingsDrawer: document.getElementById('settings-drawer'),
        settingsOverlay: document.getElementById('settings-overlay'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        
        // Settings Tuning Controls
        stTone: document.getElementById('st_tone'),
        stAudience: document.getElementById('st_audience'),
        stNiche: document.getElementById('st_niche'),
        stBrandVoice: document.getElementById('st_brand_voice'),
        stModel: document.getElementById('st_model'),
        stTemperature: document.getElementById('st_temperature'),
        stMaxTokens: document.getElementById('st_max_tokens'),
        stSafety: document.getElementById('st_safety'),
        stAutosave: document.getElementById('st_autosave'),
        stWordcount: document.getElementById('st_wordcount'),
        btnExportSettings: document.getElementById('btn-export-settings'),
        btnImportSettings: document.getElementById('btn-import-settings'),
        importSettingsFile: document.getElementById('import-settings-file'),
        btnResetSettings: document.getElementById('btn-reset-settings'),

        // Input Area
        tabItems: document.querySelectorAll('.tab-item'),
        tabContents: document.querySelectorAll('.tab-content'),
        tabIndicator: document.querySelector('.tab-indicator'),
        
        transcriptInput: document.getElementById('transcript-input'),
        transcriptWordCount: document.getElementById('transcript-word-count'),
        btnLoadSample: document.getElementById('btn-load-sample'),
        
        // Audio/Video Upload
        dropZoneAudio: document.getElementById('drop-zone-audio'),
        fileInputAudio: document.getElementById('file-input-audio'),
        btnBrowseAudio: document.getElementById('btn-browse-audio'),
        fileInfoAudio: document.getElementById('file-info-audio'),
        fileNameAudio: document.getElementById('file-name-audio'),
        fileSizeAudio: document.getElementById('file-size-audio'),
        btnRemoveAudio: document.getElementById('btn-remove-audio'),

        // Document Upload
        dropZoneDoc: document.getElementById('drop-zone-doc'),
        fileInputDoc: document.getElementById('file-input-doc'),
        btnBrowseDoc: document.getElementById('btn-browse-doc'),
        fileInfoDoc: document.getElementById('file-info-doc'),
        fileNameDoc: document.getElementById('file-name-doc'),
        fileSizeDoc: document.getElementById('file-size-doc'),
        btnRemoveDoc: document.getElementById('btn-remove-doc'),
        
        youtubeUrlInput: document.getElementById('youtube-url-input'),
        
        // Generation
        btnGenerate: document.getElementById('btn-generate'),
        btnStopGenerate: document.getElementById('btn-stop-generate'),
        progressContainer: document.getElementById('progress-container'),
        progressFill: document.getElementById('progress-bar-fill'),
        steps: document.querySelectorAll('.progress-stepper .step'),
        
        tokenTracker: document.getElementById('token-tracker'),
        tokenCountVal: document.getElementById('token-count-val'),

        // History
        btnHistory: document.getElementById('btn-history'),
        historyModal: document.getElementById('history-modal'),
        btnCloseHistory: document.getElementById('btn-close-history'),
        historyList: document.getElementById('history-list'),

        // Output & Export
        outputDashboard: document.getElementById('output-dashboard'),
        exportBar: document.getElementById('export-bar'),
        btnExportMd: document.getElementById('btn-export-md'),
        btnExportZip: document.getElementById('btn-export-zip'),
        btnExportJson: document.getElementById('btn-export-json'),
        toastContainer: document.getElementById('toast-container'),

        // Output divs mapped by key
        outputDivs: {
            youtube: document.getElementById('out-youtube'),
            thumbnail: document.getElementById('out-thumbnail'),
            timestamps: document.getElementById('out-timestamps'),
            keywords: document.getElementById('out-keywords'),
            keymoments: document.getElementById('out-keymoments'),
            facebook: document.getElementById('out-facebook'),
            linkedin: document.getElementById('out-linkedin'),
            twitter: document.getElementById('out-twitter'),
            shorts: document.getElementById('out-shorts'),
            newsletter: document.getElementById('out-newsletter'),
            blog: document.getElementById('out-blog')
        }
    };

    let activeAbortController = null;

    // Redefine global toast function to point to correct container
    showToastNotification = function(message, type = 'success') {
        if (!DOM.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `<span>${message}</span>`;
        
        let removed = false;
        const removeToast = () => {
            if (removed) return;
            removed = true;
            toast.style.animation = 'fadeOutRight 0.3s forwards';
            setTimeout(() => toast.remove(), 300);
        };
        
        toast.addEventListener('click', removeToast);
        toast.style.cursor = 'pointer';
        
        DOM.toastContainer.appendChild(toast);
        setTimeout(removeToast, 4000);
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function init() {
        bindEvents();
        updateApiUI();
        restoreSettingsUI();
        updateTabIndicator();
        applyCurrentTheme();
        
        // Restore last session if exists and autoSave is active
        if (AppState.settings.autoSave) {
            const lastOutputs = safeGetLocalStorage('vtc_last_outputs', null);
            if (lastOutputs) {
                try {
                    AppState.outputs = JSON.parse(lastOutputs);
                    renderAllOutputs();
                    if (DOM.outputDashboard) {
                        DOM.outputDashboard.classList.remove('hidden');
                        DOM.outputDashboard.classList.remove('animate-in');
                        void DOM.outputDashboard.offsetWidth;
                        DOM.outputDashboard.classList.add('animate-in');
                    }
                    if (DOM.exportBar) DOM.exportBar.classList.remove('hidden');
                } catch (e) {
                    console.error("Failed to restore last output state:", e);
                }
            }
            
            // Load history
            const storedHistory = safeGetLocalStorage('vtc_history', null);
            if (storedHistory) {
                try {
                    AppState.history = JSON.parse(storedHistory);
                } catch (e) {}
            }
        }

        const lastTranscript = safeGetLocalStorage('vtc_last_transcript', null);
        if (lastTranscript && DOM.transcriptInput) {
            DOM.transcriptInput.value = lastTranscript;
            updateWordCount();
        }
        
        setupCardEnhancements();
    }

    // ==========================================
    // EVENT BINDINGS
    // ==========================================
    function bindEvents() {
        // API Setup
        if (DOM.btnToggleApi) {
            DOM.btnToggleApi.addEventListener('click', () => {
                if (DOM.apiSetupPanel) DOM.apiSetupPanel.classList.toggle('panel-hidden');
            });
        }
        
        if (DOM.btnToggleVisibility) {
            DOM.btnToggleVisibility.addEventListener('click', () => {
                if (DOM.apiKeyInput) {
                    DOM.apiKeyInput.type = DOM.apiKeyInput.type === 'password' ? 'text' : 'password';
                }
            });
        }

        if (DOM.btnSaveApi) {
            DOM.btnSaveApi.addEventListener('click', async () => {
                if (!DOM.apiKeyInput) return;
                const key = DOM.apiKeyInput.value.trim();
                if (!key) {
                    AppState.apiKey = '';
                    safeRemoveLocalStorage('vtc_gemini_api_key');
                    updateApiUI();
                    showToastNotification("API Key removed. Running in Demo Mode.", "success");
                    return;
                }

                DOM.btnSaveApi.innerText = "Testing...";
                DOM.btnSaveApi.disabled = true;

                const test = await window.GeminiAPI.testConnection(key, AppState.settings.model);
                if (test.valid) {
                    AppState.apiKey = key;
                    safeSetLocalStorage('vtc_gemini_api_key', key);
                    if (DOM.apiSetupPanel) DOM.apiSetupPanel.classList.add('hidden');
                    showToastNotification("API Key verified & saved securely!", "success");
                } else {
                    showToastNotification("Invalid API Key: " + test.error, "error");
                }

                DOM.btnSaveApi.innerText = "Save & Test";
                DOM.btnSaveApi.disabled = false;
                updateApiUI();
            });
        }

        // Tabs
        DOM.tabItems.forEach(tab => {
            tab.addEventListener('click', () => {
                DOM.tabItems.forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                    t.setAttribute('tabindex', '-1');
                });
                DOM.tabContents.forEach(c => c.classList.remove('active'));
                
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                tab.setAttribute('tabindex', '0');
                
                const targetId = tab.getAttribute('data-tab');
                const contentEl = document.getElementById(targetId);
                if (contentEl) contentEl.classList.add('active');
                
                AppState.activeInputTab = targetId;
                updateTabIndicator();
            });
        });

        // Transcript Input
        if (DOM.transcriptInput) {
            DOM.transcriptInput.addEventListener('input', () => {
                updateWordCount();
                safeSetLocalStorage('vtc_last_transcript', DOM.transcriptInput.value);
            });
        }

        if (DOM.btnLoadSample) {
            DOM.btnLoadSample.addEventListener('click', () => {
                if (DOM.transcriptInput) {
                    DOM.transcriptInput.value = window.DemoData.transcript;
                    updateWordCount();
                    showToastNotification("Sample transcript loaded", "success");
                }
            });
        }

        // Generic File Drop Setup
        function setupFileDrop(dropZone, fileInput, btnBrowse, btnRemove, type) {
            if (!dropZone || !fileInput) return;
            
            if (btnBrowse) {
                btnBrowse.addEventListener('click', () => fileInput.click());
            }
            
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('dragover');
            });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('dragover');
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0], type);
                }
            });
            
            fileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0], type);
                }
            });
            
            if (btnRemove) {
                btnRemove.addEventListener('click', () => {
                    if (type === 'audio') {
                        AppState.audioData = null;
                        if (DOM.fileInfoAudio) DOM.fileInfoAudio.classList.add('hidden');
                        const cg = dropZone.querySelector('.drop-zone-content');
                        if (cg) cg.classList.remove('hidden');
                    } else if (type === 'doc') {
                        AppState.documentData = null;
                        if (DOM.fileInfoDoc) DOM.fileInfoDoc.classList.add('hidden');
                        const cg = dropZone.querySelector('.drop-zone-content');
                        if (cg) cg.classList.remove('hidden');
                    }
                    fileInput.value = '';
                });
            }
        }

        setupFileDrop(DOM.dropZoneAudio, DOM.fileInputAudio, DOM.btnBrowseAudio, DOM.btnRemoveAudio, 'audio');
        setupFileDrop(DOM.dropZoneDoc, DOM.fileInputDoc, DOM.btnBrowseDoc, DOM.btnRemoveDoc, 'doc');

        // History Modal Toggles
        if (DOM.btnHistory) {
            DOM.btnHistory.addEventListener('click', () => {
                renderHistoryList();
                if (DOM.historyModal) DOM.historyModal.classList.remove('hidden');
            });
        }
        
        const closeHistory = () => {
            if (DOM.historyModal) DOM.historyModal.classList.add('hidden');
        };
        
        if (DOM.btnCloseHistory) DOM.btnCloseHistory.addEventListener('click', closeHistory);
        if (DOM.historyModal) DOM.historyModal.addEventListener('click', (e) => {
            if (e.target === DOM.historyModal) closeHistory();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.historyModal && !DOM.historyModal.classList.contains('hidden')) {
                closeHistory();
            }
        });

        if (DOM.btnStopGenerate) {
            DOM.btnStopGenerate.addEventListener('click', () => {
                if (activeAbortController) {
                    activeAbortController.abort();
                    showToastNotification("Generation stopped.", "error");
                }
            });
        }

        // Settings Drawer Toggle
        if (DOM.btnToggleSettings) {
            DOM.btnToggleSettings.addEventListener('click', () => {
                if (DOM.settingsDrawer) DOM.settingsDrawer.classList.remove('closed');
                if (DOM.settingsOverlay) DOM.settingsOverlay.classList.remove('hidden');
            });
        }
        
        // Theme Quick Toggle — cycles Light ↔ Dark
        const btnToggleTheme = document.getElementById('btn-toggle-theme');
        if (btnToggleTheme) {
            btnToggleTheme.addEventListener('click', () => {
                // Determine what the user currently sees
                let effectiveTheme = AppState.settings.theme;
                if (effectiveTheme === 'System') {
                    effectiveTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
                }
                // Toggle to opposite
                const newTheme = effectiveTheme === 'Dark' ? 'Light' : 'Dark';
                AppState.settings.theme = newTheme;
                applyCurrentTheme();
                safeSetLocalStorage('vtc_settings', JSON.stringify(AppState.settings));
                restoreSettingsUI();
            });
        }

        // Listen for OS theme changes when in System mode
        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (AppState.settings.theme === 'System') {
                    applyCurrentTheme();
                }
            });
        }
        
        const closeSettings = () => {
            if (DOM.settingsDrawer) DOM.settingsDrawer.classList.add('closed');
            if (DOM.settingsOverlay) DOM.settingsOverlay.classList.add('hidden');
            saveSettings();
        };
        
        if (DOM.btnCloseSettings) DOM.btnCloseSettings.addEventListener('click', closeSettings);
        if (DOM.settingsOverlay) DOM.settingsOverlay.addEventListener('click', closeSettings);

        // Slider real-time displays
        if (DOM.stTemperature) {
            DOM.stTemperature.addEventListener('input', (e) => {
                const display = document.getElementById('temp-val');
                if (display) display.innerText = e.target.value;
            });
        }

        if (DOM.stMaxTokens) {
            DOM.stMaxTokens.addEventListener('input', (e) => {
                const display = document.getElementById('tokens-val');
                if (display) display.innerText = e.target.value;
            });
        }

        // Settings Data Import/Export/Reset
        if (DOM.btnExportSettings) {
            DOM.btnExportSettings.addEventListener('click', () => {
                try {
                    const dataStr = JSON.stringify(AppState.settings, null, 2);
                    window.ExportUtils.downloadFile(dataStr, "vtc_settings.json", "application/json");
                    showToastNotification("Settings exported successfully!", "success");
                } catch(e) {
                    showToastNotification("Failed to export settings.", "error");
                }
            });
        }

        if (DOM.btnImportSettings && DOM.importSettingsFile) {
            DOM.btnImportSettings.addEventListener('click', () => DOM.importSettingsFile.click());
            DOM.importSettingsFile.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(evt) {
                    try {
                        const parsed = JSON.parse(evt.target.result);
                        if (parsed && typeof parsed === 'object') {
                            AppState.settings = Object.assign({}, defaultSettings, parsed);
                            saveSettings(); // Writes and locks theme
                            restoreSettingsUI();
                            applyCurrentTheme();
                            showToastNotification("Setup imported and restored!", "success");
                        } else {
                            showToastNotification("Invalid file layout.", "error");
                        }
                    } catch(err) {
                        showToastNotification("Failed to read settings file.", "error");
                    }
                };
                reader.onerror = () => showToastNotification("Error reading file.", "error");
                reader.readAsText(file);
                DOM.importSettingsFile.value = ''; // Clean up input trigger
            });
        }

        if (DOM.btnResetSettings) {
            DOM.btnResetSettings.addEventListener('click', () => {
                if (confirm("Reset all settings to original factory defaults?")) {
                    AppState.settings = Object.assign({}, defaultSettings);
                    saveSettings();
                    restoreSettingsUI();
                    applyCurrentTheme();
                    showToastNotification("Defaults restored successfully.", "success");
                }
            });
        }

        // Generate Button
        if (DOM.btnGenerate) {
            DOM.btnGenerate.addEventListener('click', handleGenerate);
        }

        // Copy / Download Action Hooks
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;
                const text = targetEl.innerText;
                window.ExportUtils.copyToClipboard(text);
                
                const originalHtml = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = "✅";
                showToastNotification("Copied to clipboard!", "success");
                setTimeout(() => e.currentTarget.innerHTML = originalHtml, 2000);
            });
        });

        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const filename = e.currentTarget.getAttribute('data-filename');
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;
                const text = targetEl.innerText;
                window.ExportUtils.downloadFile(text, filename, "text/plain");
            });
        });

        // Score Buttons with Non-streaming evaluations
        document.querySelectorAll('.btn-score').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!AppState.apiKey) {
                    showToastNotification("API Key required to score content.", "error");
                    return;
                }
                
                const btnEl = e.currentTarget;
                const targetId = btnEl.getAttribute('data-target');
                const platform = btnEl.getAttribute('data-platform');
                const targetTextContainer = document.getElementById(targetId);
                if (!targetTextContainer) return;
                const contentText = targetTextContainer.innerText.trim();
                
                if (!contentText || contentText.includes("Generating...")) {
                    showToastNotification("No completed content to score.", "error");
                    return;
                }

                if (btnEl.disabled) return;
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = "⏳";
                btnEl.disabled = true;

                try {
                    const prompt = window.Prompts.getScorePrompt(platform, contentText);
                    const scoreData = await window.GeminiAPI.generate({
                        apiKey: AppState.apiKey,
                        model: AppState.settings.model,
                        systemInstruction: "You are an expert AI content evaluator. Score the provided text out of 10 and return suggestions.",
                        userPrompt: prompt,
                        temperature: 0.1, 
                        maxOutputTokens: 2048,
                        safetyFilter: AppState.settings.safetyFilter,
                        isJson: true
                    });

                    const avg = ((scoreData.hook + scoreData.readability + scoreData.engagement + scoreData.platform_fit) / 4).toFixed(1);
                    
                    let badgeClass = 'high';
                    if (avg < 8) badgeClass = 'medium';
                    if (avg < 5) badgeClass = 'low';

                    const cardBody = targetTextContainer.parentElement;
                    if (cardBody) {
                        const existing = cardBody.querySelector('.score-badge');
                        if (existing) existing.remove();

                        const badge = document.createElement('div');
                        badge.className = `score-badge ${badgeClass}`;
                        badge.innerHTML = `
                            <span>🏆 Score: ${avg}/10</span>
                            <div class="score-details">H:${scoreData.hook} | R:${scoreData.readability} | E:${scoreData.engagement} | F:${scoreData.platform_fit}</div>
                        `;
                        cardBody.appendChild(badge);
                        
                        if (scoreData.suggestions && scoreData.suggestions.length > 0) {
                            showToastNotification(`💡 Tip: ${scoreData.suggestions[0]}`, "success");
                        }
                    }
                    
                } catch (err) {
                    showToastNotification("Scoring failed: " + err.message, "error");
                } finally {
                    btnEl.innerHTML = originalHtml;
                    btnEl.disabled = false;
                }
            });
        });

        // Expanded/Collapsible View for Blog Card
        const btnExpandBlog = document.getElementById('btn-expand-blog');
        const cardBlog = document.querySelector('.card-blog');
        if (btnExpandBlog && cardBlog) {
            btnExpandBlog.addEventListener('click', () => {
                cardBlog.classList.toggle('expanded');
                if (cardBlog.classList.contains('expanded')) {
                    btnExpandBlog.innerText = "⤋";
                    btnExpandBlog.title = "Collapse";
                    cardBlog.scrollIntoView({ behavior: 'smooth' });
                } else {
                    btnExpandBlog.innerText = "⤢";
                    btnExpandBlog.title = "Expand";
                }
            });
        }

        // Export All MD / JSON Operations
        if (DOM.btnExportMd) {
            DOM.btnExportMd.addEventListener('click', () => {
                if (Object.keys(AppState.outputs).length === 0) return;
                const md = window.ExportUtils.compileMarkdownKit(AppState.outputs, AppState.settings);
                window.ExportUtils.downloadFile(md, `ChitroLip_Kit_${window.ExportUtils.getFormattedDate()}.md`, "text/markdown");
            });
        }
        
        if (DOM.btnExportZip) {
            DOM.btnExportZip.addEventListener('click', async () => {
                if (Object.keys(AppState.outputs).length === 0) return;
                
                const originalHtml = DOM.btnExportZip.innerHTML;
                DOM.btnExportZip.innerHTML = "⏳";
                DOM.btnExportZip.disabled = true;
                
                try {
                    await window.ExportUtils.downloadBulkZip(AppState.outputs, AppState.settings);
                    showToastNotification("Bulk export downloaded successfully!", "success");
                } catch(e) {
                    showToastNotification("Bulk export failed.", "error");
                    console.error(e);
                } finally {
                    DOM.btnExportZip.innerHTML = originalHtml;
                    DOM.btnExportZip.disabled = false;
                }
            });
        }
        
        if (DOM.btnExportJson) {
            DOM.btnExportJson.addEventListener('click', () => {
                if (Object.keys(AppState.outputs).length === 0) return;
                const json = JSON.stringify(AppState.outputs, null, 2);
                window.ExportUtils.downloadFile(json, `ChitroLip_Kit_${window.ExportUtils.getFormattedDate()}.json`, "application/json");
            });
        }

        // Global Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                handleGenerate();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (DOM.btnToggleSettings) DOM.btnToggleSettings.click();
            }
            if (e.key === 'Escape' && DOM.settingsDrawer && !DOM.settingsDrawer.classList.contains('closed')) {
                closeSettings();
            }
        });
    }

    // ==========================================
    // UI CONTROL STATE SYNCHRONIZATION
    // ==========================================
    function updateApiUI() {
        if (!DOM.apiIndicator || !DOM.apiStatusText || !DOM.apiStatusDot) return;
        if (AppState.apiKey) {
            DOM.apiStatusDot.className = 'status-dot';
            DOM.apiStatusText.innerText = 'API Connected';
            DOM.apiIndicator.style.borderColor = 'var(--accent-emerald)';
            if (DOM.apiKeyInput) DOM.apiKeyInput.value = AppState.apiKey;
        } else {
            DOM.apiStatusDot.className = 'status-dot demo';
            DOM.apiStatusText.innerText = 'Demo Mode';
            DOM.apiIndicator.style.borderColor = 'var(--accent-cyan)';
        }
    }

    function updateWordCount() {
        if (!DOM.transcriptInput || !DOM.transcriptWordCount) return;
        
        if (!AppState.settings.showWordCount) {
            DOM.transcriptWordCount.style.display = 'none';
            return;
        }
        
        DOM.transcriptWordCount.style.display = 'block';
        const text = DOM.transcriptInput.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        DOM.transcriptWordCount.innerText = `${words} words`;
    }

    function updateTabIndicator() {
        if (!DOM.tabIndicator) return;
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab) {
            DOM.tabIndicator.style.width = `${activeTab.offsetWidth}px`;
            DOM.tabIndicator.style.left = `${activeTab.offsetLeft}px`;
        }
    }

    function applyCurrentTheme() {
        // Migrate old theme values from previous sessions
        const migrateMap = { 'Liquid Glass': 'System', 'Clear': 'Dark' };
        if (migrateMap[AppState.settings.theme]) {
            AppState.settings.theme = migrateMap[AppState.settings.theme];
            safeSetLocalStorage('vtc_settings', JSON.stringify(AppState.settings));
        }
        
        const theme = AppState.settings.theme;
        const html = document.documentElement;
        
        if (theme === 'Dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'Light') {
            html.setAttribute('data-theme', 'light');
        } else {
            // 'System' or any unknown value
            html.removeAttribute('data-theme');
        }
        updateThemeToggleIcon();
    }

    function updateThemeToggleIcon() {
        const btnToggleTheme = document.getElementById('btn-toggle-theme');
        if (!btnToggleTheme) return;
        const iconLight = btnToggleTheme.querySelector('.theme-icon-light');
        const iconDark = btnToggleTheme.querySelector('.theme-icon-dark');
        if (!iconLight || !iconDark) return;
        
        let isDark = false;
        const currentTheme = AppState.settings.theme;
        if (currentTheme === 'Dark') {
            isDark = true;
        } else if (currentTheme === 'Light') {
            isDark = false;
        } else {
            // System mode — check OS preference
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        // When dark: show sun icon (to switch to light). When light: show moon icon.
        if (isDark) {
            iconLight.classList.remove('hidden');
            iconDark.classList.add('hidden');
        } else {
            iconLight.classList.add('hidden');
            iconDark.classList.remove('hidden');
        }
    }

    function saveSettings() {
        try {
            // Radio Segmented selectors
            const langEl = document.querySelector('input[name="st_language"]:checked');
            if (langEl) AppState.settings.language = langEl.value;

            const lenEl = document.querySelector('input[name="st_length"]:checked');
            if (lenEl) AppState.settings.contentLength = lenEl.value;

            const emoEl = document.querySelector('input[name="st_emojis"]:checked');
            if (emoEl) AppState.settings.emojiDensity = emoEl.value;

            const themeEl = document.querySelector('input[name="st_theme"]:checked');
            if (themeEl) AppState.settings.theme = themeEl.value;

            // Simple Dropdowns/Inputs (with null checks)
            if (DOM.stTone) AppState.settings.tone = DOM.stTone.value;
            if (DOM.stAudience) AppState.settings.audience = DOM.stAudience.value;
            if (DOM.stNiche) AppState.settings.niche = DOM.stNiche.value;
            if (DOM.stBrandVoice) AppState.settings.brandVoice = DOM.stBrandVoice.value;
            if (DOM.stModel) AppState.settings.model = DOM.stModel.value;

            // Sliders
            if (DOM.stTemperature) AppState.settings.temperature = parseFloat(DOM.stTemperature.value);
            if (DOM.stMaxTokens) AppState.settings.maxTokens = parseInt(DOM.stMaxTokens.value, 10);

            // Switches
            const ctaEl = document.getElementById('st_cta');
            if (ctaEl) AppState.settings.ctaStyle = ctaEl.value;

            if (DOM.stSafety) AppState.settings.safetyFilter = DOM.stSafety.checked;
            if (DOM.stAutosave) AppState.settings.autoSave = DOM.stAutosave.checked;
            if (DOM.stWordcount) AppState.settings.showWordCount = DOM.stWordcount.checked;

            safeSetLocalStorage('vtc_settings', JSON.stringify(AppState.settings));
            applyCurrentTheme();
            updateWordCount();
        } catch(e) {
            console.error("Failed to capture and save settings:", e);
        }
    }

    function restoreSettingsUI() {
        try {
            // Radios
            const langEl = document.querySelector(`input[name="st_language"][value="${AppState.settings.language}"]`);
            if (langEl) langEl.checked = true;

            const lenEl = document.querySelector(`input[name="st_length"][value="${AppState.settings.contentLength}"]`);
            if (lenEl) lenEl.checked = true;

            const emoEl = document.querySelector(`input[name="st_emojis"][value="${AppState.settings.emojiDensity}"]`);
            if (emoEl) emoEl.checked = true;

            const themeEl = document.querySelector(`input[name="st_theme"][value="${AppState.settings.theme}"]`);
            if (themeEl) themeEl.checked = true;

            // Simple select/input fields
            if (DOM.stTone) DOM.stTone.value = AppState.settings.tone;
            if (DOM.stAudience) DOM.stAudience.value = AppState.settings.audience;
            if (DOM.stNiche) DOM.stNiche.value = AppState.settings.niche;
            if (DOM.stBrandVoice) DOM.stBrandVoice.value = AppState.settings.brandVoice || '';
            if (DOM.stModel) DOM.stModel.value = AppState.settings.model;

            // Sliders
            if (DOM.stTemperature) {
                DOM.stTemperature.value = AppState.settings.temperature;
                const tempVal = document.getElementById('temp-val');
                if (tempVal) tempVal.innerText = AppState.settings.temperature;
            }
            if (DOM.stMaxTokens) {
                DOM.stMaxTokens.value = AppState.settings.maxTokens;
                const tokensVal = document.getElementById('tokens-val');
                if (tokensVal) tokensVal.innerText = AppState.settings.maxTokens;
            }

            // CTA Select
            const ctaEl = document.getElementById('st_cta');
            if (ctaEl) ctaEl.value = AppState.settings.ctaStyle || 'Question';

            // Checkbox Switches
            if (DOM.stSafety) DOM.stSafety.checked = AppState.settings.safetyFilter;
            if (DOM.stAutosave) DOM.stAutosave.checked = AppState.settings.autoSave;
            if (DOM.stWordcount) DOM.stWordcount.checked = AppState.settings.showWordCount;

            updateWordCount();
        } catch(e) {
            console.error("Failed to restore settings UI elements:", e);
        }
    }

    async function handleFileSelect(file, type) {
        if (!file) return;
        if (file.size > 100 * 1024 * 1024) {
            showToastNotification("File exceeds 100MB limit. Please compress.", "error");
            return;
        }
        try {
            const dropZone = type === 'audio' ? DOM.dropZoneAudio : DOM.dropZoneDoc;
            const dropContent = dropZone ? dropZone.querySelector('.drop-zone-content') : null;
            const fileInfo = type === 'audio' ? DOM.fileInfoAudio : DOM.fileInfoDoc;
            const fileName = type === 'audio' ? DOM.fileNameAudio : DOM.fileNameDoc;
            const fileSize = type === 'audio' ? DOM.fileSizeAudio : DOM.fileSizeDoc;

            if (dropContent) dropContent.classList.add('hidden');
            if (fileInfo) fileInfo.classList.remove('hidden');
            if (fileName) fileName.innerText = file.name;
            if (fileSize) fileSize.innerText = `(${(file.size / (1024*1024)).toFixed(1)} MB)`;
            
            const base64Data = await window.GeminiAPI.fileToBase64(file);
            
            if (type === 'audio') {
                AppState.audioData = base64Data;
            } else {
                AppState.documentData = base64Data;
            }
            showToastNotification("File loaded successfully!", "success");
        } catch (e) {
            showToastNotification("Failed to process file.", "error");
        }
    }

    // ==========================================
    // GENERATION ORCHESTRATION & FAULT TOLERANCE
    // ==========================================
    async function handleGenerate() {
        if (AppState.isGenerating) return; 
        
        let inputPayload = null;

        if (AppState.activeInputTab === 'tab-transcript') {
            if (!DOM.transcriptInput) return;
            const text = DOM.transcriptInput.value.trim();
            if (!text && !AppState.apiKey) {
                // Pre-populate with beautiful default demo transcript if empty in demo mode
                DOM.transcriptInput.value = window.DemoData.transcript;
            } else if (!text) {
                showToastNotification("Please paste a transcript first.", "error");
                return;
            }
            inputPayload = DOM.transcriptInput.value.trim();
        } 
        else if (AppState.activeInputTab === 'tab-audio') {
            if (!AppState.apiKey) {
                showToastNotification("API Key required for direct file analysis.", "error");
                if (DOM.btnToggleApi) DOM.btnToggleApi.click();
                return;
            }
            if (!AppState.audioData) {
                showToastNotification("Please select/drag a media file first.", "error");
                return;
            }
            inputPayload = AppState.audioData;
        }
        else if (AppState.activeInputTab === 'tab-document') {
            if (!AppState.apiKey) {
                showToastNotification("API Key required for document analysis.", "error");
                if (DOM.btnToggleApi) DOM.btnToggleApi.click();
                return;
            }
            if (!AppState.documentData) {
                showToastNotification("Please select/drag a document first.", "error");
                return;
            }
            inputPayload = AppState.documentData;
        }
        else if (AppState.activeInputTab === 'tab-youtube') {
            if (!AppState.apiKey) {
                showToastNotification("API Key required for YouTube URL parsing.", "error");
                if (DOM.btnToggleApi) DOM.btnToggleApi.click();
                return;
            }
            if (!DOM.youtubeUrlInput) return;
            const url = DOM.youtubeUrlInput.value.trim();
            if (!url) {
                showToastNotification("Please enter a YouTube video link.", "error");
                return;
            }
            // Format YouTube URL as fileData object
            inputPayload = { fileUri: url, mimeType: "video/mp4" };
        }

        // DEMO STATE FALLBACK
        if (!AppState.apiKey) {
            runDemoGeneration();
            return;
        }

        // FAULT ISOLATED LIVE GENERATION
        runLiveGeneration(inputPayload);
    }

    function setupGenerationUI() {
        AppState.isGenerating = true;
        AppState.totalTokensSession = 0;
        if (DOM.btnGenerate) DOM.btnGenerate.classList.add('hidden');
        if (DOM.btnStopGenerate) DOM.btnStopGenerate.classList.remove('hidden');
        if (DOM.tokenTracker) DOM.tokenTracker.classList.remove('hidden');
        if (DOM.tokenCountVal) DOM.tokenCountVal.innerText = '0';

        if (DOM.progressContainer) DOM.progressContainer.classList.remove('hidden');
        if (DOM.outputDashboard) {
            DOM.outputDashboard.classList.remove('hidden');
            DOM.outputDashboard.classList.remove('animate-in');
            void DOM.outputDashboard.offsetWidth;
            DOM.outputDashboard.classList.add('animate-in');
        }
        if (DOM.exportBar) DOM.exportBar.classList.add('hidden');
        
        // Remove error states and scoring badges
        document.querySelectorAll('.bento-card').forEach(card => {
            card.className = card.className.split(' ').filter(c => c !== 'error-state' && c !== 'expanded').join(' ');
            const oldBadge = card.querySelector('.score-badge');
            if (oldBadge) oldBadge.remove();
        });

        // Render clean skeleton bars to wow the user initially
        Object.values(DOM.outputDivs).forEach(div => {
            if (div) {
                div.innerHTML = `
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line short"></div>
                `;
            }
        });

        setStep(1);
    }

    function setStep(stepNum) {
        if (!DOM.steps || !DOM.progressFill) return;
        DOM.steps.forEach((step, i) => {
            if (i < stepNum - 1) {
                step.className = 'step completed';
            } else if (i === stepNum - 1) {
                step.className = 'step active';
            } else {
                step.className = 'step';
            }
        });
        DOM.progressFill.style.width = `${(stepNum / 3) * 100}%`;
    }

    // Defensive Individual Card Error Marking with Instant Local Block Retry
    function markCardError(cardSelector, outputIds, promptText) {
        const cardEl = document.querySelector(cardSelector);
        if (!cardEl) return;
        
        cardEl.classList.add('error-state');
        const bodyEl = cardEl.querySelector('.card-body');
        if (!bodyEl) return;

        bodyEl.innerHTML = `
            <div class="error-icon">⚠️</div>
            <p class="small">Generation failed for this block.</p>
            <button class="btn-retry-card" type="button">Retry Block</button>
        `;

        const retryBtn = bodyEl.querySelector('.btn-retry-card');
        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                bodyEl.innerHTML = `
                    <div class="skeleton-line title"></div>
                    <div class="skeleton-line"></div>
                    <div class="skeleton-line short"></div>
                `;
                cardEl.classList.remove('error-state');
                
                try {
                    const sysInstr = window.Prompts.getSystemInstruction(AppState.settings);
                    const inlineDataObj = AppState.activeInputTab === 'tab-audio' ? AppState.audioData : null;
                    
                    const result = await window.GeminiAPI.streamGenerate({
                        apiKey: AppState.apiKey,
                        model: AppState.settings.model,
                        systemInstruction: sysInstr,
                        userPrompt: promptText,
                        temperature: AppState.settings.temperature,
                        maxOutputTokens: AppState.settings.maxTokens,
                        safetyFilter: AppState.settings.safetyFilter,
                        inlineData: inlineDataObj,
                        onChunk: (jsonStr) => {
                            try {
                                const partial = JSON.parse(jsonStr);
                                outputIds.forEach(id => {
                                    if (partial[id] && DOM.outputDivs[id]) {
                                        renderStreamingText(DOM.outputDivs[id], partial[id]);
                                    }
                                });
                            } catch(e) {}
                        }
                    });
                    
                    // Update state variables and persistence
                    Object.assign(AppState.outputs, result);
                    if (AppState.settings.autoSave) {
                        safeSetLocalStorage('vtc_last_outputs', JSON.stringify(AppState.outputs));
                    }
                    renderAllOutputs();
                    showToastNotification("Block regenerated successfully!", "success");
                } catch(err) {
                    showToastNotification("Regeneration error: " + err.message, "error");
                    markCardError(cardSelector, outputIds, promptText);
                }
            });
        }
    }

    async function runLiveGeneration(inputPayload) {
        setupGenerationUI();
        activeAbortController = new AbortController();

        const sysInstr = window.Prompts.getSystemInstruction(AppState.settings);
        let transcriptText = '';
        
        try {
            // STEP 1: Two-Step Extraction for Files
            if (typeof inputPayload === 'object' && inputPayload !== null) {
                setStep(2);
                showToastNotification("Extracting text from media...", "success");
                
                const extractionPrompt = window.Prompts.getExtractionPrompt();
                transcriptText = await window.GeminiAPI.streamGenerate({
                    apiKey: AppState.apiKey,
                    model: AppState.settings.model,
                    systemInstruction: "You are a highly accurate transcription engine.",
                    userPrompt: extractionPrompt,
                    temperature: 0.1,
                    inlineData: inputPayload,
                    isJson: false,
                    signal: activeAbortController.signal,
                    onChunk: () => {}, 
                    onTokens: (count) => accumulateTokens(count)
                });
                
                if (!transcriptText || transcriptText.trim() === '') {
                    throw new Error("Failed to extract any text from the file.");
                }
            } else {
                transcriptText = inputPayload;
            }
            
            // Formulate request prompt packets
            const contentContext = typeof transcriptText === 'string' ? transcriptText : "Analyze the content deeply.";
            AppState.lastContentContext = contentContext;
            
            const b1Prompt = window.Prompts.getBatch1Prompt(contentContext);
            const b2Prompt = window.Prompts.getBatch2Prompt(contentContext);
            const b3Prompt = window.Prompts.getBatch3Prompt(contentContext);
            const b4Prompt = window.Prompts.getBatch4Prompt(contentContext);

            setStep(3);
            
            // Spawn 4 batches in isolated threads using the extracted text
            const batch1 = window.GeminiAPI.streamGenerate({
                apiKey: AppState.apiKey,
                model: AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b1Prompt,
                temperature: AppState.settings.temperature,
                maxOutputTokens: AppState.settings.maxTokens,
                safetyFilter: AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = JSON.parse(jsonStr);
                        if (partial.youtube && DOM.outputDivs.youtube) renderStreamingText(DOM.outputDivs.youtube, partial.youtube);
                        if (partial.thumbnail && DOM.outputDivs.thumbnail) renderStreamingText(DOM.outputDivs.thumbnail, partial.thumbnail);
                    } catch(e) {} 
                }
            });

            const batch2 = window.GeminiAPI.streamGenerate({
                apiKey: AppState.apiKey,
                model: AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b2Prompt,
                temperature: AppState.settings.temperature,
                maxOutputTokens: AppState.settings.maxTokens,
                safetyFilter: AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = JSON.parse(jsonStr);
                        if (partial.facebook && DOM.outputDivs.facebook) renderStreamingText(DOM.outputDivs.facebook, partial.facebook);
                        if (partial.linkedin && DOM.outputDivs.linkedin) renderStreamingText(DOM.outputDivs.linkedin, partial.linkedin);
                        if (partial.twitter && DOM.outputDivs.twitter) renderStreamingText(DOM.outputDivs.twitter, partial.twitter);
                        if (partial.newsletter && DOM.outputDivs.newsletter) renderStreamingText(DOM.outputDivs.newsletter, partial.newsletter);
                    } catch(e) {} 
                }
            });

            const batch3 = window.GeminiAPI.streamGenerate({
                apiKey: AppState.apiKey,
                model: AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b3Prompt,
                temperature: AppState.settings.temperature,
                maxOutputTokens: AppState.settings.maxTokens,
                safetyFilter: AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = JSON.parse(jsonStr);
                        if (partial.shorts && DOM.outputDivs.shorts) renderStreamingText(DOM.outputDivs.shorts, partial.shorts);
                        if (partial.blog && DOM.outputDivs.blog) renderStreamingText(DOM.outputDivs.blog, partial.blog);
                    } catch(e) {} 
                }
            });

            const batch4 = window.GeminiAPI.streamGenerate({
                apiKey: AppState.apiKey,
                model: AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b4Prompt,
                temperature: AppState.settings.temperature,
                maxOutputTokens: AppState.settings.maxTokens,
                safetyFilter: AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = JSON.parse(jsonStr);
                        if (partial.timestamps && DOM.outputDivs.timestamps) renderStreamingText(DOM.outputDivs.timestamps, partial.timestamps);
                        if (partial.keywords && DOM.outputDivs.keywords) renderStreamingText(DOM.outputDivs.keywords, partial.keywords);
                        if (partial.keymoments && DOM.outputDivs.keymoments) renderStreamingText(DOM.outputDivs.keymoments, partial.keymoments);
                    } catch(e) {} 
                }
            });

            const [res1, res2, res3, res4] = await Promise.allSettled([batch1, batch2, batch3, batch4]);

            // Consolidate values defensively
            AppState.outputs = {};
            
            if (res1.status === 'fulfilled') {
                Object.assign(AppState.outputs, res1.value);
            } else {
                console.error("Batch 1 failed:", res1.reason);
                markCardError('.card-youtube', ['youtube'], b1Prompt);
                markCardError('.card-thumbnail', ['thumbnail'], b1Prompt);
            }

            if (res2.status === 'fulfilled') {
                Object.assign(AppState.outputs, res2.value);
            } else {
                console.error("Batch 2 failed:", res2.reason);
                markCardError('.card-facebook', ['facebook'], b2Prompt);
                markCardError('.card-linkedin', ['linkedin'], b2Prompt);
                markCardError('.card-twitter', ['twitter'], b2Prompt);
                markCardError('.card-newsletter', ['newsletter'], b2Prompt);
            }

            if (res3.status === 'fulfilled') {
                Object.assign(AppState.outputs, res3.value);
            } else {
                console.error("Batch 3 failed:", res3.reason);
                markCardError('.card-shorts', ['shorts'], b3Prompt);
                markCardError('.card-blog', ['blog'], b3Prompt);
            }

            if (res4.status === 'fulfilled') {
                Object.assign(AppState.outputs, res4.value);
            } else {
                console.error("Batch 4 failed:", res4.reason);
                markCardError('.card-timestamps', ['timestamps'], b4Prompt);
                markCardError('.card-keywords', ['keywords'], b4Prompt);
                markCardError('.card-keymoments', ['keymoments'], b4Prompt);
            }

            finishGeneration(Object.keys(AppState.outputs).length > 0);
            
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("Global Generation Pipeline Crash:", error);
            showToastNotification(error.message || "Generation halted midway.", "error");
            finishGeneration(false);
        }
    }

    // ==========================================
    // DEMO MODE TYPING EMULATION
    // ==========================================
    async function runDemoGeneration() {
        setupGenerationUI();
        const demo = window.DemoData.outputs;
        
        await new Promise(r => setTimeout(r, 800));
        setStep(2);
        
        await new Promise(r => setTimeout(r, 800));
        setStep(3);

        const keys = Object.keys(demo);
        let currentIndex = 0;
        
        // Emulate liquid flowing typewriter stream
        const interval = setInterval(() => {
            currentIndex += 25;
            let finished = true;
            
            keys.forEach(key => {
                const targetText = demo[key];
                const div = DOM.outputDivs[key];
                if (!div) return;
                
                if (currentIndex < targetText.length) {
                    finished = false;
                    renderStreamingText(div, targetText.substring(0, currentIndex));
                } else {
                    renderStreamingText(div, targetText, false);
                }
            });

            if (finished) {
                clearInterval(interval);
                AppState.outputs = Object.assign({}, demo);
                finishGeneration(true);
            }
        }, 20);
    }

    // ==========================================
    // RENDERING & PARSING HELPERS
    // ==========================================
    function renderStreamingText(element, text, isStreaming = true) {
        if (!element) return;
        
        // Advanced formatting parser supporting headings, lists, bold elements
        let formatted = text
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            
        if (isStreaming) {
            element.innerHTML = formatted + '<span class="streaming-cursor"></span>';
        } else {
            element.innerHTML = formatted;
        }
    }

    function renderAllOutputs() {
        Object.keys(AppState.outputs).forEach(key => {
            if (DOM.outputDivs[key]) {
                renderStreamingText(DOM.outputDivs[key], AppState.outputs[key], false);
            }
        });
    }

    function finishGeneration(success) {
        AppState.isGenerating = false;
        if (DOM.btnGenerate) {
            DOM.btnGenerate.innerHTML = `<span class="btn-text">Generate Content ✨</span><span class="shortcut-hint">Ctrl+Enter</span>`;
            DOM.btnGenerate.disabled = false;
            DOM.btnGenerate.classList.remove('hidden');
        }
        if (DOM.btnStopGenerate) DOM.btnStopGenerate.classList.add('hidden');
        
        if (success) {
            setStep(4);
            setTimeout(() => {
                if (DOM.progressContainer) DOM.progressContainer.classList.add('hidden');
            }, 1500);
            if (DOM.exportBar) DOM.exportBar.classList.remove('hidden');
            showToastNotification("Content repurposed with elite configurations!", "success");
            
            renderAllOutputs();
            saveToHistory();

            if (AppState.settings.autoSave) {
                safeSetLocalStorage('vtc_last_outputs', JSON.stringify(AppState.outputs));
            }
        } else {
            if (DOM.progressContainer) DOM.progressContainer.classList.add('hidden');
            showToastNotification("Generation process completed with isolated card exceptions.", "error");
        }
    }

    // ==========================================
    // TRACKING & HISTORY HELPERS
    // ==========================================
    function accumulateTokens(count) {
        if (!count) return;
        AppState.totalTokensSession += count;
        if (DOM.tokenCountVal) {
            let costStr = "";
            if (AppState.settings.model.includes('pro')) {
                costStr = ` (~$${(AppState.totalTokensSession * 2.5 / 1000000).toFixed(4)})`;
            } else {
                costStr = ` (Free Tier)`;
            }
            DOM.tokenCountVal.innerText = AppState.totalTokensSession.toLocaleString() + costStr;
        }
    }

    function setupCardEnhancements() {
        document.querySelectorAll('.bento-card').forEach(card => {
            const body = card.querySelector('.card-body');
            const actions = card.querySelector('.card-actions');
            const streamDiv = card.querySelector('.streaming-text');
            if (!body || !streamDiv) return;

            // Add Counters
            const counter = document.createElement('div');
            counter.className = 'card-counter';
            counter.style.cssText = 'position: absolute; bottom: 5px; right: 10px; font-size: 0.75rem; color: var(--text-muted); background: var(--bg-surface); padding: 2px 8px; border-radius: 10px; opacity: 0.8; z-index: 10; pointer-events: none;';
            body.appendChild(counter);

            const updateCounter = () => {
                const text = streamDiv.innerText.trim();
                const chars = text.length;
                const words = text ? text.split(/\s+/).length : 0;
                counter.innerText = `${chars} chars • ${words} words`;
                
                if ((streamDiv.id === 'out-twitter' && chars > 280) || (streamDiv.id === 'out-linkedin' && chars > 3000)) {
                    counter.style.color = 'var(--accent-rose)';
                } else {
                    counter.style.color = 'var(--text-muted)';
                }
            };

            streamDiv.addEventListener('input', updateCounter);
            streamDiv.addEventListener('blur', () => {
                const key = streamDiv.id.replace('out-', '');
                AppState.outputs[key] = streamDiv.innerHTML;
                if (AppState.settings.autoSave) {
                    safeSetLocalStorage('vtc_last_outputs', JSON.stringify(AppState.outputs));
                }
            });

            const observer = new MutationObserver(updateCounter);
            observer.observe(streamDiv, { childList: true, subtree: true, characterData: true });

            // Add Regenerate Button
            if (actions) {
                const regenBtn = document.createElement('button');
                regenBtn.className = 'icon-btn-small btn-regen';
                regenBtn.title = 'Regenerate this card';
                regenBtn.innerHTML = '🔄';
                actions.insertBefore(regenBtn, actions.firstChild);
                
                regenBtn.addEventListener('click', async () => {
                    if (!AppState.apiKey) {
                        showToastNotification("API Key required to regenerate.", "error");
                        return;
                    }
                    if (!AppState.lastContentContext) {
                        showToastNotification("No context available to regenerate. Please run a full generation first.", "error");
                        return;
                    }

                    const key = streamDiv.id.replace('out-', '');
                    const originalHtml = regenBtn.innerHTML;
                    regenBtn.innerHTML = '⏳';
                    regenBtn.disabled = true;
                    
                    try {
                        streamDiv.innerHTML = '<span class="streaming-cursor"></span>';
                        const sysInstr = window.Prompts.getSystemInstruction(AppState.settings);
                        
                        let promptToUse = "";
                        if (['youtube', 'thumbnail'].includes(key)) promptToUse = window.Prompts.getBatch1Prompt(AppState.lastContentContext);
                        else if (['facebook', 'linkedin', 'twitter', 'newsletter'].includes(key)) promptToUse = window.Prompts.getBatch2Prompt(AppState.lastContentContext);
                        else if (['shorts', 'blog'].includes(key)) promptToUse = window.Prompts.getBatch3Prompt(AppState.lastContentContext);
                        else promptToUse = window.Prompts.getBatch4Prompt(AppState.lastContentContext);

                        // Extract only the target card using standard stream logic
                        await window.GeminiAPI.streamGenerate({
                            apiKey: AppState.apiKey,
                            model: AppState.settings.model,
                            systemInstruction: sysInstr,
                            userPrompt: promptToUse,
                            temperature: AppState.settings.temperature + 0.1, // slightly higher temp for variation
                            maxOutputTokens: AppState.settings.maxTokens,
                            safetyFilter: AppState.settings.safetyFilter,
                            onChunk: (text) => {
                                try {
                                    const parsed = JSON.parse(text);
                                    if (parsed[key]) {
                                        renderStreamingText(streamDiv, parsed[key]);
                                    }
                                } catch(e){}
                            },
                            onTokens: (count) => accumulateTokens(count)
                        });
                        
                        // Final extraction
                        const resultText = streamDiv.innerHTML.replace('<span class="streaming-cursor"></span>', '');
                        AppState.outputs[key] = resultText;
                        if (AppState.settings.autoSave) safeSetLocalStorage('vtc_last_outputs', JSON.stringify(AppState.outputs));
                        showToastNotification(`Successfully regenerated ${key}!`, "success");
                    } catch (e) {
                        console.error(e);
                        showToastNotification("Regeneration failed.", "error");
                    } finally {
                        regenBtn.innerHTML = originalHtml;
                        regenBtn.disabled = false;
                        const cursor = streamDiv.querySelector('.streaming-cursor');
                        if(cursor) cursor.remove();
                    }
                });
            }
        });
    }

    function saveToHistory() {
        if (!AppState.settings.autoSave) return;
        if (Object.keys(AppState.outputs).length === 0) return;
        
        const timestamp = new Date().toLocaleString();
        const snippet = AppState.outputs.youtube ? AppState.outputs.youtube.substring(0, 50).replace(/<[^>]*>?/gm, '') + "..." : "Generated Content";
        
        const record = {
            id: Date.now(),
            date: timestamp,
            snippet: snippet,
            outputs: Object.assign({}, AppState.outputs),
            tokens: AppState.totalTokensSession
        };
        
        AppState.history.unshift(record);
        if (AppState.history.length > 20) {
            AppState.history.pop(); // Keep last 20 records
        }
        
        safeSetLocalStorage('vtc_history', JSON.stringify(AppState.history));
    }

    function renderHistoryList() {
        if (!DOM.historyList) return;
        DOM.historyList.innerHTML = '';
        
        if (AppState.history.length === 0) {
            DOM.historyList.innerHTML = '<p class="text-muted small">No history available yet.</p>';
            return;
        }
        
        AppState.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div class="history-title">${item.snippet}</div>
                    <div class="history-date">${item.date} • ${item.tokens || 0} tokens</div>
                </div>
            `;
            div.addEventListener('click', () => {
                AppState.outputs = Object.assign({}, item.outputs);
                renderAllOutputs();
                if (DOM.outputDashboard) {
                    DOM.outputDashboard.classList.remove('hidden');
                }
                if (DOM.exportBar) DOM.exportBar.classList.remove('hidden');
                if (DOM.historyModal) DOM.historyModal.classList.add('hidden');
                showToastNotification("History restored!", "success");
            });
            DOM.historyList.appendChild(div);
        });
    }

    // Initialize the app core
    init();
});
