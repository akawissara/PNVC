import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { ref, onValue } from 'firebase/database';
import { useAssets } from 'expo-asset';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { db } from '../../firebase';
import { useUserAuth } from '../context/UserAuthContext';
import BackHeader from '../components/BackHeader';

export default function ScoreDetailScreen({ route, navigation }) {
  const { plan } = route.params;
  const { user, isAdmin, loading: authLoading } = useUserAuth();

  const [scores, setScores] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [assets] = useAssets([require('../../assets/pnvc.png')]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigation.goBack();
      return;
    }

    const isOwnerTeacher = user.email === plan.teacherEmail;

    if (!isAdmin && !isOwnerTeacher) {
      navigation.goBack();
      return;
    }

    const scoreRef = ref(db, `scores/${plan.id}`);

    const unsubscribe = onValue(scoreRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        list.sort((a, b) => {
          const aId = a.studentId || '';
          const bId = b.studentId || '';
          return aId.localeCompare(bId);
        });

        setScores(list);
      } else {
        setScores([]);
      }

      setPageLoading(false);
    });

    return () => unsubscribe();
  }, [authLoading, user, isAdmin, plan, navigation]);

  const getAverageGrade = () => {
    if (scores.length === 0) return '0.00';
    const sum = scores.reduce((acc, item) => acc + Number(item.grade || 0), 0);
    return (sum / scores.length).toFixed(2);
  };

  const showPopup = (title, message) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleExportPdf = async () => {
    try {
      if (scores.length === 0) {
        showPopup('แจ้งเตือน', 'ยังไม่มีข้อมูลผลการเรียนสำหรับส่งออก PDF');
        return;
      }

      const logoUri = assets?.[0]?.uri || '';
      const avgGrade = getAverageGrade();

      const rowsHtml = scores
        .map(
          (item, index) => `
            <tr>
              <td class="center">${index + 1}</td>
              <td class="center">${plan.subjectCode || '-'}</td>
              <td class="left">${plan.subjectName || '-'}</td>
              <td class="center">${item.total ?? 0}</td>
              <td class="center">${item.grade ?? 0}</td>
            </tr>
          `
        )
        .join('');

      const firstStudent = scores[0] || {};

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page {
                size: A4 portrait;
                margin: 14mm 12mm 14mm 12mm;
              }

              body {
                font-family: Arial, sans-serif;
                color: #111;
                font-size: 13px;
                line-height: 1.35;
              }

              .page {
                width: 100%;
              }

              .top {
                display: table;
                width: 100%;
                margin-bottom: 8px;
              }

              .top-left {
                display: table-cell;
                width: 80px;
                vertical-align: top;
              }

              .top-center {
                display: table-cell;
                vertical-align: top;
                text-align: center;
              }

              .logo {
                width: 58px;
                height: 58px;
                object-fit: contain;
              }

              .college {
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 2px;
              }

              .address {
                font-size: 12px;
                margin-bottom: 6px;
              }

              .report-title {
                font-size: 20px;
                font-weight: bold;
                margin-top: 6px;
              }

              .student-grid {
                width: 100%;
                margin-top: 10px;
                margin-bottom: 10px;
                border-bottom: 1px solid #111;
                padding-bottom: 8px;
              }

              .student-grid table {
                width: 100%;
                border-collapse: collapse;
              }

              .student-grid td {
                width: 50%;
                padding: 2px 4px;
                vertical-align: top;
                font-size: 13px;
              }

              .label {
                font-weight: bold;
                white-space: nowrap;
              }

              .score-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
              }

              .score-table thead th {
                border-top: 1px solid #111;
                border-bottom: 1px solid #111;
                padding: 6px 4px;
                font-weight: bold;
                font-size: 13px;
              }

              .score-table tbody td {
                padding: 5px 4px;
                font-size: 13px;
              }

              .left {
                text-align: left;
              }

              .center {
                text-align: center;
              }

              .term-row td {
                padding-top: 10px;
                padding-bottom: 6px;
                font-weight: bold;
              }

              .summary {
                width: 100%;
                margin-top: 10px;
              }

              .summary table {
                width: 100%;
                border-collapse: collapse;
              }

              .summary td {
                width: 50%;
                padding: 4px;
                font-size: 13px;
                text-align: center;
              }

              .footer-line {
                border-top: 1px solid #111;
                margin-top: 40px;
              }
            </style>
          </head>
          <body>
            <div class="page">
              <div class="top">
                <div class="top-left">
                  ${logoUri ? `<img class="logo" src="${logoUri}" />` : ''}
                </div>
                <div class="top-center">
                  <div class="college">วิทยาลัยอาชีวศึกษาปัตตานี</div>
                  <div class="address">10 ต.สะบารัง อ.เมืองปัตตานี จ.ปัตตานี 94000</div>
                  <div class="report-title">รายงานผลการศึกษา</div>
                </div>
              </div>

              <div class="student-grid">
                <table>
                  <tr>
                    <td><span class="label">รหัสนักศึกษา :</span> ${firstStudent.studentId || '-'}</td>
                    <td><span class="label">ชื่อ - สกุล :</span> ${firstStudent.studentName || '-'}</td>
                  </tr>
                  <tr>
                    <td><span class="label">รหัสกลุ่มเรียน :</span> -</td>
                    <td><span class="label">กลุ่มเรียน :</span> สารสนเทศ</td>
                  </tr>
                  <tr>
                    <td><span class="label">ชั้นปี :</span> -</td>
                    <td><span class="label">ประเภทวิชา :</span> อุตสาหกรรมดิจิทัลและเทคโนโลยีสารสนเทศ</td>
                  </tr>
                  <tr>
                    <td><span class="label">ประเภทนักเรียน :</span> ปกติ</td>
                    <td><span class="label">กลุ่มอาชีพ :</span> คอมพิวเตอร์และการประยุกต์</td>
                  </tr>
                  <tr>
                    <td><span class="label">สถานะนักเรียน :</span> กำลังศึกษา</td>
                    <td><span class="label">สาขาวิชา :</span> สารสนเทศ</td>
                  </tr>
                </table>
              </div>

              <table class="score-table">
                <thead>
                  <tr>
                    <th class="center" style="width:8%;">ลำดับ</th>
                    <th class="center" style="width:18%;">รหัสวิชา</th>
                    <th class="left" style="width:54%;">ชื่อวิชา</th>
                    <th class="center" style="width:10%;">หน่วยกิต</th>
                    <th class="center" style="width:10%;">เกรด</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="term-row">
                    <td></td>
                    <td colspan="4" class="left">ภาคเรียนที่ 2/2568</td>
                  </tr>
                  ${rowsHtml}
                </tbody>
              </table>

              <div class="summary">
                <table>
                  <tr>
                    <td>หน่วยกิตประจำภาค : -</td>
                    <td>เกรดเฉลี่ยประจำภาค : ${avgGrade}</td>
                  </tr>
                  <tr>
                    <td>หน่วยกิตสะสม : -</td>
                    <td>เกรดเฉลี่ยสะสม : ${avgGrade}</td>
                  </tr>
                </table>
              </div>

              <div class="footer-line"></div>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });

      const canShare = await Sharing.isAvailableAsync();

      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'ส่งออกผลการเรียนเป็น PDF',
          UTI: 'com.adobe.pdf',
        });
      } else {
        showPopup('สำเร็จ', `สร้าง PDF เรียบร้อยแล้ว\n${uri}`);
      }
    } catch (error) {
      console.log('export pdf error:', error);
      showPopup('ผิดพลาด', 'สร้าง PDF ไม่สำเร็จ');
    }
  };

  const renderItem = ({ item, index }) => (
    <View style={styles.tableRow}>
      <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>
      <Text style={[styles.td, styles.colStudentId]}>{item.studentId}</Text>
      <Text style={[styles.td, styles.colName]}>{item.studentName}</Text>
      <Text style={[styles.td, styles.colTotal]}>{item.total}</Text>
      <Text style={[styles.td, styles.colGrade]}>{item.grade}</Text>
    </View>
  );

  if (authLoading || pageLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={styles.loadingText}>กำลังโหลด...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <BackHeader
        title="กลับหน้าก่อนหน้า"
        onPress={() => navigation.goBack()}
      />

      <View style={styles.container}>
        <Text style={styles.header}>ผลการเรียนรายวิชา</Text>
        <Text style={styles.subjectCode}>
          {plan.subjectCode} - {plan.subjectName}
        </Text>

        <View style={styles.topActionRow}>
          <TouchableOpacity style={styles.pdfBtn} onPress={handleExportPdf}>
            <Text style={styles.pdfBtnText}>ส่งออก PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>ครูผู้สอน: {plan.teacherName}</Text>
          <Text style={styles.infoText}>เวลาเรียน: {plan.studyTime}</Text>
          <Text style={styles.infoText}>จำนวนผู้เรียน: {scores.length} คน</Text>
          <Text style={styles.infoText}>เกรดเฉลี่ยรายวิชา: {getAverageGrade()}</Text>
        </View>

        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNo]}>ลำดับ</Text>
            <Text style={[styles.th, styles.colStudentId]}>รหัสนักเรียน</Text>
            <Text style={[styles.th, styles.colName]}>ชื่อ-สกุล</Text>
            <Text style={[styles.th, styles.colTotal]}>รวม</Text>
            <Text style={[styles.th, styles.colGrade]}>ผลการเรียน</Text>
          </View>

          {scores.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>ยังไม่มีข้อมูลผลการเรียน</Text>
            </View>
          ) : (
            <FlatList
              data={scores}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#f6f8fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#555',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 10,
  },
  subjectCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff6b00',
    lineHeight: 24,
    marginBottom: 12,
  },
  topActionRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  pdfBtn: {
    backgroundColor: '#d32f2f',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  pdfBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    elevation: 2,
  },
  infoText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  tableCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#8a8a8a',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  th: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  td: {
    fontSize: 13,
    color: '#222',
    textAlign: 'center',
    lineHeight: 20,
  },
  colNo: {
    flex: 0.9,
  },
  colStudentId: {
    flex: 2.2,
  },
  colName: {
    flex: 3.4,
    textAlign: 'left',
    paddingHorizontal: 6,
  },
  colTotal: {
    flex: 1.2,
  },
  colGrade: {
    flex: 1.4,
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: '#777',
  },
});