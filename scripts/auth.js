// /scripts/auth.js

import { auth } from "../firebase/firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../firebase/firebase-auth.js";

// Function to sign up a user
export async function signUp(email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// Function to sign in a user
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}

// Function to sign out a user
export async function signOutUser() {
  await auth
    .signOut()
    .then(() => {
      console.log("Logged out successfully");
      return true;
    })
    .catch((error) => {
      console.log(`error signing user out: ${error.message}`);
      return false;
    });
}
