// header.js
const header = document.createElement('header');
header.classList.add('header');
header.innerHTML = `
<nav class="flex justify-content">
    <p>Today's To Do</p>
    <i class="fa fa-retweet"></i>
</nav>
`;

export default header;

// footer.js
const footer = document.createElement('footer');
footer.classList.add('footer');
footer.innerHTML = `
<button type="button" class="button" data-action="deleteCompleted">Clear all completed<button>
`;

export default footer;

// drag.js
import reorderTasks from './sort.js';
import { getTasksArray, setTasksArray, displayTaskArray } from './tasks.js';

export const reRenderTask = (tasks, taskContainerEl) => {
  while (taskContainerEl.firstChild) {
    taskContainerEl.removeChild(taskContainerEl.firstChild);
  }
  displayTaskArray(tasks, taskContainerEl);
};

const dragAndDropHandler = () => {
  let taskDragged;
  document.addEventListener('dragstart', (event) => {
    if (event.target.dataset.action === 'drag') {
      taskDragged = event.target;
      taskDragged.classList.add('dragstart');
    }
  }, false);

  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  }, false);

  document.addEventListener('drop', (event) => {
    event.preventDefault();
    taskDragged.classList.remove('dragstart');
    if (event.target.dataset.action === 'drag') {
      let tasksArray = getTasksArray();
      tasksArray = reorderTasks(tasksArray, taskDragged.id, event.target.id);
      const taskContainer = document.querySelector('ul.taskContainer');
      reRenderTask(tasksArray, taskContainer);
      setTasksArray(tasksArray);
    }
  }, false);
};

export default dragAndDropHandler;

// app.js
// eslint-disable-next-line no-unused-vars
import _ from 'lodash';
import './style.css';
import header from './header.js';
import form from './input.js';
import footer from './footer.js';
import updateStatus from './updateStatus.js';
import dragAndDropHandler, { reRenderTask } from './drag.js';
import {
  getTasksArray, displayTaskArray, deleteCompletedTasks, setTasksArray, Task,
} from './tasks.js';
import { editTask, deleteTask } from './addAndRemove.js';

const startApp = () => {
  const taskContainer = document.createElement('ul');
  taskContainer.classList.add('taskContainer');
  displayTaskArray(getTasksArray(), taskContainer);

  const displayPage = () => {
    const mainContainer = document.querySelector('#content');
    mainContainer.append(header, form, taskContainer, footer);
  };

  displayPage();
  dragAndDropHandler();

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const description = document.querySelector('.input').value;
    const newTask = Task({ description });
    const currentTasksArray = getTasksArray();
    const newTasks = currentTasksArray.concat(newTask);
    setTasksArray(newTasks);
    reRenderTask(newTasks, taskContainer);
    form.reset();
  });

  document.addEventListener('click', (event) => {
    if (!event.target.dataset.action) {
      return;
    }

    const { taskId } = event.target.dataset;

    if (event.target.dataset.action === 'uncheck') {
      const taskDescription = event.target.parentElement.querySelector('.task-description');
      const taskCheck = event.target.parentElement.querySelector('.check-box');
      const checkIcon = event.target.parentElement.querySelector('.checkIcon');
      updateStatus(taskId, taskDescription, checkIcon, taskCheck);
    }

    if (event.target.dataset.action === 'delete') {
      deleteTask(taskId, getTasksArray());
    }

    if (event.target.dataset.action === 'edit') {
      const taskDescription = event.target.parentElement.querySelector('.task-description');
      const editIcon = event.target.parentElement.querySelector('.editIcon');
      const deleteIcon = event.target.parentElement.querySelector('.deleteIcon');
      editTask(taskDescription, editIcon, deleteIcon, getTasksArray(), taskId);
    }

    if (event.target.dataset.action === 'deleteCompleted') {
      const uncompletedTasks = deleteCompletedTasks();
      reRenderTask(uncompletedTasks, taskContainer);
    }
  });
};

export default startApp;

// index.js
import startApp from './app.js';

startApp();

// input.js
const form = document.createElement('form');
form.classList.add('form');
form.innerHTML = `
    <input type="text" class="input" placeholder="Add to your list..."></input>
    `;

export default form;

