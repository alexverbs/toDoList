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
const db = firebase.firestore();

// Helper function to format dates consistently (e.g., "MM/DD/YYYY")
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
  const todoText = todoInput.value.trim();
  if (todoText.length > 0) {
    const today = formatDate(new Date());
    const todoObject = {
      text: todoText,
      date: today,
      completed: false,
    };

    try {
      // Add todo to Firestore
      const docRef = await db.collection("todos").add(todoObject);
      todoObject.id = docRef.id;

      // Check if we need to add the date header
      if (!document.querySelector(".date-header")) {
        const dateHeader = document.createElement("li");
        dateHeader.classList.add("date-header");
        dateHeader.textContent = today;
        todoListUL.append(dateHeader);
      }

      appendTodoToList(todoObject); // Only append the new item
      todoInput.value = "";
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }
}

async function updateTodoList() {
  todoListUL.innerHTML = "";
  const todos = await getTodos();

  let currentDisplayedDate = "";
  todos.forEach((todo) => {
    const formattedDate = formatDate(todo.date);
    if (formattedDate !== currentDisplayedDate) {
      currentDisplayedDate = formattedDate;
      const dateHeader = document.createElement("li");
      dateHeader.classList.add("date-header");
      dateHeader.textContent = currentDisplayedDate;
      todoListUL.append(dateHeader);
    }
    appendTodoToList(todo);
  });
}

function appendTodoToList(todo) {
  const todoItem = createTodoItem(todo);
  todoListUL.append(todoItem);
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
    await db
      .collection("todos")
      .doc(todo.id)
      .update({ completed: checkbox.checked });
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
  await db.collection("todos").doc(todoId).delete();
  todoElement.remove(); // Only remove the deleted item

  // Check if there are no remaining tasks and remove the date header if so
  if (
    todoListUL.children.length === 1 &&
    todoListUL.querySelector(".date-header")
  ) {
    todoListUL.querySelector(".date-header").remove();
  }
}

async function getTodos() {
  const todosSnapshot = await db.collection("todos").get();
  return todosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Initial load of todo list
updateTodoList();
