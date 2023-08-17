import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TodoForm } from './TodoForm';
import { v4 as uuidv4 } from 'uuid';
import { Todo } from './Todo';
import moment from 'moment';

const ALARM_SOUND_URL = '/audioSound.mp3';

export const TodoWrapper = () => {
  const [todos, setTodos] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [closestTask, setClosestTask] = useState('');
  const [alarmTriggered, setAlarmTriggered] = useState(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const audioRef = useRef(null);
  const alarmIntervalsMap = useRef(new Map());
  const alarmDateTimeMap = useRef(new Map());
  const [snoozeActive, setSnoozeActive] = useState(false);
  const [snoozeTimeout, setSnoozeTimeout] = useState(null);
  const [showTasks, setShowTasks] = useState(false);


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
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  useEffect(() => {
    console.log('Saving todos to localStorage...');
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

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

  const handleAlarmEnded = (id) => {
    console.log(`Alarm for task ${id} ended`);
    if (isAlarmPlaying && alarmTriggered === id) {
      handleStopAlarm();
    }
    if (snoozeActive && snoozeTimeout.id === id) {
      setSnoozeActive(false);
    }
  };
  
  const handleStopAlarm = () => {
    console.log('Stopping alarm');
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAlarmTriggered(null);
    setIsAlarmPlaying(false);
    if (snoozeActive) {
      setSnoozeActive(false);
    }
  };

  const handleSnooze = (id) => {
    console.log(`Snoozing alarm for task ${id}`);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsAlarmPlaying(false);
  
    if (snoozeTimeout) {
      clearTimeout(snoozeTimeout.timeout);
    }
  
    const snoozeTaskItem = todos.find((todo) => todo.id === id);
    const snoozeTaskName = snoozeTaskItem ? snoozeTaskItem.task : '';
  
    const newSnoozeTimeout = setTimeout(() => {
      const audio = new Audio(ALARM_SOUND_URL);
      audio.addEventListener('ended', () => handleAlarmEnded(id));
      audioRef.current = audio;
      audio
        .play()
        .then(() => {
          console.log('Snooze audio played successfully');
          setIsAlarmPlaying(true);
          recalculateClosestTask([...todos, { id: id, task: snoozeTaskName, date: '', time: '' }]);
        })
        .catch((error) => {
          console.error('Error playing snooze audio:', error);
          setIsAlarmPlaying(false);
        });
    }, 60000); 
  
    setSnoozeTimeout({
      id: id,
      timeout: newSnoozeTimeout,
      endTime: moment().add(1, 'minute'),
      timeRemaining: 60000,
      taskName: snoozeTaskName,
    });
  
    setSnoozeActive(true);
    setClosestTask(`${snoozeTaskName}: Snooze for 1 min`);
  };
  
  
  
  const recalculateClosestTask = useCallback(() => {
    let closestTimeRemaining = Infinity;
    let closestTaskName = '';
    let closestTaskTimeRemaining = '';
  
    todos.forEach((todo) => {
      if (!todo.completed) {
        const currentTime = moment();
        const taskTime = moment(`${todo.date} ${todo.time}`, 'YYYY-MM-DD HH:mm');
        const timeRemaining = taskTime.diff(currentTime, 'milliseconds');
  
        if (timeRemaining > 0 && timeRemaining < closestTimeRemaining) {
          closestTimeRemaining = timeRemaining;
          closestTaskName = todo.task;
          closestTaskTimeRemaining = `${Math.floor(timeRemaining / 3600000)}h ${Math.floor(
            (timeRemaining % 3600000) / 60000
          )}m ${Math.floor((timeRemaining % 60000) / 1000)}s`;
        }
      }
    });
  
    if (snoozeTimeout && snoozeActive) {
      closestTaskName = snoozeTimeout.taskName;
      closestTaskTimeRemaining = `Snooze for 1 min`;
    } else if (closestTimeRemaining === Infinity) {
      closestTaskName = '';
      closestTaskTimeRemaining = '';
    }
  
    setClosestTask(closestTaskName !== '' ? `${closestTaskName}: ${closestTaskTimeRemaining}` : '');
  }, [todos, snoozeTimeout, snoozeActive]);
  

  useEffect(() => {
    console.log('Calculating closest task remaining time...');
    recalculateClosestTask([...todos]);

    const intervalId = setInterval(() => {
      recalculateClosestTask([...todos]);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [todos, snoozeTimeout, snoozeActive, recalculateClosestTask]);

  const toggleComplete = (id) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
    );

    if (isAlarmPlaying && alarmTriggered === id) {
      handleStopAlarm();
    }

    clearInterval(alarmIntervalsMap.current.get(id));
    alarmIntervalsMap.current.delete(id);
    alarmDateTimeMap.current.delete(id);

    if (snoozeTimeout && snoozeTimeout.id === id) {
      clearTimeout(snoozeTimeout.timeout);
      setSnoozeTimeout(null);
    }

    recalculateClosestTask(todos.filter((todo) => todo.id !== id));

    saveToLocalStorage(todos.filter((todo) => todo.id !== id));
  };

  const deleteTodo = (id) => {
    if (isAlarmPlaying && alarmTriggered === id) {
      handleStopAlarm();
    }

    clearInterval(alarmIntervalsMap.current.get(id));
    alarmIntervalsMap.current.delete(id);
    alarmDateTimeMap.current.delete(id);

    if (snoozeTimeout && alarmTriggered === id) {
      clearTimeout(snoozeTimeout.timeout);
    }

    if (snoozeTimeout && snoozeTimeout.id === id) {
      clearTimeout(snoozeTimeout.timeout);
      setSnoozeTimeout(null);
    }

    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));

    recalculateClosestTask(todos.filter((todo) => todo.id !== id));

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

      clearInterval(alarmIntervalsMap.current.get(id));

      if (updatedAlarmDateTime.isValid() && timeRemaining > 0) {
        alarmIntervalsMap.current.set(
          id,
          setInterval(() => {
            const currentTime = moment();
            const timeRemaining = updatedAlarmDateTime.diff(currentTime, 'milliseconds');

            if (timeRemaining <= 0 && !isAlarmPlaying) {
              const audio = new Audio(ALARM_SOUND_URL);
              audio.addEventListener('ended', () => handleAlarmEnded(id));
              audioRef.current = audio;
              audio
                .play()
                .then(() => {
                  console.log(`Audio for task ${id} played successfully`);
                  setAlarmTriggered(id);
                  setIsAlarmPlaying(true);
                  clearInterval(alarmIntervalsMap.current.get(id));
                })
                .catch((error) => {
                  console.error('Error playing audio:', error);
                  setAlarmTriggered(null);
                  setIsAlarmPlaying(false);
                });
            }
          }, 1000)
        );
      }
    } else {
      clearInterval(alarmIntervalsMap.current.get(id));
      setIsAlarmPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    alarmDateTimeMap.current.set(id, updatedAlarmDateTime);
    saveToLocalStorage(
      todos.map((todo) =>
        todo.id === id ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime } : todo
      )
    );
  };

  const handleViewTasks = () => {
    setShowTasks(!showTasks);
  };

  console.log('Rendering TodoWrapper component...');

  return (
    <div className={`TodoWrapper ${darkMode ? 'dark-mode' : ''}`}>
      <div className="menu-bar">
        <h1>My To-Do List</h1>
        {closestTask && (
        <p className="remaining-time">
          {closestTask}
          </p>
        )}
      </div>
      <TodoForm
        addTodo={addTodo}
        showTasks={showTasks}
        handleViewTasks={handleViewTasks}
        toggleDarkMode={toggleDarkMode}
        darkMode={darkMode}
      />
      {showTasks &&
        todos.map((todo) => (
          <Todo
            task={todo}
            key={todo.id}
            toggleComplete={toggleComplete}
            deleteTodo={deleteTodo}
            editTodo={editTodo}
            alarmTriggered={alarmTriggered}
            handleSnooze={() => handleSnooze(todo.id)} // Pass handleSnooze function to Todo component
          />
        ))}
      {showTasks && isAlarmPlaying && (
        <div className="alarm-buttons">
          <button className="Todo-btn" onClick={handleStopAlarm}>
            Stop Alarm
          </button>
          {alarmTriggered && (
            <button className="Todo-btn" onClick={() => handleSnooze(alarmTriggered)}>
              Snooze for 1 min
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TodoWrapper;
