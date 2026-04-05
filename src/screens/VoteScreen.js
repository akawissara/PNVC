import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ref, onValue, push, set, get } from 'firebase/database';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function VoteScreen({ navigation }) {
  const { user, loading } = useUserAuth();
  const [votes, setVotes] = useState([]);
  const [voteRecords, setVoteRecords] = useState([]);
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

  // ===== User กดโหวต =====
  const handleVote = async (voteItem, selectedOption) => {
    if (!user) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    // เช็คว่าเคยโหวตโครงการนี้แล้วหรือยัง
    const alreadyVoted = voteRecords.some(
      (r) => r.voteId === voteItem.id && r.voterUid === user.uid
    );

    if (alreadyVoted) {
      Alert.alert('แจ้งเตือน', 'คุณโหวตโครงการนี้แล้ว');
      return;
    }

    try {
      // หา ID ถัดไป (1, 2, 3, ...)
      const snapshot = await get(ref(db, 'voteRecords'));
      let nextId = 1;

      if (snapshot.exists()) {
        const data = snapshot.val();
        const existingIds = Object.keys(data).map((k) => parseInt(k)).filter((n) => !isNaN(n));
        if (existingIds.length > 0) {
          nextId = Math.max(...existingIds) + 1;
        }
      }

      const newRecordId = String(nextId);

      // บันทึกลงตาราง voteRecords
      await set(ref(db, `voteRecords/${newRecordId}`), {
        recordId: newRecordId,               // Primary Key เป็นตัวเลข "1", "2", "3"
        voteId: voteItem.id,                 // Foreign Key → ชี้ไปตาราง votes
        projectName: voteItem.projectName,   // ชื่อโครงการ
        description: voteItem.description || '',  // รายละเอียด
        selectedOption: selectedOption,      // "เข้าร่วม" หรือ "ไม่เข้าร่วม"
        voterName: user.displayName || user.email.split('@')[0],  // ชื่อผู้โหวต
        voterEmail: user.email || '',        // อีเมลผู้โหวต
        voterUid: user.uid,                  // UID ผู้โหวต (ใช้เช็คซ้ำ)
        votedAt: new Date().toLocaleString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),                                  // เช่น "5 เมษายน 2026 14:30"
      });

      Alert.alert('สำเร็จ', `คุณเลือก "${selectedOption}" โครงการ "${voteItem.projectName}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.log('vote error:', error);
      Alert.alert('ผิดพลาด', 'บันทึกการโหวตไม่สำเร็จ');
    }
  };

  // นับจำนวนคนโหวตของแต่ละโครงการ
  const getVoteCount = (voteId) => {
    return voteRecords.filter((r) => r.voteId === voteId).length;
  };

  // เช็คว่า user คนนี้โหวตโครงการนี้แล้วหรือยัง
  const hasUserVoted = (voteId) => {
    if (!user) return false;
    return voteRecords.some(
      (r) => r.voteId === voteId && r.voterUid === user.uid
    );
  };

  // ดึงตัวเลือกที่ user เลือกไว้
  const getUserVoteOption = (voteId) => {
    if (!user) return null;
    const record = voteRecords.find(
      (r) => r.voteId === voteId && r.voterUid === user.uid
    );
    return record ? record.selectedOption : null;
  };

  const renderVoteCard = ({ item }) => {
    const voted = hasUserVoted(item.id);
    const count = getVoteCount(item.id);
    const myOption = getUserVoteOption(item.id);

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.projectName}</Text>

        {!!item.description && (
          <Text style={styles.cardDesc}>{item.description}</Text>
        )}

        <Text style={styles.countText}>
          จำนวนผู้โหวต: {count} คน
        </Text>

        <Text style={styles.statusText}>
          สถานะ: {voted ? `โหวตแล้ว (${myOption}) ✓` : 'ยังไม่ได้โหวต'}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.joinButton,
              voted && myOption === 'เข้าร่วม' && styles.joinButtonActive,
              voted && styles.buttonDisabled,
            ]}
            onPress={() => handleVote(item, 'เข้าร่วม')}
            disabled={voted}
          >
            <Text style={[
              styles.joinButtonText,
              voted && myOption === 'เข้าร่วม' && styles.joinButtonTextActive,
              voted && myOption !== 'เข้าร่วม' && styles.buttonTextDisabled,
            ]}>
              {voted && myOption === 'เข้าร่วม' ? 'เลือกแล้ว ✓' : 'เข้าร่วม'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.rejectButton,
              voted && myOption === 'ไม่เข้าร่วม' && styles.rejectButtonActive,
              voted && styles.buttonDisabled,
            ]}
            onPress={() => handleVote(item, 'ไม่เข้าร่วม')}
            disabled={voted}
          >
            <Text style={[
              styles.rejectButtonText,
              voted && myOption === 'ไม่เข้าร่วม' && styles.rejectButtonTextActive,
              voted && myOption !== 'ไม่เข้าร่วม' && styles.buttonTextDisabled,
            ]}>
              {voted && myOption === 'ไม่เข้าร่วม' ? 'เลือกแล้ว ✓' : 'ไม่เข้าร่วม'}
            </Text>
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

      <Text style={styles.header}>ระบบโหวต</Text>
      <Text style={styles.subheader}>เลือกโหวตโครงการที่ต้องการเข้าร่วม (โหวตได้ 1 ครั้งต่อโครงการ)</Text>

      <FlatList
        data={votes}
        keyExtractor={(item) => item.id}
        renderItem={renderVoteCard}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>ยังไม่มีหัวข้อโหวต</Text>
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
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 6,
  },
  subheader: {
    fontSize: 14,
    color: '#666',
    marginBottom: 18,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  countText: {
    fontSize: 15,
    color: '#ff6b00',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 12,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  joinButton: {
    flex: 1,
    backgroundColor: '#fff3eb',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  joinButtonActive: {
    backgroundColor: '#ff6b00',
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b00',
  },
  joinButtonTextActive: {
    color: '#fff',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  rejectButtonActive: {
    backgroundColor: '#ff3b30',
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  rejectButtonTextActive: {
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonTextDisabled: {
    color: '#bbb',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
    fontSize: 15,
  },
});
