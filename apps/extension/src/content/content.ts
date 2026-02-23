chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'insertEmail') {
    insertEmailToGmail(request.email);
  }
});

function insertEmailToGmail(emailText: string) {
  const selectors = [
    '[role="textbox"][aria-label*="Message"]',
    '[role="textbox"][aria-label*="message"]',
    '[role="textbox"][aria-label*="Body"]',
    '[role="textbox"][aria-label*="body"]',
    'div[aria-label*="Message"][contenteditable="true"]',
    'div[aria-label*="body"][contenteditable="true"]',
    'div.Am.Al.editable[contenteditable="true"]',
    'div[contenteditable="true"][role="textbox"]'
  ];

  let composeBox: HTMLElement | null = null;
  for (const selector of selectors) {
    composeBox = document.querySelector(selector) as HTMLElement;
    if (composeBox) break;
  }
  
  if (composeBox) {
    composeBox.focus();
    composeBox.innerText = emailText;
    
    composeBox.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('Email inserted successfully');
  } else {
    console.error('Could not find Gmail compose box. Make sure a compose window is open.');
  }
}