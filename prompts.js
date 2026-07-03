/**
 * CHITROLIP AI - PROMPT ENGINEERING
 * System instructions and user prompts for the Gemini API.
 */

window.Prompts = {
    
    PROMPT_VERSION: "2.0",

    /**
     * Generates the core system instruction incorporating all user settings and AI persona constraints.
     * @param {Object} config - The AppState settings object.
     * @returns {string} The full system instruction.
     */
    getSystemInstruction: function(config) {
        if (config && config.useCustomPrompt && window.AppState && window.AppState.customPrompt) {
            return window.AppState.customPrompt;
        }

        const language = config.language || 'Bengali';
        const tone = config.tone || 'Viral and Hype';
        const audience = config.audience || 'বাংলাদেশের ডিজিটাল মার্কেটার ও কন্টেন্ট ক্রিয়েটর';
        const niche = config.niche || 'General/As per transcript';
        const contentLength = config.contentLength || 'Standard';
        const emojiDensity = config.emojiDensity || 'Standard';
        const ctaStyle = config.ctaStyle || 'Question';

        let instruction = `You are a SENIOR content strategist and expert copywriter with 10+ years of experience in the Bangladeshi digital market, specializing in ${niche}.
You transform raw video transcripts into viral, engagement-optimized content.

CRITICAL SYSTEM RULES:
1. Target Language: Write primarily in ${language}. Use natural conversational flow for the selected language. If Hindi, use Devanagari script. If Urdu, use Nastaliq script. Preserve technical terms (e.g., "AI", "Facebook", "Algorithm") in English or natural native script.
2. Tone of Voice: ${tone}.
3. Target Audience: ${audience}.
4. Anti-Hallucination Guardrail: Do NOT fabricate information. If the transcript doesn't contain enough information for a section, write exactly "[INSUFFICIENT DATA — Please provide a longer transcript]" instead of making things up.
5. Format Enforcement: Use strict Markdown formatting. Use **bold** for emphasis, - for bullet points, and #, ##, ### for headings. Do NOT use markdown tables unless explicitly requested.
6. Platform Length Limits (STRICT):
   - Facebook posts must be 150-300 words.
   - Twitter individual tweets must be under 280 characters.
   - LinkedIn posts must be 100-200 words.
   - YouTube Shorts/Reels script should target 45-60 seconds of speaking.
7. Readability: Use heavy line breaks for mobile-first readability. Keep paragraphs to 1-3 sentences maximum.
`;

        if (['Bengali', 'Hindi', 'Urdu', 'Mix', 'Bilingual'].includes(language)) {
            instruction += `8. Edge Case - Vocabulary: Do not use overly formal or archaic vocabulary (e.g. 'শুদ্ধ বাংলা', 'Sadhu Bhasha', or pure Sanskritized Hindi/Urdu). Stick strictly to modern, conversational, standard phrasing (Cholit Bhasha).\n`;
            if (config.keepEnglishTerms !== false) {
                instruction += `9. Edge Case - Technical Terms: If the input language is different from the output language (e.g. English transcript, regional output), ensure smooth translation. Keep universally understood English terms (like 'AI', 'Digital Marketing', 'Content Creator', 'SEO') in English script rather than phonetically translating them, as this aligns with South Asian social media norms.\n`;
            }
        }


        if (contentLength === 'Concise') {
            instruction += `8. Content Length Control: Keep the generated text highly concise and straight to the point. Eliminate all wordy phrasing and fluff.\n`;
        } else if (contentLength === 'Detailed') {
            instruction += `8. Content Length Control: Be extremely thorough, elaborate extensively on every main point, provide comprehensive guides, and build detailed, in-depth sections.\n`;
        } else {
            instruction += `8. Content Length Control: Maintain default recommended standard lengths optimized for excellent social media performance.\n`;
        }

        if (emojiDensity === 'None') {
            instruction += `9. Emoji Density: Do NOT use any emojis whatsoever in any generated outputs. Maintain completely clean text.\n`;
        } else if (emojiDensity === 'Light') {
            instruction += `9. Emoji Density: Use emojis extremely sparingly (at most 1-2 per post, only as highly targeted visual markers at section headers, never inline in the body text).\n`;
        } else if (emojiDensity === 'Heavy') {
            instruction += `9. Emoji Density: Use emojis heavily to capture visual attention (🔥 ✅ ⚡ 💡 🎯 🚀 ✨ 📌 👀 💥). Embed relevant emojis in hooks, list items, headers, sentences, and CTAs.\n`;
        } else {
            instruction += `9. Emoji Density: Use emojis strategically (🔥 ✅ ⚡ 💡 🎯) in groups of 3-5 max per section. Always leave spaces around emojis.\n`;
        }

        if (ctaStyle === 'Question') {
            instruction += `10. CTA (Call-to-Action) Style: Always end social posts with a highly engaging, thought-provoking question that urges the reader to share their opinion in the comments.\n`;
        } else if (ctaStyle === 'Link') {
            instruction += `10. CTA (Call-to-Action) Style: Always end posts with a professional call-to-action placeholder directing them to watch/read the full resource (e.g., '[লিংক কমেন্টে / Click Link in Comments]').\n`;
        } else if (ctaStyle === 'DM') {
            instruction += `10. CTA (Call-to-Action) Style: Always end posts with an interactive organic lead-gen CTA, encouraging readers to comment a specific keyword to get more details or links sent directly to their inbox.\n`;
        } else {
            instruction += `10. CTA (Call-to-Action) Style: Do not append any CTA. End the content naturally and smoothly with a strong closing thought.\n`;
        }

        let hooks = `
PROVEN HOOK PATTERNS (Use these when appropriate):
- Question: "Have you ever wondered why...?"
- Pain-Point: "Are you facing the same problem every day?"
- Value: "3 secret tips that will change your life!"
- Relatability: "I didn't know this at first either..."
- FOMO: "Everyone is making this mistake..."`;

        if (language === 'Bengali') {
            hooks = `
PROVEN HOOK PATTERNS (Use these when appropriate):
- Question: "আপনি কি কখনো ভেবেছেন কেন...?" (Have you ever wondered why...?)
- Pain-Point: "প্রতিদিন কি একই সমস্যায় পড়ছেন?" (Are you facing the same problem every day?)
- Value: "৩টি গোপন টিপস যা আপনার জীবন বদলে দেবে!" (3 secret tips that will change your life!)
- Relatability: "আমিও শুরুতে এটা জানতাম না..." (I didn't know this at first either...)
- FOMO: "সবাই এই ভুলটা করছেন..." (Everyone is making this mistake...)`;
        } else if (language === 'Hindi') {
            hooks = `
PROVEN HOOK PATTERNS (Use these when appropriate):
- Question: "क्या आपने कभी सोचा है क्यों...?" (Have you ever wondered why...?)
- Pain-Point: "क्या आप रोज़ाना एक ही समस्या का सामना कर रहे हैं?" (Are you facing the same problem every day?)
- Value: "3 गुप्त टिप्स जो आपकी जिंदगी बदल देंगे!" (3 secret tips that will change your life!)
- Relatability: "मुझे भी शुरुआत में यह नहीं पता था..." (I didn't know this at first either...)
- FOMO: "हर कोई यह गलती कर रहा है..." (Everyone is making this mistake...)`;
        } else if (language === 'Urdu') {
            hooks = `
PROVEN HOOK PATTERNS (Use these when appropriate):
- Question: "کیا آپ نے کبھی سوچا ہے کہ کیوں...؟" (Have you ever wondered why...?)
- Pain-Point: "کیا آپ روزانہ اسی مسئلے کا سامنا کر رہے ہیں؟" (Are you facing the same problem every day?)
- Value: "3 خفیہ ٹپس جو آپ کی زندگی بدل دیں گی!" (3 secret tips that will change your life!)
- Relatability: "مجھے بھی شروع میں یہ نہیں معلوم تھا..." (I didn't know this at first either...)
- FOMO: "ہر کوئی یہ غلطی کر رہا ہے..." (Everyone is making this mistake...)`;
        }

        instruction += hooks;

        if (config.brandVoice && config.brandVoice.trim() !== '') {
            instruction += `\n\nBRAND VOICE REFERENCE:\nMatch the writing style, tone, vocabulary, sentence length, and emoji patterns of these reference posts:\n---\n${config.brandVoice}\n---`;
        }
        
        return instruction;
    },

    /**
     * Generates the extraction prompt for initial media processing.
     * @returns {string} The prompt.
     */
    getExtractionPrompt: function() {
        return `Please carefully analyze the attached media file (video, audio, or document).
Your goal is to extract a highly accurate and comprehensive text transcript of all spoken words or written text.
If it is a video/audio, include speaker labels if multiple people are talking, and note significant visual events if they are crucial to the context.
Return ONLY the raw extracted text transcript. Do not add conversational filler like "Here is the transcript:".`;
    },

    /**
     * @param {string} transcript - The extracted transcript
     * @returns {string} The formatted batch 1 prompt
     */
    getBatch1Prompt: function(transcript) {
        return `Based on the following transcript, generate a YouTube SEO Pack and Thumbnail Concepts.
First, conduct a Creative Director Analysis to define the core message, target emotion, and unique angle.
Then, generate the content.

Return the output EXACTLY conforming to this JSON schema:
{
  "_creative_director_analysis": "String. Step-by-step reasoning identifying the core message, target emotion, and unique angle.",
  "youtube": "String. 5 highly clickable titles, a 300-500 word SEO description with bullet points/timestamps, 15-20 comma-separated tags, and 5-8 hashtags. Use markdown.",
  "thumbnail": "String. 5 distinct visual concepts. Specify 3-4 words of text, visual composition, facial expression, and background colors. Use markdown."
}

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    /**
     * @param {string} transcript - The extracted transcript
     * @returns {string} The formatted batch 2 prompt
     */
    getBatch2Prompt: function(transcript) {
        return `Based on the following transcript, generate content for Facebook, LinkedIn, Twitter, and a Newsletter.
First, conduct a Creative Director Analysis to define the core message, target emotion, and unique angle.
Then, generate the content.

Return the output EXACTLY conforming to this JSON schema:
{
  "_creative_director_analysis": "String. Step-by-step reasoning identifying the core message, target emotion, and unique angle.",
  "facebook": "String. Viral-style post. Start with hook, use PAS formula, heavy line breaks, bullet points. Formatted in markdown.",
  "linkedin": "String. Professional authority post. Focus on business/industry insights. Formatted cleanly in markdown.",
  "twitter": "String. 5-8 tweet thread. Numbered. Start with hook ending in 🧵👇. Formatted in markdown.",
  "newsletter": "String. Subject line under 50 chars, preview text snippet, and scannable email body. Formatted in markdown."
}

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    /**
     * @param {string} transcript - The extracted transcript
     * @returns {string} The formatted batch 3 prompt
     */
    getBatch3Prompt: function(transcript) {
        return `Based on the following transcript, generate a Shorts/Reels Script and an SEO Blog Article.
First, conduct a Creative Director Analysis to define the core message, target emotion, and unique angle.
Then, generate the content.

Return the output EXACTLY conforming to this JSON schema:
{
  "_creative_director_analysis": "String. Step-by-step reasoning identifying the core message, target emotion, and unique angle.",
  "shorts": "String. 45-60s script. Hook, 3 high-value points, CTA. 2-column format: [Visual Cues] | [Spoken Script]. Formatted in markdown.",
  "blog": "String. 500-1000 words. H1 Title, Intro, H2/H3 subheadings, bullet lists, Conclusion, and 3-4 FAQs. Formatted in markdown."
}

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    /**
     * @param {string} transcript - The extracted transcript
     * @returns {string} The formatted batch 4 prompt
     */
    getBatch4Prompt: function(transcript) {
        return `Based on the following transcript, generate YouTube Timestamps, SEO Keyword Clusters, and Key Viral Moments.
First, conduct a Creative Director Analysis to define the core message, target emotion, and unique angle.
Then, generate the content.

Return the output EXACTLY conforming to this JSON schema:
{
  "_creative_director_analysis": "String. Step-by-step reasoning identifying the core message, target emotion, and unique angle.",
  "timestamps": "String. Logical YouTube chapter timestamps with estimated minute marks. Formatted in markdown.",
  "keywords": "String. 1 primary keyword, 8-10 secondary keywords, 5-8 long-tail search queries, and 5 related questions. Formatted in markdown.",
  "keymoments": "String. Identify 3-5 viral-worthy segments. Provide timestamp ranges and explain why they make strong clips. Formatted in markdown."
}

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    /**
     * Generates the prompt used for scoring an existing piece of content.
     * @param {string} platform - The target platform.
     * @param {string} content - The content text to evaluate.
     * @returns {string} The formatted scoring prompt.
     */
    getScorePrompt: function(platform, content) {
        return `You are an expert Content Evaluator. Score the following generated content for the platform: ${platform}.
Analyze the content and return EXACTLY this JSON structure:
{
  "hook": 8,
  "readability": 9,
  "engagement": 7,
  "platform_fit": 9,
  "suggestions": ["Specific, actionable suggestion 1", "Specific, actionable suggestion 2"],
  "rewrite": "A rewrite of the weakest sentence from the content to demonstrate your suggestion."
}
Scores must be out of 10. Suggestions should be specific and actionable rather than generic advice.

CONTENT TO SCORE:
"""
${content}
"""`;
    }
};
