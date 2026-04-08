chrome.runtime.onInstalled.addListener((details) => {
  console.log("Email Co-Composer installed:", details.reason);
});

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});
