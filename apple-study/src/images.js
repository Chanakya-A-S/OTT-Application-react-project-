import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { uid } from './utils/date';

const DIR = FileSystem.documentDirectory + 'note-images/';

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
}

export const imageUri = (id) => DIR + id + '.jpg';

export async function readImageBase64(id) {
  try {
    return await FileSystem.readAsStringAsync(imageUri(id), { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    return null;
  }
}

export async function ensureLocalImage(id, fetchBase64) {
  await ensureDir();
  const info = await FileSystem.getInfoAsync(imageUri(id));
  if (info.exists) return true;
  const data = await fetchBase64();
  if (!data) return false;
  await FileSystem.writeAsStringAsync(imageUri(id), data, { encoding: FileSystem.EncodingType.Base64 });
  return true;
}

/** Pick (or shoot) a photo, shrink it, store it in app storage. Returns {imageId, w, h} or null. */
export async function pickImage(fromCamera) {
  const perm = fromCamera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert('Permission needed', fromCamera ? 'Allow camera access to snap photos.' : 'Allow photo access to add images.');
    return null;
  }
  const opts = { mediaTypes: ['images'], quality: 1, allowsEditing: false };
  const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  const resize = (a.width || 1200) > 1200 ? [{ resize: { width: 1200 } }] : [];
  const out = await manipulateAsync(a.uri, resize, { compress: 0.6, format: SaveFormat.JPEG });
  await ensureDir();
  const id = uid();
  await FileSystem.copyAsync({ from: out.uri, to: imageUri(id) });
  return { imageId: id, w: out.width, h: out.height };
}

export async function deleteImage(id) {
  try {
    await FileSystem.deleteAsync(imageUri(id), { idempotent: true });
  } catch {}
}
