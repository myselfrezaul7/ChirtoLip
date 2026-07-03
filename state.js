/**
 * CHITROLIP AI - STATE MANAGEMENT
 * Handles global AppState and LocalStorage wrappers.
 */

window.StateManager = (function() {
    /**
     * Safely retrieves a value from localStorage.
     * @param {string} key - The localStorage key.
     * @param {*} fallbackValue - Value to return if key is missing or access is denied.
     * @returns {*} The parsed string or fallback value.
     */
    function safeGetLocalStorage(key, fallbackValue) {
        try {
            const val = localStorage.getItem(key);
            return val !== null ? val : fallbackValue;
        } catch(e) {
            console.warn("Storage read failed or blocked for:", key, e);
            return fallbackValue;
        }
    }

    /**
     * Safely sets a value in localStorage.
     * @param {string} key - The localStorage key.
     * @param {string} value - The value to store.
     */
    function safeSetLocalStorage(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch(e) {
            console.warn("Storage write failed or blocked for:", key, e);
        }
    }

    /**
     * Safely removes a value from localStorage.
     * @param {string} key - The localStorage key.
     */
    function safeRemoveLocalStorage(key) {
        try {
            localStorage.removeItem(key);
        } catch(e) {
            console.warn("Storage removal failed or blocked for:", key, e);
        }
    }

    // One-time migration from old vtc_ keys to new cl_ keys
    (function migrateLocalStorageKeys() {
        const migrationMap = {
            'vtc_settings': 'cl_settings',
            'vtc_gemini_api_key': 'cl_gemini_api_key',
            'vtc_last_outputs': 'cl_last_outputs',
            'vtc_history': 'cl_history',
            'vtc_last_transcript': 'cl_last_transcript'
        };
        try {
            let migrated = false;
            for (const [oldKey, newKey] of Object.entries(migrationMap)) {
                const oldVal = localStorage.getItem(oldKey);
                if (oldVal !== null && localStorage.getItem(newKey) === null) {
                    localStorage.setItem(newKey, oldVal);
                    migrated = true;
                }
            }
            if (migrated) {
                console.log('ChitroLip: Migrated localStorage keys from vtc_ to cl_ prefix.');
            }
        } catch (e) {
            console.warn('ChitroLip: localStorage migration skipped.', e);
        }
    })();

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
        showWordCount: true,
        useCustomPrompt: false,
        keepEnglishTerms: true
    };

    let initialSettings = defaultSettings;
    try {
        const rawSettings = safeGetLocalStorage('cl_settings', null);
        if (rawSettings) {
            initialSettings = Object.assign({}, defaultSettings, JSON.parse(rawSettings));
        }
    } catch(e) {
        console.warn("Failed to parse settings from storage. Resetting to default.", e);
    }

    const AppState = {
        apiKey: safeGetLocalStorage('cl_gemini_api_key', ''),
        activeInputTab: 'tab-transcript',
        audioData: null,
        documentData: null,
        outputs: {},
        lastContentContext: '',
        isGenerating: false,
        settings: initialSettings,
        history: [],
        totalTokensSession: 0,
        customPrompt: safeGetLocalStorage('cl_custom_prompt', '')
    };

    window.AppState = AppState;

    /**
     * Saves the current active session inputs and outputs to localStorage.
     */
    function saveCurrentSession() {
        if (!AppState.settings.autoSave) return;
        const sessionData = {
            activeInputTab: AppState.activeInputTab,
            transcript: document.getElementById('transcript-input') ? document.getElementById('transcript-input').value : '',
            youtubeUrl: document.getElementById('youtube-url-input') ? document.getElementById('youtube-url-input').value : '',
            outputs: AppState.outputs
        };
        safeSetLocalStorage('cl_current_session', JSON.stringify(sessionData));
    }

    /**
     * Restores the session from localStorage if it exists.
     */
    function restoreCurrentSession() {
        try {
            const raw = safeGetLocalStorage('cl_current_session', null);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.transcript && document.getElementById('transcript-input')) {
                    document.getElementById('transcript-input').value = data.transcript;
                }
                if (data.youtubeUrl && document.getElementById('youtube-url-input')) {
                    document.getElementById('youtube-url-input').value = data.youtubeUrl;
                }
                if (data.activeInputTab) {
                    const tabBtn = document.querySelector(`.tab-item[data-tab="${data.activeInputTab}"]`);
                    if (tabBtn) tabBtn.click();
                }
                if (data.outputs && Object.keys(data.outputs).length > 0) {
                    AppState.outputs = data.outputs;
                    
                    if (window.Cards) {
                        Object.keys(AppState.outputs).forEach(key => {
                            const div = document.getElementById(`out-${key}`);
                            if (div) window.Cards.renderStreamingText(div, AppState.outputs[key], false);
                        });
                        
                        if (document.getElementById('output-dashboard')) {
                            document.getElementById('output-dashboard').classList.remove('hidden');
                        }
                        if (document.getElementById('hero-empty-state')) {
                            document.getElementById('hero-empty-state').classList.add('hidden');
                        }
                        if (document.getElementById('export-bar')) {
                            document.getElementById('export-bar').classList.remove('hidden');
                        }
                    }
                }
            }
        } catch(e) {
            console.error("Failed to restore session:", e);
        }
    }

    /**
     * Clears the current session and resets the UI.
     */
    function clearCurrentSession() {
        safeRemoveLocalStorage('cl_current_session');
        AppState.outputs = {};
        if (document.getElementById('transcript-input')) document.getElementById('transcript-input').value = '';
        if (document.getElementById('youtube-url-input')) document.getElementById('youtube-url-input').value = '';
        
        if (document.getElementById('output-dashboard')) document.getElementById('output-dashboard').classList.add('hidden');
        if (document.getElementById('export-bar')) document.getElementById('export-bar').classList.add('hidden');
        if (document.getElementById('hero-empty-state')) {
            document.getElementById('hero-empty-state').classList.remove('hidden');
        }
        
        const keys = ['youtube', 'thumbnail', 'timestamps', 'keywords', 'keymoments', 'facebook', 'twitter', 'linkedin', 'newsletter', 'shorts', 'blog'];
        keys.forEach(k => {
            const div = document.getElementById(`out-${k}`);
            if (div) div.innerHTML = '';
        });
        
        if (window.showToastNotification) window.showToastNotification("Session cleared successfully.", "success");
    }

    return {
        safeGetLocalStorage,
        safeSetLocalStorage,
        safeRemoveLocalStorage,
        defaultSettings,
        saveCurrentSession,
        restoreCurrentSession,
        clearCurrentSession
    };
})();
