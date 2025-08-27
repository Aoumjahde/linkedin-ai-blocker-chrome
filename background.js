// Background service worker for LinkedIn AI Detector

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    chrome.storage.sync.set({
      geminiApiKey: '',
      geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      autoDetect: true
    });
    
    // Open welcome page or show notification
    chrome.tabs.create({
      url: 'https://github.com/ollama/ollama'
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'log') {
    console.log('LinkedIn AI Detector:', message.data);
  } else if (message.action === 'callGemini') {
    // Handle Gemini API calls to avoid CORS issues
    handleGeminiCall(message.data, sendResponse);
    return true; // Keep message channel open for async response
  } else if (message.action === 'testGeminiConnection') {
    // Handle Gemini connection test
    testGeminiConnection(message.data, sendResponse);
    return true; // Keep message channel open for async response
  }
});

// Handle Gemini API calls
async function handleGeminiCall(data, sendResponse) {
  try {
    console.log('Background script: Calling Gemini API');
    
    const response = await fetch(`${data.endpoint}?key=${data.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: data.prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    sendResponse({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Background script: Gemini call failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Test Gemini connection
async function testGeminiConnection(data, sendResponse) {
  try {
    console.log('Background script: Testing Gemini connection');
    
    const response = await fetch(`${data.endpoint}?key=${data.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: "Hello, this is a test message. Please respond with 'Test successful' if you can see this."
          }]
        }]
      })
    });

    if (response.ok) {
      const responseData = await response.json();
      if (responseData.candidates && responseData.candidates[0]) {
        sendResponse({
          success: true,
          message: 'Gemini connection successful'
        });
      } else {
        sendResponse({
          success: false,
          error: 'Invalid response format'
        });
      }
    } else {
      sendResponse({
        success: false,
        error: `HTTP ${response.status}`
      });
    }
  } catch (error) {
    console.error('Background script: Gemini connection test failed:', error);
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Handle tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && 
      tab.url && 
      tab.url.includes('linkedin.com')) {
    
    // Ensure content script is injected
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content.js']
    }).catch(() => {
      // Content script already injected or failed
    });
  }
});
