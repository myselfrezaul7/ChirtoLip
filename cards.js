/**
 * CHITROLIP AI - CARDS & RENDERING
 * Handles the bento grid cards, inline editing, and text rendering.
 */

window.Cards = (function() {

    /**
     * Renders the markdown formatted text into the specified DOM element.
     * 
     * @param {HTMLElement} element - The target container element.
     * @param {string} text - The raw text/markdown to parse and render.
     * @param {boolean} [isStreaming=true] - Whether to append the typing cursor.
     */
    function renderStreamingText(element, text, isStreaming = true) {
        if (!element) return;
        
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

    /**
     * Force-renders all current outputs from AppState across the dashboard.
     */
    function renderAllOutputs() {
        Object.keys(window.AppState.outputs).forEach(key => {
            if (window.DOM.outputDivs[key]) {
                renderStreamingText(window.DOM.outputDivs[key], window.AppState.outputs[key], false);
            }
        });
    }

    /**
     * Initializes per-card enhancements like word counters and regenerate buttons.
     */
    function setupCardEnhancements() {
        document.querySelectorAll('.bento-card').forEach(card => {
            const body = card.querySelector('.card-body');
            const actions = card.querySelector('.card-actions');
            const streamDiv = card.querySelector('.streaming-text');
            if (!body || !streamDiv) return;

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
                window.AppState.outputs[key] = streamDiv.innerHTML;
                if (window.AppState.settings.autoSave) {
                    window.StateManager.safeSetLocalStorage('cl_last_outputs', JSON.stringify(window.AppState.outputs));
                }
            });

            const observer = new MutationObserver(updateCounter);
            observer.observe(streamDiv, { childList: true, subtree: true, characterData: true });

            if (actions) {
                const regenBtn = document.createElement('button');
                regenBtn.className = 'icon-btn-small btn-regen';
                regenBtn.title = 'Regenerate this card';
                regenBtn.innerHTML = '🔄';
                actions.insertBefore(regenBtn, actions.firstChild);
                
                regenBtn.addEventListener('click', async () => {
                    if (!window.AppState.apiKey) {
                        window.showToastNotification("API Key required to regenerate.", "error");
                        return;
                    }
                    if (!window.AppState.lastContentContext) {
                        window.showToastNotification("No context available to regenerate. Please run a full generation first.", "error");
                        return;
                    }

                    const key = streamDiv.id.replace('out-', '');
                    const originalHtml = regenBtn.innerHTML;
                    regenBtn.innerHTML = '⏳';
                    regenBtn.disabled = true;
                    
                    try {
                        streamDiv.innerHTML = '<span class="streaming-cursor"></span>';
                        const sysInstr = window.Prompts.getSystemInstruction(window.AppState.settings);
                        
                        let promptToUse = "";
                        if (['youtube', 'thumbnail'].includes(key)) promptToUse = window.Prompts.getBatch1Prompt(window.AppState.lastContentContext);
                        else if (['facebook', 'linkedin', 'twitter', 'newsletter'].includes(key)) promptToUse = window.Prompts.getBatch2Prompt(window.AppState.lastContentContext);
                        else if (['shorts', 'blog'].includes(key)) promptToUse = window.Prompts.getBatch3Prompt(window.AppState.lastContentContext);
                        else promptToUse = window.Prompts.getBatch4Prompt(window.AppState.lastContentContext);

                        await window.GeminiAPI.streamGenerate({
                            apiKey: window.AppState.apiKey,
                            model: window.AppState.settings.model,
                            systemInstruction: sysInstr,
                            userPrompt: promptToUse,
                            temperature: window.AppState.settings.temperature + 0.1, 
                            maxOutputTokens: window.AppState.settings.maxTokens,
                            safetyFilter: window.AppState.settings.safetyFilter,
                            onChunk: (text) => {
                                try {
                                    const parsed = window.GeminiAPI.parsePartialJSON(text);
                                    if (parsed[key]) {
                                        renderStreamingText(streamDiv, parsed[key]);
                                    }
                                } catch(e){}
                            },
                            onTokens: (count) => {
                                if (window.Generation && window.Generation.accumulateTokens) {
                                    window.Generation.accumulateTokens(count);
                                }
                            }
                        });
                        
                        const resultText = streamDiv.innerHTML.replace('<span class="streaming-cursor"></span>', '');
                        window.AppState.outputs[key] = resultText;
                        if (window.AppState.settings.autoSave) window.StateManager.safeSetLocalStorage('cl_last_outputs', JSON.stringify(window.AppState.outputs));
                        window.showToastNotification(`Successfully regenerated ${key}!`, "success");
                    } catch (e) {
                        console.error(e);
                        window.showToastNotification("Regeneration failed.", "error");
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

    /**
     * Visually marks a card as failed and provides an instant retry button.
     * @param {string} cardSelector - The CSS selector for the card.
     * @param {string[]} outputIds - The JSON keys associated with this card.
     * @param {string} promptText - The prompt to retry generation with.
     */
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
                    const sysInstr = window.Prompts.getSystemInstruction(window.AppState.settings);
                    const inlineDataObj = window.AppState.activeInputTab === 'tab-audio' ? window.AppState.audioData : null;
                    
                    const result = await window.GeminiAPI.streamGenerate({
                        apiKey: window.AppState.apiKey,
                        model: window.AppState.settings.model,
                        systemInstruction: sysInstr,
                        userPrompt: promptText,
                        temperature: window.AppState.settings.temperature,
                        maxOutputTokens: window.AppState.settings.maxTokens,
                        safetyFilter: window.AppState.settings.safetyFilter,
                        inlineData: inlineDataObj,
                        onChunk: (jsonStr) => {
                            try {
                                const partial = window.GeminiAPI.parsePartialJSON(jsonStr);
                                outputIds.forEach(id => {
                                    if (partial[id] && window.DOM.outputDivs[id]) {
                                        renderStreamingText(window.DOM.outputDivs[id], partial[id]);
                                    }
                                });
                            } catch(e) {}
                        }
                    });
                    
                    Object.assign(window.AppState.outputs, result);
                    if (window.AppState.settings.autoSave) {
                        window.StateManager.safeSetLocalStorage('cl_last_outputs', JSON.stringify(window.AppState.outputs));
                    }
                    renderAllOutputs();
                    window.showToastNotification("Block regenerated successfully!", "success");
                } catch(err) {
                    window.showToastNotification("Regeneration error: " + err.message, "error");
                    markCardError(cardSelector, outputIds, promptText);
                }
            });
        }
    }

    return {
        renderStreamingText,
        renderAllOutputs,
        setupCardEnhancements,
        markCardError
    };
})();
