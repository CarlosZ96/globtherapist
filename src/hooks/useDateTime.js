import { useState } from 'react';

const useDateTime = (initialTime = 8, initialEndTime = 22) => {
  const [startTime, setStartTime] = useState(initialTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [selectedTime, setSelectedTime] = useState(7);

  const incrementTime = (setter, current, max) => {
    if (current < max) setter(current + 1);
  };

  const decrementTime = (setter, current, min) => {
    if (current > min) setter(current - 1);
  };

  const formatTime = (hour) => {
    const period = hour >= 12 ? 'pm' : 'am';
    const formattedHour = hour > 12 ? hour - 12 : hour;
    return `${formattedHour}:00${period}`;
  };

  const formatTimeRange = (hour) => {
    const start = `${hour > 12 ? hour - 12 : hour}:00${hour >= 12 ? 'pm' : 'am'}`;
    const end = `${hour > 12 ? hour - 12 : hour}:40${hour >= 12 ? 'pm' : 'am'}`;
    return `${start}-${end}`;
  };

  return {
    startTime,
    endTime,
    selectedTime,
    setStartTime,
    setEndTime,
    setSelectedTime,
    incrementTime,
    decrementTime,
    formatTime,
    formatTimeRange,
  };
};

export default useDateTime;
