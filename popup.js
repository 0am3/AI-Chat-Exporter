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
          
          // The Markdown text passed back from content.js
          const markdownData = response.data.payload; 
          
          // Generate a dynamic filename
          const safeDate = new Date().toISOString().split('T')[0];
          const filename = `Neural_Extract_Gemini_${safeDate}.md`;

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
        } else {
          statusDiv.innerText = ">> ERR: Extraction failed.";
          statusDiv.classList.add('error');
        }

        // Reset button
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
      }
    );
  } catch (err) {
    statusDiv.innerText = ">> ERR: System failure.";
    statusDiv.classList.add('error');
    btn.style.pointerEvents = 'auto';
    btn.style.opacity = '1';
  }
});
