import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { getLocalDateKey } from '@/features/assignments/domain/todayVisits';

export function useLocalVisitDate(): string {
  const [today, setToday] = useState(getLocalDateKey);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(() => setToday(getLocalDateKey()), nextMidnight.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [today]);

  useEffect(() => {
    let previous = AppState.currentState;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active' && previous !== 'active') setToday(getLocalDateKey());
      previous = next;
    });
    return () => subscription.remove();
  }, []);

  return today;
}
