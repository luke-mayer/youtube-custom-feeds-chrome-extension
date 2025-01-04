const YOUTUBE_ORIGIN = "https://www.youtube.com";
const OFFSCREEN_DOCUMENT_PATH = '/offscreen.html';

// AUTHENTICATION HANDLING
let creatingOffscreenDocument;

// helper function - returns boolean indicating if a document is already active.
async function hasDocument() {
  const matchedClients = await clients.matchAll();

  return matchedClients.some(
    (c) => c.url === chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)
  );
}

async function setupOffscreenDocument(path) {
  if (!(await hasDocument())) {
    if (creating) {
      await creating;
    } else {
      creating = chrome.offscreen.createDocument({
        url: path,
        reasons: [
          chrome.offscreen.Reason.DOM_SCRAPING
        ],
        justification: 'authentication'
      });
      await creating;
      creating = null;
    }
  }
}

async function closeOffscreenDocument() {
  if (!(await hasDocument())) {
    return;
  }
  await chrome.offscreen.closeDocument();
}

function getAuth() {
  return new Promise(async (resolve, reject) => {
    const auth = await chrome.runtime.sendMessage({
      type: 'firebase-auth',
      target: 'offscreen'
    });
    auth?.name !== 'FirebaseError' ? resolve(auth) : reject(auth);
  })
}

async function firebaseAuth() {
  await setupOffscreenDocument(OFFSCREEN_DOCUMENT_PATH);

  const auth = await getAuth()
    .then((auth) => {
      console.log('User Authenticated', auth);
      return auth;
    })
    .cath(err => {
      if (err.code === 'auth/operation-not-allowed') {
        console.error('You must enable an OAuth provider in the Firebase' +
          ' console in order to use signInWithPopup.');
      } else {
        console.error(err);
        return err;
      }
    })
    .finally(closeOffscreenDocument)

  return auth;
}

// Allows users to open the side panel by clicking on the action toolbar icon
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

chrome.sidePanel.setOptions({
  path: "sidepanel/sidepanel.html",
  enabled: true,
});

/*
chrome.tabs.onUpdated.addListener(async (tabId, info, tab) => {
  if (!tab.url) return;
  const url = new URL(tab.url);
  // Enables the side panel on google.com
  if (url.origin === YOUTUBE_ORIGIN) {
    await chrome.sidePanel.setOptions({
      tabId,
      path: "sidepanel/sidepanel.html",
      enabled: true,
    });
  } else {
    // Disables the side panel on all other sites
    await chrome.sidePanel.setOptions({
      tabId,
      enabled: false,
    });
  }
});
*/
chrome.storage.session.setAccessLevel(
  { accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" },
  () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to set access level: ", chrome.runtime.lastError);
    } else {
      console.log("Access level set to TRUSTED_AND_UNTRUSTED_CONTEXTS");
    }
  }
);

/*
let activeTabId = null;

// Listen for the initial side panel open action
chrome.sidePanel.onOpened.addListener((tabId) => {
  activeTabId = tabId;
});

// Listen for tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activeTabId !== null && activeInfo.tabId !== activeTabId) {
    chrome.sidePanel.close(); // Close side panel if switching tabs
    activeTabId = null; // Reset active tab ID
  }
});
*/
