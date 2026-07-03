/**
 * CHITROLIP AI - GENERATION ORCHESTRATION
 * Handles the core generation pipeline, API batching, and progress states.
 */

window.Generation = (function() {

    let activeAbortController = null;
    let activeDemoInterval = null;

    /**
     * Accumulates token usage during streaming and updates the UI counter.
     * @param {number} count - Tokens consumed in the latest chunk/request.
     */
    function accumulateTokens(count) {
        if (!count) return;
        window.AppState.totalTokensSession += count;
        if (window.DOM.tokenCountVal) {
            let costStr = "";
            if (window.AppState.settings.model.includes('pro')) {
                costStr = ` (~$${(window.AppState.totalTokensSession * 2.5 / 1000000).toFixed(4)})`;
            } else {
                costStr = ` (Free Tier)`;
            }
            window.DOM.tokenCountVal.innerText = window.AppState.totalTokensSession.toLocaleString() + costStr;
        }
    }

    /**
     * Triggers the CSS confetti animation on generation success.
     */
    function triggerConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        container.classList.remove('hidden');
        container.innerHTML = '';
        const colors = ['#007aff', '#af52de', '#32d74b', '#ff9500', '#ff375f', '#64d2ff', '#ff2d55'];
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.background = colors[i % colors.length];
            piece.style.setProperty('--x', `${(Math.random() - 0.5) * 600}px`);
            piece.style.setProperty('--y', `${(Math.random() - 0.5) * 600}px`);
            piece.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
            piece.style.animationDelay = `${Math.random() * 0.3}s`;
            container.appendChild(piece);
        }
        setTimeout(() => {
            container.classList.add('hidden');
            container.innerHTML = '';
        }, 2500);
    }

    /**
     * Updates the progress bar steps.
     * @param {number} stepNum - The current step (1-4).
     */
    function setStep(stepNum) {
        if (!window.DOM.steps || !window.DOM.progressFill) return;
        window.DOM.steps.forEach((step, i) => {
            if (i < stepNum - 1) {
                step.className = 'step completed';
            } else if (i === stepNum - 1) {
                step.className = 'step active';
            } else {
                step.className = 'step';
            }
        });
        window.DOM.progressFill.style.width = `${(stepNum / 3) * 100}%`;
    }

    /**
     * Prepares the UI for a new generation cycle.
     */
    function setupGenerationUI() {
        window.AppState.isGenerating = true;
        window.AppState.totalTokensSession = 0;
        if (window.DOM.btnGenerate) window.DOM.btnGenerate.classList.add('hidden');
        if (window.DOM.btnStopGenerate) window.DOM.btnStopGenerate.classList.remove('hidden');
        if (window.DOM.tokenTracker) window.DOM.tokenTracker.classList.remove('hidden');
        if (window.DOM.tokenCountVal) window.DOM.tokenCountVal.innerText = '0';

        if (window.DOM.progressContainer) window.DOM.progressContainer.classList.remove('hidden');
        if (window.DOM.outputDashboard) {
            if (window.DOM.heroEmptyState) window.DOM.heroEmptyState.style.display = 'none';
            window.DOM.outputDashboard.classList.remove('hidden');
            window.DOM.outputDashboard.classList.remove('animate-in');
            void window.DOM.outputDashboard.offsetWidth;
            window.DOM.outputDashboard.classList.add('animate-in');
        }
        if (window.DOM.exportBar) window.DOM.exportBar.classList.add('hidden');
        
        document.querySelectorAll('.bento-card').forEach(card => {
            card.className = card.className.split(' ').filter(c => c !== 'error-state' && c !== 'expanded').join(' ');
            const oldBadge = card.querySelector('.score-badge');
            if (oldBadge) oldBadge.remove();
        });

        Object.values(window.DOM.outputDivs).forEach(div => {
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

    /**
     * Concludes the generation cycle and saves history.
     * @param {boolean} success - Whether the generation was successful.
     */
    function finishGeneration(success) {
        window.AppState.isGenerating = false;
        if (window.DOM.btnGenerate) {
            window.DOM.btnGenerate.innerHTML = `<span class="btn-text">Generate Content ✨</span><span class="shortcut-hint">Ctrl+Enter</span>`;
            window.DOM.btnGenerate.disabled = false;
            window.DOM.btnGenerate.classList.remove('hidden');
        }
        if (window.DOM.btnStopGenerate) window.DOM.btnStopGenerate.classList.add('hidden');
        
        if (success) {
            setStep(4);
            if (window.DOM.progressContainer) window.DOM.progressContainer.classList.add('hidden');
            triggerConfetti();
            if (window.DOM.exportBar) window.DOM.exportBar.classList.remove('hidden');
            window.showToastNotification("Content repurposed with elite configurations!", "success");
            
            window.Cards.renderAllOutputs();
            window.History.saveToHistory();

            if (window.AppState.settings.autoSave && window.StateManager.saveCurrentSession) {
                window.StateManager.saveCurrentSession();
            }
        } else {
            if (window.DOM.progressContainer) window.DOM.progressContainer.classList.add('hidden');
            window.showToastNotification("Generation process completed with isolated card exceptions.", "error");
        }
    }

    /**
     * Orchestrates the initial input validation before handing off to the generation engine.
     */
    async function handleGenerate() {
        if (window.AppState.isGenerating) return; 
        
        let inputPayload = null;

        if (window.AppState.activeInputTab === 'tab-transcript') {
            if (!window.DOM.transcriptInput) return;
            const text = window.DOM.transcriptInput.value.trim();
            if (!text && !window.AppState.apiKey) {
                window.DOM.transcriptInput.value = window.DemoData.transcript;
            } else if (!text) {
                window.showToastNotification("Please paste a transcript first.", "error");
                return;
            }
            inputPayload = window.DOM.transcriptInput.value.trim();
        } 
        else if (window.AppState.activeInputTab === 'tab-audio') {
            if (!window.AppState.apiKey) {
                window.showToastNotification("API Key required for direct file analysis.", "error");
                if (window.DOM.btnToggleApi) window.DOM.btnToggleApi.click();
                return;
            }
            if (!window.AppState.audioData) {
                window.showToastNotification("Please select/drag a media file first.", "error");
                return;
            }
            inputPayload = window.AppState.audioData;
        }
        else if (window.AppState.activeInputTab === 'tab-document') {
            if (!window.AppState.apiKey) {
                window.showToastNotification("API Key required for document analysis.", "error");
                if (window.DOM.btnToggleApi) window.DOM.btnToggleApi.click();
                return;
            }
            if (!window.AppState.documentData) {
                window.showToastNotification("Please select/drag a document first.", "error");
                return;
            }
            inputPayload = window.AppState.documentData;
        }
        else if (window.AppState.activeInputTab === 'tab-youtube') {
            if (!window.AppState.apiKey) {
                window.showToastNotification("API Key required for YouTube URL parsing.", "error");
                if (window.DOM.btnToggleApi) window.DOM.btnToggleApi.click();
                return;
            }
            if (!window.DOM.youtubeUrlInput) return;
            const url = window.DOM.youtubeUrlInput.value.trim();
            if (!url) {
                window.showToastNotification("Please enter a YouTube video link.", "error");
                return;
            }
            inputPayload = { fileUri: url, mimeType: "video/mp4" };
        }

        if (!window.AppState.apiKey) {
            runDemoGeneration();
            return;
        }

        runLiveGeneration(inputPayload);
    }

    /**
     * Executes the actual live generation against the Gemini API.
     * @param {*} inputPayload - The verified input text or object payload.
     */
    async function runLiveGeneration(inputPayload) {
        setupGenerationUI();
        activeAbortController = new AbortController();

        const sysInstr = window.Prompts.getSystemInstruction(window.AppState.settings);
        let transcriptText = '';
        
        try {
            if (typeof inputPayload === 'object' && inputPayload !== null) {
                setStep(2);
                window.showToastNotification("Extracting text from media...", "success");
                
                const extractionPrompt = window.Prompts.getExtractionPrompt();
                transcriptText = await window.GeminiAPI.streamGenerate({
                    apiKey: window.AppState.apiKey,
                    model: window.AppState.settings.model,
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
            
            const contentContext = typeof transcriptText === 'string' ? transcriptText : "Analyze the content deeply.";
            window.AppState.lastContentContext = contentContext;
            
            const b1Prompt = window.Prompts.getBatch1Prompt(contentContext);
            const b2Prompt = window.Prompts.getBatch2Prompt(contentContext);
            const b3Prompt = window.Prompts.getBatch3Prompt(contentContext);
            const b4Prompt = window.Prompts.getBatch4Prompt(contentContext);

            setStep(3);
            
            const batch1 = window.GeminiAPI.streamGenerate({
                apiKey: window.AppState.apiKey,
                model: window.AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b1Prompt,
                temperature: window.AppState.settings.temperature,
                maxOutputTokens: window.AppState.settings.maxTokens,
                safetyFilter: window.AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = window.GeminiAPI.parsePartialJSON(jsonStr);
                        if (partial.youtube && window.DOM.outputDivs.youtube) window.Cards.renderStreamingText(window.DOM.outputDivs.youtube, partial.youtube);
                        if (partial.thumbnail && window.DOM.outputDivs.thumbnail) window.Cards.renderStreamingText(window.DOM.outputDivs.thumbnail, partial.thumbnail);
                    } catch(e) {} 
                }
            });

            const batch2 = window.GeminiAPI.streamGenerate({
                apiKey: window.AppState.apiKey,
                model: window.AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b2Prompt,
                temperature: window.AppState.settings.temperature,
                maxOutputTokens: window.AppState.settings.maxTokens,
                safetyFilter: window.AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = window.GeminiAPI.parsePartialJSON(jsonStr);
                        if (partial.facebook && window.DOM.outputDivs.facebook) window.Cards.renderStreamingText(window.DOM.outputDivs.facebook, partial.facebook);
                        if (partial.linkedin && window.DOM.outputDivs.linkedin) window.Cards.renderStreamingText(window.DOM.outputDivs.linkedin, partial.linkedin);
                        if (partial.twitter && window.DOM.outputDivs.twitter) window.Cards.renderStreamingText(window.DOM.outputDivs.twitter, partial.twitter);
                        if (partial.newsletter && window.DOM.outputDivs.newsletter) window.Cards.renderStreamingText(window.DOM.outputDivs.newsletter, partial.newsletter);
                    } catch(e) {} 
                }
            });

            const batch3 = window.GeminiAPI.streamGenerate({
                apiKey: window.AppState.apiKey,
                model: window.AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b3Prompt,
                temperature: window.AppState.settings.temperature,
                maxOutputTokens: window.AppState.settings.maxTokens,
                safetyFilter: window.AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = window.GeminiAPI.parsePartialJSON(jsonStr);
                        if (partial.shorts && window.DOM.outputDivs.shorts) window.Cards.renderStreamingText(window.DOM.outputDivs.shorts, partial.shorts);
                        if (partial.blog && window.DOM.outputDivs.blog) window.Cards.renderStreamingText(window.DOM.outputDivs.blog, partial.blog);
                    } catch(e) {} 
                }
            });

            const batch4 = window.GeminiAPI.streamGenerate({
                apiKey: window.AppState.apiKey,
                model: window.AppState.settings.model,
                systemInstruction: sysInstr,
                userPrompt: b4Prompt,
                temperature: window.AppState.settings.temperature,
                maxOutputTokens: window.AppState.settings.maxTokens,
                safetyFilter: window.AppState.settings.safetyFilter,
                signal: activeAbortController.signal,
                onTokens: (count) => accumulateTokens(count),
                onChunk: (jsonStr) => {
                    try { 
                        const partial = window.GeminiAPI.parsePartialJSON(jsonStr);
                        if (partial.timestamps && window.DOM.outputDivs.timestamps) window.Cards.renderStreamingText(window.DOM.outputDivs.timestamps, partial.timestamps);
                        if (partial.keywords && window.DOM.outputDivs.keywords) window.Cards.renderStreamingText(window.DOM.outputDivs.keywords, partial.keywords);
                        if (partial.keymoments && window.DOM.outputDivs.keymoments) window.Cards.renderStreamingText(window.DOM.outputDivs.keymoments, partial.keymoments);
                    } catch(e) {} 
                }
            });

            const [res1, res2, res3, res4] = await Promise.allSettled([batch1, batch2, batch3, batch4]);

            window.AppState.outputs = {};
            
            if (res1.status === 'fulfilled') {
                Object.assign(window.AppState.outputs, res1.value);
            } else {
                console.error("Batch 1 failed:", res1.reason);
                window.Cards.markCardError('.card-youtube', ['youtube'], b1Prompt);
                window.Cards.markCardError('.card-thumbnail', ['thumbnail'], b1Prompt);
            }

            if (res2.status === 'fulfilled') {
                Object.assign(window.AppState.outputs, res2.value);
            } else {
                console.error("Batch 2 failed:", res2.reason);
                window.Cards.markCardError('.card-facebook', ['facebook'], b2Prompt);
                window.Cards.markCardError('.card-linkedin', ['linkedin'], b2Prompt);
                window.Cards.markCardError('.card-twitter', ['twitter'], b2Prompt);
                window.Cards.markCardError('.card-newsletter', ['newsletter'], b2Prompt);
            }

            if (res3.status === 'fulfilled') {
                Object.assign(window.AppState.outputs, res3.value);
            } else {
                console.error("Batch 3 failed:", res3.reason);
                window.Cards.markCardError('.card-shorts', ['shorts'], b3Prompt);
                window.Cards.markCardError('.card-blog', ['blog'], b3Prompt);
            }

            if (res4.status === 'fulfilled') {
                Object.assign(window.AppState.outputs, res4.value);
            } else {
                console.error("Batch 4 failed:", res4.reason);
                window.Cards.markCardError('.card-timestamps', ['timestamps'], b4Prompt);
                window.Cards.markCardError('.card-keywords', ['keywords'], b4Prompt);
                window.Cards.markCardError('.card-keymoments', ['keymoments'], b4Prompt);
            }

            finishGeneration(Object.keys(window.AppState.outputs).length > 0);
            
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error("Global Generation Pipeline Crash:", error);
            window.showToastNotification(error.message || "Generation halted midway.", "error");
            finishGeneration(false);
        }
    }

    /**
     * Executes a demo sequence for users without an API key or when explicitly triggered.
     */
    async function runDemoGeneration(demoDataOverride) {
        setupGenerationUI();
        const demo = demoDataOverride || window.DemoData.outputs_en || window.DemoData.outputs;
        
        await new Promise(r => setTimeout(r, 800));
        setStep(2);
        
        await new Promise(r => setTimeout(r, 800));
        setStep(3);

        const keys = Object.keys(demo);
        let currentIndex = 0;
        
        if (activeDemoInterval) clearInterval(activeDemoInterval);
        
        activeDemoInterval = setInterval(() => {
            currentIndex += 25;
            let finished = true;
            
            keys.forEach(key => {
                const targetText = demo[key];
                const div = window.DOM.outputDivs[key];
                if (!div) return;
                
                if (currentIndex < targetText.length) {
                    finished = false;
                    window.Cards.renderStreamingText(div, targetText.substring(0, currentIndex));
                } else {
                    window.Cards.renderStreamingText(div, targetText, false);
                }
            });

            if (finished) {
                clearInterval(activeDemoInterval);
                activeDemoInterval = null;
                window.AppState.outputs = Object.assign({}, demo);
                finishGeneration(true);
            }
        }, 20);
    }

    /**
     * Aborts an active generation.
     */
    function stopGenerate() {
        let stopped = false;
        if (activeAbortController) {
            activeAbortController.abort();
            stopped = true;
        }
        if (activeDemoInterval) {
            clearInterval(activeDemoInterval);
            activeDemoInterval = null;
            stopped = true;
        }
        
        if (stopped) {
            window.showToastNotification("Generation stopped.", "error");
            finishGeneration(Object.keys(window.AppState.outputs).length > 0);
        }
    }

    return {
        handleGenerate,
        runDemoGeneration,
        stopGenerate,
        accumulateTokens
    };
})();
