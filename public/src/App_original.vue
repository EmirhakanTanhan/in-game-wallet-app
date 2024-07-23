<template>
  <div id="app">
    <h1>Google Sign-In Demo</h1>
    <div v-if="user">
      <p>Welcome, {{ user.displayName }}!</p>
      <img :src="user.photoURL" alt="User profile" />
      <button @click="signOut">Sign Out</button>
    </div>
    <div v-else>
      <button @click="signIn">Sign In with Google</button>
    </div>
  </div>
</template>

<script>
import {initializeApp} from 'firebase/app';
import {getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged} from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDYIlifV_8Sma7RLR2yugQv9kklDMhmVgs",
  authDomain: "in-game-wallet-app.firebaseapp.com",
  projectId: "in-game-wallet-app",
  storageBucket: "in-game-wallet-app.appspot.com",
  messagingSenderId: "622826913157",
  appId: "1:622826913157:web:b7c278cea6aafb777e58ec"
};

initializeApp(firebaseConfig);
const auth = getAuth();

export default {
  name: 'App',
  data() {
    return {
      user: null
    };
  },
  methods: {
    signIn() {
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
          .then(result => {
            // const credential = GoogleAuthProvider.credentialFromResult(result);
            // const token = credential.accessToken;
            // The signed-in user info.
            this.user = result.user;
          })
          .catch(error => {
            // const credential = GoogleAuthProvider.credentialFromError(error);
            console.error("Error during sign in:", error);
          });
    },
    signOut() {
      signOut(auth)
          .then(() => {
            this.user = null;
          })
          .catch(error => {
            console.error("Error during sign out:", error);
          });
    }
  },
  mounted() {
    onAuthStateChanged(auth, user => {
      this.user = user;
      console.log(this.user);
    });
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
img {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  margin-top: 20px;
}
</style>