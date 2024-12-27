import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  onSnapshot,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { firebaseConfig } from "./config.js";

const todoForm = document.querySelector("form");
const todoInput = document.getElementById("todo-input");
const todoListUL = document.getElementById("todo-list");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firebase initialized");

const userEmail = document.getElementById("user-email");
const logoutButton = document.getElementById("logout-button");

let unsubscribe;

onAuthStateChanged(auth, (user) => {
  if (user) {
    // User is signed in
    userEmail.textContent = `Signed in as: ${user.email}`;
    logoutButton.style.display = "block";
    unsubscribe = setupTodoListener(user);
  } else {
    // User is signed out
    userEmail.textContent = "";
    logoutButton.style.display = "none";
    if (unsubscribe) {
      unsubscribe();
    }
    window.location.href = "index.html"; // Redirect to login page
  }
});

logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    // Redirect is handled by onAuthStateChanged
  } catch (error) {
    console.error("Error signing out:", error);
  }
});

// Helper function to format dates consistently
function formatDate(date) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

todoForm.addEventListener("submit", function (e) {
  e.preventDefault();
  addTodo();
});

document.getElementById("add-button").addEventListener("click", function (e) {
  e.preventDefault();
  addTodo();
});

async function addTodo() {
  const user = auth.currentUser;
  if (!user) return;

  const todoText = todoInput.value.trim();
  const today = formatDate(new Date());
  if (todoText.length > 0) {
    const todoObject = {
      text: todoText,
      date: today,
      completed: false,
      userId: user.uid,
    };

    try {
      // Add todo to Firestore
      await addDoc(collection(db, "todos"), todoObject);
      // Clear the input field
      todoInput.value = "";
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }
}

function setupTodoListener(user) {
  if (!user) return;

  const q = query(collection(db, "todos"), where("userId", "==", user.uid));
  return onSnapshot(q, (snapshot) => {
    todoListUL.innerHTML = "";
    const todos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Group todos by date and sort by date descending
    const groupedTodos = todos.reduce((groups, todo) => {
      const date = formatDate(todo.date);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(todo);
      return groups;
    }, {});

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedTodos).sort(
      (a, b) => new Date(b) - new Date(a)
    );

    // Render each date section and its todos
    sortedDates.forEach((date) => {
      const dateSection = createDateSection(date);
      groupedTodos[date].forEach((todo) => {
        const todoItem = createTodoItem(todo);
        dateSection.querySelector("ul").append(todoItem);
      });
      todoListUL.append(dateSection);
    });
  });
}

function createDateSection(date) {
  const section = document.createElement("li");
  section.classList.add("date-section");
  section.setAttribute("data-date", date);
  section.innerHTML = `
    <div class="date-header">${date}</div>
    <ul class="todo-items"></ul>
  `;
  return section;
}

function createTodoItem(todo) {
  const todoLI = document.createElement("li");
  todoLI.classList = "todo";
  todoLI.innerHTML = `
    <input type="checkbox" id="${todo.id}" ${todo.completed ? "checked" : ""}>
    <label class="custom-checkbox" for="${todo.id}">
      <svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
    </label>
    <label for="${todo.id}" class="todo-text">${todo.text}</label>
    <button class="delete-button">
      <svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed">
        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
    </button>
  `;

  const deleteButton = todoLI.querySelector(".delete-button");
  deleteButton.addEventListener("click", () => deleteTodoItem(todo.id, todoLI));

  const checkbox = todoLI.querySelector("input");
  checkbox.addEventListener("change", async () => {
    await updateDoc(doc(db, "todos", todo.id), { completed: checkbox.checked });
    todoLI.querySelector(".todo-text").style.textDecoration = checkbox.checked
      ? "line-through"
      : "none";
    todoLI.querySelector(".todo-text").style.color = checkbox.checked
      ? "var(--secondary-color)"
      : "var(--text-color)";
  });

  return todoLI;
}

async function deleteTodoItem(todoId, todoElement) {
  await deleteDoc(doc(db, "todos", todoId));
  todoElement.remove();

  // Remove the date section if it's empty
  const dateSection = todoElement.closest(".date-section");
  if (dateSection && dateSection.querySelectorAll(".todo").length === 0) {
    dateSection.remove();
  }
}

async function getTodos() {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(collection(db, "todos"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
