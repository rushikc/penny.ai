import React, {useEffect, useState} from 'react';
import {useSelector} from 'react-redux';
import {Snackbar} from 'react-native-paper';
import {RootState} from '../store/store';
import {removeAlert} from '../store/alertActions';

const ALERT_COLORS: Record<string, string> = {
  success: '#4caf50',
  error: '#f44336',
  warning: '#ff9800',
  info: '#2196f3',
};

const AlertComponent: React.FC = () => {
  const alerts = useSelector((state: RootState) => state.expense.alerts);
  const [visible, setVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<{id: string; type: string; message: string} | null>(null);

  useEffect(() => {
    if (alerts.length > 0 && !visible) {
      setCurrentAlert(alerts[alerts.length - 1]);
      setVisible(true);
    }
  }, [alerts, visible]);

  const onDismiss = () => {
    setVisible(false);
    if (currentAlert) {
      removeAlert(currentAlert.id);
    }
    setCurrentAlert(null);
  };

  if (!currentAlert) return null;

  return (
    <Snackbar
      visible={visible}
      onDismiss={onDismiss}
      duration={3000}
      style={{backgroundColor: ALERT_COLORS[currentAlert.type] || ALERT_COLORS.info}}
      action={{label: 'OK', onPress: onDismiss, textColor: 'white'}}
    >
      {currentAlert.message}
    </Snackbar>
  );
};

export default AlertComponent;
