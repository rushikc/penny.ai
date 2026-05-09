import React, {useState} from 'react';
import {View, StyleSheet, ScrollView, ActivityIndicator} from 'react-native';
import {Button, Surface, Text, useTheme} from 'react-native-paper';
import dayjs from 'dayjs';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {FinanceStorage} from '../../api/FinanceStorage';
import {getUnixTimestamp} from '../../utility/utility';
import {createTimedAlert} from '../../store/alertActions';

const ReloadData: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);

  const handleReloadAll = async () => {
    setLoading(true);
    try {
      await ExpenseAPI.getExpenseList(getUnixTimestamp('2020-01-01'));
      createTimedAlert({type: 'success', message: 'All expenses reloaded successfully.'});
    } catch {
      createTimedAlert({type: 'error', message: 'Failed to reload expenses.'});
    } finally {
      setLoading(false);
    }
  };

  const handleReloadRecent = async () => {
    setLoading(true);
    try {
      await ExpenseAPI.getExpenseList(getUnixTimestamp(dayjs().subtract(30, 'day').toDate()));
      await FinanceStorage.clearStorageData();
      createTimedAlert({type: 'success', message: 'Recent expenses reloaded successfully.'});
    } catch {
      createTimedAlert({type: 'error', message: 'Failed to reload expenses.'});
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    setLoading(true);
    try {
      await FinanceStorage.clearStorageData();
      createTimedAlert({type: 'success', message: 'Cache cleared successfully.'});
    } catch {
      createTimedAlert({type: 'error', message: 'Clearing cache failed.'});
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 8}}>Reload Recent Expenses</Text>
        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 12}}>
          Reload expenses from the last 30 days.
        </Text>
        <Button mode="contained" onPress={handleReloadRecent} disabled={loading} loading={loading}>
          Reload Recent
        </Button>
      </Surface>

      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 8}}>Reload All Expenses</Text>
        <Text variant="bodySmall" style={{color: theme.colors.error, marginBottom: 12}}>
          Caution: This may increase Firebase billing due to large reads.
        </Text>
        <Button mode="contained" buttonColor={theme.colors.error} onPress={handleReloadAll} disabled={loading} loading={loading}>
          Reload All
        </Button>
      </Surface>

      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 8}}>Clear Local Cache</Text>
        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 12}}>
          Erases all locally cached data. Forces reload from Firebase on next use.
        </Text>
        <Button mode="contained" buttonColor="#ff9800" onPress={handleClearCache} disabled={loading} loading={loading}>
          Clear Cache
        </Button>
      </Surface>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  section: {padding: 16, borderRadius: 12, marginBottom: 16},
});

export default ReloadData;
