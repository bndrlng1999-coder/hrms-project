import { useCallback, useRef, useState } from 'react';

export const useSingleFlight = () => {
  const inFlightRef = useRef(false);
  const [loading, setLoading] = useState(false);

  const run = useCallback(async (task) => {
    if (inFlightRef.current) return null;
    inFlightRef.current = true;
    setLoading(true);
    try {
      return await task();
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  return { loading, run };
};
