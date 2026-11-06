// Catch manual clock/time-zone changes as well as waking a suspended tab.
import { useEffect, useState } from "react";
import { localDateKey, millisecondsUntilNextDay } from "./calendar";

export function useDeviceDate(): string {
  const [today, setToday] = useState(() => localDateKey(new Date()));

  useEffect(() => {
    let midnightTimer: ReturnType<typeof setTimeout>;
    const syncDate = () => {
      const now = new Date();
      setToday(localDateKey(now));
      clearTimeout(midnightTimer);
      midnightTimer = setTimeout(syncDate, millisecondsUntilNextDay(now) + 100);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") syncDate();
    };

    syncDate();
    const clockCheck = setInterval(syncDate, 60_000);
    window.addEventListener("focus", syncDate);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearTimeout(midnightTimer);
      clearInterval(clockCheck);
      window.removeEventListener("focus", syncDate);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return today;
}
