import { useState, useEffect } from 'react';
import { formatTime, formatFullDate } from '../utils/dates';

export function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    time: formatTime(now),
    date: formatFullDate(now),
    now,
  };
}
