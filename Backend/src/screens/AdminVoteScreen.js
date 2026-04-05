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
  get,
  onValue,
  update,
  remove,
} from 'firebase/database';
import { db } from '../../../firebase';
import { useUserAuth } from '../../../src/context/UserAuthContext';
import BackHeader from '../../../src/components/BackHeader';

export default function AdminVoteScreen({ navigation }) {
  const { isAdmin, loading } = useUserAuth();

  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [votes, setVotes] = useState([]);
  const [voteRecords, setVoteRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // ดึงข้อมูลตาราง votes (รายการโหวต)
  useEffect(() => {
    const votesRef = ref(db, 'votes');
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const voteList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setVotes(voteList.reverse());
      } else {
        setVotes([]);
      }
      setPageLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ดึงข้อมูลตาราง voteRecords (บันทึกการโหวต)
  useEffect(() => {
    const recordsRef = ref(db, 'voteRecords');
    const unsubscribe = onValue(recordsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const recordList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setVoteRecords(recordList);
      } else {
        setVoteRecords([]);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <BackHeader
          title="กลับหน้าแรก"
          onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
        />
        <Text style={styles.noAccess}>คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้</Text>
      </View>
    );
  }

  const resetForm = () => {
    setProjectName('');
    setDescription('');
    setEditingId(null);
  };

  // ===== Admin สร้าง/แก้ไขหัวข้อโหวต (ตาราง votes) =====
  const handleSaveVote = async () => {
    if (!projectName.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกชื่อโครงการ');
      return;
    }

    try {
      if (editingId) {
        // แก้ไขหัวข้อโหวต
        await update(ref(db, `votes/${editingId}`), {
          projectName: projectName.trim(),
          description: description.trim(),
          updatedAt: new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        Alert.alert('สำเร็จ', 'แก้ไขหัวข้อโหวตแล้ว');
      } else {
        // สร้างหัวข้อโหวตใหม่ โดยใช้ ID เป็นตัวเลข 1, 2, 3, ...
        const snapshot = await get(ref(db, 'votes'));
        let nextId = 1;

        if (snapshot.exists()) {
          const data = snapshot.val();
          const existingIds = Object.keys(data).map((k) => parseInt(k)).filter((n) => !isNaN(n));
          if (existingIds.length > 0) {
            nextId = Math.max(...existingIds) + 1;
          }
        }

        const newVoteId = String(nextId);

        await set(ref(db, `votes/${newVoteId}`), {
          voteId: newVoteId,                 // Primary Key เป็นตัวเลข "1", "2", "3"
          projectName: projectName.trim(),
          description: description.trim(),
          createdAt: new Date().toLocaleString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
        });
        Alert.alert('สำเร็จ', `เพิ่มหัวข้อโหวตแล้ว (ID: ${newVoteId})`);
      }
      resetForm();
    } catch (error) {
      console.log('save vote error:', error);
      Alert.alert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleEdit = (item) => {
    setProjectName(item.projectName || '');
    setDescription(item.description || '');
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบหัวข้อโหวตนี้ใช่หรือไม่\n(บันทึกการโหวตของหัวข้อนี้จะถูกลบด้วย)',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              // ลบหัวข้อโหวต
              await remove(ref(db, `votes/${id}`));

              // ลบ voteRecords ที่เกี่ยวข้อง
              const relatedRecords = voteRecords.filter(
                (r) => r.voteId === id
              );
              for (const record of relatedRecords) {
                await remove(ref(db, `voteRecords/${record.id}`));
              }

              // ลบ voteSummary ที่เกี่ยวข้อง
              await remove(ref(db, `voteSummary/${id}`));

              Alert.alert('สำเร็จ', 'ลบหัวข้อโหวตแล้ว');
            } catch (error) {
              console.log('delete vote error:', error);
              Alert.alert('ผิดพลาด', 'ลบข้อมูลไม่สำเร็จ');
            }
          },
        },
      ]
    );
  };

  // นับจำนวนคนโหวตแยกตามตัวเลือก
  const getVoteCounts = (voteId) => {
    const records = voteRecords.filter((r) => r.voteId === voteId);
    const joinCount = records.filter((r) => r.selectedOption === 'เข้าร่วม').length;
    const rejectCount = records.filter((r) => r.selectedOption === 'ไม่เข้าร่วม').length;
    return { total: records.length, joinCount, rejectCount };
  };

  const renderItem = ({ item }) => {
    const { total, joinCount, rejectCount } = getVoteCounts(item.id);

    // ดึงรายชื่อคนที่โหวตโครงการนี้
    const voters = voteRecords.filter((r) => r.voteId === item.id);

    return (
      <View style={styles.voteCard}>
        <Text style={styles.voteTitle}>{item.projectName}</Text>

        {!!item.description && (
          <Text style={styles.voteDesc}>{item.description}</Text>
        )}

        <Text style={styles.countLabel}>
          จำนวนผู้โหวตทั้งหมด: {total} คน
        </Text>
        <Text style={styles.joinCount}>
          เข้าร่วม: {joinCount} คน
        </Text>
        <Text style={styles.rejectCount}>
          ไม่เข้าร่วม: {rejectCount} คน
        </Text>

        {/* แสดงรายชื่อผู้โหวต */}
        {voters.length > 0 && (
          <View style={styles.voterList}>
            <Text style={styles.voterHeader}>รายชื่อผู้โหวต:</Text>
            {voters.map((v, index) => (
              <Text key={v.id} style={styles.voterText}>
                {index + 1}. {v.voterName} ({v.voterEmail}) - {v.selectedOption === 'เข้าร่วม' ? '✅ เข้าร่วม' : '❌ ไม่เข้าร่วม'} - {v.votedAt}
              </Text>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => handleEdit(item)}
          >
            <Text style={styles.actionText}>แก้ไข</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.actionText}>ลบ</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading || pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={{ marginTop: 10 }}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.header}>Admin จัดการโหวต</Text>

      <View style={styles.formCard}>
        <TextInput
          placeholder="ชื่อโครงการ"
          value={projectName}
          onChangeText={setProjectName}
          style={styles.input}
        />

        <TextInput
          placeholder="รายละเอียด"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
        />

        <TouchableOpacity style={styles.addBtn} onPress={handleSaveVote}>
          <Text style={styles.addBtnText}>
            {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มหัวข้อโหวต'}
          </Text>
        </TouchableOpacity>

        {editingId && (
          <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
            <Text style={styles.cancelBtnText}>ยกเลิก</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={votes}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ยังไม่มีหัวข้อโหวต</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fb', paddingHorizontal: 16, paddingBottom: 16 },
  center: { flex: 1, backgroundColor: '#f6f8fb', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  noAccess: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  formCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    elevation: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    backgroundColor: '#f9fafc',
    fontSize: 15,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: '#ff6b00',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  voteCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  voteTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#111',
  },
  voteDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  countLabel: {
    fontSize: 16,
    color: '#ff6b00',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  joinCount: {
    fontSize: 15,
    color: '#2E7D32',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  rejectCount: {
    fontSize: 15,
    color: '#D32F2F',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  voterList: {
    backgroundColor: '#f9fafc',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  voterHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  voterText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    marginRight: 10,
  },
  editBtn: {
    backgroundColor: '#4a90e2',
  },
  deleteBtn: {
    backgroundColor: '#ff3b30',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 20,
  },
});
