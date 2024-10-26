// /scripts/sidepanel.js

import { signUp, signIn } from "./auth.js";
import { auth } from "../firebase/firebase-init.js";
import { onAuthStateChanged, deleteUser } from "../firebase/firebase-auth.js";
import { BASE_URL } from "../firebase/firebase-secrets.js";

const PREFIX = "/api/v1";

// Get DOM elements
const authTitle = document.getElementById("auth-title");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const addFeedInput = document.getElementById("add-feed-input");
const authContainer = document.getElementById("auth-container");
const addFeedContainer = document.getElementById("add-feed-div");
const authButton = document.getElementById("auth-button");
const toggleAuth = document.getElementById("toggle-auth");
const toggleLink = document.getElementById("toggle-link");
const statusText = document.getElementById("status");
const appStatus = document.getElementById("app-status");
const backToFeedsButton = document.getElementById("back-to-feeds-button");
const addFeedButton = document.getElementById("add-feed-button");
const addFeedForm = document.getElementById("add-feed-form");
const videoHeaderContainer = document.getElementById("video-header-container");
const videoHeader = document.getElementById("video-header");
const refreshVideosButton = document.getElementById("refresh-videos-button");
const videosDiv = document.getElementById("videos-div");
const signOutLink = document.getElementById("sign-out-link");
const deleteAccountLink = document.getElementById("delete-account-link");

let isSignIn = true;
let signedIn = false;
let feedsVisible = false;
let videosVisible = false;

let feedMap = new Map();

// Toggle between Sign In and Sign Up
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  isSignIn = !isSignIn;
  updateAuthMode();
});

function updateAuthMode() {
  authTitle.textContent = isSignIn ? "Sign In" : "Sign Up";
  authButton.textContent = isSignIn ? "Sign In" : "Sign Up";
  toggleAuth.innerHTML = isSignIn
    ? "Don't have an account? <a href='#' id='toggle-link'>Sign Up</a>"
    : "Already have an account? <a href='#' id='toggle-link'>Sign In</a>";
  // Re-attach event listener to the new link
  document.getElementById("toggle-link").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    isSignIn = !isSignIn;
    updateAuthMode();
  });
}

signOutLink.addEventListener("click", async (e) => {
  e.stopPropagation();
  console.log("In signOutLink event");
  await auth
    .signOut()
    .then(() => {
      console.log("Logged out successfully???");
      signedOutFeeds();
    })
    .catch((error) => {
      console.error(`error signing user out: ${error.message}`);
      appStatus.style.color = "red";
      appStatus.textContent =
        "Sorry, there was an issue signing out, try disabling the extensiom.";
    });
});

// ! DELETES USER ACCOUNT
deleteAccountLink.addEventListener("click", async (e) => {
  e.stopPropagation();
  console.log("In deleteAccountLink event");
});

authButton.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  statusText.textContent = "";

  try {
    let user;
    if (isSignIn) {
      user = await signIn(email, password);
    } else {
      user = await signUp(email, password);
    }

    // Store user ID locally
    chrome.storage.local.set({ uid: user.uid }, () => {
      console.log("User ID stored locally.");
    });

    // Send user ID to backend
    await sendUserIdToBackend(user.uid);

    // Update UI
    statusText.style.color = "green";
    statusText.textContent = `Welcome, ${user.email}!`;
    // Optionally, hide auth UI or show logged-in state
    signedIntoFeeds();
  } catch (error) {
    console.error("Authentication error:", error);
    statusText.style.color = "red";
    statusText.textContent = `Error: ${error.message}`;
  }
});

// Displays the message to the user for the specified amount of time (in seconds)
async function statusMessageDisplay(message, time, blue) {
  let pauseTime;
  if (time && time < 100) {
    pauseTime = time * 1000;
  } else {
    pauseTime = 10000;
  }

  if (blue) {
    appStatus.style.color = "blue";
  } else {
    appStatus.style.color = "red";
  }

  if (message) {
    appStatus.textContent = message;
  }

  setTimeout(() => {
    appStatus.innerHTML = "";
  }, pauseTime);
}