// sort.js
const reorderTasks = (tasksArray, moveId, placedId) => {
    const moveElementIndex = tasksArray.findIndex((element) => element.id === moveId);
    const moveElement = tasksArray[moveElementIndex];
    let newTaskArray = [];
    tasksArray.forEach((element, index) => {
      if (element.id === placedId) {
        if (index < moveElementIndex) {
          newTaskArray = newTaskArray.concat([moveElement, element]);
          return;
        }
        newTaskArray = newTaskArray.concat([element, moveElement]);
        return;
      }
      if (element.id !== moveId) {
        newTaskArray = newTaskArray.concat([element]);
      }
    });
    return newTaskArray;
  };
  
  export default reorderTasks;
//   tasks.js
const generateId = () => (Math.random() + 1).toString(36).substring(7);

const generateIndex = () => {
  if (localStorage.getItem('tasksArray') === null) {
    return 0;
  }
  const storedTasksArray = JSON.parse(localStorage.getItem('tasksArray'));
  return storedTasksArray.length;
};

export const Task = (taskData) => {
  const {
    description, completedStatus = false, id = generateId(), index = generateIndex(),
  } = taskData;
  function changeCompletedStatus() {
    this.completedStatus = !this.completedStatus;
  }
  function setDescription(newDescription) {
    this.description = newDescription;
  }
  return {
    description, completedStatus, id, changeCompletedStatus, setDescription, index,
  };
};

const parseTasks = (tasks) => tasks.map(Task);

let tasksArray;

const createTaskElement = (task) => {
  const isCompleted = task.completedStatus;
  const taskElement = document.createElement('li');
  taskElement.id = `${task.id}`;
  taskElement.setAttribute('draggable', true);
  taskElement.setAttribute('data-action', 'drag');
  taskElement.classList.add('flex', 'tasklist', 'justify-content');
  taskElement.innerHTML = `
          <label class="flex task">
          <input type="checkbox" value='${isCompleted}' data-action="uncheck" class="check-box ${isCompleted ? 'none' : ''}" data-task-id="${task.id}">
          <i class="fa fa-check checkIcon ${isCompleted ? '' : 'none'}"></i>
          <p class="task-description ${isCompleted ? 'checked' : ''}">${task.description}</p>
          </label>
          <div data-action='edit' data-task-id="${task.id}" class="'${isCompleted}' edit-container">
          <i class="fa fa-ellipsis-v editIcon icon ${isCompleted ? 'none' : ''}" data-task-id="${task.id}"></i>
          <i class="fa fa-trash deleteIcon ${isCompleted ? '' : 'none'}" data-action="delete" data-task-id="${task.id}"></i>
         </div>
          `;
  return taskElement;
};

const displayTask = (task, taskContainerEl) => {
  const newTaskElement = createTaskElement(task);
  taskContainerEl.appendChild(newTaskElement);
};

export const displayTaskArray = (tasks, taskContainerEl) => {
  tasks.forEach((task) => {
    displayTask(task, taskContainerEl);
  });
};

export const getTasksArray = () => {
  if (localStorage.getItem('tasksArray') === null) {
    tasksArray = [];
  } else {
    tasksArray = JSON.parse(localStorage.getItem('tasksArray'));
    tasksArray = parseTasks(tasksArray);
  }
  return tasksArray;
};

export const setTasksArray = (newTasksArray) => {
  localStorage.setItem('tasksArray', JSON.stringify(newTasksArray));
};

export const deleteCompletedTasks = () => {
  tasksArray = getTasksArray();
  tasksArray = tasksArray.filter((task) => task.completedStatus !== true);
  setTasksArray(tasksArray);
  return tasksArray;
};

// updateStatus.js
import { getTasksArray, setTasksArray } from './tasks.js';

const updateStatus = (id, taskDescription, checkIcon, taskCheck) => {
  let currentTask;
  const tasksArray = getTasksArray();
  const newTasksArray = tasksArray.map((task) => {
    if (task.id === id) {
      task.changeCompletedStatus();
      currentTask = task;
    }
    return task;
  });
  setTasksArray(newTasksArray);
  if (currentTask.completedStatus) {
    taskDescription.classList.add('checked');
    taskCheck.classList.add('none');
    checkIcon.classList.remove('none');
  } else {
    taskDescription.classList.remove('checked');
    taskCheck.classList.remove('none');
    checkIcon.classList.add('none');
  }
};

export default updateStatus;


