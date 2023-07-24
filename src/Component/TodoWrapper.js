import React, { useState, useRef } from "react";
import { TodoForm } from "./TodoForm";
import { v4 as uuidv4 } from "uuid";
import { Todo } from "./Todo";
import moment from "moment";

const ALARM_SOUND_URL = "/audioSound.mp3";

export const TodoWrapper = () => {
  const [todos, setTodos] = useState([]);
  const [alarmTriggered, setAlarmTriggered] = useState(false); 
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef(null);
  const alarmIntervalRef = useRef(null);

  const addTodo = (todo, time, date) => {
    setTodos([
      ...todos,
      {
        id: uuidv4(),
        task: todo,
        completed: false,
        isEditing: false,
        date: date ? date : moment().format('YYYY-MM-DD'),
        time: time ? time : moment().format('HH:mm'),
        alarmTime: null,
      },
    ]);
  
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
    }
  
    const formattedDate = date ? moment(date).format("YYYY-MM-DD") : moment().format("YYYY-MM-DD");
    const formattedTime = time ? moment(time, "HH:mm").format("HH:mm") : moment().format("HH:mm");
    const alarmDateTime = moment(`${formattedDate} ${formattedTime}`, "YYYY-MM-DD HH:mm");
    const timeRemaining = alarmDateTime.diff(moment(), "milliseconds");
  
    if (alarmDateTime.isValid() && timeRemaining > 0) {
      setAlarmTriggered(false);
      setIsAlarmPlaying(false);
  
      alarmIntervalRef.current = setInterval(() => {
        const currentTime = moment();
        const timeRemaining = alarmDateTime.diff(currentTime, "milliseconds");
  
        if (timeRemaining <= 0 && !alarmTriggered) {
          const audio = new Audio(ALARM_SOUND_URL);
          audio.addEventListener("ended", handleAlarmEnded);
          audioRef.current = audio;
          audio.play();
          setAlarmTriggered(true);
          setIsAlarmPlaying(true);
  
          clearInterval(alarmIntervalRef.current);
        }
      }, 1000);
    }
  };
  

  const handleAlarmEnded = () => {
    setAlarmTriggered(false);
  };

  const handleStopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmTriggered(false);
    setIsAlarmPlaying(false);
  };

  const handleSnooze = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmPlaying(false);
    setAlarmTriggered(false);

    setTimeout(() => {
      const audio = new Audio(ALARM_SOUND_URL);
      audio.addEventListener("ended", handleAlarmEnded);
      audioRef.current = audio;
      audio.play();
      setAlarmTriggered(true);
      setIsAlarmPlaying(true);
    }, 60000);
  };

  const toggleComplete = (id) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const editTodo = (id, editedTask, editedDate, editedTime, alarmTime) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id
          ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime }
          : todo
      )
    );
  };

  return (
    <div className="TodoWrapper">
      <h1>My To-Do List</h1>
      <TodoForm addTodo={addTodo} />
      {todos.map((todo) => (
        <Todo
          task={todo}
          key={todo.id}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          editTodo={editTodo}
        />
      ))}
      {isAlarmPlaying && (
        <div className="alarm-buttons">
          <button className="Todo-btn" onClick={handleStopAlarm}>Stop Alarm</button>
          <button className="Todo-btn" onClick={handleSnooze}>Snooze for 1 min</button>
        </div>
      )}
    </div>
  );
};

export default TodoWrapper;