// Monitor authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("User is signed in");
    await sendUserIdToBackend(user.uid);
    signedIntoFeeds();
  } else {
    console.log("No user is signed in.");
    // Maybe create function to gurrantee that everything is turned off besides sign in form
  }
});

addFeedButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleAddFeedOn();
});

// creates a new feed
addFeedForm.onsubmit = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  addFeed(addFeedInput.value.trim());
};

async function signedIntoFeeds() {
  await fetchFeeds();
  let feeds = [...feedMap.keys()];
  authContainer.style.display = "none";
  toggleFeedsOn();
  displayFeeds(feeds);
}

function signedOutFeeds() {
  toggleFeedsOff();
  authContainer.style.display = "block";
}

// Used to keep track of which feeds' videos have already been rendered
let feedVideosDisplayed = {};

function displayFeeds(feedNames) {
  let cardsDiv = document.getElementById("cards-div");
  // cardsDiv.innerHTML = "";

  // Creating card for each feed
  feedNames.forEach((feedName) => {
    let cardId = `${feedName}-card`;
    if (document.getElementById(cardId)) {
      return; // Skips to the next feedName
    }

    let card = document.createElement("div");
    card.className = "card";
    card.id = cardId;

    let cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    let feedTitle = document.createElement("h3");
    feedTitle.textContent = feedName;
    cardHeader.appendChild(feedTitle);

    let editDeleteDiv = document.createElement("div");
    editDeleteDiv.className = "edit-delete-div";

    let editButton = document.createElement("button");
    editButton.textContent = "Channels";
    editButton.className = "edit-channels-button";
    editButton.id = `edit-channels-${feedName}`;
    editDeleteDiv.appendChild(editButton);

    let deleteFeedLink = document.createElement("a");
    deleteFeedLink.innerHTML = "<h3>X</h3>";
    deleteFeedLink.className = "delete-feed-link";
    deleteFeedLink.href = "#";
    editDeleteDiv.appendChild(deleteFeedLink);

    cardHeader.appendChild(editDeleteDiv);
    card.appendChild(cardHeader);

    let videosButton = document.createElement("button");
    videosButton.innerText = "Open Feed";
    videosButton.className = "open-feed-button";
    videosButton.id = `open-feed-${feedName}`;

    let channelsDiv = displayChannels(feedName);
    card.append(channelsDiv);
    card.appendChild(videosButton);

    cardsDiv.appendChild(card);

    editButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleChannels(feedName);
    });

    feedVideosDisplayed[feedName] = false;

    videosButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      await displayVideos(feedName);
      toggleVideosOn(feedName);
    });

    deleteFeedLink.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFeed(feedName);
    });
  });
}

