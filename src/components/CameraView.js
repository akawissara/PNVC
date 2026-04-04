import { Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Image,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { addPhoto, getLastPhoto } from '../utils/storageHelper';

export default function CameraViewScreen({ onPhotoSaved, onOpenGallery }) {
  const camRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [ready, setReady] = useState(false);
  const [facing, setFacing] = useState('back');
  const [thumb, setThumb] = useState(null);

  useEffect(() => {
    (async () => {
      const last = await getLastPhoto();
      if (last) setThumb(last);
    })();
  }, []);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#000' }} />;

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#fff', marginBottom: 8 }}>
          ต้องการสิทธิ์การใช้กล้อง
        </Text>
        <TouchableOpacity style={styles.btnPrimary} onPress={requestPermission}>
          <Text style={styles.btnPrimaryText}>อนุญาต</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFacing = () => {
    setFacing((f) => (f === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    try {
      if (!camRef.current || !ready) return;

      const shot = await camRef.current.takePictureAsync();

      if (Platform.OS === 'web') {
        // บน Web ใช้ URI จาก shot ได้เลย (เป็น blob URL)
        await addPhoto(shot.uri);
        setThumb(shot.uri);
        onPhotoSaved?.(shot.uri);
        Alert.alert('สำเร็จ', 'บันทึกรูปแล้ว');
      } else {
        // บนมือถือ ค่อย copy ไฟล์
        const filename = `photo_${Date.now()}.jpg`;
        const dest = FileSystem.documentDirectory + filename;
        await FileSystem.copyAsync({ from: shot.uri, to: dest });
        await addPhoto(dest);
        setThumb(dest);
        onPhotoSaved?.(dest);
        Alert.alert('สำเร็จ', 'บันทึกรูปไว้ในเครื่องแล้ว');
      }
    } catch (e) {
      console.log(e);
      Alert.alert('ผิดพลาด', 'ถ่ายหรือบันทึกรูปไม่สำเร็จ');
    }
  };

  return (
    <View style={styles.root}>
      <CameraView
        ref={camRef}
        style={styles.camera}
        facing={facing}
        onCameraReady={() => setReady(true)}
      >
        <View style={styles.focusWrap}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
      </CameraView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.thumbWrap}
          onPress={onOpenGallery}
          activeOpacity={0.7}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <Text style={{ color: '#999' }}>รูป</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shutterOuter}
          onPress={takePicture}
          activeOpacity={0.8}
        >
          <View style={styles.shutterInner} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.roundBtn} onPress={toggleFacing}>
          <Text style={{ color: '#fff', fontSize: 18 }}>↺</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  btnPrimary: {
    backgroundColor: '#fff',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimaryText: {
    color: '#111',
    fontWeight: 'bold',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  focusWrap: {
    position: 'absolute',
    top: '16%',
    left: '12%',
    right: '12%',
    bottom: '18%',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 6,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 6,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 6,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 6,
  },
  bottomBar: {
    backgroundColor: '#000',
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  thumbWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterOuter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#fff',
  },
  roundBtn: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
});