/**
 * CHITROLIP AI - EXPORT UTILITIES
 * Compiles outputs into Markdown/JSON and handles copying/downloading.
 */

window.ExportUtils = {
    
    // Copy to clipboard with fallback
    copyToClipboard: async function(text) {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers or local file:// without secure context
            let textArea = document.createElement("textarea");
            textArea.value = text;
            textArea.style.position = "fixed";
            textArea.style.left = "-999999px";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (err) {
                console.error('Fallback copy failed', err);
            }
            document.body.removeChild(textArea);
        }
    },

    // Download a file dynamically
    downloadFile: function(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    },

    // Get current formatted date for filenames
    getFormattedDate: function() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    },

    // Compile everything into a beautiful Markdown file
    compileMarkdownKit: function(outputs, settings) {
        const dateStr = new Date().toLocaleString();
        
        let md = `# ChitroLip — Content Kit\n`;
        md += `Generated: ${dateStr}\n`;
        md += `Language: ${settings.language} | Tone: ${settings.tone}\n`;
        md += `---\n\n`;

        const sections = [
            { key: 'youtube', title: '🎥 YouTube SEO Pack' },
            { key: 'thumbnail', title: '🖼️ Thumbnail Concepts' },
            { key: 'timestamps', title: '🕐 YouTube Timestamps' },
            { key: 'keywords', title: '🔑 SEO Keyword Clusters' },
            { key: 'keymoments', title: '🎯 Key Viral Moments' },
            { key: 'facebook', title: '📘 Facebook Viral Post' },
            { key: 'linkedin', title: '💼 LinkedIn Authority Post' },
            { key: 'twitter', title: '🐦 Twitter/X Thread' },
            { key: 'shorts', title: '📱 Shorts/Reels Script' },
            { key: 'newsletter', title: '📧 Newsletter Snippet' },
            { key: 'blog', title: '✍️ SEO Blog Article' }
        ];

        sections.forEach(sec => {
            if (outputs[sec.key]) {
                md += `## ${sec.title}\n\n`;
                md += `${outputs[sec.key]}\n\n`;
                md += `---\n\n`;
            }
        });

        return md;
    },

    // Export all outputs as separate files inside a ZIP
    downloadBulkZip: async function(outputs, settings) {
        if (!window.JSZip) {
            // Dynamically load JSZip
            await new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        const zip = new window.JSZip();
        const dateStr = this.getFormattedDate();
        
        const sections = [
            { key: 'youtube', filename: '1-YouTube_SEO.txt' },
            { key: 'thumbnail', filename: '2-Thumbnails.txt' },
            { key: 'timestamps', filename: '3-Timestamps.txt' },
            { key: 'keywords', filename: '4-Keywords.txt' },
            { key: 'keymoments', filename: '5-KeyMoments.txt' },
            { key: 'facebook', filename: '6-Facebook.txt' },
            { key: 'linkedin', filename: '7-LinkedIn.txt' },
            { key: 'twitter', filename: '8-Twitter.txt' },
            { key: 'shorts', filename: '9-ShortsScript.txt' },
            { key: 'newsletter', filename: '10-Newsletter.txt' },
            { key: 'blog', filename: '11-Blog.txt' }
        ];

        sections.forEach(sec => {
            if (outputs[sec.key] && outputs[sec.key].trim() !== '') {
                zip.file(sec.filename, outputs[sec.key]);
            }
        });

        // Add the full markdown kit too
        zip.file('0-Complete_Kit.md', this.compileMarkdownKit(outputs, settings));

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ChitroLip_Export_${dateStr}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100);
    }
};