function displayChannels(feedName) {
  let channelArray = feedMap.get(feedName);

  let channelsDivId = `${feedName}-channel-list-div`;

  let channelsDiv = document.getElementById(channelsDivId);
  if (!channelsDiv) {
    channelsDiv = document.createElement("div");
  }

  channelsDiv.className = "channel-list";
  channelsDiv.id = channelsDivId;
  channelsDiv.style = "display: none;";

  let ulId = `${feedName}-card-channel-list`;
  let ul = document.getElementById(ulId);
  if (!ul) {
    ul = document.createElement("ul");
  }
  ul.id = ulId;

  channelArray.forEach((channelHandle) => {
    let liId = `${feedName}-card-${channelHandle}`;
    if (document.getElementById(liId)) {
      return; // Skips if channel is already renderred
    }

    let li = document.createElement("li");
    li.innerText = channelHandle;
    li.className = "feed-card-channels";
    li.id = liId;

    let removeButton = document.createElement("button");
    removeButton.className = "remove-button";
    removeButton.innerText = "Remove";
    removeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      removeChannel(feedName, channelHandle);
    });
    li.appendChild(removeButton);

    ul.appendChild(li);
  });

  if (!channelsDiv.contains(ul)) {
    channelsDiv.appendChild(ul);
  }

  let addChannelFormId = `${feedName}-add-channel-form`;

  if (!document.getElementById(addChannelFormId)) {
    let addChannelForm = document.createElement("form");
    addChannelForm.id = addChannelFormId;
    addChannelForm.className = "add-channel-form";

    let addChannelDiv = document.createElement("div");
    addChannelDiv.className = "add-channel-div";

    let channelInput = document.createElement("input");
    channelInput.type = "text";
    channelInput.id = `${feedName}-channel-input`;
    channelInput.placeholder = "Add channel handle...";
    channelInput.autocomplete = "off";

    let submitButton = document.createElement("button");
    submitButton.type = "submit";
    submitButton.textContent = "Add";

    addChannelDiv.appendChild(channelInput);
    addChannelDiv.appendChild(submitButton);

    addChannelForm.appendChild(addChannelDiv);

    let channelHandleInstructions = document.createElement("p");
    channelHandleInstructions.textContent =
      "Input the channel handle (not the channel name). The channel handle begins with @. It can be found on a channel's page underneath the channel name.";
    addChannelForm.appendChild(channelHandleInstructions);

    addChannelForm.onsubmit = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      addChannel(feedName, channelInput.value.trim());
      addChannelForm.reset();
    };

    channelsDiv.appendChild(addChannelForm);
  }

  return channelsDiv;
}

async function displayVideos(feedName) {
  videoHeader.textContent = feedName;

  // Refresh button
  refreshVideosButton.onclick = async (e) => {
    e.stopPropagation();
    await updateVideos(feedName);
    resetVideos(feedName);
    displayVideos(feedName);
  };

  backToFeedsButton.onclick = (e) => {
    e.stopPropagation();
    toggleFeedsOn(feedName);
  };

  // Return if videos have already been renderred
  if (feedVideosDisplayed[feedName]) {
    console.log("videos already rendered for feed: ", feedName);
    return;
  }
  // Second check to handle when user logs out then logs back in
  if (document.getElementById(`${feedName}-videos-div`)) {
    feedVideosDisplayed[feedName] = true;
    console.log("videos already rendered for feed: ", feedName);
    return;
  }

  console.log("Renderring videos for feed: ", feedName);

  let innerVideosDiv = document.createElement("div");
  innerVideosDiv.id = `${feedName}-videos-div`;

  let videos = await fetchVideos(feedName); // async call in future

  // Creating video cards
  if (videos) {
    videos.forEach((video) => {
      let card = document.createElement("div");
      card.className = "video-card";

      let title = document.createElement("h3");
      let channel = document.createElement("h4");
      let date = document.createElement("h4");
      let thumbnail = document.createElement("img");
      thumbnail.className = "thumbnail";
      let aLink = document.createElement("a");

      title.textContent = video.title;
      channel.textContent = video.channel;
      date.textContent = video.publishedAt;
      thumbnail.src = video.thumbnailURL;

      aLink.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await chrome.tabs.query(
          {
            active: true,
            currentWindow: true,
          },
          ([tab]) => {
            chrome.tabs.update(tab.id, { url: video.videoURL });
          }
        );
      });

      let infoDiv = document.createElement("div");
      infoDiv.className = "video-info";
      infoDiv.appendChild(title);
      infoDiv.appendChild(channel);
      infoDiv.appendChild(date);

      card.appendChild(thumbnail);
      card.appendChild(infoDiv);

      aLink.appendChild(card);

      innerVideosDiv.appendChild(aLink);
    });
  } else {
    console.error("in displayVideos(): videos not defined");
  }

  videosDiv.appendChild(innerVideosDiv);

  feedVideosDisplayed[feedName] = true;
}

