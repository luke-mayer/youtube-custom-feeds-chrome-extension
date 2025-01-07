const _URL = 'https://custom--feed-438305--auth-web-page-l2tljg0r.web.app/'; // temp url
const iframe = document.createElement('iframe');
iframe.src = _URL;
document.documentElement.appendChild(iframe);
console.log("event listener should be added to handle chrome messages");
chrome.runtime.onMessage.addListener(handleChromeMessages);

function handleChromeMessages(message, sender, sendResponse) {
  console.log("Inside chrome message receiver.");
  if (message.target !== 'offscreen') {
    return false;
  }

  function handleIframeMessage({ data }) {
    console.log("Inside handleIframeMessage");
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
