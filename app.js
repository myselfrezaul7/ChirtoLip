/**
 * CHITROLIP AI - MAIN ORCHESTRATOR
 * Binds DOM events and initializes the application modules.
 */

window.onerror = function(msg, url, line, col, error) {
    console.error("Global Error Boundary Trapped:", msg, "at", url, ":", line, col, error);
    try {
        if (window.showToastNotification) {
            window.showToastNotification("A minor interface error occurred. App recovered safely.", "error");
        }
    } catch(e) {}
    return false;
};

window.onunhandledrejection = function(event) {
    console.error("Unhandled Promise Rejection Trapped:", event.reason);
    try {
        if (window.showToastNotification) {
            window.showToastNotification("Network operation failed or timed out. Check your connection.", "error");
        }
    } catch(e) {}
};

document.addEventListener('DOMContentLoaded', () => {
    const DOM = window.DOM;

    function init() {
        bindEvents();
        window.UI.updateApiUI();
        window.UI.restoreSettingsUI();
        window.UI.updateTabIndicator();
        window.UI.applyCurrentTheme();
        
        if (window.AppState.settings.autoSave) {
            const lastOutputs = window.StateManager.safeGetLocalStorage('cl_last_outputs', null);
            if (lastOutputs) {
                try {
                    window.AppState.outputs = JSON.parse(lastOutputs);
                    window.Cards.renderAllOutputs();
                    if (DOM.outputDashboard) {
                        if (DOM.heroEmptyState) DOM.heroEmptyState.style.display = 'none';
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
            
            const storedHistory = window.StateManager.safeGetLocalStorage('cl_history', null);
            if (storedHistory) {
                try {
                    window.AppState.history = JSON.parse(storedHistory);
                } catch (e) {}
            }
        }

        const lastTranscript = window.StateManager.safeGetLocalStorage('cl_last_transcript', null);
        if (lastTranscript && DOM.transcriptInput) {
            DOM.transcriptInput.value = lastTranscript;
            window.UI.updateWordCount();
        }
        
        window.Cards.setupCardEnhancements();
    }

    function bindEvents() {
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
                    window.AppState.apiKey = '';
                    window.StateManager.safeRemoveLocalStorage('cl_gemini_api_key');
                    window.UI.updateApiUI();
                    window.showToastNotification("API Key removed. Running in Demo Mode.", "success");
                    return;
                }

                DOM.btnSaveApi.innerText = "Testing...";
                DOM.btnSaveApi.disabled = true;

                const test = await window.GeminiAPI.testConnection(key, window.AppState.settings.model);
                if (test.valid) {
                    window.AppState.apiKey = key;
                    window.StateManager.safeSetLocalStorage('cl_gemini_api_key', key);
                    if (DOM.apiSetupPanel) DOM.apiSetupPanel.classList.add('hidden');
                    window.showToastNotification("API Key verified & saved securely!", "success");
                } else {
                    window.showToastNotification("Invalid API Key: " + test.error, "error");
                }

                DOM.btnSaveApi.innerText = "Save & Test";
                DOM.btnSaveApi.disabled = false;
                window.UI.updateApiUI();
            });
        }

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
                
                window.AppState.activeInputTab = targetId;
                window.UI.updateTabIndicator();
            });
        });

        if (DOM.transcriptInput) {
            DOM.transcriptInput.addEventListener('input', () => {
                window.UI.updateWordCount();
                window.StateManager.safeSetLocalStorage('cl_last_transcript', DOM.transcriptInput.value);
            });
        }

        if (DOM.btnLoadSample) {
            DOM.btnLoadSample.addEventListener('click', () => {
                if (DOM.transcriptInput) {
                    DOM.transcriptInput.value = window.DemoData.transcript;
                    window.UI.updateWordCount();
                    window.showToastNotification("Sample transcript loaded", "success");
                }
            });
        }

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
                        window.AppState.audioData = null;
                        if (DOM.fileInfoAudio) DOM.fileInfoAudio.classList.add('hidden');
                        const cg = dropZone.querySelector('.drop-zone-content');
                        if (cg) cg.classList.remove('hidden');
                    } else if (type === 'doc') {
                        window.AppState.documentData = null;
                        if (DOM.fileInfoDoc) DOM.fileInfoDoc.classList.add('hidden');
                        const cg = dropZone.querySelector('.drop-zone-content');
                        if (cg) cg.classList.remove('hidden');
                    }
                    fileInput.value = '';
                });
            }
        }

        async function handleFileSelect(file, type) {
            if (!file) return;
            if (file.size > 100 * 1024 * 1024) {
                window.showToastNotification("File exceeds 100MB limit. Please compress.", "error");
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
                    window.AppState.audioData = base64Data;
                } else {
                    window.AppState.documentData = base64Data;
                }
                window.showToastNotification("File loaded successfully!", "success");
            } catch (e) {
                window.showToastNotification("Failed to process file.", "error");
            }
        }

        setupFileDrop(DOM.dropZoneAudio, DOM.fileInputAudio, DOM.btnBrowseAudio, DOM.btnRemoveAudio, 'audio');
        setupFileDrop(DOM.dropZoneDoc, DOM.fileInputDoc, DOM.btnBrowseDoc, DOM.btnRemoveDoc, 'doc');

        if (DOM.btnHistory) {
            DOM.btnHistory.addEventListener('click', () => {
                window.History.renderHistoryList();
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
                window.Generation.stopGenerate();
            });
        }

        if (DOM.btnToggleSettings) {
            DOM.btnToggleSettings.addEventListener('click', () => {
                if (DOM.settingsDrawer) DOM.settingsDrawer.classList.remove('closed');
                if (DOM.settingsOverlay) DOM.settingsOverlay.classList.remove('hidden');
            });
        }
        
        const btnToggleTheme = document.getElementById('btn-toggle-theme');
        if (btnToggleTheme) {
            btnToggleTheme.addEventListener('click', () => {
                let effectiveTheme = window.AppState.settings.theme;
                if (effectiveTheme === 'System') {
                    effectiveTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Dark' : 'Light';
                }
                const newTheme = effectiveTheme === 'Dark' ? 'Light' : 'Dark';
                window.AppState.settings.theme = newTheme;
                window.UI.applyCurrentTheme();
                window.StateManager.safeSetLocalStorage('cl_settings', JSON.stringify(window.AppState.settings));
                window.UI.restoreSettingsUI();
            });
        }

        if (window.matchMedia) {
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                if (window.AppState.settings.theme === 'System') {
                    window.UI.applyCurrentTheme();
                }
            });
        }
        
        const closeSettings = () => {
            if (DOM.settingsDrawer) DOM.settingsDrawer.classList.add('closed');
            if (DOM.settingsOverlay) DOM.settingsOverlay.classList.add('hidden');
            window.UI.saveSettings();
        };
        
        if (DOM.btnCloseSettings) DOM.btnCloseSettings.addEventListener('click', closeSettings);
        if (DOM.settingsOverlay) DOM.settingsOverlay.addEventListener('click', closeSettings);

        document.querySelectorAll('input[name="st_language"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (window.UI.updateTranscriptPlaceholder) {
                    window.UI.updateTranscriptPlaceholder(e.target.value);
                }
            });
        });

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

        const customPromptGroup = document.getElementById('custom_prompt_group');
        const stUseCustomPrompt = document.getElementById('st_use_custom_prompt');
        const stCustomPromptText = document.getElementById('st_custom_prompt_text');
        const customPromptCharCount = document.getElementById('custom_prompt_char_count');
        const btnResetCustomPrompt = document.getElementById('btn_reset_custom_prompt');

        if (stUseCustomPrompt && customPromptGroup) {
            stUseCustomPrompt.addEventListener('change', (e) => {
                customPromptGroup.style.display = e.target.checked ? 'block' : 'none';
                if (e.target.checked && !stCustomPromptText.value) {
                    const tempConfig = Object.assign({}, window.AppState.settings, { useCustomPrompt: false });
                    stCustomPromptText.value = window.Prompts.getSystemInstruction(tempConfig);
                    if (customPromptCharCount) customPromptCharCount.innerText = stCustomPromptText.value.length + " chars";
                }
            });
        }

        if (stCustomPromptText && customPromptCharCount) {
            stCustomPromptText.addEventListener('input', (e) => {
                customPromptCharCount.innerText = e.target.value.length + " chars";
            });
        }

        if (btnResetCustomPrompt && stCustomPromptText) {
            btnResetCustomPrompt.addEventListener('click', () => {
                if (confirm("Reset custom prompt back to the dynamically generated system instruction?")) {
                    const tempConfig = Object.assign({}, window.AppState.settings, { useCustomPrompt: false });
                    stCustomPromptText.value = window.Prompts.getSystemInstruction(tempConfig);
                    if (customPromptCharCount) customPromptCharCount.innerText = stCustomPromptText.value.length + " chars";
                    window.showToastNotification("Custom prompt reset to default.", "success");
                }
            });
        }

        if (DOM.btnExportSettings) {
            DOM.btnExportSettings.addEventListener('click', () => {
                try {
                    const dataStr = JSON.stringify(window.AppState.settings, null, 2);
                    window.ExportUtils.downloadFile(dataStr, "chitrolip_settings.json", "application/json");
                    window.showToastNotification("Settings exported successfully!", "success");
                } catch(e) {
                    window.showToastNotification("Failed to export settings.", "error");
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
                            window.AppState.settings = Object.assign({}, window.StateManager.defaultSettings, parsed);
                            window.UI.saveSettings();
                            window.UI.restoreSettingsUI();
                            window.UI.applyCurrentTheme();
                            window.showToastNotification("Setup imported and restored!", "success");
                        } else {
                            window.showToastNotification("Invalid file layout.", "error");
                        }
                    } catch(err) {
                        window.showToastNotification("Failed to read settings file.", "error");
                    }
                };
                reader.onerror = () => window.showToastNotification("Error reading file.", "error");
                reader.readAsText(file);
                DOM.importSettingsFile.value = '';
            });
        }

        if (DOM.btnResetSettings) {
            DOM.btnResetSettings.addEventListener('click', () => {
                if (confirm("Reset all settings to original factory defaults?")) {
                    window.AppState.settings = Object.assign({}, window.StateManager.defaultSettings);
                    window.UI.saveSettings();
                    window.UI.restoreSettingsUI();
                    window.UI.applyCurrentTheme();
                    window.showToastNotification("Defaults restored successfully.", "success");
                }
            });
        }

        if (DOM.btnGenerate) {
            DOM.btnGenerate.addEventListener('click', () => {
                window.Generation.handleGenerate();
            });
        }

        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('data-target');
                const targetEl = document.getElementById(targetId);
                if (!targetEl) return;
                const text = targetEl.innerText;
                window.ExportUtils.copyToClipboard(text);
                
                const originalHtml = e.currentTarget.innerHTML;
                e.currentTarget.innerHTML = "✅";
                window.showToastNotification("Copied to clipboard!", "success");
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

        document.querySelectorAll('.btn-score').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (!window.AppState.apiKey) {
                    window.showToastNotification("API Key required to score content.", "error");
                    return;
                }
                
                const btnEl = e.currentTarget;
                const targetId = btnEl.getAttribute('data-target');
                const platform = btnEl.getAttribute('data-platform');
                const targetTextContainer = document.getElementById(targetId);
                if (!targetTextContainer) return;
                const contentText = targetTextContainer.innerText.trim();
                
                if (!contentText || contentText.includes("Generating...")) {
                    window.showToastNotification("No completed content to score.", "error");
                    return;
                }

                if (btnEl.disabled) return;
                const originalHtml = btnEl.innerHTML;
                btnEl.innerHTML = "⏳";
                btnEl.disabled = true;

                try {
                    const prompt = window.Prompts.getScorePrompt(platform, contentText);
                    const scoreData = await window.GeminiAPI.generate({
                        apiKey: window.AppState.apiKey,
                        model: window.AppState.settings.model,
                        systemInstruction: "You are an expert AI content evaluator. Score the provided text out of 10 and return suggestions.",
                        userPrompt: prompt,
                        temperature: 0.1, 
                        maxOutputTokens: 2048,
                        safetyFilter: window.AppState.settings.safetyFilter,
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

                        let badgeHTML = `
                            <span>🏆 Score: ${avg}/10</span>
                            <div class="score-details">H:${scoreData.hook} | R:${scoreData.readability} | E:${scoreData.engagement} | F:${scoreData.platform_fit}</div>
                        `;
                        
                        if (scoreData.rewrite) {
                            badgeHTML += `
                                <div class="score-rewrite" style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 0.8rem; font-style: italic;">
                                    <strong>AI Rewrite:</strong> ${scoreData.rewrite}
                                </div>
                            `;
                        }

                        badge.innerHTML = badgeHTML;
                        cardBody.appendChild(badge);
                        
                        if (scoreData.suggestions && scoreData.suggestions.length > 0) {
                            window.showToastNotification(`💡 Tip: ${scoreData.suggestions[0]}`, "success");
                        }
                    }
                    
                } catch (err) {
                    window.showToastNotification("Scoring failed: " + err.message, "error");
                } finally {
                    btnEl.innerHTML = originalHtml;
                    btnEl.disabled = false;
                }
            });
        });

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

        if (DOM.btnExportMd) {
            DOM.btnExportMd.addEventListener('click', () => {
                if (Object.keys(window.AppState.outputs).length === 0) return;
                const md = window.ExportUtils.compileMarkdownKit(window.AppState.outputs, window.AppState.settings);
                window.ExportUtils.downloadFile(md, `ChitroLip_Kit_${window.ExportUtils.getFormattedDate()}.md`, "text/markdown");
            });
        }
        
        if (DOM.btnExportZip) {
            DOM.btnExportZip.addEventListener('click', async () => {
                if (Object.keys(window.AppState.outputs).length === 0) return;
                
                const originalHtml = DOM.btnExportZip.innerHTML;
                DOM.btnExportZip.innerHTML = "⏳";
                DOM.btnExportZip.disabled = true;
                
                try {
                    await window.ExportUtils.downloadBulkZip(window.AppState.outputs, window.AppState.settings);
                    window.showToastNotification("Bulk export downloaded successfully!", "success");
                } catch(e) {
                    window.showToastNotification("Bulk export failed.", "error");
                    console.error(e);
                } finally {
                    DOM.btnExportZip.innerHTML = originalHtml;
                    DOM.btnExportZip.disabled = false;
                }
            });
        }
        
        if (DOM.btnExportJson) {
            DOM.btnExportJson.addEventListener('click', () => {
                if (Object.keys(window.AppState.outputs).length === 0) return;
                const json = JSON.stringify(window.AppState.outputs, null, 2);
                window.ExportUtils.downloadFile(json, `ChitroLip_Kit_${window.ExportUtils.getFormattedDate()}.json`, "application/json");
            });
        }

        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                window.Generation.handleGenerate();
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                if (DOM.btnToggleSettings) DOM.btnToggleSettings.click();
            }
            if (e.key === 'Escape' && DOM.settingsDrawer && !DOM.settingsDrawer.classList.contains('closed')) {
                closeSettings();
            }
        });
        const btnClearSession = document.getElementById('btn-clear-session');
        if (btnClearSession) {
            btnClearSession.addEventListener('click', () => {
                if (confirm("Are you sure you want to clear the current session? All generated content will be lost.")) {
                    if (window.StateManager.clearCurrentSession) {
                        window.StateManager.clearCurrentSession();
                    }
                }
            });
        }
        // Demo Mode Binding
        window.triggerDemoMode = function(type) {
            const isBengali = type === 'bn';
            const demoTranscript = isBengali ? window.DemoData.transcript_bn : window.DemoData.transcript_en;
            const demoOutputs = isBengali ? window.DemoData.outputs_bn : window.DemoData.outputs_en;
            
            // Set language setting corresponding to demo
            const langEl = document.querySelector(`input[name="st_language"][value="${isBengali ? 'Bengali' : 'English'}"]`);
            if (langEl) {
                langEl.checked = true;
                if (window.UI && window.UI.updateTranscriptPlaceholder) {
                    window.UI.updateTranscriptPlaceholder(langEl.value);
                }
                if (window.UI && window.UI.saveSettings) {
                    window.UI.saveSettings();
                }
            }

            if (DOM.transcriptInput) {
                DOM.transcriptInput.value = demoTranscript;
                if (window.UI && window.UI.updateWordCount) window.UI.updateWordCount();
            }
            
            // Bypass API validation and trigger generation sequence
            if (window.Generation && window.Generation.runDemoGeneration) {
                window.Generation.runDemoGeneration(demoOutputs);
            }
        };

        const btnDemoBn = document.getElementById('btn-demo-bn');
        const btnDemoEn = document.getElementById('btn-demo-en');

        if (btnDemoBn) {
            btnDemoBn.addEventListener('click', () => window.triggerDemoMode('bn'));
        }
        if (btnDemoEn) {
            btnDemoEn.addEventListener('click', () => window.triggerDemoMode('en'));
        }

        // Restore active session if autoSave is enabled
        if (window.AppState.settings.autoSave && window.StateManager.restoreCurrentSession) {
            window.StateManager.restoreCurrentSession();
        }
    }

    init();
});
