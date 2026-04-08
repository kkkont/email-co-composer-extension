chrome.runtime.onInstalled.addListener((details) => {
  console.log("Email Co-Composer installed:", details.reason);
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId === undefined) {
    return;
  }

  chrome.sidePanel.open({ windowId: tab.windowId, tabId: tab.id });
});

// Open side panel when compose window is detected in Gmail
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'openSidePanel' && sender.tab) {
    chrome.sidePanel.open({ windowId: sender.tab.windowId!, tabId: sender.tab.id! });
  }
});
