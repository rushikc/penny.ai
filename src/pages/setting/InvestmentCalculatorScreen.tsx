import React, {useEffect, useMemo, useState} from 'react';
import {ScrollView, StyleSheet, View} from 'react-native';
import Slider from '@react-native-community/slider';
import {ActivityIndicator, Text} from 'react-native-paper';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {useAppTheme} from '../../theme/useAppTheme';
import Card from '../../components/ui/Card';
import {radius, spacing, typography} from '../../theme/tokens';
import {
  calculateInvestmentProjections,
  fetchInvestmentData,
  InvestmentAsset,
  InvestmentProjection,
} from '../../utility/investmentCalculations';

const DEFAULT_USD_TO_INR = 95.18;
const DEFAULT_YEARS = 5;
const DEFAULT_RETURN_RATE = 12;

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

type SliderControlProps = {
  label: string;
  helperText?: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  valueLabel: string;
  onValueChange: (value: number) => void;
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
}) => {
  const theme = useAppTheme();

  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHeader}>
        <Text variant="titleSmall" style={{color: theme.colors.onSurface, fontWeight: '600'}}>
          {label}
        </Text>
        <Text variant="titleMedium" style={{color: theme.colors.primary, fontWeight: '700'}}>
          {valueLabel}
        </Text>
      </View>
      {helperText ? (
        <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary, marginBottom: spacing.sm}}>
          {helperText}
        </Text>
      ) : null}
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onValueChange}
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
};

const ProjectionRow: React.FC<ProjectionRowProps> = ({projection}) => {
  const theme = useAppTheme();
  const isUsd = projection.currency === 'USD';

  return (
    <View style={[styles.projectionRow, {borderBottomColor: theme.colors.custom.border}]}>
      <View style={styles.projectionLeft}>
        <Text variant="bodyLarge" style={{color: theme.colors.onSurface, fontWeight: '600'}}>
          {projection.name}
        </Text>
        <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary, marginTop: 2}}>
          {isUsd
            ? `${formatUsd(projection.currentValue)} today · ${projection.appliedReturnRate}% return`
            : `${formatInr(projection.currentValue)} today · ${projection.appliedReturnRate}% return`}
        </Text>
      </View>
      <View style={styles.projectionRight}>
        <Text variant="bodyLarge" style={{color: theme.colors.onSurface, fontWeight: '700', textAlign: 'right'}}>
          {isUsd ? formatUsd(projection.futureValue) : formatInr(projection.futureValue)}
        </Text>
        {isUsd ? (
          <Text variant="bodySmall" style={{color: theme.colors.custom.textSecondary, textAlign: 'right', marginTop: 2}}>
            {formatInr(projection.futureValueInr)}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const InvestmentCalculatorScreen: React.FC = () => {
  const theme = useAppTheme();
  const [assets, setAssets] = useState<InvestmentAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYears, setSelectedYears] = useState(DEFAULT_YEARS);
  const [assumedReturnRate, setAssumedReturnRate] = useState(DEFAULT_RETURN_RATE);
  const [usdToInrRate] = useState(DEFAULT_USD_TO_INR);

  useEffect(() => {
    let isMounted = true;

    const loadInvestmentData = async () => {
      try {
        const data = await fetchInvestmentData();
        if (isMounted) {
          setAssets(data);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadInvestmentData();

    return () => {
      isMounted = false;
    };
  }, []);

  const {projections, totalInr} = useMemo(
    () => calculateInvestmentProjections(assets, selectedYears, assumedReturnRate, usdToInrRate),
    [assets, selectedYears, assumedReturnRate, usdToInrRate],
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, {backgroundColor: theme.colors.background}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.controlsCard}>
        <SliderControl
          label="Time Horizon"
          value={selectedYears}
          minimumValue={1}
          maximumValue={10}
          step={1}
          valueLabel={`${selectedYears} ${selectedYears === 1 ? 'year' : 'years'}`}
          onValueChange={value => setSelectedYears(Math.round(value))}
        />

        <View style={[styles.sectionDivider, {backgroundColor: theme.colors.custom.border}]} />

        <SliderControl
          label="Expected Return"
          helperText="Temporarily overrides the default market return for Mutual Funds and US Stocks projections."
          value={assumedReturnRate}
          minimumValue={5}
          maximumValue={20}
          step={0.5}
          valueLabel={`${assumedReturnRate % 1 === 0 ? assumedReturnRate : assumedReturnRate.toFixed(1)}%`}
          onValueChange={value => setAssumedReturnRate(Math.round(value * 2) / 2)}
        />
      </Card>

      <Card noPadding style={styles.tableCard}>
        <View style={styles.tableHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color={theme.colors.primary} />
          <Text variant="titleSmall" style={{color: theme.colors.onSurface, fontWeight: '700', marginLeft: spacing.sm}}>
            Projected Growth
          </Text>
        </View>

        {projections.map(projection => (
          <ProjectionRow key={projection.id} projection={projection} />
        ))}

        <View style={[styles.totalRow, {backgroundColor: theme.colors.surfaceVariant}]}>
          <Text variant="titleMedium" style={{color: theme.colors.onSurface, fontWeight: '700'}}>
            Total Amount (INR)
          </Text>
          <Text style={[styles.totalAmount, {color: theme.colors.primary}]}>
            {formatInr(totalInr)}
          </Text>
        </View>
      </Card>

      <Text variant="bodySmall" style={[styles.disclaimer, {color: theme.colors.custom.textSecondary}]}>
        Projections use compound growth formulas and assume contributions continue for the selected horizon.
        EPF uses a fixed {projections.find(item => item.id === 'epf')?.appliedReturnRate ?? 8.25}% annual rate.
        US Stocks values are converted at 1 USD = ₹{usdToInrRate.toFixed(2)}.
      </Text>
    </ScrollView>
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
  sliderBounds: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.xs,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  tableCard: {
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
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
  projectionRight: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomLeftRadius: radius.card,
    borderBottomRightRadius: radius.card,
  },
  totalAmount: {
    ...typography.amount,
    fontSize: 22,
  },
  disclaimer: {
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});

export default InvestmentCalculatorScreen;
