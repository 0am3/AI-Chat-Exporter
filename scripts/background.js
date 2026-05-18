// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startExport") {
    
    // Determine the target based on the URL
    let target = null;
    if (request.url.includes("gemini.google.com")) {
      target = "gemini";
    } else if (request.url.includes("chatgpt.com")) {
      target = "chatgpt";
    } else if (request.url.includes("claude.ai")) {
      target = "claude";
    } else if (request.url.includes("chat.z.ai")) {
      target = "zai";
    }

    if (!target) {
      sendResponse({ status: "unsupported" });
      return true;
    }

    // Ping the content script in the active tab to start extraction
    chrome.tabs.sendMessage(
      request.tabId, 
      { action: `extract_${target}` }, 
      (response) => {
        if (chrome.runtime.lastError) {
          console.error("Injection failed. Is the page fully loaded?", chrome.runtime.lastError);
          sendResponse({ status: "error" });
        } else {
          sendResponse({ status: "success", data: response });
        }
      }
    );
    return true; // Keeps the message channel open for async response
  }
});