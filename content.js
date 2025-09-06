// LinkedIn AI Detector Content Script
class LinkedInAIDetector {
  constructor() {
    this.geminiApiKey = '';
    this.geminiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    this.isEnabled = true;
    this.processedElements = new Set();
    this.postsAnalyzed = 0;
    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupObserver();
    this.scanExistingContent();
    this.addToggleButton();
    this.setupMessageListener();
  }

  setupObserver() {
    // Observe DOM changes to catch new posts/comments
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanNode(node);
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  scanExistingContent() {
    this.scanNode(document.body);
  }

  scanNode(node) {
    if (!this.isEnabled) return;

    // Look for LinkedIn post containers
    const postSelectors = [
      '[data-urn*="urn:li:activity:"]',
      '.feed-shared-update-v2',
      '.feed-shared-text',
      '.comments-comment-item',
      '.comments-comment-item__main-content'
    ];

    postSelectors.forEach(selector => {
      const elements = node.querySelectorAll ? node.querySelectorAll(selector) : [];
      elements.forEach(element => {
        if (!this.processedElements.has(element)) {
          this.processedElements.add(element);
          this.analyzeContent(element);
        }
      });
    });
  }

  async analyzeContent(element) {
    try {
      const text = this.extractText(element);
      if (text && text.length > 20) { // Only analyze meaningful content
        this.postsAnalyzed++;
        
        // Quick client-side AI detection for obvious cases
        const quickAICheck = this.quickAIDetection(text);
        if (quickAICheck !== null) {
          // We have a confident quick detection
          this.addAIFlag(element, quickAICheck);
        } else {
          // Use Gemini API for uncertain cases
          const isAI = await this.detectAI(text);
          this.addAIFlag(element, isAI);
        }
      }
    } catch (error) {
      console.error('Error analyzing content:', error);
    }
  }

  quickAIDetection(text) {
    const lowerText = text.toLowerCase();
    
    // STRONG AI INDICATORS - return true immediately
    if (this.countEmojis(text) > 4) return true; // Too many emojis
    if (this.hasExcessiveBuzzwords(lowerText)) return true; // Corporate jargon
    if (this.hasPerfectHashtags(text)) return true; // Perfect hashtag formatting
    if (this.hasGenericMotivationalLanguage(lowerText)) return true; // Generic motivation
    
    // STRONG HUMAN INDICATORS - return false immediately
    if (this.hasPersonalDetails(text)) return false; // Personal stories
    if (this.hasImperfectGrammar(text)) return false; // Natural mistakes
    if (this.hasCasualLanguage(lowerText)) return false; // Casual tone
    
    // Uncertain - return null for API analysis
    return null;
  }

  countEmojis(text) {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emojiRegex);
    return matches ? matches.length : 0;
  }

  hasExcessiveBuzzwords(text) {
  const buzzwords = [
    'artificial intelligence (ai)', 'machine learning (ml)', 'deep learning', 'neural network',
    'large language model (llm)', 'generative ai', 'transformer architecture', 'model parameters',
    'training data', 'inference', 'pre-training', 'fine-tuning', 'tokenization',
    'context window', 'hallucinations', 'prompt engineering', 'zero-shot learning',
    'few-shot learning', 'embeddings', 'vector database', 'mixture of experts (moe)',
    'reinforcement learning from human feedback (rlhf)', 'chain-of-thought (cot)',
    'retrieval-augmented generation (rag)', 'transfer learning', 'self-attention',
    'knowledge graph', 'hyperparameters', 'scalability', 'efficiency',
    'multimodality', 'agentic ai', 'autonomous agents', 'real-time processing',
    'low-latency', 'high-throughput', 'data synthesis', 'code generation',
    'code debugging', 'summarization', 'content creation', 'chatbot',
    'virtual assistant', 'sentiment analysis', 'named entity recognition (ner)',
    'conversational ai', 'personalization', 'enterprise integration',
    'domain-specific llm', 'decision-making', 'digital transformation',
    'innovation hub', 'disruption', 'ecosystem', 'synergy', 'value proposition',
    'paradigm shift', 'vertical integration', 'monetization', 'roi (return on investment)',
    'stakeholders', 'seamless integration', 'optimized workflow', 'scalable solution',
    'end-to-end', 'robust', 'agile', 'user-centric', 'game-changer', 'cutting-edge',
    'bias mitigation', 'ai alignment', 'transparency', 'explainability (xai)',
    'ethical ai', 'responsible ai', 'data privacy', 'algorithmic fairness',
    'security risks', 'accountability', 'revolutionary', 'transformative',
    'unprecedented', 'holistic', 'dynamic', 'empowering', 'future-proof',
    'on-the-fly', 'in-the-wild', 'leveraging', 'driving', 'pioneering',
    'ushering in', 'at the forefront', 'quantum computing', 'the internet of things (iot)',
    'smart technology', 'predictive analytics', 'big data', 'cloud-based'
  ];
    
    const foundBuzzwords = buzzwords.filter(word => text.includes(word));
    return foundBuzzwords.length >= 2; // 2 or more buzzwords = likely AI
  }

