chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_gemini") {
    console.log(">> Initiating Gemini Extraction Protocol v2...");
    
    // Extract Title from <title> tag and clean it
    // Gemini often uses "[Title] - Google Gemini" or just "Google Gemini"
    let chatTitle = document.title
      .replace(" - Google Gemini", "")
      .replace(" - Gemini", "")
      .replace("Google Gemini", "")
      .trim();

    if (!chatTitle || chatTitle === "Gemini") {
      chatTitle = "Untitled Chat";
    }

    runGeminiExtractor().then(chatData => {
      console.log(">> Extraction complete.");
      sendResponse({ 
        status: "success", 
        payload: chatData,
        title: chatTitle 
      });
    });
    return true; 
  }
});

async function runGeminiExtractor() {
  console.log(">> Initiating Neural Extraction: Phase 4 (Precision Mode)...");
  
  await forceLoadHistory();
  await expandThinkingBlocks();

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  let fullMarkdownLog = "# Neural Extraction: Gemini\n\n";
  const dateStr = new Date().toLocaleString();
  fullMarkdownLog += `*Extracted on: ${dateStr}*\n\n---\n\n`;

  const messageNodes = document.querySelectorAll('user-query, model-response');

  messageNodes.forEach(node => {
    
    // --- USER NODE ---
    if (node.tagName.toLowerCase() === 'user-query') {
      // Gemini uses .query-content or sometimes just innerText
      const queryContent = node.querySelector('.query-content, [data-test-id="query-content"], .user-query-content');
      const contentText = queryContent ? queryContent.innerText : node.innerText;
      fullMarkdownLog += `### 🧑‍💻 **User**\n\n${contentText.trim()}\n\n`;
    } 
    
    // --- MODEL NODE ---
    else if (node.tagName.toLowerCase() === 'model-response') {
      let thinkingMarkdown = "";
      let mainResponseMarkdown = "";
      let sourcesMarkdown = "";

      // 1. Identify all markdown regions
      const allMarkdownNodes = node.querySelectorAll('.markdown');
      
      allMarkdownNodes.forEach(mdNode => {
        // A. Is it a Thinking Block?
        if (mdNode.closest('model-thoughts, [data-test-id="thoughts-content"], .thoughts-content')) {
          thinkingMarkdown += turndownService.turndown(mdNode.innerHTML) + "\n\n";
        }
        // B. Is it the Main Response?
        // We look for the 'markdown-main-panel' class or if it's inside structured-content
        else if (mdNode.classList.contains('markdown-main-panel') || mdNode.closest('structured-content-container')) {
          mainResponseMarkdown += turndownService.turndown(mdNode.innerHTML) + "\n\n";
        }
        // C. Fallback: If it's not thinking but it's a model response markdown
        else if (!mdNode.closest('model-thoughts')) {
          mainResponseMarkdown += turndownService.turndown(mdNode.innerHTML) + "\n\n";
        }
      });

      // 2. Extract Sources (Citations)
      const sourcesList = node.querySelector('sources-list, .sources-list');
      if (sourcesList) {
        sourcesMarkdown = "\n\n**Sources:**\n" + turndownService.turndown(sourcesList.innerHTML);
      }

      // 3. Final Compilation
      fullMarkdownLog += `### 🤖 **Gemini**\n\n`;
      
      if (thinkingMarkdown.trim()) {
         fullMarkdownLog += `<details>\n<summary>🧠 <i>Expand Model Thinking</i></summary>\n\n${thinkingMarkdown.trim()}\n\n</details>\n\n`;
      }
      
      if (mainResponseMarkdown.trim()) {
         fullMarkdownLog += `${mainResponseMarkdown.trim()}\n\n`;
      }

      if (sourcesMarkdown.trim()) {
         fullMarkdownLog += `${sourcesMarkdown.trim()}\n\n`;
      }
      
      fullMarkdownLog += `---\n\n`;
    }
  });

  return fullMarkdownLog;
}

// --- Specialized Expansion Engine ---
async function expandThinkingBlocks() {
  console.log(">> Probing neural pathways for expansion...");
  
  // High-precision selectors
  const buttons = document.querySelectorAll('button[data-test-id="thoughts-header-button"], .thoughts-header-button');
  let clicked = 0;

  for (const btn of buttons) {
    // Check if it's already expanded. Gemini usually uses aria-expanded or a class
    const isExpanded = btn.getAttribute('aria-expanded') === 'true' || 
                       btn.closest('.model-thoughts')?.querySelector('.thoughts-content-expanded');
    
    if (!isExpanded) {
      btn.click();
      clicked++;
      // Short delay between clicks to allow UI to breathe
      await new Promise(r => setTimeout(r, 200));
    }
  }

  if (clicked > 0) {
    console.log(`>> Expanded ${clicked} reasoning blocks. Waiting for render...`);
    await new Promise(r => setTimeout(r, 2000)); 
  }
}

// --- Deep Scroll Protocol ---
async function forceLoadHistory() {
  console.log(">> Scanning history origin...");
  
  let previousMessageCount = 0;
  let unchangedCount = 0;
  const maxRetries = 5;

  while (unchangedCount < maxRetries) {
    const messages = document.querySelectorAll('user-query, model-response');
    if (messages.length === 0) break;

    const currentMessageCount = messages.length;
    messages[0].scrollIntoView({ behavior: 'smooth', block: 'start' });

    await new Promise(r => setTimeout(r, 1500)); 

    if (currentMessageCount > previousMessageCount) {
      unchangedCount = 0;
      previousMessageCount = currentMessageCount;
    } else {
      unchangedCount++;
    }
  }
  
  await new Promise(r => setTimeout(r, 1000)); 
}