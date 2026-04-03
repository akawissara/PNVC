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
import { ref, onValue, runTransaction, set, get } from 'firebase/database';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function VoteScreen({ navigation }) {
  const { user, loading } = useUserAuth();
  const [votes, setVotes] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

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

  const handleVote = async (voteId, selectedOption) => {
    if (!user) {
      Alert.alert('แจ้งเตือน', 'กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    try {
      const userVoteRef = ref(db, `votes/${voteId}/userVotes/${user.uid}`);
      const userVoteSnap = await get(userVoteRef);

      if (userVoteSnap.exists()) {
        Alert.alert('แจ้งเตือน', 'คุณโหวตหัวข้อนี้แล้ว');
        return;
      }

      const optionCountRef = ref(db, `votes/${voteId}/optionVotes/${selectedOption}`);

      await runTransaction(optionCountRef, (currentValue) => {
        return (currentValue || 0) + 1;
      });

      await set(userVoteRef, {
        uid: user.uid,
        email: user.email || '',
        selectedOption,
        votedAt: Date.now(),
      });

      Alert.alert('สำเร็จ', `คุณเลือก "${selectedOption}" เรียบร้อยแล้ว`);
    } catch (error) {
      console.log('vote error:', error);
      Alert.alert('ผิดพลาด', 'บันทึกการโหวตไม่สำเร็จ');
    }
  };

  const renderVoteCard = ({ item }) => {
    const userVotes = item.userVotes || {};
    const myVote = user && userVotes[user.uid] ? userVotes[user.uid] : null;
    const hasVoted = !!myVote;
    const selectedOption = myVote?.selectedOption || '';

    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{item.title}</Text>

        {!!item.description && (
          <Text style={styles.cardDesc}>{item.description}</Text>
        )}

        <Text style={styles.statusText}>
          สถานะ: {hasVoted ? `โหวตแล้ว (${selectedOption})` : 'ยังไม่ได้โหวต'}
        </Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              styles.joinButton,
              hasVoted && styles.optionButtonDisabled,
            ]}
            onPress={() => handleVote(item.id, 'เข้าร่วม')}
            disabled={hasVoted}
          >
            <Text style={styles.joinText}>
              {hasVoted && selectedOption === 'เข้าร่วม' ? 'เลือกแล้ว' : 'เข้าร่วม'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionButton,
              styles.rejectButton,
              hasVoted && styles.optionButtonDisabled,
            ]}
            onPress={() => handleVote(item.id, 'ไม่เข้าร่วม')}
            disabled={hasVoted}
          >
            <Text style={styles.rejectText}>
              {hasVoted && selectedOption === 'ไม่เข้าร่วม' ? 'เลือกแล้ว' : 'ไม่เข้าร่วม'}
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
    marginBottom: 18,
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
  optionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#fff3eb',
  },
  rejectButton: {
    backgroundColor: '#f1f1f1',
  },
  optionButtonDisabled: {
    opacity: 0.6,
  },
  joinText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff6b00',
  },
  rejectText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  emptyText: {
    textAlign: 'center',
    color: '#777',
    marginTop: 40,
    fontSize: 15,
  },
});