  hasPerfectHashtags(text) {
    // Check for perfectly formatted hashtags (common in AI posts)
    const hashtagRegex = /#[A-Z][a-z]+(?:[A-Z][a-z]+)*/g;
    const hashtags = text.match(hashtagRegex);
    return hashtags && hashtags.length >= 3; // 3+ perfect hashtags = likely AI
  }

  hasGenericMotivationalLanguage(text) {
  const motivationalPhrases = [
    'embrace the journey', 'unlock your full potential', 'the only limit is your imagination',
    'believe in yourself', 'you\'ve got this!', 'keep moving forward', 'every challenge is an opportunity',
    'your potential is limitless', 'start with a single step', 'the future is bright',
    'focus on the positive', 'stay resilient', 'you are capable of great things',
    'don\'t be afraid to fail', 'progress, not perfection', 'find your inner strength',
    'make every day count', 'your journey is unique', 'rise to the occasion',
    'create your own destiny', 'be the change you wish to see', 'inspire others',
    'the world is waiting for you', 'step out of your comfort zone', 'find your passion',
    'stay focused on your goals', 'visualize your success', 'hard work pays off',
    'dream big', 'never give up', 'your voice matters', 'the best is yet to come',
    'challenge yourself', 'find joy in the small things', 'be kind to yourself',
    'your efforts will be rewarded', 'find your purpose', 'take a leap of faith',
    'the possibilities are endless', 'a fresh start awaits', 'find the silver lining',
    'be bold and brave', 'you are the master of your fate', 'turn obstacles into stepping stones',
    'learn from yesterday, live for today', 'your courage is your strength',
    'stay true to yourself', 'let your dreams be your guide', 'celebrate your progress',
    'radiate positivity', 'your inner light shines bright', 'overcome and conquer',
    'take it one day at a time', 'you are stronger than you think', 'the sky is the limit',
    'follow your heart', 'let your creativity flow', 'find your happy place',
    'stay curious', 'the world is your canvas', 'your journey is just beginning',
    'you can achieve anything', 'don\'t let fear hold you back', 'every moment is a new beginning',
    'seize the day', 'your potential is waiting to be realized', 'trust the process',
    'find your inner peace', 'be your own hero', 'live life to the fullest',
    'dare to be different', 'your success story starts now', 'find strength in vulnerability',
    'the journey is the reward', 'be the best version of yourself', 'chase your dreams',
    'you are a work in progress', 'find your rhythm', 'let your intuition guide you',
    'the power is within you', 'stay positive and persistent', 'you are not alone',
    'be a force for good', 'find strength in your struggles', 'the future belongs to you',
    'your potential is a superpower', 'let go of what no longer serves you',
    'the next chapter awaits', 'your story is still being written', 'stay humble and hungry',
    'grow through what you go through', 'be the author of your life', 'your greatness is waiting',
    'find your purpose in the pain', 'your journey is a testament to your strength',
    'let your passion be your fuel', 'you are a masterpiece in the making',
    'the best view comes after the hardest climb', 'don\'t just exist, live'
  ];
    
    const foundPhrases = motivationalPhrases.filter(phrase => text.includes(phrase));
    return foundPhrases.length >= 2; // 2+ generic phrases = likely AI
  }

