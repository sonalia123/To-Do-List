import React, { useState, useEffect } from 'react';
import EmailShare from './EmailShare';

export const Todo = ({ task, toggleComplete, deleteTodo, editTodo, alarmTriggered }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTaskData, setEditedTaskData] = useState({
    task: '',
    date: '',
    time: '',
  });
  const [alarmTime, setAlarmTime] = useState('');

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

  const handleToggleEditing = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedTaskData({
        task: task.task,
        date: task.date,
        time: task.time,
      });
    }
  };

  const handleEditDate = (e) => {
    setEditedTaskData({
      ...editedTaskData,
      date: e.target.value,
    });
  };

  const handleEditTime = (e) => {
    setEditedTaskData({
      ...editedTaskData,
      time: e.target.value,
    });
  };

  const handleSave = () => {
    editTodo(
      task.id,
      editedTaskData.task,
      editedTaskData.date,
      editedTaskData.time,
      alarmTime
    );
    setIsEditing(false);
  };

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
      ) : (
        <>
          <p onClick={() => toggleComplete(task.id)} className={`${task.completed ? 'completed' : ''}`}>
            {task.task}
          </p>
          <p>Date: {task.date}</p>
          <p>Time: {task.time}</p>
          {alarmTime && <p>Alarm: {alarmTime.toLocaleString()}</p>}
          <div>
            <button onClick={handleToggleEditing}>Edit</button>
            <button onClick={() => deleteTodo(task.id)}>Delete</button>
            <EmailShare task={task} />
          </div>
        </>
      )}
    </div>
  );
};