function toggleChannels(feedName) {
  let divId = `${feedName}-channel-list-div`;
  let channelsDiv = document.getElementById(divId);
  if (channelsDiv.style.display === "none") {
    channelsDiv.style.display = "block";
  } else {
    channelsDiv.style.display = "none";
  }
}

function toggleVideos() {
  let divId = "video-container";
  let videosContainer = document.getElementById(divId);
  if (videosContainer.style.display === "none") {
    videosContainer.style.display = "block";
  } else {
    videosContainer.style.display = "none";
  }
}

function toggleAddFeedOn() {
  addFeedContainer.style.display = "block";
}

function toggleAddFeedOff() {
  addFeedContainer.style.display = "none";
}

function toggleFeedsOn(feedName) {
  toggleVideosOff(feedName);
  let divId = "feed-container";
  let feedsDiv = document.getElementById(divId);
  feedsDiv.style.display = "block";
  feedsVisible = true;
}

function toggleFeedsOff() {
  let divId = "feed-container";
  let feedsDiv = document.getElementById(divId);
  feedsDiv.style.display = "none";
  feedsVisible = false;
}

function toggleVideosOn(feedName) {
  toggleFeedsOff();
  toggleInnerVideosOn(feedName);
  let divId = "video-container";
  let videosContainer = document.getElementById(divId);
  videosContainer.style.display = "block";
  videosVisible = true;
}

function toggleVideosOff(feedName) {
  let divId = "video-container";
  let videosContainer = document.getElementById(divId);
  videosContainer.style.display = "none";
  if (feedName) {
    toggleInnerVideosOff(feedName);
  }
  videosVisible = false;
}

function toggleInnerVideosOn(feedName) {
  let divId = `${feedName}-videos-div`;
  let innerVideosDiv = document.getElementById(divId);
  innerVideosDiv.style.display = "block";
}

function toggleInnerVideosOff(feedName) {
  let divId = `${feedName}-videos-div`;
  let innerVideosDiv = document.getElementById(divId);
  innerVideosDiv.style.display = "none";
}

function resetVideos(feedName) {
  let innerVideosDiv = document.getElementById(`${feedName}-videos-div`);
  if (innerVideosDiv) {
    innerVideosDiv.remove();
  }
  feedVideosDisplayed[feedName] = false;
}

function refreshChannels(feedName) {
  let channelsDiv = document.getElementById(`${feedName}-channel-list-div`);
  if (channelsDiv) {
    channelsDiv.innerHTML = "";
    let newChannelsDiv = displayChannels(feedName);
    channelsDiv.replaceWith(newChannelsDiv);
  }
}

function removeFeedElement(feedName) {
  let cardsDiv = document.getElementById("cards-div");

  if (cardsDiv) {
    let cardId = `${feedName}-card`;
    let card = document.getElementById(cardId);
    if (card) {
      cardsDiv.removeChild(card);
    }
  }
}

// ************* //
// * API CALLS * //
// ************* //

// /login - POST
// Function to send user ID to backend via HTTPS
async function sendUserIdToBackend(uid) {
  try {
    const response = await fetch(`${BASE_URL}${PREFIX}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Firebase-ID": uid,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Backend response:", data);
    } else {
      console.error("Backend error:", response.statusText);
      let errMessage = "Sorry, there was an issue on our end. Try again later.";
      statusMessageDisplay(errMessage, 10, false);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10, false);
  }
}

// /feed - POST
// Creates a new feed and adds it to the database
async function addFeed(feedName) {
  let addFeedFormError = document.getElementById("add-feed-form-error");
  if (!feedName || feedName.length < 1) {
    console.error("Invalid feedName: ", feedName);
    addFeedFormError.textContent = "Invalid feed name";
    addFeedFormError.style.display = "block";
    return;
  }

  // Backend call
  try {
    const response = await fetch(`${BASE_URL}${PREFIX}/feed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Firebase-ID": auth.currentUser.uid,
      },
      body: JSON.stringify({ feedName: feedName }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("addFeed(): Backend response:", data);
      feedMap.set(feedName, []); // adds new feed to the feedMap
      displayFeeds([...feedMap.keys()]);
    } else {
      console.error("addFeed(): Backend error:", response.statusText);
      let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
      statusMessageDisplay(errMessage, 10, false);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10, false);
  }

  addFeedFormError.textContent = "";
  addFeedFormError.style.display = "none";
  addFeedForm.reset();
  toggleAddFeedOff();
}

