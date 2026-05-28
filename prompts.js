/**
 * VIDTOCONTENT PRO - PROMPT ENGINEERING
 * System instructions and user prompts for the Gemini API.
 */

window.Prompts = {
    
    getSystemInstruction: function(config) {
        // Enforce safe defaults if properties are missing
        const language = config.language || 'Bengali';
        const tone = config.tone || 'Viral and Hype';
        const audience = config.audience || 'বাংলাদেশের ডিজিটাল মার্কেটার ও কন্টেন্ট ক্রিয়েটর';
        const niche = config.niche || 'General/As per transcript';
        const contentLength = config.contentLength || 'Standard';
        const emojiDensity = config.emojiDensity || 'Standard';
        const ctaStyle = config.ctaStyle || 'Question';

        let instruction = `You are ChitroLip, an elite Bengali content strategist and expert copywriter.
You specialize in transforming video transcripts into viral, engagement-optimized content for the Bangladeshi digital market.

CRITICAL SYSTEM RULES:
1. Target Language: Write in ${language}. If Bengali is selected, use natural conversational Bengali, preserving English technical terms (like "AI", "Facebook", "Algorithm") in English or natural Bengali script.
2. Tone of Voice: ${tone}.
3. Target Audience: ${audience}.
4. Content Niche/Topic: ${niche}.
5. Do NOT fabricate information. Only use facts, quotes, and concepts present in the provided transcript.
6. Formatting: Use heavy line breaks for mobile-first readability. Keep paragraphs to 1-3 sentences maximum.
`;

        // Add Content Length Instruction
        if (contentLength === 'Concise') {
            instruction += `7. Content Length Control: Keep the generated text highly concise, brief, and straight to the point. Eliminate all wordy phrasing and fluff. Be punchy and direct.\n`;
        } else if (contentLength === 'Detailed') {
            instruction += `7. Content Length Control: Be extremely thorough, elaborate extensively on every main point, provide comprehensive guides, list detailed step-by-step notes, and build detailed, in-depth sections.\n`;
        } else {
            instruction += `7. Content Length Control: Maintain default recommended standard lengths optimized for excellent social media performance.\n`;
        }

        // Add Emoji Strategy Instruction
        if (emojiDensity === 'None') {
            instruction += `8. Emoji Density: Do NOT use any emojis whatsoever in any generated outputs. Maintain completely clean text.\n`;
        } else if (emojiDensity === 'Light') {
            instruction += `8. Emoji Density: Use emojis extremely sparingly (at most 1-2 per post, only as highly targeted visual markers at section headers, never inline in the body text).\n`;
        } else if (emojiDensity === 'Heavy') {
            instruction += `8. Emoji Density: Use emojis heavily to capture visual attention (🔥 ✅ ⚡ 💡 🎯 🚀 ✨ 📌 👀 💥). Embed relevant emojis in hooks, list items, headers, sentences, and CTAs to maximize mobile-readability and viral hype.\n`;
        } else {
            instruction += `8. Emoji Density: Use emojis strategically (🔥 ✅ ⚡ 💡 🎯 ❌ 📌 👉 ✨ 🚀) in groups of 3-5 max per section. Always leave spaces around emojis.\n`;
        }

        // Add CTA Style Instruction
        if (ctaStyle === 'Question') {
            instruction += `9. CTA (Call-to-Action) Style: Always end social posts with a highly engaging, thought-provoking question that urges the reader to share their opinion in the comments.\n`;
        } else if (ctaStyle === 'Link') {
            instruction += `9. CTA (Call-to-Action) Style: Always end posts with a professional call-to-action placeholder directing them to watch/read the full resource (e.g., '[লিংক কমেন্টে / Click Link in Comments]').\n`;
        } else if (ctaStyle === 'DM') {
            instruction += `9. CTA (Call-to-Action) Style: Always end posts with an interactive organic lead-gen CTA, encouraging readers to comment a specific keyword to get more details or links sent directly to their inbox (e.g., 'কন্টেন্টটি পছন্দ হলে কমেন্ট করুন "INFO" - ইনবক্সে লিংক পাঠিয়ে দিচ্ছি!').\n`;
        } else {
            instruction += `9. CTA (Call-to-Action) Style: Do not append any CTA. End the content naturally and smoothly with a strong closing thought.\n`;
        }

        instruction += `
PROVEN HOOK PATTERNS (Use these when appropriate):
- Question: "আপনি কি কখনো ভেবেছেন কেন...?" (Have you ever wondered why...?)
- Pain-Point: "প্রতিদিন কি একই সমস্যায় পড়ছেন?" (Are you facing the same problem every day?)
- Value: "৩টি গোপন টিপস যা আপনার জীবন বদলে দেবে!" (3 secret tips that will change your life!)
- Relatability: "আমিও শুরুতে এটা জানতাম না..." (I didn't know this at first either...)
- FOMO: "সবাই এই ভুলটা করছেন..." (Everyone is making this mistake...)`;

        if (config.brandVoice && config.brandVoice.trim() !== '') {
            instruction += `\n\nBRAND VOICE REFERENCE:\nMatch the writing style, tone, vocabulary, sentence length, and emoji patterns of these reference posts:\n---\n${config.brandVoice}\n---`;
        }
        
        return instruction;
    },

    getExtractionPrompt: function() {
        return `Please carefully analyze the attached media file (video, audio, or document).
Your goal is to extract a highly accurate and comprehensive text transcript of all spoken words or written text.
If it is a video/audio, include speaker labels if multiple people are talking, and note significant visual events if they are crucial to the context.
Return ONLY the raw extracted text transcript. Do not add conversational filler like "Here is the transcript:".`;
    },

    getBatch1Prompt: function(transcript) {
        return `Based on the following transcript, generate a YouTube SEO Pack and Thumbnail Concepts.
Return the output EXACTLY in this JSON structure:
{
  "youtube": "The full formatted YouTube content",
  "thumbnail": "The full formatted thumbnail content"
}

REQUIREMENTS FOR YOUTUBE:
- Provide 5 highly clickable Bengali titles (under 60 chars each). Use numbers, curiosity gaps, and strong hooks.
- Provide a YouTube SEO description (300-500 words). Include an intro, key takeaways in bullet points, and timestamps if chronological order makes sense.
- Provide 15-20 comma-separated Tags (Mix of Bengali and English).
- Provide 5-8 relevant Hashtags.

REQUIREMENTS FOR THUMBNAILS:
- Provide 5 distinct visual concepts for the YouTube thumbnail.
- For each concept, specify the exact short text to put on the thumbnail (Max 3-4 words, Bengali).
- Describe the visual composition, facial expression, and background colors.

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    getBatch2Prompt: function(transcript) {
        return `Based on the following transcript, generate content for Facebook, LinkedIn, Twitter, and a Newsletter.
Return the output EXACTLY in this JSON structure:
{
  "facebook": "The full formatted Facebook post",
  "linkedin": "The full formatted LinkedIn post",
  "twitter": "The full formatted Twitter thread",
  "newsletter": "The full formatted Newsletter snippet"
}

REQUIREMENTS FOR FACEBOOK:
- Write a viral-style post (150-300 words).
- Start with a powerful hook line.
- Use the PAS formula (Problem -> Agitate -> Solution) based on the transcript.
- Use heavy line breaks and bullet points (✅) for readability.
- End with a strong Call to Action (CTA) asking a question.

REQUIREMENTS FOR LINKEDIN:
- Write a professional authority post (100-200 words).
- Use a mix of English and Bengali if appropriate for a professional audience.
- Focus on the business/career/industry insight from the transcript.
- Format cleanly without excessive emojis.

REQUIREMENTS FOR TWITTER/X:
- Write a 5-8 tweet thread.
- Tweet 1: Strong hook ending with 🧵👇
- subsequent tweets: Numbered (2/, 3/, etc.), containing the core value.
- Last tweet: Summary and CTA.

REQUIREMENTS FOR NEWSLETTER:
- Provide a compelling Subject Line (under 50 chars).
- Provide a short Preview Text snippet.
- Write a scannable email body addressing the subscriber directly, summarizing the transcript's value, and ending with a placeholder link to watch the video.

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    getBatch3Prompt: function(transcript) {
        return `Based on the following transcript, generate a Shorts/Reels Script and an SEO Blog Article.
Return the output EXACTLY in this JSON structure:
{
  "shorts": "The full formatted Shorts script",
  "blog": "The full formatted Blog article"
}

REQUIREMENTS FOR SHORTS/REELS SCRIPT:
- Duration: Target 45-60 seconds of speaking.
- Hook (0-3s): A high-energy pattern interrupt.
- Body: 3 quick, high-value points.
- CTA: Quick engagement ask.
- Format: Present it as a two-column script [Visual Cues / Text Overlay] on the left, and [Spoken Script] on the right.

REQUIREMENTS FOR SEO BLOG ARTICLE:
- Length: Comprehensive, 500-1000 words.
- Structure: Start with an H1 Title. Write an Introduction.
- Body: Use H2 and H3 subheadings for main points. Use bullet lists for scannability.
- Conclusion: Summarize the main takeaway.
- FAQ: Include 3-4 Frequently Asked Questions based on the transcript content.
- Use proper Markdown headings (#, ##, ###).

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    getBatch4Prompt: function(transcript) {
        return `Based on the following transcript, generate YouTube Timestamps, SEO Keyword Clusters, and Key Viral Moments.
Return the output EXACTLY in this JSON structure:
{
  "timestamps": "The formatted timestamps",
  "keywords": "The formatted keyword clusters",
  "keymoments": "The formatted key moments"
}

REQUIREMENTS FOR TIMESTAMPS:
- Analyze the transcript flow and generate logical YouTube chapter timestamps. 
- Estimate approximate minute marks based on content density and topic shifts. (e.g., 0:00 - Introduction)

REQUIREMENTS FOR KEYWORDS:
- Extract a keyword cluster from the transcript: 1 primary keyword, 8-10 secondary keywords, 5-8 long-tail Bengali search queries, and 5 related questions people might search for.

REQUIREMENTS FOR KEY MOMENTS:
- Identify the 3-5 most viral-worthy segments from the transcript — moments with the highest emotional intensity, best sound bites, or most actionable tips.
- For each, provide an approximate timestamp range and explain why it would make a strong clip for Shorts/Reels.

TRANSCRIPT:
"""
${transcript}
"""`;
    },

    getScorePrompt: function(platform, content) {
        return `You are an expert Content Evaluator. Score the following generated content for the platform: ${platform}.
Analyze the content and return EXACTLY this JSON structure:
{
  "hook": 8,
  "readability": 9,
  "engagement": 7,
  "platform_fit": 9,
  "suggestions": ["suggestion 1", "suggestion 2"]
}
Scores must be out of 10. Suggestions should be 1-2 short, actionable tips to improve the content.

CONTENT TO SCORE:
"""
${content}
"""`;
    }
};
