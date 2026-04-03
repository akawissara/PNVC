import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BackHeader from '../components/BackHeader';

export default function InternshipScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.title}>ระบบติดตามการฝึกงาน</Text>
      <Text style={styles.subtitle}>ติดตามการฝึกงานในสถานประกอบการ</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>หน้านี้เตรียมไว้สำหรับ</Text>
        <Text style={styles.cardText}>- ติดตามสถานะการฝึกงาน</Text>
        <Text style={styles.cardText}>- บันทึกข้อมูลสถานประกอบการ</Text>
        <Text style={styles.cardText}>- รายงานความคืบหน้าการฝึกงาน</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginBottom: 18,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#111',
  },
  cardText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
  },
});