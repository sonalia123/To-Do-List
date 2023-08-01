import React, { useState, useRef, useEffect } from 'react';
import { TodoForm } from './TodoForm';
import { v4 as uuidv4 } from 'uuid';
import { Todo } from './Todo';
import moment from 'moment';

const ALARM_SOUND_URL = '/audioSound.mp3';

export const TodoWrapper = () => {
  const [todos, setTodos] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [alarmTriggered, setAlarmTriggered] = useState(false);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef(null);
  const alarmIntervalRef = useRef(null);
  const alarmDateTime = useRef(null);
  

  useEffect(() => {
    console.log('Fetching todos from localStorage...');
    const todosFromLocalStorage = JSON.parse(localStorage.getItem('todos'));
    if (todosFromLocalStorage) {
      setTodos(todosFromLocalStorage);
    }

    const darkModePreference = JSON.parse(localStorage.getItem('darkMode'));
    if (darkModePreference !== null) {
      setDarkMode(darkModePreference);
    }

    const alarmDataFromLocalStorage = JSON.parse(localStorage.getItem('alarmData'));
    if (alarmDataFromLocalStorage) {
      const { alarmDateTime: storedAlarmDateTime, alarmTriggered: storedAlarmTriggered, isAlarmPlaying: storedIsAlarmPlaying } = alarmDataFromLocalStorage;
      alarmDateTime.current = storedAlarmDateTime;
      setAlarmTriggered(storedAlarmTriggered);
      setIsAlarmPlaying(storedIsAlarmPlaying);
    }
  }, []);

  useEffect(() => {
    console.log('Saving todos to localStorage...');
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('alarmData', JSON.stringify({ alarmDateTime: alarmDateTime.current, alarmTriggered, isAlarmPlaying }));
  }, [alarmTriggered, isAlarmPlaying]);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  const saveToLocalStorage = (todos) => {
    localStorage.setItem('todos', JSON.stringify(todos));
  };

  const addTodo = (todo, time, date) => {
    setTodos((prevTodos) => [
      ...prevTodos,
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
    console.log('New todo added:', {
      task: todo,
      time: time,
      date: date,
    });
    saveToLocalStorage([...todos, { task: todo, time: time, date: date }]);
  };

  const handleAlarmEnded = () => {
    console.log('Alarm ended');
    setAlarmTriggered(false);
    setIsAlarmPlaying(false);
  };

  const handleStopAlarm = () => {
    console.log('Stopping alarm');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmTriggered(false);
    setIsAlarmPlaying(false);
  };

  const handleSnooze = () => {
    console.log('Snoozing alarm');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmPlaying(false);
    setAlarmTriggered(false);

    setTimeout(() => {
      const audio = new Audio(ALARM_SOUND_URL);
      audio.addEventListener('ended', handleAlarmEnded);
      audioRef.current = audio;
      audio
        .play()
        .then(() => {
          console.log('Snooze audio played successfully');
          setAlarmTriggered(true);
          setIsAlarmPlaying(true);
        })
        .catch((error) => {
          console.error('Error playing snooze audio:', error);
          setAlarmTriggered(false);
          setIsAlarmPlaying(false);
        });
    }, 60 * 1000);
  };

  const toggleComplete = (id) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );
  };

  const deleteTodo = (id) => {
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
    saveToLocalStorage(todos.filter((todo) => todo.id !== id));
  };

  const editTodo = (id, editedTask, editedDate, editedTime, alarmTime) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime } : todo
      )
    );

    let updatedAlarmDateTime = null;
    if (alarmTime && alarmTime !== '') {
      updatedAlarmDateTime = moment(`${editedDate} ${editedTime}`, 'YYYY-MM-DD HH:mm');
      const timeRemaining = updatedAlarmDateTime.diff(moment(), 'milliseconds');

      if (alarmIntervalRef.current) {
        clearInterval(alarmIntervalRef.current);
      }

      if (updatedAlarmDateTime.isValid() && timeRemaining > 0) {
        setAlarmTriggered(false);
        setIsAlarmPlaying(false);

        alarmIntervalRef.current = setInterval(() => {
          const currentTime = moment();
          const timeRemaining = updatedAlarmDateTime.diff(currentTime, 'milliseconds');

          if (timeRemaining <= 0 && !alarmTriggered) {
            const audio = new Audio(ALARM_SOUND_URL);
            audio.addEventListener('ended', handleAlarmEnded);
            audioRef.current = audio;
            audio
              .play()
              .then(() => {
                console.log('Audio played successfully');
                setAlarmTriggered(true);
                setIsAlarmPlaying(true);
                clearInterval(alarmIntervalRef.current);
              })
              .catch((error) => {
                console.error('Error playing audio:', error);
                setAlarmTriggered(false);
                setIsAlarmPlaying(false);
              });
          }
        }, 1000);
      }
    } else {
      setAlarmTriggered(false);
      setIsAlarmPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    alarmDateTime.current = updatedAlarmDateTime;
    saveToLocalStorage(
      todos.map((todo) =>
        todo.id === id ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime } : todo
      )
    );

    saveAlarmDataToLocalStorage(updatedAlarmDateTime, alarmTriggered, isAlarmPlaying);
  };

  const saveAlarmDataToLocalStorage = (alarmDateTime, alarmTriggered, isAlarmPlaying) => {
    localStorage.setItem(
      'alarmData',
      JSON.stringify({
        alarmDateTime,
        alarmTriggered,
        isAlarmPlaying,
      })
    );
  };

  console.log('Rendering TodoWrapper component...');

  return (
    <div className={`TodoWrapper ${darkMode ? 'dark-mode' : ''}`}>
      <div className="menu-bar">
        <h1>My To-Do List</h1>
        <button className="dark-mode-button" onClick={toggleDarkMode}>
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
      <TodoForm addTodo={addTodo} />
      {todos.map((todo) => (
        <Todo
          task={todo}
          key={todo.id}
          toggleComplete={toggleComplete}
          deleteTodo={deleteTodo}
          editTodo={editTodo}
          alarmTriggered={alarmTriggered}
        />
      ))}
      {isAlarmPlaying && (
        <div className="alarm-buttons">
          <button className="Todo-btn" onClick={handleStopAlarm}>
            Stop Alarm
          </button>
          {alarmTriggered && (
            <button className="Todo-btn" onClick={handleSnooze}>
              Snooze for 1 min
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoWrapper;
