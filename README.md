# AI Chat Exporter: Neural Extractor 🧠🤖

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-brightgreen.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build & Release](https://github.com/0am3/AI-Chat-Exporter/actions/workflows/release.yml/badge.svg)](https://github.com/0am3/AI-Chat-Exporter/actions/workflows/release.yml)

A high-performance Chrome Extension designed to archive your AI chatbot conversations with maximum fidelity. It bypasses lazy-loading and extracts "Thinking" blocks to ensure your Markdown exports are complete and structured.

---

## ✨ Key Features

- **Deep-Scroll Protocol:** Automatically triggers history loading to capture the entire conversation from the origin.
- **Thinking Block Extraction:** Captures hidden "neural pathways" (reasoning blocks) from models like Gemini and OpenAI's reasoning series.
- **Neural UI:** A sleek, cyberpunk-themed interface with real-time target detection.
- **Clean Markdown:** Converts complex HTML chat structures into readable Markdown using Turndown.

## 🚀 Supported Platforms

- **Gemini (Fully Implemented):** Deep-scroll, Thinking blocks, and complete history extraction.
- **ChatGPT (Support Pending):** URL detection active.
- **Claude (Support Pending):** URL detection active.

## 📂 Project Structure

```text
/
├── scripts/
│   ├── background.js    # Message routing and navigation tracking
│   ├── content.js       # Core extraction logic and DOM manipulation
│   └── turndown.js      # HTML-to-Markdown utility
├── popup/
│   ├── popup.html       # extension UI
│   ├── popup.js         # Detection logic and download trigger
│   └── popup.css        # Cyberpunk styling & animations
├── manifest.json        # Extension configuration
└── README.md            # You are here
```

## 🛠️ Installation

### Option 1: Download Pre-built Release (Recommended)
1. Go to the [Releases](https://github.com/0am3/AI-Chat-Exporter/releases) page.
2. Download the latest `ai-chat-exporter-vX.X.zip`.
3. Unzip the file to a permanent folder.
4. Open Chrome and navigate to `chrome://extensions/`.
5. Enable **Developer mode** in the top right.
6. Click **Load unpacked** and select the unzipped folder.

### Option 2: Clone for Development
1. Clone this repository:
   ```bash
   git clone https://github.com/0am3/AI-Chat-Exporter.git
   ```
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the project directory.

## 🖥️ Usage

1. Navigate to a supported AI chat (e.g., `gemini.google.com`).
2. Click the **Neural Extractor** icon in your toolbar.
3. Wait for the `TARGET DETECTED` signal.
4. Hit **Extract Data Stream** and watch the logs scroll as your data is compiled.

---

*Developed by [0am3](https://github.com/0am3)*
