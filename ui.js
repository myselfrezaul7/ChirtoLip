/**
 * CHITROLIP AI - UI & DOM MANAGEMENT
 * Handles DOM references, toasts, and generic UI state.
 */

window.UI = (function() {

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
        stKeepEnglishTerms: document.getElementById('st_keep_english_terms'),
        stAutosave: document.getElementById('st_autosave'),
        stWordcount: document.getElementById('st_wordcount'),
        
        // Custom Prompt Additions
        stUseCustomPrompt: document.getElementById('st_use_custom_prompt'),
        customPromptGroup: document.getElementById('custom_prompt_group'),
        stCustomPromptText: document.getElementById('st_custom_prompt_text'),
        customPromptCharCount: document.getElementById('custom_prompt_char_count'),
        btnResetCustomPrompt: document.getElementById('btn_reset_custom_prompt'),

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
        outputDashboard: document.getElementById('output-dashboard'),
        heroEmptyState: document.getElementById('hero-empty-state'),
        exportBar: document.getElementById('export-bar'),
        tokenTracker: document.getElementById('token-tracker'),
        tokenCountVal: document.getElementById('token-count-val'),

        // History
        btnHistory: document.getElementById('btn-history'),
        historyModal: document.getElementById('history-modal'),
        btnCloseHistory: document.getElementById('btn-close-history'),
        historyList: document.getElementById('history-list'),

        // Output & Export
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

    window.DOM = DOM;

    /**
     * Displays a temporary toast notification.
     * @param {string} message - The message to display.
     * @param {string} [type='success'] - 'success' or 'error' styling.
     */
    function showToastNotification(message, type = 'success') {
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
    }

    window.showToastNotification = showToastNotification;

    /**
     * Updates the API Status visual indicators.
     */
    function updateApiUI() {
        if (!DOM.apiIndicator || !DOM.apiStatusText || !DOM.apiStatusDot) return;
        if (window.AppState.apiKey) {
            DOM.apiStatusDot.className = 'status-dot';
            DOM.apiStatusText.innerText = 'API Connected';
            DOM.apiIndicator.style.borderColor = 'var(--accent-emerald)';
            if (DOM.apiKeyInput) DOM.apiKeyInput.value = window.AppState.apiKey;
        } else {
            DOM.apiStatusDot.className = 'status-dot demo';
            DOM.apiStatusText.innerText = 'Demo Mode';
            DOM.apiIndicator.style.borderColor = 'var(--accent-cyan)';
        }
    }

    /**
     * Updates the word count display for the transcript input.
     */
    function updateWordCount() {
        if (!DOM.transcriptInput || !DOM.transcriptWordCount) return;
        
        if (!window.AppState.settings.showWordCount) {
            DOM.transcriptWordCount.style.display = 'none';
            return;
        }
        
        DOM.transcriptWordCount.style.display = 'block';
        const text = DOM.transcriptInput.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        DOM.transcriptWordCount.innerText = `${words} words`;
    }

    /**
     * Synchronizes the active tab visual indicator underline.
     */
    function updateTabIndicator() {
        if (!DOM.tabIndicator) return;
        const activeTab = document.querySelector('.tab-item.active');
        if (activeTab) {
            DOM.tabIndicator.style.width = `${activeTab.offsetWidth}px`;
            DOM.tabIndicator.style.left = `${activeTab.offsetLeft}px`;
        }
    }

    /**
     * Applies the current CSS theme variables based on AppState.
     */
    function applyCurrentTheme() {
        const migrateMap = { 'Liquid Glass': 'System', 'Clear': 'Dark' };
        if (migrateMap[window.AppState.settings.theme]) {
            window.AppState.settings.theme = migrateMap[window.AppState.settings.theme];
            window.StateManager.safeSetLocalStorage('cl_settings', JSON.stringify(window.AppState.settings));
        }
        
        const theme = window.AppState.settings.theme;
        const html = document.documentElement;
        
        if (theme === 'Dark') {
            html.setAttribute('data-theme', 'dark');
        } else if (theme === 'Light') {
            html.setAttribute('data-theme', 'light');
        } else {
            html.removeAttribute('data-theme');
        }
        updateThemeToggleIcon();
    }

    /**
     * Updates the sun/moon icon based on active theme.
     */
    function updateThemeToggleIcon() {
        const btnToggleTheme = document.getElementById('btn-toggle-theme');
        if (!btnToggleTheme) return;
        const iconLight = btnToggleTheme.querySelector('.theme-icon-light');
        const iconDark = btnToggleTheme.querySelector('.theme-icon-dark');
        if (!iconLight || !iconDark) return;
        
        let isDark = false;
        const currentTheme = window.AppState.settings.theme;
        if (currentTheme === 'Dark') {
            isDark = true;
        } else if (currentTheme === 'Light') {
            isDark = false;
        } else {
            isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        
        if (isDark) {
            iconLight.classList.remove('hidden');
            iconDark.classList.add('hidden');
        } else {
            iconLight.classList.add('hidden');
            iconDark.classList.remove('hidden');
        }
    }

    /**
     * Saves user form settings into AppState and persists to localStorage.
     */
    function saveSettings() {
        try {
            const langEl = document.querySelector('input[name="st_language"]:checked');
            if (langEl) window.AppState.settings.language = langEl.value;

            const lenEl = document.querySelector('input[name="st_length"]:checked');
            if (lenEl) window.AppState.settings.contentLength = lenEl.value;

            const emoEl = document.querySelector('input[name="st_emojis"]:checked');
            if (emoEl) window.AppState.settings.emojiDensity = emoEl.value;

            const themeEl = document.querySelector('input[name="st_theme"]:checked');
            if (themeEl) window.AppState.settings.theme = themeEl.value;

            if (DOM.stTone) window.AppState.settings.tone = DOM.stTone.value;
            if (DOM.stAudience) window.AppState.settings.audience = DOM.stAudience.value;
            if (DOM.stNiche) window.AppState.settings.niche = DOM.stNiche.value;
            if (DOM.stBrandVoice) window.AppState.settings.brandVoice = DOM.stBrandVoice.value;
            if (DOM.stModel) window.AppState.settings.model = DOM.stModel.value;

            if (DOM.stTemperature) window.AppState.settings.temperature = parseFloat(DOM.stTemperature.value);
            if (DOM.stMaxTokens) window.AppState.settings.maxTokens = parseInt(DOM.stMaxTokens.value, 10);

            const ctaEl = document.getElementById('st_cta');
            if (ctaEl) window.AppState.settings.ctaStyle = ctaEl.value;

            if (DOM.stSafety) window.AppState.settings.safetyFilter = DOM.stSafety.checked;
            if (DOM.stKeepEnglishTerms) window.AppState.settings.keepEnglishTerms = DOM.stKeepEnglishTerms.checked;
            if (DOM.stAutosave) window.AppState.settings.autoSave = DOM.stAutosave.checked;
            if (DOM.stWordcount) window.AppState.settings.showWordCount = DOM.stWordcount.checked;

            if (DOM.stUseCustomPrompt) window.AppState.settings.useCustomPrompt = DOM.stUseCustomPrompt.checked;
            if (DOM.stCustomPromptText) {
                window.AppState.customPrompt = DOM.stCustomPromptText.value;
                window.StateManager.safeSetLocalStorage('cl_custom_prompt', window.AppState.customPrompt);
            }

            window.StateManager.safeSetLocalStorage('cl_settings', JSON.stringify(window.AppState.settings));
            applyCurrentTheme();
            updateWordCount();
        } catch(e) {
            console.error("Failed to capture and save settings:", e);
        }
    }

    /**
     * Reads AppState and restores the visual UI form fields to match.
     */
    function restoreSettingsUI() {
        try {
            const langEl = document.querySelector(`input[name="st_language"][value="${window.AppState.settings.language}"]`);
            if (langEl) langEl.checked = true;

            const lenEl = document.querySelector(`input[name="st_length"][value="${window.AppState.settings.contentLength}"]`);
            if (lenEl) lenEl.checked = true;

            const emoEl = document.querySelector(`input[name="st_emojis"][value="${window.AppState.settings.emojiDensity}"]`);
            if (emoEl) emoEl.checked = true;

            const themeEl = document.querySelector(`input[name="st_theme"][value="${window.AppState.settings.theme}"]`);
            if (themeEl) themeEl.checked = true;

            if (DOM.stTone) DOM.stTone.value = window.AppState.settings.tone;
            if (DOM.stAudience) DOM.stAudience.value = window.AppState.settings.audience;
            if (DOM.stNiche) DOM.stNiche.value = window.AppState.settings.niche;
            if (DOM.stBrandVoice) DOM.stBrandVoice.value = window.AppState.settings.brandVoice || '';
            if (DOM.stModel) DOM.stModel.value = window.AppState.settings.model;

            if (DOM.stTemperature) {
                DOM.stTemperature.value = window.AppState.settings.temperature;
                const tempVal = document.getElementById('temp-val');
                if (tempVal) tempVal.innerText = window.AppState.settings.temperature;
            }
            if (DOM.stMaxTokens) {
                DOM.stMaxTokens.value = window.AppState.settings.maxTokens;
                const tokensVal = document.getElementById('tokens-val');
                if (tokensVal) tokensVal.innerText = window.AppState.settings.maxTokens;
            }

            const ctaEl = document.getElementById('st_cta');
            if (ctaEl) ctaEl.value = window.AppState.settings.ctaStyle || 'Question';

            if (DOM.stSafety) DOM.stSafety.checked = window.AppState.settings.safetyFilter;
            if (DOM.stKeepEnglishTerms) DOM.stKeepEnglishTerms.checked = window.AppState.settings.keepEnglishTerms;
            if (DOM.stAutosave) DOM.stAutosave.checked = window.AppState.settings.autoSave;
            if (DOM.stWordcount) DOM.stWordcount.checked = window.AppState.settings.showWordCount;

            if (DOM.stUseCustomPrompt) {
                DOM.stUseCustomPrompt.checked = window.AppState.settings.useCustomPrompt;
                if (DOM.customPromptGroup) {
                    DOM.customPromptGroup.style.display = window.AppState.settings.useCustomPrompt ? 'block' : 'none';
                }
            }
            
            if (DOM.stCustomPromptText) {
                // If custom prompt is empty, populate it with the baseline generated one, temporarily bypassing the use-custom flag
                if (!window.AppState.customPrompt) {
                    const tempConfig = Object.assign({}, window.AppState.settings, { useCustomPrompt: false });
                    window.AppState.customPrompt = window.Prompts.getSystemInstruction(tempConfig);
                }
                DOM.stCustomPromptText.value = window.AppState.customPrompt;
                if (DOM.customPromptCharCount) {
                    DOM.customPromptCharCount.innerText = DOM.stCustomPromptText.value.length + " chars";
                }
            }

            updateWordCount();
            updateTranscriptPlaceholder(window.AppState.settings.language);
        } catch(e) {
            console.error("Failed to restore settings UI elements:", e);
        }
    }

    /**
     * Updates the placeholder text in the transcript textarea based on the selected language.
     * @param {string} language - The selected target language.
     */
    function updateTranscriptPlaceholder(language) {
        if (!DOM.transcriptInput) return;
        let placeholder = "Paste your video transcript here...\n\n";
        
        if (language === 'Bengali') {
            placeholder += "বাংলা বা ইংরেজি ট্রান্সক্রিপ্ট পেস্ট করুন।";
        } else if (language === 'Hindi') {
            placeholder += "अपना वीडियो या ऑडियो ट्रांसक्रिप्ट यहाँ पेस्ट करें।";
        } else if (language === 'Urdu') {
            placeholder += "اپنی ویڈیو یا آڈیو ٹرانسکرپٹ یہاں پیسٹ کریں۔";
        } else {
            placeholder += "Paste your English or Bilingual transcript.";
        }
        
        placeholder += "\n\n(Timestamped transcripts are also supported!)";
        DOM.transcriptInput.placeholder = placeholder;
    }

    return {
        updateApiUI,
        updateWordCount,
        updateTabIndicator,
        applyCurrentTheme,
        updateThemeToggleIcon,
        saveSettings,
        restoreSettingsUI,
        updateTranscriptPlaceholder
    };
})();
