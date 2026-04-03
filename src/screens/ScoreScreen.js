import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function ScoreScreen({ navigation }) {
  const { user, loading } = useUserAuth();

  const [plans, setPlans] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [attendance, setAttendance] = useState('');
  const [assignment, setAssignment] = useState('');
  const [midterm, setMidterm] = useState('');
  const [finalScore, setFinalScore] = useState('');

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

  const calculateGrade = (
    attendanceVal,
    assignmentVal,
    midtermVal,
    finalVal
  ) => {
    if (
      attendanceVal === '' ||
      assignmentVal === '' ||
      midtermVal === '' ||
      finalVal === ''
    ) {
      return 0;
    }

    const total =
      Number(attendanceVal) +
      Number(assignmentVal) +
      Number(midtermVal) +
      Number(finalVal);

    if (total < 50) return 0;
    if (total < 55) return 1;
    if (total < 60) return 1.5;
    if (total < 65) return 2;
    if (total < 70) return 2.5;
    if (total < 75) return 3;
    if (total < 80) return 3.5;
    return 4;
  };

  const getTotal = () => {
    return (
      Number(attendance || 0) +
      Number(assignment || 0) +
      Number(midterm || 0) +
      Number(finalScore || 0)
    );
  };

  const resetForm = () => {
    setStudentId('');
    setStudentName('');
    setAttendance('');
    setAssignment('');
    setMidterm('');
    setFinalScore('');
  };

  const showPopup = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setSuccessMessage('');
    resetForm();
  };

  const handleSaveScore = async () => {
    if (!user) {
      showPopup('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!selectedPlan) {
      showPopup('แจ้งเตือน', 'กรุณาเลือกวิชาก่อนกรอกคะแนน');
      return;
    }

    if (!studentId.trim() || !studentName.trim()) {
      showPopup('แจ้งเตือน', 'กรุณากรอกรหัสนักเรียนและชื่อนักเรียน');
      return;
    }

    const total = getTotal();
    const grade = calculateGrade(attendance, assignment, midterm, finalScore);

    try {
      await set(ref(db, `scores/${selectedPlan.id}/${studentId.trim()}`), {
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        attendance: Number(attendance || 0),
        assignment: Number(assignment || 0),
        midterm: Number(midterm || 0),
        final: Number(finalScore || 0),
        total,
        grade,
        teacherEmail: user.email || '',
        subjectCode: selectedPlan.subjectCode || '',
        subjectName: selectedPlan.subjectName || '',
        updatedAt: Date.now(),
      });

      showPopup('สำเร็จ', 'บันทึกคะแนนเรียบร้อยแล้ว');
      setSuccessMessage('บันทึกคะแนนเรียบร้อยแล้ว');
      resetForm();

      setTimeout(() => {
        setSuccessMessage('');
      }, 2500);
    } catch (error) {
      console.log('save score error:', error);
      showPopup('ผิดพลาด', 'บันทึกคะแนนไม่สำเร็จ');
    }
  };

  const previewGrade = calculateGrade(
    attendance,
    assignment,
    midterm,
    finalScore
  );

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
        <Text style={styles.emptyText}>กรุณาเข้าสู่ระบบก่อน</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.header}>ระบบบันทึกคะแนนผลการเรียน</Text>
      <Text style={styles.subheader}>แสดงเฉพาะรายวิชาของครู: {user.email}</Text>

      <Text style={styles.sectionTitle}>รายวิชาของฉัน</Text>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isSelected = selectedPlan?.id === item.id;

          return (
            <View
              style={[
                styles.subjectCard,
                isSelected && styles.subjectCardActive,
              ]}
            >
              <Text style={styles.subjectTitle}>
                {item.subjectCode} - {item.subjectName}
              </Text>
              <Text style={styles.subjectText}>ครูผู้สอน: {item.teacherName}</Text>
              <Text style={styles.subjectText}>เวลาเรียน: {item.studyTime}</Text>

              <View style={styles.subjectActionRow}>
                <TouchableOpacity
                  style={styles.selectBtn}
                  onPress={() => handleSelectPlan(item)}
                >
                  <Text style={styles.selectBtnText}>
                    {isSelected ? 'กำลังกรอกวิชานี้' : 'เลือกวิชา'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewBtn}
                  onPress={() => navigation.navigate('ScoreDetail', { plan: item })}
                >
                  <Text style={styles.viewBtnText}>ดูผล</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ยังไม่มีรายวิชาที่เป็นของครูคนนี้</Text>
        }
      />

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>กรอกคะแนนนักเรียน</Text>

        {selectedPlan ? (
          <Text style={styles.selectedSubject}>
            วิชาที่เลือก: {selectedPlan.subjectCode} - {selectedPlan.subjectName}
          </Text>
        ) : (
          <Text style={styles.selectedHint}>
            กรุณากด "เลือกวิชา" ด้านบนก่อนกรอกคะแนน
          </Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="รหัสนักเรียน"
          value={studentId}
          onChangeText={setStudentId}
        />

        <TextInput
          style={styles.input}
          placeholder="ชื่อนักเรียน"
          value={studentName}
          onChangeText={setStudentName}
        />

        <TextInput
          style={styles.input}
          placeholder="คะแนนเข้าเรียน"
          value={attendance}
          onChangeText={setAttendance}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="คะแนนงาน"
          value={assignment}
          onChangeText={setAssignment}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="คะแนนกลางภาค"
          value={midterm}
          onChangeText={setMidterm}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="คะแนนปลายภาค"
          value={finalScore}
          onChangeText={setFinalScore}
          keyboardType="numeric"
        />

        <View style={styles.previewBox}>
          <Text style={styles.previewText}>คะแนนรวม: {getTotal()}</Text>
          <Text style={styles.previewText}>เกรดที่ประเมิน: {previewGrade}</Text>
        </View>

        {successMessage ? (
          <Text style={styles.successText}>{successMessage}</Text>
        ) : null}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveScore}>
          <Text style={styles.saveBtnText}>บันทึกคะแนน</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  subjectCardActive: {
    borderColor: '#ff6b00',
  },
  subjectTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
    lineHeight: 24,
  },
  subjectText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  subjectActionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  selectBtn: {
    flex: 1,
    backgroundColor: '#ff6b00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  selectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  viewBtn: {
    flex: 1,
    backgroundColor: '#4a90e2',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    elevation: 2,
  },
  selectedSubject: {
    fontSize: 15,
    color: '#ff6b00',
    fontWeight: '600',
    marginBottom: 14,
    lineHeight: 22,
  },
  selectedHint: {
    fontSize: 14,
    color: '#777',
    marginBottom: 14,
    lineHeight: 22,
  },
  input: {
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  previewBox: {
    backgroundColor: '#fff3eb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  previewText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  successText: {
    color: 'green',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: '#ff6b00',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
    fontSize: 15,
  },
});