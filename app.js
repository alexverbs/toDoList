const todoForm = document.querySelector("form");
const todoInput = document.getElementById("todo-input");
const todoListUL = document.getElementById("todo-list");

const firebaseConfig = {
  apiKey: "AIzaSyDazmrMZVjsn2-aTp-wrIznxF-dglF66_s",
  authDomain: "todolist-abv.firebaseapp.com",
  projectId: "todolist-abv",
  storageBucket: "todolist-abv.firebasestorage.app",
  messagingSenderId: "618134673179",
  appId: "1:618134673179:web:66f974edd8a211a33fe5be",
  measurementId: "G-T9VXDVVV2J",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

let allTodos = getTodos();
updateTodoList();

todoForm.addEventListener("submit", function (e) {
  e.preventDefault();
  addTodo();
});

async function addTodo() {
  const todoText = todoInput.value.trim();
  if (todoText.length > 0) {
    const today = new Date().toLocaleDateString();
    const todoObject = {
      text: todoText,
      date: today,
      completed: false,
    };

    try {
      // Add todo to Firestore
      await db.collection("todos").add(todoObject);
      console.log("Task added successfully:", todoObject);
      todoInput.value = "";
      updateTodoList();
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }
}

async function updateTodoList() {
  todoListUL.innerHTML = "";
  const todos = await getTodos();

  let currentDisplayedDate = "";

  todos.forEach((todo, index) => {
    if (todo.date !== currentDisplayedDate) {
      currentDisplayedDate = todo.date;
      const dateHeader = document.createElement("li");
      dateHeader.classList.add("date-header");
      dateHeader.textContent = currentDisplayedDate;
      todoListUL.append(dateHeader);
    }
    const todoItem = createTodoItem(todo, index);
    todoListUL.append(todoItem);
  });
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
  deleteButton.addEventListener("click", () => deleteTodoItem(todo.id));

  const checkbox = todoLI.querySelector("input");
  checkbox.addEventListener("change", async () => {
    await db
      .collection("todos")
      .doc(todo.id)
      .update({ completed: checkbox.checked });
    updateTodoList();
  });

  return todoLI;
}

async function deleteTodoItem(todoId) {
  await db.collection("todos").doc(todoId).delete();
  updateTodoList();
}

function saveTodos() {
  const todosJSON = JSON.stringify(allTodos);
  localStorage.setItem("todos", todosJSON);
}

async function getTodos() {
  const todosSnapshot = await db.collection("todos").get();
  return todosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
