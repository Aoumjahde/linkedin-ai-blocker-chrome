// Popup script for LinkedIn AI Detector
class PopupManager {
  constructor() {
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupEventListeners();
    this.checkGeminiStatus();
    this.updateStats();
  }

  loadSettings() {
    chrome.storage.sync.get({
      geminiApiKey: '',
      geminiEndpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
      autoDetect: true
    }, (items) => {
      document.getElementById('gemini-api-key').value = items.geminiApiKey;
      document.getElementById('gemini-endpoint').value = items.geminiEndpoint;
      document.getElementById('auto-detect').checked = items.autoDetect;
      
      // Update status based on API key
      this.updateStatusBasedOnApiKey(items.geminiApiKey);
    });
  }

  setupEventListeners() {
    // Save settings when changed
    document.getElementById('gemini-api-key').addEventListener('change', (e) => {
      this.saveSetting('geminiApiKey', e.target.value);
    });

    document.getElementById('gemini-endpoint').addEventListener('change', (e) => {
      this.saveSetting('geminiEndpoint', e.target.value);
    });

    document.getElementById('auto-detect').addEventListener('change', (e) => {
      this.saveSetting('autoDetect', e.target.checked);
    });

    // Test connection button
    document.getElementById('test-connection').addEventListener('click', () => {
      this.testConnection();
    });
  }

  saveSetting(key, value) {
    chrome.storage.sync.set({ [key]: value }, () => {
      // Notify content script of setting change
      this.notifyContentScript('settingChanged', { key, value });
    });
  }

  async checkGeminiStatus() {
    const apiKey = document.getElementById('gemini-api-key').value;
    const endpoint = document.getElementById('gemini-endpoint').value;
    const statusElement = document.getElementById('gemini-status');
    
    // Check if API key is provided
    if (!apiKey || apiKey.trim() === '') {
      statusElement.textContent = 'API Key Required';
      statusElement.className = 'status-value offline';
      return;
    }
    
    try {
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Test connection"
            }]
          }]
        })
      });
      
      if (response.ok) {
        statusElement.textContent = 'Online';
        statusElement.className = 'status-value online';
      } else {
        throw new Error('Response not ok');
      }
    } catch (error) {
      statusElement.textContent = 'Offline';
      statusElement.className = 'status-value offline';
    }
  }

  updateStatusBasedOnApiKey(apiKey) {
    const statusElement = document.getElementById('gemini-status');
    if (!apiKey || apiKey.trim() === '') {
      statusElement.textContent = 'API Key Required';
      statusElement.className = 'status-value offline';
    } else {
      // Check status if API key is provided
      this.checkGeminiStatus();
    }
  }

  async updateStats() {
    try {
      // Get stats from content script
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'getStats' }, (response) => {
          if (response && response.postsAnalyzed !== undefined) {
            document.getElementById('posts-analyzed').textContent = response.postsAnalyzed;
          }
        });
      }
    } catch (error) {
      console.error('Error updating stats:', error);
    }
  }

  notifyContentScript(action, data) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url && tabs[0].url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tabs[0].id, { action, data });
      }
    });
  }

  async testConnection() {
    const resultDiv = document.getElementById('connection-result');
    const testBtn = document.getElementById('test-connection');
    const apiKey = document.getElementById('gemini-api-key').value;
    
    // Check if API key is provided
    if (!apiKey || apiKey.trim() === '') {
      resultDiv.textContent = '❌ Please enter your Gemini API key first';
      resultDiv.style.color = '#f87171';
      return;
    }
    
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    resultDiv.textContent = '';
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && tab.url.includes('linkedin.com')) {
        chrome.tabs.sendMessage(tab.id, { action: 'testConnection' }, (response) => {
          if (response && response.success) {
            resultDiv.textContent = '✅ ' + response.message;
            resultDiv.style.color = '#4ade80';
          } else {
            resultDiv.textContent = '❌ ' + (response?.message || 'Connection failed');
            resultDiv.style.color = '#f87171';
          }
        });
      } else {
        resultDiv.textContent = '❌ Please open LinkedIn first';
        resultDiv.style.color = '#f87171';
      }
    } catch (error) {
      resultDiv.textContent = '❌ Error: ' + error.message;
      resultDiv.style.color = '#f87171';
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Test Connection';
    }
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateStats') {
    document.getElementById('posts-analyzed').textContent = message.postsAnalyzed;
  }
});
