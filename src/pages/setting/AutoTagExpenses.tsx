import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ScrollView} from 'react-native';
import {Banner, Button, Surface, Text, useTheme} from 'react-native-paper';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {getUnixTimestamp} from '../../utility/utility';

const AutoTagExpenses: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => { setSuccess(false); setProcessedCount(0); }, 3500);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleAutoTagAll = async () => {
    setLoading(true);
    try {
      const count = await ExpenseAPI.autoTagPastExpenses(getUnixTimestamp('2020-01-01'));
      setProcessedCount(count);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to auto-tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoTagRecent = async () => {
    setLoading(true);
    try {
      const count = await ExpenseAPI.autoTagPastExpenses(Date.now() - 90 * 24 * 60 * 60 * 1000);
      setProcessedCount(count);
      setSuccess(true);
    } catch (error) {
      console.error('Failed to auto-tag recent:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Banner visible={true} icon="information" style={{marginBottom: 16}}>
        This feature automatically assigns tags to expenses based on vendor-tag mappings from 'Manage Vendor Tags'.
      </Banner>

      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 8}}>Auto-tag Recent (90 days)</Text>
        <Button mode="contained" onPress={handleAutoTagRecent} disabled={loading} loading={loading}>
          Auto-tag Recent
        </Button>
      </Surface>

      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 8}}>Auto-tag All Past Expenses</Text>
        <Text variant="bodySmall" style={{color: theme.colors.onSurfaceVariant, marginBottom: 12}}>
          Goes through all expenses and applies tags based on vendor mappings.
        </Text>
        <Button mode="contained" buttonColor={theme.colors.error} onPress={handleAutoTagAll} disabled={loading} loading={loading}>
          Auto-tag All
        </Button>
      </Surface>

      {success && (
        <Surface style={[styles.successCard, {backgroundColor: '#e8f5e9'}]} elevation={1}>
          <Text variant="bodyMedium" style={{color: '#2e7d32'}}>
            Auto-tagging successful! {processedCount} expenses were updated.
          </Text>
        </Surface>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  section: {padding: 16, borderRadius: 12, marginBottom: 16},
  successCard: {padding: 16, borderRadius: 12, marginTop: 8},
});

export default AutoTagExpenses;
