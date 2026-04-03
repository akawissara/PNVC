import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
} from 'react-native';
import { getAllPhotos } from '../utils/storageHelper';

export default function GalleryScreen({ onBack }) {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    (async () => {
      const all = await getAllPhotos();
      setPhotos(all.reverse());
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>แกลเลอรี</Text>
      </View>

      {photos.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ color: '#999' }}>ยังไม่มีรูปที่ถ่ายไว้</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.photo} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', paddingTop: 50 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  backBtn: { padding: 8 },
  backText: { color: '#fff' },
  title: { color: '#fff', fontSize: 18, marginLeft: 10 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingHorizontal: 5 },
  photo: {
    width: '32%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
  },
});