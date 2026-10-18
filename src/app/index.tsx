import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Image, Alert, Platform, Modal, ActivityIndicator, Linking } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Feather from '@expo/vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

type CustomAttachment = {
  id: string;
  label: string;
  image: string | null;
};

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [landlordName, setLandlordName] = useState('Saiful Hasan Khan');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('536/02/636 New Madeyganj, Triveni Nagar 3, Khadra, Lucknow');
  const [tenantName, setTenantName] = useState('Shoeb Ahmad Khan');
  const [unitRate, setUnitRate] = useState('7.5');
  
  const [currentReading, setCurrentReading] = useState('');
  const [currentReadingMonth, setCurrentReadingMonth] = useState('');
  const [previousReading, setPreviousReading] = useState('');
  const [previousReadingMonth, setPreviousReadingMonth] = useState('');
  
  const [rentAmount, setRentAmount] = useState('8000');
  const [rentMonth, setRentMonth] = useState('');
  
  const [waterCharge, setWaterCharge] = useState('100');
  const [waterMonth, setWaterMonth] = useState('');
  
  const [elecMonth, setElecMonth] = useState('');

  const [meterImage, setMeterImage] = useState<string | null>(null);
  const [rentReceiptImage, setRentReceiptImage] = useState<string | null>(null);
  const [utilityReceiptImage, setUtilityReceiptImage] = useState<string | null>(null);
  
  const [extraAttachments, setExtraAttachments] = useState<CustomAttachment[]>([]);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [generatedPdfUri, setGeneratedPdfUri] = useState('');
  const [generatedPdfBase64, setGeneratedPdfBase64] = useState('');
  const [generatedDateString, setGeneratedDateString] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  useFocusEffect(
    useCallback(() => {
      const loadDefaults = async () => {
        const ln = await AsyncStorage.getItem('landlordName');
        const lp = await AsyncStorage.getItem('landlordPhone');
        const la = await AsyncStorage.getItem('landlordAddress');
        const tn = await AsyncStorage.getItem('tenantName');
        const ur = await AsyncStorage.getItem('unitRate');
        if (ln) setLandlordName(ln);
        if (lp) setLandlordPhone(lp);
        if (la) setLandlordAddress(la);
        if (tn) setTenantName(tn);
        if (ur) setUnitRate(ur);
      };
      loadDefaults();
    }, [])
  );

  const pickImage = async (setImage: (uri: string) => void) => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setImage(`data:image/jpeg;base64,${asset.base64}`);
      }
    } catch (e: any) {
      console.log('Image picker error', e);
      Alert.alert('Error', e?.message || 'Could not pick image.');
    }
  };

  const totals = useMemo(() => {
    const cur = parseFloat(currentReading || '0');
    const prev = parseFloat(previousReading || '0');
    const hasCurrent = currentReading.trim() !== '';
    const hasPrevious = previousReading.trim() !== '';
    const hasBoth = hasCurrent && hasPrevious;
    const isNegative = hasBoth && cur < prev;
    const units = hasBoth ? Math.max(0, cur - prev) : 0;
    const rate = parseFloat(unitRate || '7.5');
    const elecCharge = units * rate;
    const rent = parseFloat(rentAmount || '0');
    const water = parseFloat(waterCharge || '0');
    const totalAmount = rent + water + elecCharge;
    return {
      hasCurrent,
      hasPrevious,
      hasBoth,
      isNegative,
      cur,
      prev,
      units,
      rate,
      elecCharge,
      rent,
      water,
      totalAmount,
    };
  }, [currentReading, previousReading, unitRate, rentAmount, waterCharge]);

  const calculateTotals = () => {
    return totals;
  };

  const openPreview = async () => {
    const { units, elecCharge, rent, water, totalAmount } = calculateTotals();
    const generatedOn = new Date().toLocaleDateString('en-GB');

    const html = `
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #1a5632; padding-bottom: 10px; margin-bottom: 20px; }
            .header h1 { color: #1a5632; margin: 0; font-size: 28px; display: flex; align-items: center; }
            .date { text-align: right; font-size: 14px; color: #666; }
            .section { margin-bottom: 20px; }
            .label { font-size: 12px; color: #888; text-transform: uppercase; font-weight: bold; margin-bottom: 5px; }
            .value { font-size: 18px; font-weight: bold; color: #111; }
            .sub-value { font-size: 14px; color: #555; }
            .card { background-color: #f7f9f8; border-left: 4px solid #1a5632; padding: 15px; margin-bottom: 20px; border-radius: 4px; }
            .card-title { color: #1a5632; font-weight: bold; margin-bottom: 10px; display: flex; align-items: center; }
            .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
            .bold { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; padding: 10px 0; font-size: 12px; color: #888; border-bottom: 1px solid #eee; text-transform: uppercase; }
            td { padding: 15px 0; border-bottom: 1px solid #eee; }
            .amount { text-align: right; font-weight: bold; font-size: 16px; }
            .total-row { font-size: 20px; font-weight: bold; color: #1a5632; border-bottom: 2px solid #111; border-top: 2px solid #111; }
            .total-row td { padding: 15px 0; }
            .footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 30px; }
            .page-break { page-break-before: always; }
            .image-title { color: #1a5632; font-size: 18px; font-weight: bold; margin-bottom: 10px; margin-top: 20px; }
            .attached-image { max-width: 100%; max-height: 800px; display: block; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="header">
            <div style="display:flex; align-items:center;">
              <svg style="width:32px;height:32px;margin-right:10px;color:#1a5632;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <div>
                <h1>RENT RECEIPT</h1>
                <div style="font-size:12px;color:#888;">Payment Confirmation</div>
              </div>
            </div>
            <div class="date">
              Generated On<br/><span style="font-weight:bold;color:#111;font-size:16px">${generatedOn}</span>
            </div>
          </div>

          <div class="section" style="border-bottom: 1px dashed #eee; padding-bottom: 15px;">
            <div class="label">PAID TO (LANDLORD)</div>
            <div class="value">${landlordName || 'N/A'}</div>
            <div class="sub-value">${landlordAddress || 'N/A'}</div>
          </div>

          <div class="section" style="border-bottom: 1px dashed #eee; padding-bottom: 15px;">
            <div class="label">PAID BY (TENANT)</div>
            <div class="value">${tenantName || 'N/A'}</div>
          </div>

          <div class="card">
            <div class="card-title">⚡ Electricity Calculation</div>
            <div class="row">
              <span>Current Reading (${currentReadingMonth || '-'})</span>
              <span>${currentReading || '0'}</span>
            </div>
            <div class="row" style="border-bottom: 1px dashed #ddd; padding-bottom: 8px; margin-bottom: 12px;">
              <span>Previous Reading (${previousReadingMonth || '-'})</span>
              <span>${previousReading || '0'}</span>
            </div>
            <div class="row bold">
              <span>${units} Units × ₹${unitRate || '0'}/unit</span>
              <span>₹${elecCharge.toFixed(2)}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>DESCRIPTION</th>
                <th style="text-align: right;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div class="bold">Monthly Rent</div>
                  <div class="sub-value" style="font-size: 12px;">For Month: ${rentMonth || '-'}</div>
                </td>
                <td class="amount">₹${rent.toFixed(2)}</td>
              </tr>
              <tr>
                <td>
                  <div class="bold">Water Charge</div>
                  <div class="sub-value" style="font-size: 12px;">For Month: ${waterMonth || '-'}</div>
                </td>
                <td class="amount">₹${water.toFixed(2)}</td>
              </tr>
              <tr>
                <td>
                  <div class="bold">Electricity Charge</div>
                  <div class="sub-value" style="font-size: 12px;">For Month: ${elecMonth || '-'}</div>
                </td>
                <td class="amount">₹${elecCharge.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td style="border-top: 2px solid #111; border-bottom: 2px solid #111;">Total Paid</td>
                <td class="amount" style="border-top: 2px solid #111; border-bottom: 2px solid #111;">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Rent & Utility Calculator<br/>
            <span style="font-weight:bold;color:#1a5632;display:inline-block;margin-top:8px;">Developed by The variation web solution | Shoeb Ahmad Khan</span>
          </div>

          ${meterImage ? `
          <div class="page-break"></div>
          <div class="image-title">Meter Reading Photo</div>
          <img class="attached-image" src="${meterImage}" />
          ` : ''}

          ${rentReceiptImage ? `
          <div class="page-break"></div>
          <div class="image-title">Rent Payment Receipt</div>
          <img class="attached-image" src="${rentReceiptImage}" />
          ` : ''}

          ${utilityReceiptImage ? `
          <div class="page-break"></div>
          <div class="image-title">Utility Payment Receipt</div>
          <img class="attached-image" src="${utilityReceiptImage}" />
          ` : ''}

          ${extraAttachments.filter(a => a.image).map(a => `
          <div class="page-break"></div>
          <div class="image-title">${a.label || 'Additional Attachment'}</div>
          <img class="attached-image" src="${a.image}" />
          `).join('')}
        </body>
      </html>
    `;

    setPreviewHtml(html);
    setGeneratedDateString(generatedOn);
    setGeneratedPdfUri('');
    setIsPreviewModalVisible(true);

    try {
      // Save history record
      const newReceipt = {
        id: Date.now().toString(),
        generatedOn,
        tenantName,
        rentMonth: rentMonth || '-',
        totalAmount,
        units,
        elecCharge,
        rentAmount: rent,
        waterCharge: water
      };
      const existing = await AsyncStorage.getItem('receiptHistory');
      const history = existing ? JSON.parse(existing) : [];
      history.unshift(newReceipt);
      await AsyncStorage.setItem('receiptHistory', JSON.stringify(history));

      // Generate actual PDF file into cacheDirectory and documentDirectory via base64
      const printResult = await Print.printToFileAsync({ html, base64: true });
      const safeDate = (generatedOn || 'Receipt').replace(/[\/\s:]/g, '-');
      const cacheUri = `${FileSystem.cacheDirectory}Rent_Receipt_${safeDate}.pdf`;
      const docUri = `${FileSystem.documentDirectory}Rent_Receipt_${safeDate}.pdf`;
      if (printResult.base64) {
        await FileSystem.writeAsStringAsync(cacheUri, printResult.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        try {
          await FileSystem.writeAsStringAsync(docUri, printResult.base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch {}
        setGeneratedPdfUri(cacheUri);
        setGeneratedPdfBase64(printResult.base64);
      } else {
        setGeneratedPdfUri(printResult.uri);
      }
    } catch (e: any) {
      console.log('Error generating PDF or history', e);
    }
  };

  const ensurePdfReady = async (currentHtml: string): Promise<{ uri: string; base64: string }> => {
    const safeDate = (generatedDateString || 'Receipt').replace(/[\/\s:]/g, '-');
    const cacheUri = `${FileSystem.cacheDirectory}Rent_Receipt_${safeDate}.pdf`;
    const docUri = `${FileSystem.documentDirectory}Rent_Receipt_${safeDate}.pdf`;

    if (generatedPdfUri && generatedPdfBase64) {
      try {
        const info = await FileSystem.getInfoAsync(generatedPdfUri);
        if (info.exists) return { uri: generatedPdfUri, base64: generatedPdfBase64 };
      } catch {}
    }
    const printResult = await Print.printToFileAsync({ html: currentHtml, base64: true });
    if (printResult.base64) {
      await FileSystem.writeAsStringAsync(cacheUri, printResult.base64, {
        encoding: FileSystem.EncodingType.Base64,
      });
      try {
        await FileSystem.writeAsStringAsync(docUri, printResult.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      } catch {}
      setGeneratedPdfUri(cacheUri);
      setGeneratedPdfBase64(printResult.base64);
      return { uri: cacheUri, base64: printResult.base64 };
    } else {
      setGeneratedPdfUri(printResult.uri);
      return { uri: printResult.uri, base64: '' };
    }
  };

  const openDirectWhatsAppChat = () => {
    let cleanPhone = (landlordPhone || '').replace(/\D/g, '');
    if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

    if (!cleanPhone || cleanPhone.length < 10) {
      Alert.alert(
        'Landlord Phone Missing',
        'Please enter Landlord WhatsApp number in Settings first.',
        [
          { text: 'Open Settings', onPress: () => { setIsPreviewModalVisible(false); router.push('/settings'); } },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    const { totalAmount: totalPaid } = calculateTotals();
    const msg = `*RENT RECEIPT CONFIRMATION*\n` +
      `--------------------------------\n` +
      `*Tenant:* ${tenantName || 'Tenant'}\n` +
      `*Landlord:* ${landlordName || 'Landlord'}\n` +
      `*Rent Month:* ${rentMonth || 'This Month'}\n` +
      `*Total Paid:* ₹${totalPaid}\n` +
      `*Date:* ${generatedDateString}\n` +
      `--------------------------------\n` +
      `_Receipt generated via Rent Receipt App_`;

    Linking.openURL(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`).catch(() => {
      Alert.alert('Error', 'WhatsApp could not be opened. Make sure WhatsApp is installed.');
    });
  };

  const handleGenerate = async (action: 'save' | 'whatsapp' | 'both' | 'other') => {
    setIsProcessing(true);
    setProcessingStatus(
      action === 'save' 
        ? 'Saving PDF to folder...' 
        : action === 'whatsapp' 
        ? 'Opening WhatsApp...' 
        : action === 'both' 
        ? 'Saving & Opening WhatsApp...' 
        : 'Preparing Share...'
    );

    let uri = '';
    let pdfB64 = '';
    try {
      const ready = await ensurePdfReady(previewHtml);
      uri = ready.uri;
      pdfB64 = ready.base64;
    } catch (pdfErr: any) {
      setIsProcessing(false);
      Alert.alert('PDF Error', 'Failed to compile PDF: ' + (pdfErr?.message || 'Unknown error'));
      return;
    }

    const safeShare = async (targetUri: string) => {
      try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          Alert.alert('Sharing Unavailable', 'File sharing is not supported on this device.');
          return;
        }
        await Sharing.shareAsync(targetUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Rent Receipt',
          UTI: 'com.adobe.pdf',
        });
      } catch (e: any) {
        console.log('Share dismissed or error:', e);
      }
    };

    const saveToFolder = async (targetUri: string, base64Payload: string): Promise<boolean> => {
      let savedDir = await AsyncStorage.getItem('saveDirectory');
      if (!savedDir) {
        try {
          const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
          if (permissions && permissions.granted) {
            savedDir = permissions.directoryUri;
            await AsyncStorage.setItem('saveDirectory', savedDir);
          } else {
            Alert.alert('Save Cancelled', 'No folder was selected.');
            return false;
          }
        } catch (safPickerErr: any) {
          console.log('SAF Picker Error', safPickerErr);
          Alert.alert('Folder Error', safPickerErr?.message || 'Could not launch folder picker.');
          return false;
        }
      }

      try {
        const safeDate = generatedDateString.replace(/\//g, '-');
        const fileName = `Receipt_${safeDate}_${Date.now()}.pdf`;
        const dataToWrite = base64Payload || (await FileSystem.readAsStringAsync(targetUri, { encoding: FileSystem.EncodingType.Base64 }));
        const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(savedDir, fileName, 'application/pdf');
        await FileSystem.writeAsStringAsync(newFileUri, dataToWrite, { encoding: FileSystem.EncodingType.Base64 });
        return true;
      } catch (safWriteErr: any) {
        console.log('SAF Write Error', safWriteErr);
        Alert.alert(
          'Folder Save Issue',
          'Failed to write to your chosen folder. Would you like to select a new folder or share using the system menu?',
          [
            {
              text: 'Select New Folder',
              onPress: async () => {
                await AsyncStorage.removeItem('saveDirectory');
                await saveToFolder(targetUri, base64Payload);
              }
            },
            {
              text: 'Share / Export',
              onPress: () => safeShare(targetUri)
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return false;
      }
    };

    const shareToWhatsApp = async (targetUri: string): Promise<boolean> => {
      await safeShare(targetUri);
      return true;
    };

    try {
      if (action === 'save') {
        const didSave = await saveToFolder(uri, pdfB64);
        if (didSave) {
          Alert.alert('Saved Successfully', 'PDF has been saved to your selected folder!', [
            { text: 'Keep Previewing', style: 'cancel' },
            { text: 'Done', onPress: () => setIsPreviewModalVisible(false) }
          ]);
        }
      } else if (action === 'whatsapp') {
        await shareToWhatsApp(uri);
      } else if (action === 'both') {
        const didSave = await saveToFolder(uri, pdfB64);
        if (didSave) {
          await shareToWhatsApp(uri);
        }
      } else {
        await safeShare(uri);
      }
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const addCustomAttachment = () => {
    setExtraAttachments([...extraAttachments, { id: Date.now().toString(), label: '', image: null }]);
  };

  const removeCustomAttachment = (index: number) => {
    const newAtt = [...extraAttachments];
    newAtt.splice(index, 1);
    setExtraAttachments(newAtt);
  };

  const updateCustomAttachmentLabel = (index: number, text: string) => {
    const newAtt = [...extraAttachments];
    newAtt[index].label = text;
    setExtraAttachments(newAtt);
  };

  const updateCustomAttachmentImage = (index: number, uri: string) => {
    const newAtt = [...extraAttachments];
    newAtt[index].image = uri;
    setExtraAttachments(newAtt);
  };

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>New Receipt</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Fill in the details to generate a professional PDF.</Text>
        </View>

        <LinearGradient colors={theme.cardGradient} style={[styles.card, { borderColor: theme.cardBorder }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardHeader}>
            <Feather name="zap" color={theme.electricityAccent} size={22} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Electricity Reading</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Current Reading</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={currentReading} 
                onChangeText={setCurrentReading} 
                placeholder="e.g. 3241" 
                placeholderTextColor={theme.textMuted} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Month</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={currentReadingMonth} 
                onChangeText={setCurrentReadingMonth} 
                placeholder="e.g. Apr" 
                placeholderTextColor={theme.textMuted} 
              />
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Previous Reading</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={previousReading} 
                onChangeText={setPreviousReading} 
                placeholder="e.g. 3100" 
                placeholderTextColor={theme.textMuted} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Month</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={previousReadingMonth} 
                onChangeText={setPreviousReadingMonth} 
                placeholder="e.g. Mar" 
                placeholderTextColor={theme.textMuted} 
              />
            </View>
          </View>

          <View style={styles.inputWrapFull}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>Charge For Month</Text>
            <TextInput 
              style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
              value={elecMonth} 
              onChangeText={setElecMonth} 
              placeholder="e.g. March 2026" 
              placeholderTextColor={theme.textMuted} 
            />
          </View>

          {totals.hasBoth ? (
            totals.isNegative ? (
              <View style={styles.elecWarningBox}>
                <Feather name="alert-triangle" color="#ff9f0a" size={16} style={{marginRight: 8}} />
                <Text style={styles.elecWarningText}>
                  Current reading ({currentReading}) is lower than previous reading ({previousReading}). Please verify!
                </Text>
              </View>
            ) : (
              <LinearGradient 
                colors={[theme.electricityBg, 'rgba(0,0,0,0)']} 
                style={[styles.elecCalcBox, { borderColor: theme.electricityAccent + '40' }]}
                start={{ x: 0, y: 0 }} 
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.elecCalcHeader}>
                  <View style={[styles.elecBadge, { backgroundColor: theme.electricityBg }]}>
                    <Feather name="zap" color={theme.electricityAccent} size={14} style={{marginRight: 4}} />
                    <Text style={[styles.elecBadgeText, { color: theme.electricityAccent }]}>{totals.units} Units Consumed</Text>
                  </View>
                  <Text style={[styles.elecFormulaText, { color: theme.textSecondary }]}>
                    {totals.units} Units × ₹{totals.rate}/unit
                  </Text>
                </View>
                
                <View style={[styles.elecCalcDivider, { backgroundColor: theme.electricityAccent + '25' }]} />
                
                <View style={styles.elecCalcAmountRow}>
                  <View>
                    <Text style={[styles.elecCalcLabel, { color: theme.text }]}>Electricity Amount to Pay</Text>
                    <Text style={[styles.elecCalcSubLabel, { color: theme.textMuted }]}>{elecMonth ? `For ${elecMonth}` : 'Calculated in real-time'}</Text>
                  </View>
                  <Text style={[styles.elecCalcAmountText, { color: theme.electricityAccent }]}>₹{totals.elecCharge.toFixed(2)}</Text>
                </View>
              </LinearGradient>
            )
          ) : totals.hasCurrent || totals.hasPrevious ? (
            <View style={styles.elecHintBox}>
              <Feather name="info" color={theme.textMuted} size={14} style={{marginRight: 6}} />
              <Text style={[styles.elecHintText, { color: theme.textMuted }]}>
                {!totals.hasCurrent ? 'Fill Current Reading to calculate amount' : 'Fill Previous Reading to calculate amount'}
              </Text>
            </View>
          ) : null}
        </LinearGradient>

        <LinearGradient colors={theme.cardGradient} style={[styles.card, { borderColor: theme.cardBorder }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardHeader}>
            <Feather name="home" color={theme.rentAccent} size={22} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Rent & Water</Text>
          </View>
          
          <View style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Rent Amount</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={rentAmount} 
                onChangeText={setRentAmount} 
                placeholder="₹8000" 
                placeholderTextColor={theme.textMuted} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Rent Month</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={rentMonth} 
                onChangeText={setRentMonth} 
                placeholder="e.g. April 2026" 
                placeholderTextColor={theme.textMuted} 
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Water Charge</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={waterCharge} 
                onChangeText={setWaterCharge} 
                placeholder="₹100" 
                placeholderTextColor={theme.textMuted} 
                keyboardType="numeric" 
              />
            </View>
            <View style={styles.inputWrap}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Water Month</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                value={waterMonth} 
                onChangeText={setWaterMonth} 
                placeholder="e.g. March 2026" 
                placeholderTextColor={theme.textMuted} 
              />
            </View>
          </View>
        </LinearGradient>

        <LinearGradient colors={theme.cardGradient} style={[styles.card, { borderColor: theme.cardBorder }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.cardHeader}>
            <Feather name="camera" color={theme.secondaryAccent} size={22} />
            <Text style={[styles.cardTitle, { color: theme.text }]}>Attachments</Text>
          </View>
          
          <AttachmentButton label="Meter Photo" image={meterImage} onPick={() => pickImage(setMeterImage)} theme={theme} />
          <AttachmentButton label="Rent Receipt" image={rentReceiptImage} onPick={() => pickImage(setRentReceiptImage)} theme={theme} />
          <AttachmentButton label="Utility Receipt" image={utilityReceiptImage} onPick={() => pickImage(setUtilityReceiptImage)} theme={theme} />
          
          {extraAttachments.map((attachment, index) => (
            <View key={attachment.id} style={[styles.customAttachmentBox, { borderColor: theme.borderColor }]}>
              <View style={styles.customAttachmentHeader}>
                <TextInput 
                  style={[styles.customAttachmentInput, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
                  value={attachment.label} 
                  onChangeText={(text) => updateCustomAttachmentLabel(index, text)}
                  placeholder="e.g. Agreement Page" 
                  placeholderTextColor={theme.textMuted} 
                />
                <TouchableOpacity onPress={() => removeCustomAttachment(index)} style={styles.deleteBtn}>
                  <Feather name="trash-2" color="#ff453a" size={18} />
                </TouchableOpacity>
              </View>
              <AttachmentButton 
                label={attachment.label || "Custom Attachment"} 
                image={attachment.image} 
                onPick={() => pickImage((uri) => updateCustomAttachmentImage(index, uri))} 
                theme={theme}
              />
            </View>
          ))}

          <TouchableOpacity 
            style={[styles.addAttachmentBtn, { borderColor: theme.secondaryAccent, backgroundColor: theme.badgeBg }]} 
            onPress={addCustomAttachment}
          >
            <Feather name="plus" color={theme.secondaryAccent} size={20} style={{marginRight: 6}} />
            <Text style={[styles.addAttachmentText, { color: theme.secondaryAccent }]}>Add Custom Attachment</Text>
          </TouchableOpacity>
        </LinearGradient>
        
        <View style={styles.creditFooter}>
          <Text style={[styles.creditFooterText, { color: theme.textMuted }]}>Developed by</Text>
          <Text style={[styles.creditFooterTextBold, { color: theme.primary }]}>The variation web solution | Shoeb Ahmad Khan</Text>
        </View>
        
        <View style={{height: 40}} />
      </ScrollView>

      <View style={[styles.floatingButtonContainer, { backgroundColor: theme.floatingBarBg, borderTopColor: theme.floatingBorder, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.liveSummaryRow}>
          <View>
            <Text style={[styles.liveSummaryLabel, { color: theme.textSecondary }]}>Total Payable Amount</Text>
            <Text style={[styles.liveSummarySubLabel, { color: theme.textMuted }]}>
              {totals.elecCharge > 0 ? `Elec: ₹${totals.elecCharge.toFixed(0)} + Rent: ₹${totals.rent.toFixed(0)}` : 'Rent + Utilities'}
            </Text>
          </View>
          <Text style={[styles.liveSummaryTotal, { color: theme.primary }]}>₹{totals.totalAmount.toFixed(2)}</Text>
        </View>

        <TouchableOpacity onPress={openPreview} activeOpacity={0.85}>
          <LinearGradient colors={theme.primaryGradient} style={styles.generateButton}>
            <Feather name="file-text" color={theme.primaryBtnText} size={24} style={{marginRight: 8}} />
            <Text style={[styles.generateButtonText, { color: theme.primaryBtnText }]}>Review & Generate</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <Modal visible={isPreviewModalVisible} animationType="slide" transparent={false} onRequestClose={() => setIsPreviewModalVisible(false)}>
        <View style={[styles.fullScreenModal, { backgroundColor: theme.modalBg }]}>
          <View style={[styles.modalHeader, { backgroundColor: theme.modalHeaderBg, borderBottomColor: theme.modalHeaderBorder, paddingTop: Platform.OS === 'ios' ? insets.top + 10 : insets.top + 14 }]}>
            <Text style={[styles.modalHeaderTitle, { color: theme.text }]}>Receipt Preview</Text>
            <TouchableOpacity onPress={() => setIsPreviewModalVisible(false)} style={styles.closeBtn}>
              <Feather name="x" color={theme.text} size={24} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.webViewContainer}>
            {previewHtml ? (
              <WebView 
                originWhitelist={['*']} 
                source={{ html: previewHtml }} 
                style={{ flex: 1 }} 
                scalesPageToFit={Platform.OS === 'android' ? false : true}
              />
            ) : null}
          </View>

          <View style={[styles.modalActionArea, { backgroundColor: theme.modalHeaderBg, borderTopColor: theme.modalHeaderBorder, paddingBottom: Math.max(insets.bottom, 20) }]}>
            {isProcessing ? (
              <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20}}>
                <ActivityIndicator color={theme.primary} size="small" style={{marginRight: 10}} />
                <Text style={{color: theme.text, fontSize: 16, fontWeight: '600'}}>{processingStatus || 'Processing...'}</Text>
              </View>
            ) : (
              <>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12}}>
                  <TouchableOpacity onPress={() => handleGenerate('save')} style={[styles.modalBtn, {flex: 1, marginRight: 8, backgroundColor: theme.inputBg, borderColor: theme.borderColor, borderWidth: 1}]}>
                    <Feather name="folder" color={theme.text} size={18} style={{marginRight: 6}} />
                    <Text style={[styles.modalBtnText, { color: theme.text }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleGenerate('whatsapp')} style={[styles.modalBtn, {flex: 1, marginLeft: 8, backgroundColor: '#25D366'}]}>
                    <Feather name="share-2" color="#000" size={18} style={{marginRight: 6}} />
                    <Text style={[styles.modalBtnText, {color: '#000'}]}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => handleGenerate('both')} style={[styles.modalBtnOutline, { borderColor: theme.primary, marginBottom: 10 }]}>
                  <Text style={[styles.modalBtnOutlineText, { color: theme.primary }]}>Save & Share Both</Text>
                </TouchableOpacity>
                {landlordPhone && landlordPhone.trim().length > 0 ? (
                  <TouchableOpacity onPress={openDirectWhatsAppChat} style={styles.directChatBtn}>
                    <Feather name="message-circle" color="#25D366" size={16} style={{marginRight: 6}} />
                    <Text style={styles.directChatBtnText}>Chat with Landlord directly on WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity onPress={() => handleGenerate('other')} style={{alignItems: 'center', padding: 8}}>
                  <Text style={{color: theme.secondaryAccent, fontSize: 14}}>More Share Options...</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function AttachmentButton({ label, image, onPick, theme }: { label: string, image: string | null, onPick: () => void, theme: any }) {
  return (
    <View style={styles.attachmentContainer}>
      <TouchableOpacity 
        onPress={onPick} 
        style={[
          styles.attachmentButton, 
          { backgroundColor: theme.inputBg, borderColor: theme.borderColor },
          image ? [styles.attachmentButtonSuccess, { borderColor: theme.primary, backgroundColor: theme.badgeBg }] : null
        ]}
        activeOpacity={0.7}
      >
        <Feather name={image ? "check-circle" : "image"} color={image ? theme.primary : theme.textMuted} size={20} />
        <Text style={[styles.attachmentText, { color: theme.textSecondary }, image ? { color: theme.primary } : null]}>
          {image ? `${label} Added` : `Add ${label}`}
        </Text>
      </TouchableOpacity>
      {image && <Image source={{ uri: image }} style={[styles.previewImage, { borderColor: theme.borderColor }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#0a0a0a' },
  scrollContent: { padding: 20 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888' },
  card: { borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: '#333', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  inputWrap: { flex: 0.48 },
  inputWrapFull: { width: '100%' },
  label: { color: '#aaa', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: '#161616', borderWidth: 1, borderColor: '#333', padding: 14, borderRadius: 12, color: '#fff', fontSize: 16 },
  attachmentContainer: { marginBottom: 12 },
  attachmentButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161616', borderWidth: 1, borderColor: '#333', padding: 16, borderRadius: 12, borderStyle: 'dashed' },
  attachmentButtonSuccess: { borderColor: '#00d873', backgroundColor: 'rgba(0, 216, 115, 0.05)', borderStyle: 'solid' },
  attachmentText: { color: '#aaa', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  previewImage: { width: '100%', height: 180, resizeMode: 'cover', borderRadius: 12, marginTop: 12, borderWidth: 1, borderColor: '#333' },
  customAttachmentBox: { marginBottom: 15, borderWidth: 1, borderColor: '#333', padding: 12, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.2)' },
  customAttachmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  customAttachmentInput: { flex: 1, backgroundColor: '#161616', borderWidth: 1, borderColor: '#333', padding: 10, borderRadius: 8, color: '#fff', fontSize: 14 },
  deleteBtn: { marginLeft: 10, padding: 10, backgroundColor: 'rgba(255, 69, 58, 0.1)', borderRadius: 8 },
  addAttachmentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderWidth: 1, borderColor: '#bf5af2', borderRadius: 12, borderStyle: 'dashed', marginTop: 5, backgroundColor: 'rgba(191, 90, 242, 0.05)' },
  addAttachmentText: { color: '#bf5af2', fontWeight: '600', fontSize: 16 },
  floatingButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: 'rgba(10, 10, 10, 0.95)', borderTopWidth: 1, borderTopColor: '#1c1c1e' },
  generateButton: { flexDirection: 'row', padding: 18, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#00d873', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  generateButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },

  fullScreenModal: { flex: 1, backgroundColor: '#0a0a0a' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, backgroundColor: '#1c1c1e', borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  modalHeaderTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  webViewContainer: { flex: 1, backgroundColor: '#fff' },
  modalActionArea: { paddingHorizontal: 20, paddingTop: 16, backgroundColor: '#1c1c1e', borderTopWidth: 1, borderTopColor: '#333' },
  modalBtn: { flexDirection: 'row', backgroundColor: '#333', padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalBtnOutline: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#00d873' },
  modalBtnOutlineText: { color: '#00d873', fontSize: 16, fontWeight: 'bold' },
  directChatBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 12, marginBottom: 6, backgroundColor: 'rgba(37, 211, 102, 0.1)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(37, 211, 102, 0.3)' },
  directChatBtnText: { color: '#25D366', fontSize: 13, fontWeight: '600' },
  
  creditFooter: { alignItems: 'center', marginVertical: 20 },
  creditFooterText: { color: '#666', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  creditFooterTextBold: { color: '#00d873', fontSize: 12, fontWeight: '700' },

  elecCalcBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.3)',
  },
  elecCalcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elecBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 214, 10, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  elecBadgeText: {
    color: '#ffd60a',
    fontSize: 12,
    fontWeight: '700',
  },
  elecFormulaText: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },
  elecCalcDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 214, 10, 0.15)',
    marginVertical: 10,
  },
  elecCalcAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  elecCalcLabel: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  elecCalcSubLabel: {
    color: '#888',
    fontSize: 11,
    marginTop: 2,
  },
  elecCalcAmountText: {
    color: '#ffd60a',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  elecWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: 'rgba(255, 159, 10, 0.12)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 159, 10, 0.3)',
  },
  elecWarningText: {
    color: '#ff9f0a',
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  elecHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    padding: 10,
  },
  elecHintText: {
    color: '#888',
    fontSize: 12,
  },
  liveSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  liveSummaryLabel: {
    color: '#aaa',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  liveSummarySubLabel: {
    color: '#666',
    fontSize: 11,
    marginTop: 2,
  },
  liveSummaryTotal: {
    color: '#00d873',
    fontSize: 22,
    fontWeight: '800',
  }
});
