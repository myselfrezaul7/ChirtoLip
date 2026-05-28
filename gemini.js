/**
 * VIDTOCONTENT PRO - GEMINI API CLIENT
 * Handles streaming SSE connections, JSON structured outputs, and multimodal inputs.
 */

window.GeminiAPI = (function() {
    
    // Internal helper to parse SSE streams from the Gemini API
    async function consumeStream(response, onChunk) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        let finalUsage = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                let lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer
                
                for (let line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6);
                        if (dataStr === '[DONE]') continue;
                        
                        try {
                            const data = JSON.parse(dataStr);
                            if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
                                onChunk(data.candidates[0].content.parts[0].text);
                            }
                            if (data.usageMetadata) {
                                finalUsage = data.usageMetadata;
                            }
                        } catch (e) {
                            console.warn("Error parsing chunk:", e);
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Stream reading error:", e);
            throw e;
        } finally {
            reader.releaseLock();
        }
        return finalUsage;
    }

    // Helper to format the request payload
    function buildPayload(systemInstruction, userPrompt, temperature, inlineData = null, isJson = false, maxOutputTokens = null, safetyFilter = true) {
        let payload = {
            systemInstruction: {
                parts: [{ text: systemInstruction }]
            },
            contents: [{
                role: "user",
                parts: []
            }],
            generationConfig: {
                temperature: parseFloat(temperature) || 0.7,
            }
        };

        if (maxOutputTokens) {
            payload.generationConfig.maxOutputTokens = parseInt(maxOutputTokens, 10);
        }

        if (!safetyFilter) {
            payload.safetySettings = [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ];
        }

        if (inlineData) {
            if (inlineData.fileUri) {
                payload.contents[0].parts.push({ fileData: { fileUri: inlineData.fileUri, mimeType: inlineData.mimeType || "video/mp4" } });
            } else {
                payload.contents[0].parts.push({ inlineData: inlineData });
            }
        }
        
        payload.contents[0].parts.push({ text: userPrompt });

        if (isJson) {
            payload.generationConfig.responseMimeType = "application/json";
        }

        return payload;
    }

    return {
        // Test API key validity
        testConnection: async function(apiKey, model) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: "Hi" }] }],
                        generationConfig: { maxOutputTokens: 5 }
                    })
                });
                
                if (response.ok) return { valid: true };
                
                const error = await response.json().catch(() => ({}));
                return { valid: false, error: error.error?.message || "Invalid API Key" };
            } catch (err) {
                return { valid: false, error: err.message || "Network Error" };
            }
        },

        // Non-streaming generate content (for lightweight JSON responses like scoring)
        generate: async function({ apiKey, model, systemInstruction, userPrompt, temperature, maxOutputTokens = null, safetyFilter = true, isJson = true }) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            const payload = buildPayload(systemInstruction, userPrompt, temperature, null, isJson, maxOutputTokens, safetyFilter);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            if (isJson) {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    throw new Error("AI returned invalid JSON structure.");
                }
            }
            return text;
        },

        // Stream generated content
        streamGenerate: async function({ apiKey, model, systemInstruction, userPrompt, temperature, maxOutputTokens = null, safetyFilter = true, inlineData, isJson = true, onChunk, onTokens, signal }) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
            
            const payload = buildPayload(systemInstruction, userPrompt, temperature, inlineData, isJson, maxOutputTokens, safetyFilter);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: signal
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}`);
            }

            let fullResponse = "";
            const usage = await consumeStream(response, (chunkText) => {
                fullResponse += chunkText;
                onChunk(fullResponse); // Pass the accumulating JSON string or text
            });

            if (onTokens && usage) {
                onTokens(usage.totalTokenCount || 0);
            }

            if (!isJson) {
                return fullResponse;
            }

            // Final parse to ensure validity
            try {
                return JSON.parse(fullResponse);
            } catch (e) {
                console.error("Failed to parse final JSON:", fullResponse);
                throw new Error("AI returned invalid structure. Please try regenerating.");
            }
        },

        // File to base64 helper
        fileToBase64: function(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = () => {
                    const base64String = reader.result.split(',')[1];
                    resolve({
                        mimeType: file.type,
                        data: base64String
                    });
                };
                reader.onerror = error => reject(error);
            });
        }
    };
})();
