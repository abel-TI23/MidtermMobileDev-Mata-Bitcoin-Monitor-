/**
 * ResponsiveGrid Component
 * Adaptive grid layout that changes column count based on device size
 * 1 column on phones, 2 columns on tablets
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface ResponsiveGridProps {
  children: React.ReactNode;
  spacing?: number;
  style?: ViewStyle;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  spacing = 16,
  style 
}) => {
  const { columnCount } = useResponsive();
  
  // Convert children to array
  const childArray = React.Children.toArray(children);
  
  if (columnCount === 1) {
    // Phone portrait: 1 column
    return (
      <View style={[styles.container, style]}>
        {childArray.map((child, index) => (
          <View 
            key={`item-${index}`} 
            style={{ marginBottom: index < childArray.length - 1 ? spacing : 0 }}
          >
            {child}
          </View>
        ))}
      </View>
    );
  }
  
  // Multi-column layout (2-4 columns)
  const rows: React.ReactNode[][] = [];
  for (let i = 0; i < childArray.length; i += columnCount) {
    rows.push(childArray.slice(i, i + columnCount));
  }
  
  return (
    <View style={[styles.container, style]}>
      {rows.map((row, rowIndex) => (
        <View 
          key={`row-${rowIndex}`} 
          style={[styles.row, { marginBottom: spacing }]}
        >
          {row.map((child, colIndex) => (
            <View 
              key={`col-${rowIndex}-${colIndex}`}
              style={[
                styles.column,
                { 
                  marginRight: colIndex < row.length - 1 ? spacing : 0,
                  flex: 1,
                }
              ]}
            >
              {child}
            </View>
          ))}
          {/* Fill empty columns if incomplete row */}
          {Array.from({ length: columnCount - row.length }).map((_, idx) => (
            <View key={`empty-${rowIndex}-${idx}`} style={{ flex: 1, marginLeft: spacing }} />
          ))}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    width: '100%',
  },
  column: {
    flexDirection: 'column',
  },
});
