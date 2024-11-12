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

      // Check if date section already exists
      let dateSection = document.querySelector(`[data-date="${today}"]`);
      if (!dateSection) {
        // Create a new date section if it doesn't exist
        dateSection = createDateSection(today);
        todoListUL.prepend(dateSection);
      }
      // Add new todo item to the top of the date section
      const todoItem = createTodoItem(todoObject);
      dateSection.querySelector("ul").prepend(todoItem);
      todoInput.value = "";
    } catch (error) {
      console.error("Error adding task:", error);
    }
  }
}

async function updateTodoList() {
  todoListUL.innerHTML = "";
  const todos = await getTodos();

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
  todoElement.remove();

  // Remove the date section if it's empty
  const dateSection = todoElement.closest(".date-section");
  if (dateSection && dateSection.querySelectorAll(".todo").length === 0) {
    dateSection.remove();
  }
}

async function getTodos() {
  const todosSnapshot = await db.collection("todos").get();
  return todosSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Initial load of todo list
updateTodoList();
