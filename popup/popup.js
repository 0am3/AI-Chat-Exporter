// --- Detection Logic ---
async function checkDetection() {
  const statusDiv = document.getElementById('status');
  const detectionDiv = document.getElementById('detection-status');
  const btn = document.getElementById('exportBtn');

  try {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      updateDetectionUI(null);
      return;
    }

    const url = tab.url;
    let detectedAI = null;

    if (url.includes("gemini.google.com")) {
      detectedAI = "Gemini";
    } else if (url.includes("chatgpt.com")) {
      detectedAI = "ChatGPT";
    } else if (url.includes("claude.ai")) {
      detectedAI = "Claude";
    } else if (url.includes("chat.z.ai")) {
      detectedAI = "Z_AI";
    }

    updateDetectionUI(detectedAI);
  } catch (err) {
    console.error("Detection error:", err);
    updateDetectionUI(null);
  }
}

function updateDetectionUI(aiName) {
  const detectionDiv = document.getElementById('detection-status');
  const aiNameSpan = document.getElementById('detected-ai-name');
  const btn = document.getElementById('exportBtn');

  if (aiName) {
    aiNameSpan.innerText = aiName;
    detectionDiv.className = 'detected';
    btn.disabled = false;
    btn.classList.add('detected-active');
    btn.style.opacity = '1';
    btn.style.pointerEvents = 'auto';
  } else {
    aiNameSpan.innerText = "NO TARGET";
    detectionDiv.className = 'not-detected';
    btn.disabled = true;
    btn.classList.remove('detected-active');
    btn.style.opacity = '0.3';
    btn.style.pointerEvents = 'none';
  }
}

// Run detection on popup open
checkDetection();

document.getElementById('exportBtn').addEventListener('click', async () => {
  const statusDiv = document.getElementById('status');
  const btn = document.getElementById('exportBtn');
  
  // Update UI to show activity
  statusDiv.innerText = ">> Bypassing mainframe...";
  statusDiv.classList.remove('error');
  btn.style.pointerEvents = 'none'; // Disable button while working
  btn.style.opacity = '0.5';

  try {
    // 1. Get the current active tab the user is looking at
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // 2. Send a message to the background.js router
    chrome.runtime.sendMessage(
      { action: "startExport", tabId: tab.id, url: tab.url }, 
      (response) => {
        
        // 3. Handle the response from background.js
        if (chrome.runtime.lastError) {
          statusDiv.innerText = ">> ERR: Connection to background failed.";
          statusDiv.classList.add('error');
        } else if (response && response.status === "success") {
          statusDiv.innerText = ">> Compiling data block...";
          
          // Data passed back from content.js
          const markdownData = response.data.payload; 
          const rawTitle = response.data.title || "Untitled_Chat";
          
          // Determine filename based on detected AI
          let aiName = "AI";
          if (tab.url.includes("gemini")) aiName = "Gemini";
          else if (tab.url.includes("chatgpt")) aiName = "ChatGPT";
          else if (tab.url.includes("claude")) aiName = "Claude";
          else if (tab.url.includes("chat.z.ai")) aiName = "Z_AI";

          // Sanitize the title for filename
          // Replace spaces/special chars with hyphens, collapse multiple hyphens
          const sanitizedTitle = rawTitle
            .replace(/[^a-z0-9]/gi, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 60);

          const safeDate = new Date().toISOString().split('T')[0];
          
          // Format: Brand - Title - Date.md
          const filename = `${aiName} - ${sanitizedTitle} - ${safeDate}.md`;

          // Create a Blob (a file object in memory)
          const blob = new Blob([markdownData], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);

          // Trigger the Chrome Download API
          chrome.downloads.download({
            url: url,
            filename: filename,
            saveAs: true // Prompts the user where to save the file
          }, () => {
            statusDiv.innerText = ">> Data stream secured.";
            // Cleanup memory
            URL.revokeObjectURL(url);
          });
        } else if (response && response.status === "unsupported") {
          statusDiv.innerText = ">> ERR: Target not recognized.";
          statusDiv.classList.add('error');
        } else if (response && response.status === "prompt_needed") {
          // Display the prompt message on the extension window
          statusDiv.innerText = ">> " + (response.message || "Please perform manual action.");
          statusDiv.style.color = "#ff9800"; // Warning color
        } else {
          statusDiv.innerText = ">> ERR: Extraction failed.";
          statusDiv.classList.add('error');
        }

        // Reset button unless it's a success that we're keeping green
        if (!response || response.status !== "success") {
           btn.style.pointerEvents = 'auto';
           btn.style.opacity = '1';
        }
      }
    );
  } catch (err) {
    statusDiv.innerText = ">> ERR: System failure.";
    statusDiv.classList.add('error');
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  }
});
