# ChitroLip AI

> **Transform one video into 11 pieces of platform-optimized content in a single click.**

ChitroLip AI is a premium, no-build, browser-native application that leverages the power of Google Gemini Multimodal AI to instantly repurpose your video and audio transcripts into viral, format-perfect social media posts.

Designed explicitly for South Asian solo-creators and digital marketers, ChitroLip features robust multi-language support (Bengali, Hindi, Urdu, English) and strict style guardrails to ensure native, modern phrasing without archaic translations.

## ✨ Key Features

- **1-Click Expansion**: Paste a transcript or upload an audio/video file to instantly generate:
  - YouTube SEO (Titles, Descriptions, Timestamps, Tags)
  - Facebook Posts (Viral Formatting)
  - LinkedIn Articles (Professional Formatting)
  - X / Twitter Threads
  - Shorts / Reels Scripts
  - Newsletter Drafts
  - SEO Blog Articles
- **Multimodal File Support**: Drag and drop audio (`.mp3`, `.wav`) or document (`.pdf`, `.txt`) files directly into the UI. ChitroLip parses and base64 encodes them locally before dispatching to Gemini.
- **Style Guardrails**: A built-in edge-case engine that strictly prevents Gemini from translating universally understood English tech terms (like "AI", "SEO") into obscure phonetic Bengali/Hindi.
- **Custom Prompt Engine**: Override the system prompt entirely to bend the AI to your exact brand voice.
- **Zero-Config Architecture**: No `npm install`, no `webpack`, no build steps. Just open `index.html` in your browser and you're live. All state, settings, and histories are securely managed via `localStorage`.

## 🚀 How to Use

### 1. Setup
1. Clone or download this repository.
2. Double click `index.html` to open it in any modern browser (Chrome, Edge, Firefox).
3. That's it!

### 2. Connect Gemini API
To actually generate content, you need a free Google Gemini API Key.
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in and click **"Get API Key"**.
3. Create a new key and copy it.
4. Open ChitroLip, click the **🔑 API Key** button in the top right, and paste your key.
*(Your key is securely stored in your browser's local storage and is never sent anywhere except directly to Google's API).*

### 3. Generate
- **Without an API Key**: Click either of the **"Try a Demo"** buttons on the dashboard to see an instant simulation of how the engine works for English or Bengali workflows.
- **With an API Key**: Paste your video transcript, select your Target Language, Tone, and Emoji Density from the Settings Drawer, and hit **Generate**.

## 🛠️ Tech Stack
- **Structure**: Vanilla HTML5
- **Style**: Custom Vanilla CSS3 (Glassmorphism, CSS Variables, Responsive Grids)
- **Logic**: Vanilla ES6 JavaScript (No frameworks, lightweight modular architecture)
- **Engine**: `gemini-2.5-flash` via Server-Sent Events (SSE) for real-time text streaming.

## 💾 State Management
ChitroLip uses a highly optimized `window.AppState` Singleton pattern to track application data. All sessions and settings are automatically serialized and cached in your browser's `localStorage` (prefixed with `cl_`). 
You can export your entire generation history as a `.zip` file containing organized `.txt` and `.md` files for every platform.

---
**Crafted for Creators.** 🚀
