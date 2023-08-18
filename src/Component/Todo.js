import React, { useState, useEffect } from 'react';
import EmailShare from './EmailShare';

// Todo component displays and manages a single task
export const Todo = ({ task, toggleComplete, deleteTodo, editTodo, alarmTriggered }) => {
  
  // State to track whether the task is being edited
  const [isEditing, setIsEditing] = useState(false);
  
  // State to hold edited task data
  const [editedTaskData, setEditedTaskData] = useState({
    task: '',
    date: '',
    time: '',
  });

   // State to hold the alarm time
  const [alarmTime, setAlarmTime] = useState('');

  // Effect to update state when task prop changes
  useEffect(() => {
    if (task.alarmTime) {
      setAlarmTime(new Date(task.alarmTime));
    }
    setEditedTaskData({
      task: task.task,
      date: task.date,
      time: task.time,
    });
  }, [task]);

  // Toggle editing mode
  const handleToggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {

      // Restore original task data when canceling edit
      setEditedTaskData({
        task: task.task,
        date: task.date,
        time: task.time,
      });
    }
  };

  // Handle editing the date
  const handleEditDate = (e) => {
    setEditedTaskData({
      ...editedTaskData,
      date: e.target.value,
    });
  };

  // Handle editing the time
  const handleEditTime = (e) => {
    setEditedTaskData({
      ...editedTaskData,
      time: e.target.value,
    });
  };

  // Handle saving the edited task
  const handleSave = () => {

    // Call the editTodo function from the parent component
    editTodo(
      task.id,
      editedTaskData.task,
      editedTaskData.date,
      editedTaskData.time,
      alarmTime
    );
    setIsEditing(false); // Exit editing mode
  };

  // Handle setting an alarm for the task
  const handleSetAlarm = () => {
    const selectedDateTime = new Date(`${editedTaskData.date}T${editedTaskData.time}`);
    const now = new Date();
    if (selectedDateTime > now) {
      setAlarmTime(selectedDateTime);
      alert(`Alarm set for ${editedTaskData.date} at ${editedTaskData.time}`);
    } else {
      alert('Invalid alarm time. Please choose a future date and time.');
    }
  };

   // Render the Todo component
  return (
    <div className="Todo">
      {isEditing ? (
        <>
          <input
            type="text"
            value={editedTaskData.task}
            onChange={(e) => setEditedTaskData({ ...editedTaskData, task: e.target.value })}
          />
          <input type="date" value={editedTaskData.date} onChange={handleEditDate} />
          <input type="time" value={editedTaskData.time} onChange={handleEditTime} />
          <button onClick={handleSetAlarm}>Set Alarm</button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleToggleEditing}>Cancel</button>
        </>
      ) : ( // Render task details when not in edit mode
        <>
          <p onClick={() => toggleComplete(task.id)} className={`${task.completed ? 'completed' : ''}`}>
            {task.task}
          </p>
          <p>Date: {task.date}</p>
          <p>Time: {task.time}</p>
          {alarmTime && <p>Alarm: {alarmTime.toLocaleString()}</p>}
          <div className="Todo-buttons-container">
            <button className="Todo-button" onClick={handleToggleEditing}>Edit</button>
            <button className="Todo-button" onClick={() => deleteTodo(task.id)}>Delete</button>
            <EmailShare className="Todo-button" task={task} />
          </div>
        </>
      )}
    </div>
  );
};
