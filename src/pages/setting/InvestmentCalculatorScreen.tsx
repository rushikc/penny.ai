import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Pressable, ScrollView, StyleSheet, View} from 'react-native';
import Slider from '@react-native-community/slider';
import {ActivityIndicator, Switch, Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {ExpenseAPI} from '../../api/ExpenseAPI';
import {useAppTheme} from '../../theme/useAppTheme';
import Card from '../../components/ui/Card';
import {radius, spacing, typography} from '../../theme/tokens';
import {InvestmentAsset, InvestmentConfig} from '../../Types';
import {
  calculateInvestmentProjections,
  formatAsOfMonth,
  formatHorizonLabel,
  InvestmentProjection,
} from '../../utility/investmentCalculations';
import {FxRate, getUsdToInrRate} from '../../utility/exchangeRate';
import {createTimedAlert} from '../../store/alertActions';
import EditInvestmentAsset from './EditInvestmentAsset';
import {buildSavedInvestmentAsset} from './investmentAssetSave';

const formatInr = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const formatUsd = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatFxAge = (fetchedAt: number) => {
  const minutes = Math.max(0, Math.floor((Date.now() - fetchedAt) / 60000));
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 min ago';
  return `${minutes} min ago`;
};

type SliderControlProps = {
  label: string;
  helperText?: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  valueLabel: string;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
};

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  helperText,
  value,
  minimumValue,
  maximumValue,
  step,
  valueLabel,
  onValueChange,
  onSlidingComplete,
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHeader}>
        <Text style={[styles.sliderLabel, {color: theme.colors.onSurface}]}>
          {label}
        </Text>
        <Text style={[styles.sliderValue, {color: theme.colors.primary}]}>
          {valueLabel}
        </Text>
      </View>
      {helperText ? (
        <Text
          variant="bodySmall"
          style={{color: theme.colors.custom.textSecondary, marginBottom: spacing.sm}}
        >
          {helperText}
        </Text>
      ) : null}
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onValueChange}
        onSlidingComplete={onSlidingComplete}
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={theme.colors.custom.border}
        thumbTintColor={theme.colors.primary}
      />
      <View style={styles.sliderBounds}>
        <Text variant="labelSmall" style={{color: theme.colors.custom.textSecondary}}>
          {minimumValue}
        </Text>
        <Text variant="labelSmall" style={{color: theme.colors.custom.textSecondary}}>
          {maximumValue}
        </Text>
      </View>
    </View>
  );
};

type ProjectionRowProps = {
  projection: InvestmentProjection;
  onPress: () => void;
};

const ProjectionRow: React.FC<ProjectionRowProps> = ({projection, onPress}) => {
  const theme = useAppTheme();
  const isUsd = projection.currency === 'USD';
  const savedValueLabel = isUsd
    ? formatUsd(projection.currentValue)
    : formatInr(projection.currentValue);
  const asOfLabel = formatAsOfMonth(projection.asOfDate);
  const contributionLabel =
    projection.monthlyContribution > 0
      ? ` · +${isUsd ? formatUsd(projection.monthlyContribution) : formatInr(projection.monthlyContribution)}/mo`
      : '';

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [
        styles.projectionRow,
        {borderBottomColor: theme.colors.custom.border},
        pressed && {opacity: 0.7},
      ]}
    >
      <View style={styles.projectionLeft}>
        <Text style={[styles.projectionName, {color: theme.colors.onSurface}]}>
          {projection.name}
        </Text>
        <Text
          variant="bodySmall"
          style={{color: theme.colors.custom.textSecondary, marginTop: 2}}
        >
          {`${savedValueLabel} as of ${asOfLabel}${contributionLabel} · ${projection.appliedReturnRate}% return`}
        </Text>
      </View>
      <View style={styles.projectionRight}>
        <Text style={[styles.projectionAmount, {color: theme.colors.onSurface}]}>
          {isUsd ? formatUsd(projection.futureValue) : formatInr(projection.futureValue)}
        </Text>
        {isUsd ? (
          <Text
            variant="bodySmall"
            style={{color: theme.colors.custom.textSecondary, textAlign: 'right', marginTop: 2}}
          >
            {formatInr(projection.futureValueInr)}
          </Text>
        ) : null}
        <MaterialCommunityIcons
          name="chevron-right"
          size={18}
          color={theme.colors.custom.textSecondary}
          style={styles.rowChevron}
        />
      </View>
    </Pressable>
  );
};

