import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native';
import CameraView from '../components/CameraView';
import PreviewImage from '../components/PreviewImage';
import GalleryScreen from '../components/GalleryScreen';
import { getLastPhoto } from '../utils/storageHelper';

export default function CameraScreen() {
  const [last, setLast] = useState(null);
  const [screen, setScreen] = useState('camera');

  useEffect(() => {
    (async () => {
      setLast(await getLastPhoto());
    })();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {screen === 'camera' ? (
        <>
          <CameraView
            onPhotoSaved={setLast}
            onOpenGallery={() => setScreen('gallery')}
          />
          <PreviewImage uri={last} />
        </>
      ) : (
        <GalleryScreen onBack={() => setScreen('camera')} />
      )}
    </SafeAreaView>
  );
}