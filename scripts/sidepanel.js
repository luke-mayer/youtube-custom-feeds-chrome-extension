// /scripts/sidepanel.js

import { signUp, signIn } from "./auth.js";
import { auth } from "../firebase/firebase-init.js";
import { onAuthStateChanged } from "../firebase/firebase-auth.js";
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
const signOutButton = document.getElementById("sign-out-button");
const addFeedForm = document.getElementById("add-feed-form");

let isSignIn = true;
let signedIn = false;
let feedsVisible = false;
let videosVisible = false;

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

signOutButton.addEventListener("click", async (e) => {
  e.stopPropagation();
  console.log("In signOutButton event");
  await auth
    .signOut()
    .then(() => {
      console.log("Logged out successfully???");
      signedOutFeeds();
    })
    .catch((error) => {
      console.log(`error signing user out: ${error.message}`);
      appStatus.style.color = "red";
      appStatus.textContent =
        "Sorry, there was an issue signing out, try disabling the extensiom.";
    });
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
    sendUserIdToBackend(user.uid);

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
    }
  } catch (error) {
    console.error("Error sending user ID to backend:", error);
  }
}

// Monitor authentication state
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.uid);
    // Optionally, update UI to reflect signed-in state
    signedIntoFeeds();
  } else {
    console.log("No user is signed in.");
    // Optionally, reset UI to sign-in form
  }
});

const testChannels1 = [
  "feed1 channel1",
  "feed1 channel2",
  "feed1 channel3",
  "feed1 channel4",
  "feed1 channel5",
];
const testChannels2 = [
  "feed2 channel1",
  "feed2 channel2",
  "feed2 channel3",
  "feed2 channel4",
  "feed2 channel5",
];
const testChannels3 = [
  "feed3 channel1",
  "feed3 channel2",
  "feed3 channel3",
  "feed3 channel4",
  "feed3 channel5",
];
const testChannels4 = [
  "feed4 channel1",
  "feed4 channel2",
  "feed4 channel3",
  "feed4 channel4",
  "feed4 channel5",
];

const feedMap = new Map();
feedMap.set("Feed One", testChannels1);
feedMap.set("Feed Two", testChannels2);
feedMap.set("Feed Three", testChannels3);
feedMap.set("Feed Four", testChannels4);

const testVideo1 = {
  channel: "channel 1",
  title: "title 1",
  id: "id 1",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 1",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo2 = {
  channel: "channel 2",
  title: "title 2",
  id: "id 2",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 2",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo3 = {
  channel: "channel 3",
  title: "title 3",
  id: "id 3",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 3",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo4 = {
  channel: "channel 4",
  title: "title 4",
  id: "id 4",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 4",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo5 = {
  channel: "channel 5",
  title: "title 5",
  id: "id 5",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 5",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo6 = {
  channel: "channel 6",
  title: "title 6",
  id: "id 6",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 6",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo7 = {
  channel: "channel 7",
  title: "title 7",
  id: "id 7",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 7",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo8 = {
  channel: "channel 8",
  title: "title 8",
  id: "id 8",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 8",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo9 = {
  channel: "channel 9",
  title: "title 9",
  id: "id 9",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 9",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideo10 = {
  channel: "channel 10",
  title: "title 10",
  id: "id 10",
  thumbnailURL: "http://i3.ytimg.com/vi/Z5-E4oXsCGk/hqdefault.jpg",
  publishedAt: "publishedAt 10",
  videoURL: "https://www.youtube.com/watch?v=Z5-E4oXsCGk&t=12s",
};

const testVideos = [
  testVideo1,
  testVideo2,
  testVideo3,
  testVideo4,
  testVideo5,
  testVideo6,
  testVideo7,
  testVideo8,
  testVideo9,
  testVideo10,
];

addFeedButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleAddFeedOn();
});

// creates a new feed
addFeedForm.onsubmit = (e) => {
  e.preventDefault();
  e.stopPropagation();
  addFeed(addFeedInput.value.trim());
  addFeedForm.reset();
  toggleAddFeedOff();
};

backToFeedsButton.addEventListener("click", (e) => {
  e.stopPropagation();
  toggleFeedsOn();
});

function signedIntoFeeds() {
  var feeds = [...feedMap.keys()];
  authContainer.style.display = "none";
  toggleFeedsOn();
  displayFeeds(feeds);
}

function signedOutFeeds() {
  toggleFeedsOff();
  authContainer.style.display = "block";
}

function displayFeeds(feedNames) {
  var cardsDiv = document.getElementById("cards-div");

  feedNames.forEach((feedName) => {
    var card = document.createElement("div");
    card.className = "card";

    var cardHeader = document.createElement("div");
    cardHeader.className = "card-header";

    var feedTitle = document.createElement("h3");
    feedTitle.innerText = feedName;
    cardHeader.appendChild(feedTitle);

    var editButton = document.createElement("button");
    editButton.innerText = "Edit Channels";
    editButton.className = "edit-channels-button";
    editButton.id = `edit-channels-${feedName}`;
    cardHeader.appendChild(editButton);

    card.appendChild(cardHeader);

    var videosButton = document.createElement("button");
    videosButton.innerText = "Open Feed";
    videosButton.className = "open-feed-button";
    videosButton.id = `open-feed-${feedName}`;

    var channelsDiv = displayChannels(feedName);
    card.append(channelsDiv);
    card.appendChild(videosButton);

    cardsDiv.appendChild(card);

    editButton.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleChannels(feedName);
    });

    videosButton.addEventListener("click", async (e) => {
      e.stopPropagation();
      displayVideos(feedName);
      toggleVideosOn();
    });
  });
}