const InvestmentCalculatorScreen: React.FC = () => {
  const theme = useAppTheme();
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [includeSip, setIncludeSip] = useState(true);
  const [selectedYears, setSelectedYears] = useState(0);
  const [assumedReturnRate, setAssumedReturnRate] = useState(12);
  const [usdToInrRate, setUsdToInrRate] = useState(95.18);
  const [fxMeta, setFxMeta] = useState<FxRate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshingFx, setIsRefreshingFx] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<InvestmentAsset | null>(null);

  const persistConfig = useCallback(
    async (partial: Partial<InvestmentConfig>) => {
      const config: InvestmentConfig = {
        assets: partial.assets ?? assets,
        includeSip: partial.includeSip ?? includeSip,
        years: partial.years ?? selectedYears,
        assumedReturnRate: partial.assumedReturnRate ?? assumedReturnRate,
      };

      const success = await ExpenseAPI.updateInvestmentConfig(config);
      if (!success) {
        createTimedAlert({type: 'error', message: 'Failed to save investment settings.'});
      }
    },
    [assets, includeSip, selectedYears, assumedReturnRate],
  );

  const loadFxRate = useCallback(async (forceRefresh = false) => {
    setIsRefreshingFx(true);
    try {
      const fx = await getUsdToInrRate(forceRefresh);
      setUsdToInrRate(fx.rate);
      setFxMeta(fx);
    } finally {
      setIsRefreshingFx(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [config, fx] = await Promise.all([
          ExpenseAPI.getInvestmentConfig(),
          getUsdToInrRate(),
        ]);

        if (isMounted) {
          setAssets(config.assets);
          setIncludeSip(config.includeSip);
          setSelectedYears(0);
          setAssumedReturnRate(config.assumedReturnRate);
          setUsdToInrRate(fx.rate);
          setFxMeta(fx);

          if (config.years !== 0) {
            void ExpenseAPI.updateInvestmentConfig({...config, years: 0});
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const {projections, totalInr, totalInvestedInr, totalGainInr} = useMemo(
    () =>
      calculateInvestmentProjections(
        assets,
        selectedYears,
        assumedReturnRate,
        usdToInrRate,
        includeSip,
      ),
    [assets, selectedYears, assumedReturnRate, usdToInrRate, includeSip],
  );

  const handleIncludeSipToggle = async (value: boolean) => {
    setIncludeSip(value);
    await persistConfig({includeSip: value});
  };

  const handleYearsComplete = async (value: number) => {
    const years = Math.round(value);
    setSelectedYears(years);
    await persistConfig({years});
  };

  const handleReturnRateComplete = async (value: number) => {
    const rate = Math.round(value * 2) / 2;
    setAssumedReturnRate(rate);
    await persistConfig({assumedReturnRate: rate});
  };

  const openAddAsset = () => {
    setSelectedAsset(null);
    setEditOpen(true);
  };

  const openEditAsset = (asset: InvestmentAsset) => {
    setSelectedAsset(asset);
    setEditOpen(true);
  };

  const handleSaveAsset = async (asset: InvestmentAsset) => {
    const {nextAssets, isExisting} = buildSavedInvestmentAsset(asset, assets);

    setAssets(nextAssets);
    const success = await ExpenseAPI.updateInvestmentConfig({
      assets: nextAssets,
      includeSip,
      years: selectedYears,
      assumedReturnRate,
    });

    if (success) {
      createTimedAlert({
        type: 'success',
        message: isExisting ? 'Investment updated.' : 'Investment added.',
      });
    } else {
      createTimedAlert({type: 'error', message: 'Failed to save investment.'});
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    const nextAssets = assets.filter(item => item.id !== assetId);
    setAssets(nextAssets);
    const success = await ExpenseAPI.updateInvestmentConfig({
      assets: nextAssets,
      includeSip,
      years: selectedYears,
      assumedReturnRate,
    });

    if (success) {
      createTimedAlert({type: 'success', message: 'Investment deleted.'});
    } else {
      createTimedAlert({type: 'error', message: 'Failed to delete investment.'});
    }
  };

  const fxFootnote = fxMeta
    ? fxMeta.source === 'fallback'
      ? `1 USD = ₹${usdToInrRate.toFixed(2)} · using saved rate`
      : `1 USD = ₹${usdToInrRate.toFixed(2)} · updated ${formatFxAge(fxMeta.fetchedAt)}`
    : `1 USD = ₹${usdToInrRate.toFixed(2)}`;

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.colors.background}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={[styles.container, {backgroundColor: theme.colors.background}]}
        contentContainerStyle={styles.content}
      >
        <Card noPadding style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.primary} />
            <Text style={[styles.tableTitle, {color: theme.colors.onSurface}]}>
              Projected Growth
            </Text>
          </View>

          {projections.map(projection => (
            <ProjectionRow
              key={projection.id}
              projection={projection}
              onPress={() => openEditAsset(projection)}
            />
          ))}

          <Pressable
            onPress={openAddAsset}
            style={({pressed}) => [
              styles.addRow,
              {borderBottomColor: theme.colors.custom.border},
              pressed && {opacity: 0.7},
            ]}
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.addRowText, {color: theme.colors.primary}]}>
              Add investment
            </Text>
          </Pressable>

          <View style={[styles.totalRow, {backgroundColor: theme.colors.surfaceVariant}]}>
            <Text style={[styles.totalLabel, {color: theme.colors.onSurface}]}>
              Total Amount (INR)
            </Text>
            <Text
              style={[styles.totalAmount, {color: theme.colors.primary}]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {formatInr(totalInr)}
            </Text>
            <Text
              variant="bodySmall"
              style={{color: theme.colors.custom.textSecondary, marginTop: spacing.xs}}
              numberOfLines={2}
            >
              Invested {formatInr(totalInvestedInr)} · Gains {formatInr(totalGainInr)}
            </Text>
          </View>
        </Card>

        <Card style={styles.controlsCard}>
          <SliderControl
            label="Time Horizon"
            value={selectedYears}
            minimumValue={0}
            maximumValue={10}
            step={1}
            valueLabel={formatHorizonLabel(selectedYears)}
            onValueChange={value => setSelectedYears(Math.round(value))}
            onSlidingComplete={handleYearsComplete}
          />

          <View style={[styles.sectionDivider, {backgroundColor: theme.colors.custom.border}]} />

          <SliderControl
            label="Expected Return"
            helperText="Temporarily overrides the default market return for assets without a custom rate."
            value={assumedReturnRate}
            minimumValue={5}
            maximumValue={20}
            step={0.5}
            valueLabel={`${assumedReturnRate % 1 === 0 ? assumedReturnRate : assumedReturnRate.toFixed(1)}%`}
            onValueChange={value => setAssumedReturnRate(Math.round(value * 2) / 2)}
            onSlidingComplete={handleReturnRateComplete}
          />

          <View style={[styles.sectionDivider, {backgroundColor: theme.colors.custom.border}]} />

          <View style={styles.switchRow}>
            <View style={styles.switchText}>
              <Text style={[styles.switchLabel, {color: theme.colors.onSurface}]}>
                Include monthly SIP
              </Text>
              <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary}}>
                Off shows growth of your current balance only
              </Text>
            </View>
            <Switch value={includeSip} onValueChange={handleIncludeSipToggle} />
          </View>
        </Card>

        <Pressable onPress={() => void loadFxRate(true)} disabled={isRefreshingFx}>
          <Text
            variant="bodySmall"
            style={[styles.disclaimer, {color: theme.colors.custom.textSecondary}]}
          >
            Projections accrue SIP/PF on the 3rd of the following month since the last value or SIP edit.
            {includeSip
              ? ' Future monthly contributions are included when the horizon is greater than zero.'
              : ' Future monthly contributions are excluded when the horizon is greater than zero; past SIPs still accrue.'}
            {' '}
            {fxFootnote}
            {isRefreshingFx ? ' · refreshing…' : ' · tap to refresh rate'}
          </Text>
        </Pressable>
      </ScrollView>

      <EditInvestmentAsset
        open={editOpen}
        asset={selectedAsset}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveAsset}
        onDelete={handleDeleteAsset}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsCard: {
    marginBottom: spacing.lg,
  },
  sliderBlock: {
    paddingVertical: spacing.xs,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sliderLabel: {...typography.rowTitle},
  sliderValue: {...typography.amountRow, color: undefined},
  sliderBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  switchText: {
    flex: 1,
    paddingRight: spacing.md,
  },
  switchLabel: {...typography.rowTitle},
  tableCard: {
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  tableTitle: {...typography.cardTitle, marginLeft: spacing.sm},
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  projectionLeft: {
    flex: 1,
    paddingRight: spacing.md,
  },
  projectionName: {...typography.rowTitle},
  projectionRight: {
    alignItems: 'flex-end',
  },
  projectionAmount: {...typography.amountRow, textAlign: 'right'},
  rowChevron: {
    marginTop: spacing.xs,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addRowText: {...typography.rowTitle},
  totalRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  totalLabel: {...typography.cardTitle},
  totalAmount: {
    ...typography.amount,
    marginTop: spacing.xs,
  },
  disclaimer: {
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});

export default InvestmentCalculatorScreen;
