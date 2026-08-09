import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Button, Chip, Switch, Text, TextInput} from 'react-native-paper';
import BottomSheetModal from '../../components/ui/BottomSheetModal';
import {InvestmentAsset} from '../../Types';
import {generateUUID} from '../../utility/utility';
import {formatAsOfMonth} from '../../utility/investmentCalculations';
import {useAppTheme} from '../../theme/useAppTheme';
import {spacing, typography} from '../../theme/tokens';
import {isInvestmentAssetFormValid} from './editInvestmentValidation';

interface EditInvestmentAssetProps {
  open: boolean;
  asset: InvestmentAsset | null;
  onClose: () => void;
  onSave: (asset: InvestmentAsset) => void;
  onDelete?: (assetId: string) => void;
}

const EditInvestmentAsset: React.FC<EditInvestmentAssetProps> = ({
  open,
  asset,
  onClose,
  onSave,
  onDelete,
}) => {
  const theme = useAppTheme();
  const isAddMode = asset === null;

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [currentValue, setCurrentValue] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [useCustomReturn, setUseCustomReturn] = useState(false);
  const [annualReturnRate, setAnnualReturnRate] = useState('');

  useEffect(() => {
    if (open && asset) {
      setName(asset.name);
      setCurrency(asset.currency);
      setCurrentValue(asset.currentValue.toString());
      setMonthlyContribution(asset.monthlyContribution.toString());
      setUseCustomReturn(asset.annualReturnRate != null);
      setAnnualReturnRate(asset.annualReturnRate?.toString() ?? '');
    }
  }, [open, asset]);

  useEffect(() => {
    if (!open) {
      setName('');
      setCurrency('INR');
      setCurrentValue('');
      setMonthlyContribution('');
      setUseCustomReturn(false);
      setAnnualReturnRate('');
    }
  }, [open]);

  const currencySymbol = currency === 'USD' ? '$' : '₹';

  const parsedCurrentValue = parseFloat(currentValue);
  const parsedMonthlyContribution = parseFloat(monthlyContribution || '0');
  const parsedReturnRate = parseFloat(annualReturnRate);
  const formValid = isInvestmentAssetFormValid({
    name,
    currentValue,
    monthlyContribution,
    useCustomReturn,
    annualReturnRate,
  });

  const handleSave = () => {
    if (!formValid) return;

    const savedAsset: InvestmentAsset = {
      id: asset?.id ?? generateUUID(),
      name: name.trim(),
      currency,
      currentValue: parsedCurrentValue,
      monthlyContribution: parsedMonthlyContribution,
      ...(asset?.asOfDate != null ? {asOfDate: asset.asOfDate} : {}),
      ...(useCustomReturn ? {annualReturnRate: parsedReturnRate} : {}),
    };

    onSave(savedAsset);
    onClose();
  };

  const handleDelete = () => {
    if (!asset || !onDelete) return;
    onDelete(asset.id);
    onClose();
  };

  return (
    <BottomSheetModal
      visible={open}
      onDismiss={onClose}
      title={isAddMode ? 'Add Investment' : 'Edit Investment'}
      primaryLabel={isAddMode ? 'Add' : 'Save'}
      onPrimary={handleSave}
      primaryDisabled={!formValid}
      contentStyle={styles.content}
    >
      <TextInput
        label="Name"
        value={name}
        onChangeText={setName}
        mode="outlined"
        style={styles.input}
      />

      <Text style={[styles.fieldLabel, {color: theme.colors.onSurface}]}>Currency</Text>
      <View style={styles.chipRow}>
        <Chip
          selected={currency === 'INR'}
          onPress={() => setCurrency('INR')}
          style={styles.chip}
        >
          INR
        </Chip>
        <Chip
          selected={currency === 'USD'}
          onPress={() => setCurrency('USD')}
          style={styles.chip}
        >
          USD
        </Chip>
      </View>

      <TextInput
        label="Current value"
        value={currentValue}
        onChangeText={setCurrentValue}
        keyboardType="numeric"
        mode="outlined"
        left={<TextInput.Affix text={currencySymbol} />}
        style={styles.input}
      />
      {!isAddMode && asset?.asOfDate ? (
        <Text
          variant="bodySmall"
          style={{color: theme.colors.custom.textSecondary, marginBottom: spacing.md, marginTop: -spacing.sm}}
        >
          Balance as of {formatAsOfMonth(asset.asOfDate)}. Updating value or SIP resets this date.
        </Text>
      ) : null}

      <TextInput
        label="Monthly SIP / PF contribution"
        value={monthlyContribution}
        onChangeText={setMonthlyContribution}
        keyboardType="numeric"
        mode="outlined"
        left={<TextInput.Affix text={currencySymbol} />}
        style={styles.input}
      />
      <Text
        variant="bodySmall"
        style={{color: theme.colors.custom.textSecondary, marginBottom: spacing.md}}
      >
        Amount you invest every month
      </Text>

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text style={[styles.switchLabel, {color: theme.colors.onSurface}]}>
            Use a custom return rate
          </Text>
          <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>
            Off uses the Expected Return slider on the calculator
          </Text>
        </View>
        <Switch value={useCustomReturn} onValueChange={setUseCustomReturn} />
      </View>

      {useCustomReturn ? (
        <TextInput
          label="Annual return rate"
          value={annualReturnRate}
          onChangeText={setAnnualReturnRate}
          keyboardType="numeric"
          mode="outlined"
          right={<TextInput.Affix text="%" />}
          style={styles.input}
        />
      ) : null}

      {!isAddMode ? (
        <Button
          mode="text"
          textColor={theme.colors.error}
          onPress={handleDelete}
          style={styles.deleteBtn}
        >
          Delete Investment
        </Button>
      ) : null}
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.sm,
  },
  input: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    marginBottom: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  switchText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchLabel: {
    ...typography.rowTitle,
    marginBottom: spacing.xs,
  },
  deleteBtn: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});

export default EditInvestmentAsset;
