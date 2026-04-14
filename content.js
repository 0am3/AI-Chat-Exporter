// Listen for the signal from background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "extract_gemini") {
    console.log(">> Initiating Gemini Extraction Protocol v2...");
    runGeminiExtractor().then(chatData => {
      console.log(">> Extraction complete.");
      sendResponse({ status: "success", payload: chatData });
    });
    return true; 
  }
});

async function runGeminiExtractor() {
  // 1. Force the lazy-load (Scroll to top)
  await forceLoadHistory();

  // 2. NEW: Force expand all "Thinking" blocks
  await expandThinkingBlocks();

  // 3. Initialize Markdown Compiler
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  let fullMarkdownLog = "# Neural Extraction: Gemini\n\n";
  const dateStr = new Date().toLocaleString();
  fullMarkdownLog += `*Extracted on: ${dateStr}*\n\n---\n\n`;

  // 4. Locate ONLY the top-level chat nodes to prevent dual-saving
  const messageNodes = document.querySelectorAll('user-query, model-response');

  messageNodes.forEach(node => {
    
    // --- Extract User Prompt ---
    if (node.tagName.toLowerCase() === 'user-query') {
      const contentHTML = node.innerText || node.textContent; 
      fullMarkdownLog += `### 🧑‍💻 **User**\n\n> ${contentHTML.trim().replace(/\n/g, '\n> ')}\n\n`;
    } 
    
    // --- Extract Gemini Response ---
    else if (node.tagName.toLowerCase() === 'model-response') {
      let thinkingMarkdown = "";
      let mainResponseMarkdown = "";

      // A. Extract the "Thinking" Block
      // Based on your HTML, we target the thoughts container
      const thoughtsContainer = node.querySelector('.thoughts-content, [data-test-id="thoughts-content"]');
      if (thoughtsContainer) {
        const thoughtMarkdownNode = thoughtsContainer.querySelector('.markdown');
        if (thoughtMarkdownNode) {
           thinkingMarkdown = turndownService.turndown(thoughtMarkdownNode.innerHTML);
        }
      }

      // B. Extract the Main Response
      // We grab all .markdown blocks, but REJECT any that are inside the thoughts container
      const allMarkdownNodes = node.querySelectorAll('.markdown');
      allMarkdownNodes.forEach(mdNode => {
        if (!mdNode.closest('.thoughts-content') && !mdNode.closest('[data-test-id="thoughts-content"]')) {
           mainResponseMarkdown += turndownService.turndown(mdNode.innerHTML) + "\n\n";
        }
      });

      // C. Assemble the Markdown for this turn
      fullMarkdownLog += `### 🤖 **Gemini**\n\n`;
      
      // Inject thinking block as a collapsible HTML element within the Markdown
      if (thinkingMarkdown.trim()) {
         fullMarkdownLog += `<details>\n<summary>🧠 <i>Expand Model Thinking</i></summary>\n\n${thinkingMarkdown.trim()}\n\n</details>\n\n`;
      }
      
      // Inject main response
      if (mainResponseMarkdown.trim()) {
         fullMarkdownLog += `${mainResponseMarkdown.trim()}\n\n`;
      }
      
      fullMarkdownLog += `---\n\n`;
    }
  });

  return fullMarkdownLog;
}

// --- Utility: Expand Hidden Thinking ---
async function expandThinkingBlocks() {
  console.log(">> Bypassing logic gates. Expanding hidden neural pathways...");
  
  // Find the specific button wrappers you provided
  const buttons = document.querySelectorAll('.thoughts-header-button-content');
  let clicked = 0;

  buttons.forEach(btn => {
    // Check if it currently says "Show thinking". We don't want to click "Hide thinking" and close it!
    if (btn.innerText.includes("Show thinking")) {
      btn.click();
      clicked++;
    }
  });

  // If we clicked anything, we MUST wait for Google's Angular framework to render the new DOM elements
  if (clicked > 0) {
    console.log(`>> Expanded ${clicked} thinking blocks. Waiting for render...`);
    await new Promise(r => setTimeout(r, 1500)); 
  }
}

// --- Utility: The Auto-Scroller ---
// --- Utility: The Deep-Scroll Protocol ---
async function forceLoadHistory() {
  console.log(">> Initiating Deep-Scroll Protocol. Bypassing lazy-load barriers...");
  
  let previousMessageCount = 0;
  let unchangedCount = 0;
  const maxRetries = 5; // How many times to wait if we think we hit the top

  while (unchangedCount < maxRetries) {
    // 1. Find all currently loaded message nodes
    const messages = document.querySelectorAll('user-query, model-response');
    
    if (messages.length === 0) {
      console.log(">> ERR: No data nodes found.");
      break; 
    }

    const currentMessageCount = messages.length;

    // 2. The Hack: Target the oldest currently loaded message and force it to the top of the screen.
    // This perfectly triggers Gemini's internal Intersection Observers to load older history.
    messages[0].scrollIntoView({ behavior: 'smooth', block: 'start' });

    // 3. Wait for Google's servers to fetch and render the older messages
    await new Promise(r => setTimeout(r, 1500)); 

    // 4. Check if the DOM expanded
    if (currentMessageCount > previousMessageCount) {
      console.log(`>> Deeper layer extracted. Nodes loaded: ${currentMessageCount}`);
      unchangedCount = 0; // Reset retry counter because we successfully loaded more
      previousMessageCount = currentMessageCount;
    } else {
      unchangedCount++;
      console.log(`>> Scanning for origin point... (Attempt ${unchangedCount}/${maxRetries})`);
    }
  }
  
  console.log(">> Origin reached. Full neural history is now in memory.");
  
  // Give the DOM one last second to stabilize before we start scraping
  await new Promise(r => setTimeout(r, 1000)); 
}