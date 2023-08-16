import React, { useState } from 'react';

export const TodoForm = ({ addTodo, showTasks, handleViewTasks, toggleDarkMode, darkMode }) => {
  const [value, setValue] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value) {
      addTodo(value, time, date);
      setValue('');
      setTime('');
      setDate('');
    }
  };

  return (
    <form className="TodoForm" onSubmit={handleSubmit}>
      <input
        type="text"
        className="todo-input"
        value={value}
        placeholder="Add the task"
        onChange={(e) => setValue(e.target.value)}
      />
      <input
        type="date"
        className="todo-date"
        value={date}
        placeholder="Enter Date"
        onChange={(e) => setDate(e.target.value)}
      />
      <input
        type="time"
        className="todo-time"
        value={time}
        placeholder="Enter Time"
        onChange={(e) => setTime(e.target.value)}
      />
      <button type="submit" className="Todo-btn-add">
        Add Task
      </button>
      <button className="Todo-btn" onClick={handleViewTasks}>
        {showTasks ? 'Hide Tasks' : 'View Tasks'}
      </button>
      <button className="dark-mode-button" onClick={toggleDarkMode}>
        {darkMode ? 'Light Mode' : 'Dark Mode'}
      </button>
    </form>
  );
};
