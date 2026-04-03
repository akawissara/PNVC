import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  ref,
  push,
  set,
  onValue,
  remove,
  update,
} from 'firebase/database';
import { db } from '../../../firebase';
import { useUserAuth } from '../../../src/context/UserAuthContext';
import BackHeader from '../../../src/components/BackHeader';

export default function AdminStudyPlanScreen({ navigation }) {
  const { isAdmin, loading } = useUserAuth();

  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [credit, setCredit] = useState('');
  const [studyTime, setStudyTime] = useState('');

  const [plans, setPlans] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const studyPlanRef = ref(db, 'studyPlans');

    const unsubscribe = onValue(studyPlanRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setPlans(list.reverse());
      } else {
        setPlans([]);
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setSubjectCode('');
    setSubjectName('');
    setTeacherEmail('');
    setTeacherName('');
    setCredit('');
    setStudyTime('');
    setEditingId(null);
  };

  const validateForm = () => {
    if (!subjectCode.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกรหัสวิชา');
      return false;
    }

    if (!subjectName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อวิชา');
      return false;
    }

    if (!teacherEmail.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมลครูผู้สอน');
      return false;
    }

    if (!teacherName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อครูผู้สอน');
      return false;
    }

    if (!credit.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกหน่วยกิต');
      return false;
    }

    if (!studyTime.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกเวลาในการเข้าเรียน');
      return false;
    }

    return true;
  };

  const handleSavePlan = async () => {
    if (!validateForm()) return;

    const payload = {
      subjectCode: subjectCode.trim(),
      subjectName: subjectName.trim(),
      teacherEmail: teacherEmail.trim().toLowerCase(),
      teacherName: teacherName.trim(),
      credit: credit.trim(),
      studyTime: studyTime.trim(),
    };

    try {
      if (editingId) {
        await update(ref(db, `studyPlans/${editingId}`), {
          ...payload,
          updatedAt: Date.now(),
        });

        Alert.alert('สำเร็จ', 'แก้ไขข้อมูลแผนการเรียนแล้ว');
      } else {
        const newPlanRef = push(ref(db, 'studyPlans'));

        await set(newPlanRef, {
          ...payload,
          createdAt: Date.now(),
        });

        Alert.alert('สำเร็จ', 'เพิ่มข้อมูลแผนการเรียนแล้ว');
      }

      resetForm();
    } catch (error) {
      console.log('save study plan error:', error);
      Alert.alert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleEdit = (item) => {
    setSubjectCode(item.subjectCode || '');
    setSubjectName(item.subjectName || '');
    setTeacherEmail(item.teacherEmail || '');
    setTeacherName(item.teacherName || '');
    setCredit(item.credit || '');
    setStudyTime(item.studyTime || '');
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบข้อมูลรายวิชานี้ใช่หรือไม่',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(db, `studyPlans/${id}`));
              Alert.alert('สำเร็จ', 'ลบข้อมูลแล้ว');
            } catch (error) {
              console.log('delete study plan error:', error);
              Alert.alert('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.planCard}>
      <Text style={styles.planTitle}>
        {item.subjectCode} - {item.subjectName}
      </Text>

      <Text style={styles.planText}>ครูผู้สอน: {item.teacherName}</Text>
      <Text style={styles.planText}>อีเมลครู: {item.teacherEmail}</Text>
      <Text style={styles.planText}>หน่วยกิต: {item.credit}</Text>
      <Text style={styles.planText}>เวลาเรียน: {item.studyTime}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => handleEdit(item)}
        >
          <Text style={styles.actionButtonText}>แก้ไข</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.actionButtonText}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading || pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={{ marginTop: 10 }}>กำลังโหลด...</Text>
      </View>
    );
  }

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <BackHeader
          title="กลับหน้าแรก"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        />
        <Text style={styles.noAccessText}>คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.header}>จัดการแผนการเรียน</Text>

      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder="รหัสวิชา"
          value={subjectCode}
          onChangeText={setSubjectCode}
        />

        <TextInput
          style={styles.input}
          placeholder="ชื่อวิชา"
          value={subjectName}
          onChangeText={setSubjectName}
        />

        <TextInput
          style={styles.input}
          placeholder="อีเมลครูผู้สอน"
          value={teacherEmail}
          onChangeText={setTeacherEmail}
          autoCapitalize="none"
        />

        <TextInput
          style={styles.input}
          placeholder="ชื่อครูผู้สอน"
          value={teacherName}
          onChangeText={setTeacherName}
        />

        <TextInput
          style={styles.input}
          placeholder="หน่วยกิต"
          value={credit}
          onChangeText={setCredit}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="เวลาในการเข้าเรียน"
          value={studyTime}
          onChangeText={setStudyTime}
        />

        <View style={styles.topActionRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSavePlan}>
            <Text style={styles.saveBtnText}>
              {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูลรายวิชา'}
            </Text>
          </TouchableOpacity>

          {editingId && (
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
              <Text style={styles.cancelBtnText}>ยกเลิก</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ยังไม่มีข้อมูลแผนการเรียน</Text>
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
  center: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    textAlign: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  input: {
    backgroundColor: '#f9fafc',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    fontSize: 15,
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveBtn: {
    backgroundColor: '#ff6b00',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#eee',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  planText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#4a90e2',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
});