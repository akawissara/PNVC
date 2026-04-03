import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'photos_list'; // คีย์สำหรับเก็บรายการรูปทั้งหมดใน AsyncStorage
// ฟังก์ชันเพิ่ม URI ของรูปใหม่เข้าไปในรายการ
export async function addPhoto(uri) {
 const list = JSON.parse(await AsyncStorage.getItem(KEY)) || []; // ดึงรายการรูปเดิม
 list.push(uri); // เพิ่มรูปใหม่เข้าไป
 await AsyncStorage.setItem(KEY, JSON.stringify(list)); // บันทึกรายการใหม่กลับไป
}
// ฟังก์ชันดึง URI ของรูปทั้งหมด
export async function getAllPhotos() {
 return JSON.parse(await AsyncStorage.getItem(KEY)) || []; // คืนค่ารายการรูปทั้งหมด
}
// ฟังก์ชันดึง URI ของรูปล่าสุด (ตัวสุดท้ายในรายการ)
export async function getLastPhoto() {
 const list = JSON.parse(await AsyncStorage.getItem(KEY)) || [];
 return list.length > 0 ? list[list.length - 1] : null; // ถ้ามีรูป คืนค่ารูปล่าสุด, ถ้าไม่มี คืน null
}