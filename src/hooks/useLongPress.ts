import {useCallback, useRef, useState} from 'react';
import {GestureResponderEvent} from 'react-native';

type LongPressOptions = {
  delay?: number;
};

export function useLongPress(
  onLongPress: () => void,
  onClick?: () => void,
  {delay = 500}: LongPressOptions = {}
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handlePressIn = useCallback(() => {
    setLongPressTriggered(false);
    timeout.current = setTimeout(() => {
      onLongPress();
      setLongPressTriggered(true);
    }, delay);
  }, [onLongPress, delay]);

  const handlePressOut = useCallback(() => {
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    if (!longPressTriggered && onClick) {
      onClick();
    }
    setLongPressTriggered(false);
  }, [longPressTriggered, onClick]);

  return {
    onPressIn: handlePressIn,
    onPressOut: handlePressOut,
  };
}
