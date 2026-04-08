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
