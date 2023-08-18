import React, { useState } from 'react';

// TodoForm component displays a form for adding tasks
export const TodoForm = ({ addTodo, showTasks, handleViewTasks, toggleDarkMode, darkMode }) => {
  // State to track the input values
  const [value, setValue] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      // Call the addTodo function from the parent component to add the new task
      addTodo(value, time, date);
      setValue('');
      setTime('');
      setDate('');
    }
  };

  // Render the TodoForm component
  return (
    <form className="TodoForm" onSubmit={handleSubmit}>
      {/* Input for task description */}
      <input
        type="text"
        className="todo-input"
        value={value}
        placeholder="Add the task"
        onChange={(e) => setValue(e.target.value)}
      />

      {/* Input for task date */}
      <input
        type="date"
        className="todo-date"
        value={date}
        placeholder="Enter Date"
        onChange={(e) => setDate(e.target.value)}
      />

      {/* Input for task time */}
      <input
        type="time"
        className="todo-time"
        value={time}
        placeholder="Enter Time"
        onChange={(e) => setTime(e.target.value)}
      />

      {/* Button to add a new task */}
      <button type="submit" className="Todo-btn-add">
        Add Task
      </button>

      {/* Button to toggle displaying tasks */}
      <button className="Todo-btn" onClick={handleViewTasks}>
        {showTasks ? 'Hide Tasks' : 'View Tasks'}
      </button>

      {/* Button to toggle dark mode */}
      <button className="dark-mode-button" onClick={toggleDarkMode}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </form>
  );
};
