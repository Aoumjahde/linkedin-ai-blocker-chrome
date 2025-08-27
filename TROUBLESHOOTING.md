# 🔧 Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to fetch" Error

**Problem**: You see this error in the browser console:
```
Error calling Gemini: TypeError: Failed to fetch
```

**Solutions**:

#### A. Check if Gemini API Key is Configured
- Open the extension popup and check if you've entered your API key
- The API key field should not be empty
- Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

#### B. Verify Gemini API Key
- Open the extension popup (click the extension icon)
- Check the "Gemini API Key" field
- The field should contain your API key from Google AI Studio
- If empty, enter your API key and save

#### C. Test Connection
- In the extension popup, click "Test Connection"
- This will verify if your Gemini API key works

#### D. Check API Key Issues
The "Failed to fetch" error often indicates an API key problem. This happens because:
- The API key field is empty
- The API key is invalid or expired
- You've exceeded API quotas

**Solution**: 
1. Enter your Gemini API key in the extension settings
2. Get a new API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. Use the "Test Connection" button to verify your key works
4. Check your API usage and quotas

### 2. Extension Not Working on LinkedIn

**Problem**: The extension loads but doesn't detect any content.

**Solutions**:

#### A. Check Extension Status
- Look for the "🤖 AI Detector" button in LinkedIn header
- If not visible, the extension might not be properly loaded

#### B. Verify Content Script Injection
- Open LinkedIn
- Open DevTools (F12)
- Check Console for any error messages
- Look for "Settings loaded:" message

#### C. Refresh LinkedIn Page
- Sometimes the extension needs a page refresh to work
- Try refreshing the LinkedIn page

### 3. No AI Flags Appearing

**Problem**: Extension is running but no AI flags are shown.

**Solutions**:

#### A. Check Content Length
- Extension only analyzes content with 20+ characters
- Very short posts/comments won't be analyzed

#### B. Verify API Endpoint
- Check if the Gemini endpoint is correct
- Default should be: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Update the endpoint in extension settings if needed

#### C. Check Console Logs
- Open DevTools Console
- Look for "Calling Ollama at..." messages
- Check for any error messages

### 4. Performance Issues

**Problem**: Extension is slow or causing lag.

**Solutions**:

#### A. Disable Auto-detection
- Open extension popup
- Turn off "Auto-detect" toggle
- Manually enable when needed

#### B. Check API Quotas
- Gemini API has rate limits and quotas
- Check your usage in Google AI Studio
- Consider upgrading if you hit limits

#### C. Limit Content Scanning
- Modify `content.js` to scan fewer elements
- Increase the minimum text length threshold

### 5. Extension Won't Load

**Problem**: Chrome shows "Error loading extension" or similar.

**Solutions**:

#### A. Check File Structure
Ensure all required files are present:
```
linkedin-ai/
├── manifest.json
├── content.js
├── popup.html
├── popup.js
├── background.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

#### B. Verify Icon Files
- Icon files must be actual PNG images
- Text placeholders won't work
- Use `create-icons.html` to generate proper icons

#### C. Check Manifest Syntax
- Ensure `manifest.json` has valid JSON syntax
- Check for missing commas or brackets

### 6. Settings Not Saving

**Problem**: Extension settings reset after browser restart.

**Solutions**:

#### A. Check Chrome Storage
- Open DevTools Console
- Type: `chrome.storage.sync.get(null, console.log)`
- Verify settings are stored

#### B. Extension Permissions
- Ensure extension has "storage" permission
- Check `chrome://extensions/` for any permission errors

### 7. API Key Not Working

**Problem**: Extension shows "API Key Required" or connection fails.

**Solutions**:

#### A. Get New API Key
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Replace the old key in extension settings

#### B. Check API Key Format
- Ensure the key is copied completely
- No extra spaces or characters
- Key should start with "AIzaSy"

#### C. Verify API Key Permissions
- Check if the key has proper permissions
- Ensure the key is enabled for Gemini API

## Debug Mode

To enable debug logging:

1. Open LinkedIn
2. Open DevTools Console
3. Look for messages starting with "LinkedIn AI Detector:"
4. Check for "Settings loaded:" message
5. Look for "Calling Gemini API..." messages

## Getting Help

If you're still having issues:

1. **Check Console Logs**: Look for error messages in DevTools
2. **Test Gemini API**: Use the "Test Connection" button in extension popup
3. **Verify Settings**: Check extension popup for correct configuration
4. **Check Network**: Look for failed requests in Network tab

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | API key missing/invalid | Enter your Gemini API key in settings |
| `API Key Required` | No API key configured | Get API key from Google AI Studio |
| `HTTP error! status: 429` | Rate limit exceeded | Check API quotas, reduce usage |
| `HTTP error! status: 403` | API key permissions | Verify key has proper permissions |
| `Settings not loaded` | Extension not ready | Wait for page to load, check console |
| `No posts found` | LinkedIn structure changed | Update selectors in `content.js` |
