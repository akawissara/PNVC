import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function StudyPlanScreen({ navigation }) {
  const { user, loading } = useUserAuth();

  const [plans, setPlans] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const studyRef = ref(db, 'studyPlans');

    const unsubscribe = onValue(studyRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const myPlans = list.filter(
          (item) => item.teacherEmail === user?.email
        );

        setPlans(myPlans);
      } else {
        setPlans([]);
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading || pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={{ marginTop: 10 }}>กำลังโหลด...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <BackHeader
          title="กลับหน้าแรก"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        />
        <Text style={styles.noData}>กรุณาเข้าสู่ระบบก่อน</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>
        {item.subjectCode} - {item.subjectName}
      </Text>

      <Text style={styles.text}>ครู: {item.teacherName}</Text>
      <Text style={styles.text}>หน่วยกิต: {item.credit}</Text>
      <Text style={styles.text}>เวลาเรียน: {item.studyTime}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.header}>แผนการเรียนของฉัน</Text>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <Text style={styles.noData}>ยังไม่มีแผนการเรียน</Text>
        }
      />
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
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  noData: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  center: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
});