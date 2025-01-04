import { signInWithPopup, GoogleAuthProvider } from '../firebase/firebase-auth.js';
import { auth } from '../firebase/firebase-init.js';

const PARENT_FRAME = document.location.ancestorOrigins[0];

const PROVIDER = new GoogleAuthProvider()

function sendResponse(result) {
  globalThis.parent.self.postMessage(JSON.stringify(result), PARENT_FRAME);
}

globalThis.addEventListener('message', function({ data }) {
  if (data.initAuth) {
    signInWithPopup(auth, PROVIDER)
      .then(sendResponse)
      .catch(sendResponse)
  }
});