// /channel - POST
// adds the specified channelHandle to the specified feed
async function addChannel(feedName, channelHandle) {
  // Backend call
  try {
    const response = await fetch(`${BASE_URL}${PREFIX}/channel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Firebase-ID": auth.currentUser.uid,
      },
      body: JSON.stringify({
        feedName: feedName,
        channelHandle: channelHandle,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("addChannel(): Backend response:", data);
      console.log("this is the array in feedMap: ", feedMap.get(feedName));
      let channels = feedMap.get(feedName) || [];
      if (!channels.includes(channelHandle)) {
        channels.push(channelHandle);
        feedMap.set(feedName, channels);
      }
      refreshChannels(feedName);

      let message = `Channel ${channelHandle} successfully added to ${feedName}. Refresh the feed to see new videos.`;
      statusMessageDisplay(message, 10, true);
    } else {
      const data = await response.json();
      console.log("addChannel(): Backend response:", data);
      console.error("addChannel(): Backend error:", response.statusText);
      let errMessage = `Sorry, there was an issue. Make sure the channel handle is spelled correctly and the @ sign is included. Check the channel's page to find the handle.`;
      statusMessageDisplay(errMessage, 10, false);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10, false);
  }

  console.log("submitted add channel, handle: ", channelHandle);
}

// /feeds - GET
// Retrieves all the users feeds and calls fetchChannels
async function fetchFeeds() {
  // Backend call
  try {
    const response = await fetch(`${BASE_URL}${PREFIX}/feeds`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Firebase-ID": auth.currentUser.uid,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("fetchFeeds(): Backend response:", data);
      let feedNames = data.feedNames || [];
      feedNames.forEach(async (feedName) => {
        let emptyArray = [];
        feedMap.set(feedName, emptyArray);
        await fetchChannels(feedName);
      });

      // displayFeeds([...feedMap.keys()]);
    } else {
      const data = await response.json();
      console.error("fetchFeeds(): Error Backend response:", data);
      console.error("fetchFeeds(): Backend error:", response.statusText);
      let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
      statusMessageDisplay(errMessage, 10);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10);
  }

  console.log("fetch feeds call");
}

