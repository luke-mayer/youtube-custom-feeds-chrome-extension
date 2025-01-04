const _URL = 'url'; // Replace with earl of sign in site
const iframe = document.createElement('iframe');
iframe.src = _URL;
document.documentElement.appendChild(iframe);
chrome.runtime.onMessage.addListener(handleChromeMessages);

function handleChromeMessages(message, sender, sendResponse) {
  if (message.target !== 'offscreen') {
    return false;
  }

  function handleIframeMessage({ data }) {
    try {
      if (data.startsWith('!_{')) {
        return;
      }
      data = JSON.parse(data);
      self.removeEventListener('message', handleIframeMessage);

      sendResponse(data);
    } catch (e) {
      console.log(`json parse failed - ${e.message}`);
    }
  }

  globalThis.addEventListener('message', handleIframeMessage, false);

  iframe.contentWindow.postMessage({ "initAuth": true }, new URL(_URL).origin);
  return true;
}
