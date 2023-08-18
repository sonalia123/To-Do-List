import React, { useState, useRef, useEffect, useCallback } from 'react';
import { TodoForm } from './TodoForm';
import { v4 as uuidv4 } from 'uuid';
import { Todo } from './Todo';
import moment from 'moment';

//Audio file for the alarm sound
const ALARM_SOUND_URL = '/audioSound.mp3';

export const TodoWrapper = () => {
  //State variavles
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

  // Load todos and dark mode preference from local storage on component mount
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode((prevDarkMode) => !prevDarkMode);
  };

  // Save todos to local storage whenever 'todos' state changes
  useEffect(() => {
    console.log('Saving todos to localStorage...');
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Save todos to local storage
  const saveToLocalStorage = (todos) => {
    localStorage.setItem('todos', JSON.stringify(todos));
  };

  // Add a new todo
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
    // Save the new todo to local storage
    saveToLocalStorage([...todos, { task: todo, time: time, date: date }]);
  };

  // Handle alarm ended event
  const handleAlarmEnded = (id) => {
    // Handle alarm and snooze states
    console.log(`Alarm for task ${id} ended`);
    if (isAlarmPlaying && alarmTriggered === id) {
      handleStopAlarm();
    }
    if (snoozeActive && snoozeTimeout.id === id) {
      setSnoozeActive(false);
    }
  };
  
  //Handle stoping the alarm
  const handleStopAlarm = () => {
    // Pause the alarm audio and reset states
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

  // Handle snoozing the alarm
const handleSnooze = (id) => {
  // Pause the alarm audio and set snooze timeout
  console.log(`Snoozing alarm for task ${id}`);
  if (audioRef.current) {
    audioRef.current.removeEventListener('ended', handleAlarmEnded);
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  setIsAlarmPlaying(false);

  if (snoozeTimeout) {
    clearTimeout(snoozeTimeout.timeout);
  }

  const snoozeTaskItem = todos.find((todo) => todo.id === id);
  const snoozeTaskName = snoozeTaskItem ? snoozeTaskItem.task : '';

  const newSnoozeTimeout = setTimeout(async () => {
    try {
      const audio = new Audio(ALARM_SOUND_URL);
      audioRef.current = audio;
      audio.addEventListener('ended', () => handleAlarmEnded(id));

      await audio.play();
      console.log('Snooze audio played successfully');

      setIsAlarmPlaying(true);
      recalculateClosestTask([...todos, { id: id, task: snoozeTaskName, date: '', time: '' }]);
    } catch (error) {
      console.error('Error playing snooze audio:', error);
      setIsAlarmPlaying(false);
    }
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


  // Recalculate the closest task with remaining time 
  const recalculateClosestTask = useCallback(() => {
    // Calculate the closest task based on the time remaining
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
  
    // Set the closest task based on calcuations
    if (snoozeTimeout && snoozeActive) {
      closestTaskName = snoozeTimeout.taskName;
      closestTaskTimeRemaining = `Snooze for 1 min`;
    } else if (closestTimeRemaining === Infinity) {
      closestTaskName = '';
      closestTaskTimeRemaining = '';
    }
  
    setClosestTask(closestTaskName !== '' ? `${closestTaskName}: ${closestTaskTimeRemaining}` : '');
  }, [todos, snoozeTimeout, snoozeActive]);
  
 // Recalculate closest task on interval and on state changes
  useEffect(() => {
    // Calculate the closest task remaining time
    console.log('Calculating closest task remaining time...');
    recalculateClosestTask([...todos]);

    // Set interval to recalculate closest task every second
    const intervalId = setInterval(() => {
      recalculateClosestTask([...todos]);
    }, 1000);

    // Clear interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [todos, snoozeTimeout, snoozeActive, recalculateClosestTask]);

  // Toggle the completion status of a task
  const toggleComplete = (id) => {
    // Toggle the completion status of the task with the specified id 
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

    // Save the updated todos to local storage
    saveToLocalStorage(todos.filter((todo) => todo.id !== id));
  };

  // Delete a task
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

    // Remove the task with the specified id from the list of todos
    setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));

    recalculateClosestTask(todos.filter((todo) => todo.id !== id));

    // Save the updated todos to local storage
    saveToLocalStorage(todos.filter((todo) => todo.id !== id));
  };

  // Edit a task
  const editTodo = (id, editedTask, editedDate, editedTime, alarmTime) => {
    // Update the task with the edited values
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime } : todo
      )
    );

    // Calculate the updated alarm date and tim
    let updatedAlarmDateTime = null;
    if (alarmTime && alarmTime !== '') {
      updatedAlarmDateTime = moment(`${editedDate} ${editedTime}`, 'YYYY-MM-DD HH:mm');
      const timeRemaining = updatedAlarmDateTime.diff(moment(), 'milliseconds');

      // Clear any existing alarm intervals
      clearInterval(alarmIntervalsMap.current.get(id));

      // Set a new alarm interval if necessary
      if (updatedAlarmDateTime.isValid() && timeRemaining > 0) {
        alarmIntervalsMap.current.set(
          id,
          setInterval(() => {
            const currentTime = moment();
            const timeRemaining = updatedAlarmDateTime.diff(currentTime, 'milliseconds');

            if (timeRemaining <= 0 && !isAlarmPlaying) {
              // Play the alarm sound when the time is up
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
      // Clear the alarm interval and stop playing the alarm sound
      clearInterval(alarmIntervalsMap.current.get(id));
      setIsAlarmPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    // Update the alarm date and time in the map
    alarmDateTimeMap.current.set(id, updatedAlarmDateTime);
    
    // Save the updated todos to local storage
    saveToLocalStorage(
      todos.map((todo) =>
        todo.id === id ? { ...todo, task: editedTask, date: editedDate, time: editedTime, alarmTime } : todo
      )
    );
  };

  // Handle the view tasks toggle
  const handleViewTasks = () => {
    setShowTasks(!showTasks);
  };

// Render the TodoWrapper component  
  console.log('Rendering TodoWrapper component...');

  return (
    <div className={`TodoWrapper ${darkMode ? 'dark-mode' : ''}`}>
      <div className="header">
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