async function fetchChannels(feedName) {
  // Backend call
  try {
    const response = await fetch(
      `${BASE_URL}${PREFIX}/channels?feedName=${feedName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Firebase-ID": auth.currentUser.uid,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("fetchChannels(): Backend response:", data);
      let channelHandles = data.channelHandles || [];
      console.log(
        "These are the channelHandles (should be array):",
        channelHandles
      );
      feedMap.set(feedName, channelHandles);
      refreshChannels(feedName);
    } else {
      const data = await response.json();
      console.error("fetchChannels(): Error Backend response:", data);
      console.error("fetchChannels(): Backend error:", response.statusText);
      let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
      statusMessageDisplay(errMessage, 10);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("fetchChannels(): Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10);
  }

  console.log("fetch channels call for feed: ", feedName);
}

// /videos - GET
// Retrieves recent videos for the channels in the provided feed
async function fetchVideos(feedName) {
  console.log("fetch videos call for feed: ", feedName);

  const videosKey = `${feedName}-videos`;
  let videos = [];

  await chrome.storage.session.get([videosKey]).then(async (result) => {
    if (result[videosKey]) {
      console.log(
        "videos found in chrome.storage.session for feed: ",
        feedName
      );
      videos = result[videosKey];
    } else {
      console.log(
        "videos not found in storage, retrieving from backend, feed: ",
        feedName
      );
      videos = await updateVideos(feedName);
    }
  });

  return videos;
}

// /videos - GET
// Retrieves the videos for the specified feed
// fetchVideos helper
async function updateVideos(feedName) {
  const videosKey = `${feedName}-videos`;
  let videos;

  // Backend call
  try {
    const response = await fetch(
      `${BASE_URL}${PREFIX}/videos?feedName=${feedName}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Firebase-ID": auth.currentUser.uid,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("updateVideos(): Backend response:", data);
      videos = data.videos || [];
      console.log("These are the videos (should be array):", videos);

      let storageVideos = {};
      storageVideos[videosKey] = videos;
      chrome.storage.session.set(storageVideos);

      console.log("videos stored in backend for feed: ", feedName);
    } else {
      const data = await response.json();
      console.error("updateVideos(): Error Backend response:", data);
      console.error("updateVideos(): Backend error:", response.statusText);

      let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
      statusMessageDisplay(errMessage, 10);
    }
  } catch (error) {
    let errMessage =
      "Sorry, there was an issue, please restart the extension and try again.";
    console.error("updateVideos(): Error sending user ID to backend:", error);
    statusMessageDisplay(errMessage, 10);
  }

  return videos;
}

// /channel - DELETE
// removes the channelHandle from the specified feed, including removing it from the backend
async function removeChannel(feedName, channelHandle) {
  if (
    confirm(
      `Are you sure you want to remove ${channelHandle} from ${feedName}?`
    )
  ) {
    // Backend call
    try {
      const response = await fetch(
        `${BASE_URL}${PREFIX}/channel?feedName=${feedName}&channelHandle=${channelHandle}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Firebase-ID": auth.currentUser.uid,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("removeChannel(): Backend response:", data);

        // Removing channel from feedMap
        let channels = feedMap.get(feedName) || [];
        let indx = channels.indexOf(channelHandle);
        if (indx > -1) {
          channels.splice(indx, 1);
        }
        feedMap.set(feedName, channels);

        refreshChannels(feedName); // re-renderring channels for the feed
        console.log("removed channel, handle: ", channelHandle);
      } else {
        const data = await response.json();
        console.error("removeChannel(): Error Backend response:", data);
        console.error("removeChannel(): Backend error:", response.statusText);
        let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
        statusMessageDisplay(errMessage, 10);
      }
    } catch (error) {
      let errMessage =
        "Sorry, there was an issue, please restart the extension and try again.";
      console.error(
        "removeChannel(): Error sending request to backend:",
        error
      );
      statusMessageDisplay(errMessage, 10);
    }
  }
}

// /feed - DELETE
// removes feed, including deleting feed and all its channels from the backend
async function removeFeed(feedName) {
  if (confirm(`Are you sure you want to remove ${feedName}?`)) {
    // Backend call
    try {
      const response = await fetch(
        `${BASE_URL}${PREFIX}/feed?feedName=${feedName}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Firebase-ID": auth.currentUser.uid,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("removeFeed(): Backend response:", data);

        feedMap.delete(feedName);
        removeFeedElement(feedName);
        let feeds = [...feedMap.keys()];
        displayFeeds(feeds); // re-renderring channels for the feed
        console.log("removed feed: ", feedName);
      } else {
        const data = await response.json();
        console.error("removeFeed(): Error Backend response:", data);
        console.error("removeFeed(): Backend error:", response.statusText);
        let errMessage = `Sorry, there was an issue, please try again later: ${response.statusText}`;
        statusMessageDisplay(errMessage, 10);
      }
    } catch (error) {
      let errMessage =
        "Sorry, there was an issue, please restart the extension and try again.";
      console.error("removeFeed(): Error sending request to backend:", error);
      statusMessageDisplay(errMessage, 10);
    }
  }
}

// * End API CALLS //
