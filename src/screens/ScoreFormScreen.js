import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { ref, set } from 'firebase/database';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function ScoreFormScreen({ route, navigation }) {
  const { plan } = route.params;
  const { user } = useUserAuth();

  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [attendance, setAttendance] = useState('');
  const [assignment, setAssignment] = useState('');
  const [midterm, setMidterm] = useState('');
  const [finalScore, setFinalScore] = useState('');
  const [saving, setSaving] = useState(false);

  const showPopup = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

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

  const handleSaveScore = async () => {
    if (!user) {
      showPopup('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    if (!studentId.trim() || !studentName.trim()) {
      showPopup('แจ้งเตือน', 'กรุณากรอกรหัสนักเรียนและชื่อนักเรียน');
      return;
    }

    const total = getTotal();
    const grade = calculateGrade(attendance, assignment, midterm, finalScore);

    try {
      setSaving(true);

      await set(ref(db, `scores/${plan.id}/${studentId.trim()}`), {
        studentId: studentId.trim(),
        studentName: studentName.trim(),
        attendance: Number(attendance || 0),
        assignment: Number(assignment || 0),
        midterm: Number(midterm || 0),
        final: Number(finalScore || 0),
        total,
        grade,
        teacherEmail: user.email || '',
        subjectCode: plan.subjectCode || '',
        subjectName: plan.subjectName || '',
        updatedAt: Date.now(),
      });

      showPopup('สำเร็จ', 'บันทึกคะแนนเรียบร้อยแล้ว');
      resetForm();
    } catch (error) {
      console.log('save score error:', error);
      showPopup('ผิดพลาด', 'บันทึกคะแนนไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  };

  const previewGrade = calculateGrade(
    attendance,
    assignment,
    midterm,
    finalScore
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <BackHeader
        title="กลับหน้าก่อนหน้า"
        onPress={() => navigation.goBack()}
      />

      <Text style={styles.header}>กรอกคะแนนนักเรียน</Text>
      <Text style={styles.subject}>
        {plan.subjectCode} - {plan.subjectName}
      </Text>

      <View style={styles.subjectCard}>
        <Text style={styles.subjectText}>ครูผู้สอน: {plan.teacherName}</Text>
        <Text style={styles.subjectText}>เวลาเรียน: {plan.studyTime}</Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>ข้อมูลนักเรียน</Text>

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

        <Text style={styles.sectionTitle}>คะแนน</Text>

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

        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>คะแนนรวม: {getTotal()}</Text>
          <Text style={styles.summaryText}>เกรดที่ประเมิน: {previewGrade}</Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSaveScore}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกคะแนน'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate('ScoreDetail', { plan })}
        >
          <Text style={styles.viewBtnText}>ดูผลการเรียนรายวิชานี้</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 16,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  subject: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ff6b00',
    lineHeight: 26,
    marginBottom: 14,
  },
  subjectCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  subjectText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 6,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 18,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 12,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#fff3eb',
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  saveBtn: {
    backgroundColor: '#ff6b00',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  viewBtn: {
    backgroundColor: '#4a90e2',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
  },
  viewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
});