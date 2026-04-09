chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'insertEmail') {
    insertEmailToComposeBox(request.email);
  }
  if (request.action === 'clearEmail') {
    clearComposeBox();
  }
});

const COMPOSE_SELECTORS = [
  // Gmail selectors
  '[role="textbox"][aria-label*="Message"]',
  '[role="textbox"][aria-label*="message"]',
  '[role="textbox"][aria-label*="Body"]',
  '[role="textbox"][aria-label*="body"]',
  'div[aria-label*="Message"][contenteditable="true"]',
  'div[aria-label*="body"][contenteditable="true"]',
  'div.Am.Al.editable[contenteditable="true"]',
  'div[contenteditable="true"][role="textbox"]',
  // Outlook selectors
  'div[aria-label*="Message body"][contenteditable="true"]',
  'div[role="textbox"][aria-label*="Message body"]',
  'div.elementToProof[contenteditable="true"]',
  'div[id^="editorParent"] div[contenteditable="true"]',
];

function findComposeBox(): HTMLElement | null {
  for (const selector of COMPOSE_SELECTORS) {
    const el = document.querySelector(selector) as HTMLElement;
    if (el) return el;
  }
  return null;
}

// Watch for compose window opening (Gmail & Outlook)
function watchForCompose() {
  const seenBoxes = new WeakSet<Element>();

  const observer = new MutationObserver(() => {
    const composeBoxes = document.querySelectorAll(
      COMPOSE_SELECTORS.join(', ')
    );
    for (const box of composeBoxes) {
      if (!seenBoxes.has(box)) {
        seenBoxes.add(box);
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
        return;
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

watchForCompose();

function insertEmailToComposeBox(emailText: string) {
  const composeBox = findComposeBox();
  
  if (composeBox) {
    composeBox.focus();
    const htmlContent = emailText
      .split('\n\n')
      .map(p => `<div>${p.replace(/\n/g, '<br>')}</div>`)
      .join('<div><br></div>');
    composeBox.innerHTML = htmlContent;
    
    composeBox.dispatchEvent(new Event('input', { bubbles: true }));
    console.log('Email inserted successfully');
  } else {
    console.error('Could not find compose box. Make sure a compose window is open.');
  }
}

function clearComposeBox() {
  const composeBox = findComposeBox();

  if (composeBox) {
    composeBox.focus();
    composeBox.innerText = '';
    composeBox.dispatchEvent(new Event('input', { bubbles: true }));
  }
}