function displayChannels(feedName) {
  var channelArray = feedMap.get(feedName);

  var channelsDiv = document.createElement("div");
  channelsDiv.className = "channel-list";
  channelsDiv.id = `${feedName}-channel-list-div`;
  channelsDiv.style = "display: none;";

  var ul = document.createElement("ul");
  ul.id = `${feedName}-card-channel-list`;

  channelArray.forEach((channelHandle) => {
    var li = document.createElement("li");
    li.innerText = channelHandle;
    li.className = "feed-card-channels";
    li.id = `${feedName}-card-${channelHandle}`;

    var removeButton = document.createElement("button");
    removeButton.className = "edit-channels-button";
    removeButton.innerText = "Remove";
    removeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      removeChannel(feedName, channelHandle);
    });
    li.appendChild(removeButton);

    ul.appendChild(li);
  });

  channelsDiv.appendChild(ul);

  var addChannelForm = document.createElement("form");

  var addChannelDiv = document.createElement("div");
  addChannelDiv.className = "add-channel-div";

  var channelInput = document.createElement("input");
  channelInput.type = "text";
  channelInput.id = `${feedName}-channel-input`;
  channelInput.placeholder = "Add channel handle...";

  var submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.textContent = "Add";

  addChannelDiv.appendChild(channelInput);
  addChannelDiv.appendChild(submitButton);

  addChannelForm.appendChild(addChannelDiv);

  addChannelForm.onsubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addChannel(feedName, channelInput.value.trim());
    addChannelForm.reset();
  };

  channelsDiv.appendChild(addChannelForm);

  return channelsDiv;
}

async function displayVideos(feedName) {
  var videos = await fetchVideos(feedName); // async call in future

  var cardsDiv = document.getElementById("videos-div");

  videos.forEach((video) => {
    var card = document.createElement("div");
    card.className = "video-card";

    var title = document.createElement("h3");
    var channel = document.createElement("h4");
    var date = document.createElement("h4");
    var thumbnail = document.createElement("img");
    thumbnail.className = "thumbnail";
    var aLink = document.createElement("a");

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

    var infoDiv = document.createElement("div");
    infoDiv.className = "video-info";
    infoDiv.appendChild(title);
    infoDiv.appendChild(channel);
    infoDiv.appendChild(date);

    card.appendChild(thumbnail);
    card.appendChild(infoDiv);

    aLink.appendChild(card);

    cardsDiv.appendChild(aLink);
  });
}

function toggleChannels(feedName) {
  var divId = `${feedName}-channel-list-div`;
  var channelsDiv = document.getElementById(divId);
  if (channelsDiv.style.display === "none") {
    channelsDiv.style.display = "block";
  } else {
    channelsDiv.style.display = "none";
  }
}

function toggleVideos() {
  var divId = "video-container";
  var videosContainer = document.getElementById(divId);
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

function toggleFeedsOn() {
  toggleVideosOff();
  var divId = "feed-container";
  var feedsDiv = document.getElementById(divId);
  feedsDiv.style.display = "block";
  feedsVisible = true;
}

function toggleFeedsOff() {
  var divId = "feed-container";
  var feedsDiv = document.getElementById(divId);
  feedsDiv.style.display = "none";
  feedsVisible = false;
}

function toggleVideosOn() {
  toggleFeedsOff();
  var divId = "video-container";
  var videosContainer = document.getElementById(divId);
  videosContainer.style.display = "block";
  videosVisible = true;
}

function toggleVideosOff() {
  var divId = "video-container";
  var videosContainer = document.getElementById(divId);
  videosContainer.style.display = "none";
  videosVisible = false;
}

async function removeChannel(feedName, channelHandle) {
  // TODO Removes channel from the specified feed including removing from backend database
  // Might want to add a "are you sure" popup
  console.log("removed channel, handle: ", channelHandle);
}

async function addChannel(feedName, channelHandle) {
  //TODO adds channel to the specified field including posting it to backend
  console.log("submitted add channel, handle: ", channelHandle);
}

async function addFeed(feedName) {
  // TODO adds the specified feed to the database and adds to the userFeeds map
  // TODO also calls fetchChannels!!!
  console.log("Submitted add feed form: ", feedName);
}

async function fetchFeeds() {
  // TODO will fetch feedNames and their channels
  console.log("fetch feeds call");
}

async function fetchChannels(feedName) {
  // TODO will fetch channels for the given feedName and add them to feedMap
  console.log("fetch channels call");
}

async function fetchVideos(feedName) {
  // TODO will fetch videos for the provided feed
  console.log("fetch videos call");

  const videosKey = `${feedName}-videos`;
  var videos;

  await chrome.storage.session.get([videosKey]).then(async (result) => {
    if (result[videosKey]) {
      console.log("videos found in chrome.storage.session");
      videos = result[videosKey];
    } else {
      console.log("videos not found in storage, retrieving from backend");
      videos = await updateVideos(feedName);
    }
  });

  return videos;
}

async function updateVideos(feedName) {
  const videosKey = `${feedName}-videos`;
  var videos;

  //TODO fetch videos from backend
  videos = testVideos; // temporary

  let storageVideos = {};
  storageVideos[videosKey] = videos;
  chrome.storage.session.set(storageVideos);
  console.log("videos stored in backend");

  return videos;
}
