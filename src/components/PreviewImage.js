import { View, Text, Image, StyleSheet } from 'react-native';

export default function PreviewImage({ uri }) {
  if (!uri) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>ภาพล่าสุด:</Text>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
});