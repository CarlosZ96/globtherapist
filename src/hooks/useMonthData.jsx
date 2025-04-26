import { useState, useEffect } from 'react';
import {
  startOfMonth,
  getDaysInMonth,
  getDay,
  addMonths,
  format,
} from 'date-fns';
import { es } from 'date-fns/locale';

const useMonthData = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [days, setDays] = useState([]);
  const [monthName, setMonthName] = useState('');
  const [monthNumber, setMonthNumber] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    const firstDayOfMonth = startOfMonth(currentDate);
    const daysInMonth = getDaysInMonth(currentDate);
    const startDay = getDay(firstDayOfMonth);

    const emptyDays = Array.from({ length: daysInMonth }, (_, index) => ({
      date: index + 1,
      active: false,
    }));

    const adjustedStartDay = (startDay + 6) % 7;

    const paddedDays = Array(adjustedStartDay).fill(null).concat(emptyDays);

    setDays(paddedDays);
    const formattedMonthName = format(currentDate, 'MMMM yyyy', { locale: es });
    setMonthName(formattedMonthName.toLowerCase());
    setMonthNumber(currentDate.getMonth());
    const now = new Date();
    const offset = currentDate.getMonth() - now.getMonth()
      + 12 * (currentDate.getFullYear() - now.getFullYear());
    setMonthOffset(offset);
  }, [currentDate]);

  const changeMonth = (offset) => {
    setCurrentDate((prevDate) => addMonths(prevDate, offset));
  };

  return {
    days,
    monthName,
    monthNumber,
    monthOffset,
    changeMonth,
  };
};

export default useMonthData;
