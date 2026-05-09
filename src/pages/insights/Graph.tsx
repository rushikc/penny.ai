import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, Surface, IconButton, useTheme} from 'react-native-paper';
import {LineChart, PieChart} from 'react-native-gifted-charts';
import {CHART_COLORS} from '../../utility/constants';

interface LineDataPoint {
  date: string;
  [key: string]: string | number;
}

interface PieDataPoint {
  name: string;
  value: number;
}

interface LineGraphProps {
  data: LineDataPoint[];
  lineKeys: string[];
  title?: string;
}

interface PieGraphProps {
  data: PieDataPoint[];
  title?: string;
  onSelectionToggle?: () => void;
}

const screenWidth = Dimensions.get('window').width;

export const LineGraph: React.FC<LineGraphProps> = ({data, lineKeys, title = 'Spending Trends'}) => {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Surface style={[styles.chartContainer, {backgroundColor: theme.colors.surface}]} elevation={2}>
        <Text style={{color: theme.colors.outline, textAlign: 'center', padding: 40}}>No data available</Text>
      </Surface>
    );
  }

  const lineData = data.map(point => ({
    value: Number(point[lineKeys[0]] || 0),
    label: point.date,
    dataPointText: '',
  }));

  return (
    <Surface style={[styles.chartContainer, {backgroundColor: theme.colors.surface}]} elevation={2}>
      <Text variant="titleSmall" style={[styles.chartTitle, {color: theme.colors.onSurface}]}>{title}</Text>
      <LineChart
        data={lineData}
        width={screenWidth - 80}
        height={200}
        color={theme.colors.primary}
        thickness={2}
        dataPointsColor={theme.colors.primary}
        startFillColor={theme.colors.primary}
        startOpacity={0.2}
        endOpacity={0}
        areaChart
        curved
        yAxisTextStyle={{color: theme.colors.onSurfaceVariant, fontSize: 10}}
        xAxisLabelTextStyle={{color: theme.colors.onSurfaceVariant, fontSize: 8, width: 40}}
        hideRules={false}
        rulesColor={theme.colors.outlineVariant}
        yAxisColor={theme.colors.outlineVariant}
        xAxisColor={theme.colors.outlineVariant}
        noOfSections={4}
        maxValue={Math.max(...lineData.map(d => d.value)) * 1.2 || 100}
        spacing={Math.max(40, (screenWidth - 100) / Math.max(lineData.length - 1, 1))}
        isAnimated
      />
    </Surface>
  );
};

export const PieGraph: React.FC<PieGraphProps> = ({data, title = 'Distribution', onSelectionToggle}) => {
  const theme = useTheme();

  if (data.length === 0) {
    return (
      <Surface style={[styles.chartContainer, {backgroundColor: theme.colors.surface}]} elevation={2}>
        <Text style={{color: theme.colors.outline, textAlign: 'center', padding: 40}}>No data available</Text>
      </Surface>
    );
  }

  const pieData = data.map((item, index) => ({
    value: item.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
    text: `₹${Math.round(item.value)}`,
    textColor: theme.colors.onSurface,
    textSize: 10,
  }));

  return (
    <Surface style={[styles.chartContainer, {backgroundColor: theme.colors.surface}]} elevation={2}>
      <View style={styles.chartHeader}>
        <Text variant="titleSmall" style={{color: theme.colors.onSurface}}>{title}</Text>
        {onSelectionToggle && <IconButton icon="tune" size={20} onPress={onSelectionToggle} />}
      </View>
      <View style={styles.pieWrapper}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={55}
          innerCircleColor={theme.colors.surface}
          showText
          textColor={theme.colors.onSurface}
          textSize={9}
        />
      </View>
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: CHART_COLORS[index % CHART_COLORS.length]}]} />
            <Text variant="labelSmall" numberOfLines={1} style={{color: theme.colors.onSurfaceVariant, flex: 1}}>
              {item.name.substring(0, 20)}
            </Text>
          </View>
        ))}
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  chartContainer: {marginHorizontal: 12, marginVertical: 8, borderRadius: 12, padding: 16, overflow: 'hidden'},
  chartTitle: {marginBottom: 12},
  chartHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  pieWrapper: {alignItems: 'center', paddingVertical: 16},
  legend: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%'},
  legendDot: {width: 10, height: 10, borderRadius: 5},
});
