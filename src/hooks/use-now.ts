import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

/**
 * The current time, re-read at the next hour boundary and whenever the app
 * returns to the foreground.
 *
 * Everything Home derives from the clock changes on an hour boundary - the
 * greeting at 12:00 and 18:00, the date at midnight - so an hourly tick keeps
 * it correct without a per-second timer.
 */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const nextHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() + 1,
    );
    const timer = setTimeout(() => setNow(new Date()), nextHour.getTime() - now.getTime());
    return () => clearTimeout(timer);
  }, [now]);

  useEffect(() => {
    let previousState: AppStateStatus | null = AppState.currentState;
    const subscription = AppState.addEventListener('change', (nextState) => {
      const becameActive = nextState === 'active' && previousState !== 'active';
      previousState = nextState;
      if (becameActive) setNow(new Date());
    });
    return () => subscription.remove();
  }, []);

  return now;
}
