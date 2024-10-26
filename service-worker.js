const YOUTUBE_ORIGIN = "https://www.youtube.com";

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
