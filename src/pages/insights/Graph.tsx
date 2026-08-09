import React from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import {Text, IconButton} from 'react-native-paper';
import {LineChart, PieChart} from 'react-native-gifted-charts';
import Card from '../../components/ui/Card';
import {useAppTheme} from '../../theme/useAppTheme';
import {dataPalette, typography} from '../../theme/tokens';

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
  const theme = useAppTheme();

  if (data.length === 0) {
    return (
      <Card style={styles.chartContainer}>
        <Text style={{color: theme.colors.custom.textSecondary, textAlign: 'center', padding: 40}}>No data available</Text>
      </Card>
    );
  }

  const lineData = data.map(point => ({
    value: Number(point[lineKeys[0]] || 0),
    label: point.date,
    dataPointText: '',
  }));

  return (
    <Card style={styles.chartContainer}>
      <Text style={[styles.chartTitle, {color: theme.colors.onSurface}]}>{title}</Text>
      <LineChart
        data={lineData}
        width={screenWidth - 80}
        height={200}
        color={theme.colors.primary}
        thickness={2.5}
        dataPointsColor={theme.colors.primary}
        dataPointsRadius={3}
        startFillColor={theme.colors.primary}
        startOpacity={0.18}
        endOpacity={0}
        areaChart
        curved
        curvature={0.2}
        backgroundColor="transparent"
        yAxisTextStyle={{color: theme.colors.custom.textSecondary, fontSize: 10}}
        xAxisLabelTextStyle={{color: theme.colors.custom.textSecondary, fontSize: 8, width: 40}}
        hideRules={false}
        rulesType="dashed"
        rulesColor={theme.colors.custom.chartGrid}
        rulesThickness={1}
        yAxisColor="transparent"
        xAxisColor={theme.colors.custom.chartGrid}
        yAxisThickness={0}
        noOfSections={4}
        maxValue={Math.max(...lineData.map(d => d.value)) * 1.2 || 100}
        spacing={Math.max(40, (screenWidth - 100) / Math.max(lineData.length - 1, 1))}
        isAnimated
      />
    </Card>
  );
};

export const PieGraph: React.FC<PieGraphProps> = ({data, title = 'Distribution', onSelectionToggle}) => {
  const theme = useAppTheme();

  if (data.length === 0) {
    return (
      <Card style={styles.chartContainer}>
        <Text style={{color: theme.colors.custom.textSecondary, textAlign: 'center', padding: 40}}>No data available</Text>
      </Card>
    );
  }

  const pieData = data.map((item, index) => ({
    value: item.value,
    color: dataPalette[index % dataPalette.length],
    text: `₹${Math.round(item.value)}`,
    textColor: theme.colors.onSurface,
    textSize: 10,
  }));

  return (
    <Card style={styles.chartContainer}>
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, {color: theme.colors.onSurface}]}>{title}</Text>
        {onSelectionToggle && <IconButton icon="tune" size={20} onPress={onSelectionToggle} />}
      </View>
      <View style={styles.pieWrapper}>
        <PieChart
          data={pieData}
          donut
          radius={80}
          innerRadius={55}
          innerCircleColor={theme.colors.custom.card}
          showText
          textColor={theme.colors.onSurface}
          textSize={9}
        />
      </View>
      <View style={styles.legend}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: dataPalette[index % dataPalette.length]}]} />
            <Text variant="labelSmall" numberOfLines={1} style={{color: theme.colors.custom.textSecondary, flex: 1}}>
              {item.name.substring(0, 20)}
            </Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  chartContainer: {marginHorizontal: 12, marginVertical: 8, overflow: 'hidden'},
  chartTitle: {...typography.cardTitle, marginBottom: 12},
  chartHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  pieWrapper: {alignItems: 'center', paddingVertical: 16},
  legend: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8},
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 4, width: '45%'},
  legendDot: {width: 10, height: 10, borderRadius: 5},
});
