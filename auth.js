import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from "./config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.querySelector(".form");
  const toggleLink = document.querySelector(".span a");
  const submitButton = document.querySelector(".submit");
  const toggleText = document.querySelector(".span");

  let isLoginMode = true;

  // Function to toggle between login and signup
  function toggleMode() {
    isLoginMode = !isLoginMode;
    submitButton.value = isLoginMode ? "Log in" : "Sign up";
    toggleText.innerHTML = isLoginMode
      ? 'Don\'t have an account? <a href="#">Sign up</a>'
      : 'Already have an account? <a href="#">Log in</a>';

    // Re-add event listener to new link
    document.querySelector(".span a").addEventListener("click", (e) => {
      e.preventDefault();
      toggleMode();
    });
  }

  // Initial event listener for toggle link
  toggleLink.addEventListener("click", (e) => {
    e.preventDefault();
    toggleMode();
  });

  // Handle form submission
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      let userCredential;
      if (isLoginMode) {
        userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      }

      const user = userCredential.user;
      console.log(
        isLoginMode
          ? "Logged in successfully:"
          : "Account created successfully:",
        user
      );

      // Redirect to the todo list page
      window.location.href = "main.html";
    } catch (error) {
      console.error(isLoginMode ? "Login error:" : "Signup error:", error);
      alert(`${isLoginMode ? "Login" : "Signup"} failed: ${error.message}`);
    }
  });
});
