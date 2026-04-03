import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {
  ref,
  push,
  set,
  onValue,
  update,
  remove,
} from 'firebase/database';
import { db } from '../../../firebase';
import { useUserAuth } from '../../../src/context/UserAuthContext';
import BackHeader from '../../../src/components/BackHeader';

export default function AdminVoteScreen({ navigation }) {
  const { isAdmin } = useUserAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [votes, setVotes] = useState([]);
  const [editingId, setEditingId] = useState(null);

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
    setTitle('');
    setDescription('');
    setEditingId(null);
  };

  const handleSaveVote = async () => {
    if (!title.trim()) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกหัวข้อโหวต');
      return;
    }

    try {
      if (editingId) {
        await update(ref(db, `votes/${editingId}`), {
          title: title.trim(),
          description: description.trim(),
        });

        Alert.alert('สำเร็จ', 'แก้ไขหัวข้อโหวตแล้ว');
      } else {
        const newVoteRef = push(ref(db, 'votes'));

        await set(newVoteRef, {
          title: title.trim(),
          description: description.trim(),
          options: ['เข้าร่วม', 'ไม่เข้าร่วม'],
          optionVotes: {
            เข้าร่วม: 0,
            ไม่เข้าร่วม: 0,
          },
          userVotes: {},
          createdAt: Date.now(),
        });

        Alert.alert('สำเร็จ', 'เพิ่มหัวข้อโหวตแล้ว');
      }

      resetForm();
    } catch (error) {
      console.log('save vote error:', error);
      Alert.alert('ผิดพลาด', 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };

  const handleEdit = (item) => {
    setTitle(item.title || '');
    setDescription(item.description || '');
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบหัวข้อโหวตนี้ใช่หรือไม่',
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ลบ',
          style: 'destructive',
          onPress: async () => {
            try {
              await remove(ref(db, `votes/${id}`));
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

  const renderItem = ({ item }) => {
    const joinCount = item.optionVotes?.['เข้าร่วม'] || 0;

    return (
      <View style={styles.voteCard}>
        <Text style={styles.voteTitle}>{item.title}</Text>

        {!!item.description && (
          <Text style={styles.voteDesc}>{item.description}</Text>
        )}

        <Text style={styles.countLabel}>จำนวนผู้เข้าร่วม: {joinCount} คน</Text>

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

  return (
    <View style={styles.container}>
      <BackHeader
        title="กลับหน้าแรก"
        onPress={() => navigation.navigate('MainTabs', { screen: 'Home' })}
      />

      <Text style={styles.header}>Admin จัดการโหวต</Text>

      <View style={styles.formCard}>
        <TextInput
          placeholder="หัวข้อโหวต"
          value={title}
          onChangeText={setTitle}
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
            {editingId ? 'บันทึกการแก้ไข' : 'เพิ่มหัวข้อ'}
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
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addBtn: {
    backgroundColor: '#ff6b00',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelBtn: {
    backgroundColor: '#eee',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
  },
  voteCard: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  voteTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  voteDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  countLabel: {
    fontSize: 15,
    color: '#ff6b00',
    fontWeight: 'bold',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
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