  hasPersonalDetails(text) {
    // Check for specific personal information
    const personalIndicators = [
      /\b\d{4}\b/, // Years
      /\b[A-Z][a-z]+ [A-Z][a-z]+\b/, // Names (likely)
      /\b(?:yesterday|today|last week|this morning)\b/i, // Time references
      /\b(?:my|mine|I've|I'm|I'll)\b/i, // Personal pronouns
      /\b(?:coffee|lunch|meeting|project)\b/i // Specific activities
    ];
    
    return personalIndicators.some(indicator => indicator.test(text));
  }

  hasImperfectGrammar(text) {
    // Check for natural human mistakes
    const imperfectIndicators = [
      /\b(?:gonna|wanna|gotta|lemme)\b/i, // Contractions
      /\b(?:um|uh|hmm|well)\b/i, // Filler words
      /[.!?]{2,}/, // Multiple punctuation
      /\b(?:awesome|cool|great|nice)\b/i // Casual words
    ];
    
    return imperfectIndicators.some(indicator => indicator.test(text));
  }

  hasCasualLanguage(text) {
    const casualWords = [
      'hey', 'hi', 'thanks', 'cool', 'awesome', 'great', 'nice',
      'yeah', 'yep', 'nope', 'okay', 'sure', 'maybe', 'probably'
    ];
    
    return casualWords.some(word => text.includes(word));
  }

  extractText(element) {
    // Extract text from various LinkedIn post/comment structures
    const textSelectors = [
      '.feed-shared-text__text',
      '.comments-comment-item__text',
      '.feed-shared-update-v2__description',
      '.feed-shared-text__text--rich',
      'p',
      'span'
    ];

    let text = '';
    textSelectors.forEach(selector => {
      const textElement = element.querySelector(selector);
      if (textElement) {
        text += textElement.textContent + ' ';
      }
    });

    return text.trim();
  }

  async detectAI(text) {
    try {
      // Check if we have valid settings
      if (!this.geminiApiKey || !this.geminiEndpoint) {
        console.log('Gemini API key not configured, skipping detection');
        return false;
      }

      // Check if API key is valid (not empty)
      if (this.geminiApiKey.trim() === '') {
        console.log('Please configure your Gemini API key in the extension settings');
        return false;
      }

      const prompt = `Analyze the following text and determine if it was likely generated by AI. Be STRICT and consider these factors:

STRONG AI INDICATORS (mark as AI if ANY are present):
- Excessive emojis (more than 2-3 per sentence)
- Overly perfect grammar and punctuation
- Corporate buzzwords and jargon (synergy, leverage, optimize, etc.)
- Generic motivational language
- Repetitive sentence structures
- Lack of personal details or anecdotes
- Overly formal business language
- Perfect hashtag formatting
- Marketing-style language
- Unnatural enthusiasm or positivity

HUMAN INDICATORS (mark as HUMAN only if clearly natural):
- Personal stories or experiences
- Casual, conversational tone
- Imperfect grammar or typos
- Natural emoji usage (1-2 per post)
- Specific details about work/projects
- Authentic emotions and reactions
- Varied sentence lengths
- Real names or specific company details

Text: "${text.substring(0, 500)}..."

Be STRICT - if there's ANY doubt, mark as AI. Respond with only "AI" if AI-generated, or "HUMAN" if clearly human-written.`;

      console.log(`Calling Gemini API for AI detection`);

      // Use background script to avoid CORS issues
      return new Promise((resolve) => {
        console.log('Sending message to background script...');
        chrome.runtime.sendMessage({
          action: 'callGemini',
          data: {
            apiKey: this.geminiApiKey,
            endpoint: this.geminiEndpoint,
            prompt: prompt
          }
        }, (response) => {
          console.log('Received response from background script:', response);
          if (response && response.success) {
            console.log(`Gemini response: ${response.data.candidates[0].content.parts[0].text}`);
            const result = response.data.candidates[0].content.parts[0].text.toLowerCase() || '';
            resolve(result.includes('ai'));
          } else {
            console.error('Gemini call failed:', response?.error || 'Unknown error');
            resolve(false);
          }
        });
      });

    } catch (error) {
      console.error('Error calling Gemini:', error);
      return false;
    }
  }

  addAIFlag(element, isAI) {
    // Remove existing flag if present
    const existingFlag = element.querySelector('.ai-detector-flag');
    if (existingFlag) {
      existingFlag.remove();
    }

    // Remove existing overlay if present
    const existingOverlay = element.querySelector('.ai-detector-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Remove existing show original button if present
    const existingShowBtn = element.parentNode.querySelector('.ai-show-original-btn');
    if (existingShowBtn) {
      existingShowBtn.remove();
    }

    if (isAI) {
      // Add CSS class for styling
      element.classList.add('ai-post-blurred');
      
      // Blur the entire post and add AI warning
      element.style.filter = 'blur(3px)';
      element.style.transition = 'filter 0.3s ease';
      
      // Create AI warning overlay (without button)
      const aiOverlay = document.createElement('div');
      aiOverlay.className = 'ai-detector-overlay';
      aiOverlay.innerHTML = `
        <div class="ai-overlay-content">
          <span class="ai-overlay-text">AI Generated Content</span>
        </div>
      `;
      
      element.style.position = 'relative';
      element.appendChild(aiOverlay);
      
      // Add "Show Original" button above the blur
      const showOriginalBtn = document.createElement('button');
      showOriginalBtn.className = 'ai-show-original-btn';
      showOriginalBtn.innerHTML = '👁️ Show Original';
      showOriginalBtn.title = 'Click to temporarily view the original content';
      
      showOriginalBtn.onclick = () => {
        // Store original styles to restore later
        const originalFilter = element.style.filter;
        const originalTransition = element.style.transition;
        const originalPosition = element.style.position;
        
        // Completely remove all filters and show original content
        element.style.filter = 'none';
        element.style.transition = 'none';
        element.classList.remove('ai-post-blurred');
        
        // Hide the overlay to show clean original content
        const overlay = element.querySelector('.ai-detector-overlay');
        if (overlay) {
          overlay.style.display = 'none';
        }
        
        // Hide the show original button
        showOriginalBtn.style.display = 'none';
        
        // Create hide original button
        const hideOriginalBtn = document.createElement('button');
        hideOriginalBtn.className = 'ai-hide-original-btn';
        hideOriginalBtn.innerHTML = '🙈 Hide Original';
        hideOriginalBtn.title = 'Click to restore the blur effect';
        
        hideOriginalBtn.onclick = () => {
          // Restore all original styles and blur
          element.style.filter = 'blur(3px)';
          element.style.transition = 'filter 0.3s ease';
          element.style.position = 'relative';
          element.classList.add('ai-post-blurred');
          
          // Show the overlay again
          if (overlay) {
            overlay.style.display = 'flex';
          }
          
          // Remove hide button and restore show button
          hideOriginalBtn.remove();
          showOriginalBtn.style.display = 'block';
        };
        
        // Insert hide button after show button
        showOriginalBtn.parentNode.insertBefore(hideOriginalBtn, showOriginalBtn.nextSibling);
      };
      
      // Insert the show original button before the element
      element.parentNode.insertBefore(showOriginalBtn, element);
      
    } else {
      // Add green flag for human content
      const flag = document.createElement('div');
      flag.className = 'ai-detector-flag human-flag';
      flag.innerHTML = `
        <span class="ai-flag-icon">👤</span>
        <span class="ai-flag-text">Human Written</span>
      `;
      flag.title = 'This content appears to be written by a human';
      
      element.insertBefore(flag, element.firstChild);
    }
  }

  addToggleButton() {
    const toggleButton = document.createElement('button');
    toggleButton.id = 'ai-detector-toggle';
    toggleButton.innerHTML = '🤖 AI Detector';
    toggleButton.className = 'ai-detector-toggle-btn';
    toggleButton.onclick = () => this.toggleDetection();

    // Try to find a good place to insert the toggle button
    const header = document.querySelector('header') || document.querySelector('.global-nav');
    if (header) {
      header.appendChild(toggleButton);
    } else {
      document.body.appendChild(toggleButton);
    }
  }

  toggleDetection() {
    this.isEnabled = !this.isEnabled;
    const toggleBtn = document.getElementById('ai-detector-toggle');
    if (toggleBtn) {
      toggleBtn.classList.toggle('disabled', !this.isEnabled);
      toggleBtn.innerHTML = this.isEnabled ? '🤖 AI Detector' : '🤖 AI Detector (OFF)';
    }
  }

  loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        geminiApiKey: '',
        geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
        autoDetect: true
      }, (items) => {
        this.geminiApiKey = items.geminiApiKey;
        this.geminiEndpoint = items.geminiEndpoint;
        this.isEnabled = items.autoDetect;
        console.log('Settings loaded:', { endpoint: this.geminiEndpoint, enabled: this.isEnabled });
        resolve();
      });
    });
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'settingChanged') {
        if (message.data.key === 'geminiApiKey') {
          this.geminiApiKey = message.data.value;
        } else if (message.data.key === 'geminiEndpoint') {
          this.geminiEndpoint = message.data.value;
        } else if (message.data.key === 'autoDetect') {
          this.isEnabled = message.data.value;
        }
      } else if (message.action === 'getStats') {
        sendResponse({ postsAnalyzed: this.postsAnalyzed });
      } else if (message.action === 'testConnection') {
        this.testGeminiConnection().then(sendResponse);
        return true; // Keep message channel open for async response
      }
    });
  }

  async testGeminiConnection() {
    try {
      // Use background script to avoid CORS issues
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'testGeminiConnection',
          data: {
            apiKey: this.geminiApiKey,
            endpoint: this.geminiEndpoint
          }
        }, (response) => {
          if (response && response.success) {
            resolve({ success: true, message: 'Gemini connection successful' });
          } else {
            resolve({ success: false, message: response?.error || 'Connection failed' });
          }
        });
      });
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Initialize the detector when the page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LinkedInAIDetector();
  });
} else {
  new LinkedInAIDetector();
}
