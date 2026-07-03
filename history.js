/**
 * CHITROLIP AI - HISTORY MANAGEMENT
 * Handles saving and restoring past generation records.
 */

window.History = (function() {

    /**
     * Saves the current output state to the history list if autosave is enabled.
     */
    function saveToHistory() {
        if (!window.AppState.settings.autoSave) return;
        if (Object.keys(window.AppState.outputs).length === 0) return;
        
        const timestamp = new Date().toLocaleString();
        const snippet = window.AppState.outputs.youtube 
            ? window.AppState.outputs.youtube.substring(0, 50).replace(/<[^>]*>?/gm, '') + "..." 
            : "Generated Content";
        
        const record = {
            id: Date.now(),
            date: timestamp,
            snippet: snippet,
            outputs: Object.assign({}, window.AppState.outputs),
            tokens: window.AppState.totalTokensSession
        };
        
        window.AppState.history.unshift(record);
        if (window.AppState.history.length > 20) {
            window.AppState.history.pop();
        }
        
        window.StateManager.safeSetLocalStorage('cl_history', JSON.stringify(window.AppState.history));
    }

    let lastRenderedHeadId = null;

    /**
     * Renders the history modal list based on saved states.
     */
    function renderHistoryList() {
        if (!window.DOM.historyList) return;
        
        if (window.AppState.history.length === 0) {
            if (lastRenderedHeadId === 'empty') return;
            lastRenderedHeadId = 'empty';
            window.DOM.historyList.innerHTML = '<p class="text-muted small">No history available yet.</p>';
            return;
        }

        const currentHeadId = window.AppState.history[0].id;
        if (lastRenderedHeadId === currentHeadId) return;
        
        lastRenderedHeadId = currentHeadId;
        window.DOM.historyList.innerHTML = '';
        
        window.AppState.history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <div>
                    <div class="history-title">${item.snippet}</div>
                    <div class="history-date">${item.date} • ${item.tokens || 0} tokens</div>
                </div>
            `;
            div.addEventListener('click', () => {
                window.AppState.outputs = Object.assign({}, item.outputs);
                window.Cards.renderAllOutputs();
                if (window.DOM.outputDashboard) {
                    window.DOM.outputDashboard.classList.remove('hidden');
                }
                if (window.DOM.exportBar) window.DOM.exportBar.classList.remove('hidden');
                if (window.DOM.historyModal) window.DOM.historyModal.classList.add('hidden');
                window.showToastNotification("History restored!", "success");
            });
            window.DOM.historyList.appendChild(div);
        });
    }

    return {
        saveToHistory,
        renderHistoryList
    };
})();
