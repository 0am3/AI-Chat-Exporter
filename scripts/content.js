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
  } else if (request.action === "extract_zai") {
    console.log(">> Initiating Z AI Extraction Protocol...");
    
    let chatTitle = document.title;
    const titleEl = document.querySelector('div[dir="auto"].truncate') || document.querySelector('div[title]');
    if (titleEl && titleEl.innerText) {
        chatTitle = titleEl.innerText.trim();
    }
    if (!chatTitle || chatTitle === "Z AI" || chatTitle.includes("Z-ai")) {
      chatTitle = "Untitled Chat";
    }

    runZaiExtractor().then(chatData => {
      console.log(">> Z AI Extraction complete.");
      sendResponse({ 
        status: "success", 
        payload: chatData,
        title: chatTitle 
      });
    }).catch(err => {
      console.error(err);
      if (err.message === "USER_PROMPT_NEEDED") {
        sendResponse({ status: "prompt_needed", message: "Please open the References/Sources sidebar before exporting!" });
      } else {
        sendResponse({ status: "error" });
      }
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
         const indentedThinking = thinkingMarkdown.trim().split('\n').map(line => `> ${line}`).join('\n');
         fullMarkdownLog += `> [!quote]- 🧠 **Model Thinking**\n${indentedThinking}\n\n`;
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

// ==============================================================================
// Z AI EXTRACTION ENGINE
// ==============================================================================

async function runZaiExtractor() {
  console.log(">> Initiating Neural Extraction: Z AI Mode...");
  
  // Z AI doesn't have a deep scroll protocol yet, but scroll to top to trigger any lazy loading
  window.scrollTo(0, 0);
  
  // 1. Expand all reasoning pathways
  const thinkingBtns = document.querySelectorAll('.thinking-chain-container button');
  let clicked = 0;
  thinkingBtns.forEach(btn => {
      const parent = btn.closest('.thinking-chain-container');
      const container = parent ? parent.nextElementSibling : null;
      // If the sibling has h-0 class, it is collapsed
      if (container && container.classList.contains('h-0')) {
          btn.click();
          clicked++;
      }
  });

  if (clicked > 0) {
      console.log(`>> Expanded ${clicked} reasoning blocks. Waiting for render...`);
      await new Promise(r => setTimeout(r, 1500));
  }

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
  });

  // Preserve SVG graphical components (like charts) but remove messy base64 UI icons
  turndownService.addRule('svg', {
    filter: 'svg',
    replacement: function (content, node) {
      // Check if it's a large structural SVG like mermaid or chart, else strip it to keep MD clean
      if (node.classList.contains('mermaid') || node.id.includes('mermaid') || (node.getAttribute('width') && parseInt(node.getAttribute('width')) > 100)) {
        return '\n\n' + node.outerHTML + '\n\n';
      }
      return ''; // Strip tiny UI icons
    }
  });

  // Z AI embeds tiny base64 SVGs in IMG tags for sources, which pollutes the markdown
  turndownService.addRule('base64-svgs', {
    filter: 'img',
    replacement: function(content, node) {
      const src = node.getAttribute('src') || '';
      if (src.startsWith('data:image/svg+xml')) {
        return ''; // Strip base64 SVG icons
      }
      // Otherwise, fallback to standard image formatting
      const alt = node.getAttribute('alt') || '';
      return src ? `![${alt}](${src})` : '';
    }
  });

  // Handle inline citations and ensure URLs are extracted
  turndownService.addRule('citations', {
    filter: function (node) {
      return node.classList && (node.classList.contains('group/citations') || node.classList.contains('citation'));
    },
    replacement: function (content, node) {
      let url = node.href || "";
      if (!url) {
         const aTag = node.querySelector('a');
         if (aTag) url = aTag.href;
      }
      const text = node.innerText.trim();
      if (url) {
        return ` [[${text}]](${url}) `;
      }
      return ` [${text}] `;
    }
  });

  let fullMarkdownLog = "# Neural Extraction: Z AI\n\n";
  const dateStr = new Date().toLocaleString();
  fullMarkdownLog += `*Extracted on: ${dateStr}*\n\n---\n\n`;

  // Process every neural node
  const messageNodes = document.querySelectorAll('.chat-user, .chat-assistant');

  for (const node of messageNodes) {
    
    // --- USER NODE ---
    if (node.classList.contains('chat-user')) {
      const contentText = node.innerText;
      fullMarkdownLog += `### 🧑‍💻 **User**\n\n${contentText.trim()}\n\n`;
    } 
    
    // --- MODEL NODE ---
    else if (node.classList.contains('chat-assistant')) {
      let thinkingMarkdown = "";
      let mainResponseMarkdown = "";
      let sourcesMarkdown = "";

      // A. Extract "Thinking" (Reasoning)
      const thoughtsHeader = node.querySelector('.thinking-chain-container');
      if (thoughtsHeader && thoughtsHeader.nextElementSibling) {
        const thoughtsContainer = thoughtsHeader.nextElementSibling;
        const contentDivs = thoughtsContainer.querySelectorAll('.thinking-block');
        if (contentDivs.length > 0) {
          let combinedHTML = "";
          contentDivs.forEach(div => combinedHTML += div.innerHTML + "<br>");
          const rawThinking = turndownService.turndown(combinedHTML);
          
          if (rawThinking) {
             // Strip existing blockquote markers and wrap in Obsidian callout
             const cleanText = rawThinking.replace(/^>\s*/gm, '');
             const calloutText = cleanText.split('\n').map(line => `> ${line}`).join('\n');
             thinkingMarkdown = `> [!quote]- 🧠 **Model Thinking**\n${calloutText}\n\n`;
          }
        }
      }

      // B. Extract Main Response
      const responseContainer = node.querySelector('#response-content-container') || node;
      
      const clone = responseContainer.cloneNode(true);
      const cloneThoughtsHeader = clone.querySelector('.thinking-chain-container');
      if (cloneThoughtsHeader) {
         const cloneThoughtsContainer = cloneThoughtsHeader.nextElementSibling;
         cloneThoughtsHeader.remove();
         if (cloneThoughtsContainer && cloneThoughtsContainer.classList.contains('overflow-hidden')) {
             cloneThoughtsContainer.remove();
         }
      }
      
      mainResponseMarkdown = turndownService.turndown(clone.innerHTML);

      // C. Extract Sources Pill & URLs
      // Detect if there are sources by looking for the "Search X keywords" pills, inline citations, or the "Sources" button.
      const searchPills = Array.from(node.querySelectorAll('*')).filter(el => el.innerText && el.innerText.includes("Search") && el.innerText.includes("reference"));
      const sourceButtons = Array.from(node.querySelectorAll('button')).filter(b => 
          (b.innerText && b.innerText.includes("Sources")) || 
          (b.getAttribute('aria-label') && b.getAttribute('aria-label').includes("Sources"))
      );
      const inlineCitations = Array.from(node.querySelectorAll('button.group\\/citations, button[data-tooltip-trigger]')).filter(b => b.querySelector('img'));
      
      const hasSources = searchPills.length > 0 || sourceButtons.length > 0 || inlineCitations.length > 0;
      
      if (hasSources) {
          // The response has sources, check if the sidebar is open!
          const externalLinks = Array.from(document.querySelectorAll('a[href^="http"]'))
              .filter(a => !node.contains(a) && !a.href.includes('z.ai') && !a.closest('.thinking-chain-container'));
              
          if (externalLinks.length === 0) {
              // Sidebar is not open! Let's abort and ask the user to open it.
              alert("⚠️ Neural Extractor Alert ⚠️\n\nThis Z AI response contains sources/references.\nPlease manually click the 'Sources' or citation button to open the right-hand sidebar, then click Export again to capture the URLs.");
              throw new Error("USER_PROMPT_NEEDED");
          } else {
              sourcesMarkdown = "\n\n**Sources Referenced:**\n";
              
              // De-duplicate URLs
              const uniqueUrls = new Set();
              let linkIndex = 1;
              externalLinks.forEach(link => {
                  if (link.href && !uniqueUrls.has(link.href)) {
                      uniqueUrls.add(link.href);
                      const title = link.innerText ? link.innerText.replace(/\n/g, ' ').trim() : link.href;
                      sourcesMarkdown += `${linkIndex}. [${title || link.href}](${link.href})\n`;
                      linkIndex++;
                  }
              });
          }
      }

      // D. Final Compilation
      fullMarkdownLog += `### 🤖 **Z AI**\n\n`;
      
      if (thinkingMarkdown.trim()) {
         const indentedThinking = thinkingMarkdown.trim().split('\n').map(line => `> ${line}`).join('\n');
         fullMarkdownLog += `> [!quote]- 🧠 **Model Thinking**\n${indentedThinking}\n\n`;
      }
      
      if (mainResponseMarkdown.trim()) {
         fullMarkdownLog += `${mainResponseMarkdown.trim()}\n\n`;
      }

      if (sourcesMarkdown.trim()) {
         fullMarkdownLog += `${sourcesMarkdown.trim()}\n\n`;
      }
      
      fullMarkdownLog += `---\n\n`;
    }
  }

  return fullMarkdownLog;
}
