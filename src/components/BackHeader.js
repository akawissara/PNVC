import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function BackHeader({ title, onPress }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 10 }}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.btn}
        activeOpacity={0.8}
      >
        <Ionicons name="arrow-back" size={22} color="#ff6600" />
        <Text style={styles.text}>{title}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  text: {
    color: '#ff6600',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 6,
  },
});