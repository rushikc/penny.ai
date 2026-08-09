import React, {useEffect, useState} from 'react';
import {View, StyleSheet, ActivityIndicator, Switch} from 'react-native';
import {Button, IconButton, Surface, Text, TextInput, useTheme} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {BankConfig} from '../../Types';
import {validateCreditCardDigits} from './bankCardValidation';

const Configuration: React.FC = () => {
  const theme = useTheme();
  const [bankConfig, setBankConfig] = useState<BankConfig>({enableUpi: false, creditCards: []});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [newCardDigits, setNewCardDigits] = useState('');
  const [cardError, setCardError] = useState('');

  useEffect(() => {
    ExpenseAPI.getBankConfig().then(config => { setBankConfig(config); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const handleUpiToggle = async () => {
    setIsSaving(true);
    const updated = {...bankConfig, enableUpi: !bankConfig.enableUpi};
    const success = await ExpenseAPI.updateBankConfig(updated);
    if (success) setBankConfig(updated);
    setIsSaving(false);
  };

  const handleSaveCard = async () => {
    const validation = validateCreditCardDigits(newCardDigits, bankConfig.creditCards);
    if (!validation.ok) { setCardError(validation.error); return; }
    setIsSaving(true);
    const updated = {...bankConfig, creditCards: [...bankConfig.creditCards, newCardDigits]};
    const success = await ExpenseAPI.updateBankConfig(updated);
    if (success) { setBankConfig(updated); setCardDialogOpen(false); }
    else setCardError('Failed to add card');
    setIsSaving(false);
  };

  const handleRemoveCard = async (digits: string) => {
    setIsSaving(true);
    const updated = {...bankConfig, creditCards: bankConfig.creditCards.filter(c => c !== digits)};
    const success = await ExpenseAPI.updateBankConfig(updated);
    if (success) setBankConfig(updated);
    setIsSaving(false);
  };

  if (isLoading) return <ActivityIndicator size="large" style={{flex: 1, justifyContent: 'center'}} />;

  return (
    <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <Text variant="titleMedium" style={{marginBottom: 12}}>Bank Account Settings</Text>
        <View style={styles.switchRow}>
          <Text variant="bodyLarge">Enable HDFC UPI</Text>
          <Switch value={bankConfig.enableUpi} onValueChange={handleUpiToggle} disabled={isSaving} />
        </View>
      </Surface>

      <Surface style={[styles.section, {backgroundColor: theme.colors.surface}]} elevation={1}>
        <View style={styles.sectionHeader}>
          <Text variant="titleMedium">Credit Cards</Text>
          <Button mode="contained" compact onPress={() => { setCardDialogOpen(true); setNewCardDigits(''); setCardError(''); }}>
            Add Card
          </Button>
        </View>
        {bankConfig.creditCards.length === 0 ? (
          <Text variant="bodyMedium" style={{color: theme.colors.outline, marginTop: 12}}>No credit cards added yet</Text>
        ) : (
          bankConfig.creditCards.map((digits, i) => (
            <View key={i} style={[styles.cardItem, {borderBottomColor: theme.colors.outlineVariant}]}>
              <MaterialCommunityIcons name="credit-card" size={20} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{flex: 1, marginLeft: 12}}>HDFC ****{digits}</Text>
              <IconButton icon="minus-circle-outline" iconColor={theme.colors.error} size={20}
                onPress={() => handleRemoveCard(digits)} disabled={isSaving} />
            </View>
          ))
        )}
      </Surface>

      <BottomSheetModal
        visible={cardDialogOpen}
        onDismiss={() => setCardDialogOpen(false)}
        title="Add Credit Card"
        primaryLabel="Save"
        onPrimary={handleSaveCard}
        scrollable={false}
      >
        <Text variant="bodyMedium" style={{marginBottom: 12}}>Enter the last 4 digits of your HDFC credit card.</Text>
        <TextInput label="Last 4 Digits" value={newCardDigits} mode="outlined" keyboardType="numeric" maxLength={4}
          onChangeText={(text) => { setNewCardDigits(text.replace(/\D/g, '').slice(0, 4)); setCardError(''); }}
          error={!!cardError} />
        {cardError ? <Text variant="bodySmall" style={{color: theme.colors.error, marginTop: 4}}>{cardError}</Text> : null}
      </BottomSheetModal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, padding: 16},
  section: {padding: 16, borderRadius: 12, marginBottom: 16},
  switchRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  sectionHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  cardItem: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1},
});

export default Configuration;
