import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const [history, setHistory] = useState<any[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const existing = await AsyncStorage.getItem('receiptHistory');
      if (existing) {
        setHistory(JSON.parse(existing));
      }
    } catch (e) {
      console.log('Error loading history', e);
    }
  };

  const clearHistory = async () => {
    Alert.alert("Clear History", "Are you sure you want to delete all past receipts?", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('receiptHistory');
            setHistory([]);
          } catch (e) {
            console.log('Error clearing history', e);
          }
        }
      }
    ]);
  };

  const exportHistory = async () => {
    if (history.length === 0) {
      Alert.alert('Export Failed', 'No history to export.');
      return;
    }
    try {
      const json = JSON.stringify(history, null, 2);
      const savedDir = await AsyncStorage.getItem('saveDirectory');
      
      if (savedDir) {
        try {
          const fileName = `rent_receipts_history_${Date.now()}.json`;
          const newFileUri = await FileSystem.StorageAccessFramework.createFileAsync(savedDir, fileName, 'application/json');
          await FileSystem.writeAsStringAsync(newFileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
          Alert.alert('Success', 'History exported to your selected folder!');
          return;
        } catch (safError) {
          console.log('SAF Error, falling back to share', safError);
        }
      }
      
      const fileUri = FileSystem.documentDirectory + 'rent_receipts_history.json';
      await FileSystem.writeAsStringAsync(fileUri, json, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to export history.');
    }
  };

  const importHistory = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/json', '*/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const jsonContent = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.UTF8 });
        
        const importedData = JSON.parse(jsonContent);
        
        if (!Array.isArray(importedData)) {
          throw new Error("Invalid JSON format");
        }

        const existingMap = new Map(history.map(item => [item.id, item]));
        importedData.forEach(item => {
          if (item.id) existingMap.set(item.id, item);
        });

        const merged = Array.from(existingMap.values());
        merged.sort((a, b) => (parseInt(b.id) || 0) - (parseInt(a.id) || 0));

        await AsyncStorage.setItem('receiptHistory', JSON.stringify(merged));
        setHistory(merged);
        Alert.alert('Success', `Imported ${importedData.length} records successfully!`);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to import history. Ensure the file is a valid JSON.');
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <View style={[styles.cardHeader, { borderBottomColor: theme.borderColor }]}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Feather name="file-text" color={theme.primary} size={20} style={{marginRight: 8}} />
          <Text style={[styles.dateText, { color: theme.text }]}>{item.generatedOn}</Text>
        </View>
        <Text style={[styles.totalAmount, { color: theme.primary }]}>₹{item.totalAmount?.toFixed(2)}</Text>
      </View>
      
      <View style={styles.detailsContainer}>
        <Text style={[styles.tenantName, { color: theme.textSecondary }]}>Tenant: {item.tenantName || 'N/A'}</Text>
        <Text style={[styles.monthText, { color: theme.textMuted }]}>Rent Month: {item.rentMonth}</Text>
        
        <View style={styles.breakdownRow}>
          <Feather name="home" color={theme.rentAccent} size={14} style={{marginRight: 6}} />
          <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Rent: ₹{item.rentAmount?.toFixed(2)}</Text>
        </View>
        
        <View style={styles.breakdownRow}>
          <Feather name="zap" color={theme.electricityAccent} size={14} style={{marginRight: 6}} />
          <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Elec: ₹{item.elecCharge?.toFixed(2)} ({item.units} units)</Text>
        </View>
        
        <View style={styles.breakdownRow}>
          <Feather name="droplet" color={theme.waterAccent} size={14} style={{marginRight: 6}} />
          <Text style={[styles.breakdownText, { color: theme.textSecondary }]}>Water: ₹{item.waterCharge?.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.title, { color: theme.text }]}>Past Receipts</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={importHistory} style={[styles.iconBtn, { backgroundColor: theme.badgeBg, borderColor: theme.borderColor }]}>
            <Feather name="download" color={theme.secondaryAccent} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={exportHistory} style={[styles.iconBtn, { backgroundColor: theme.badgeBg, borderColor: theme.borderColor }]}>
            <Feather name="upload" color={theme.primary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearHistory} style={styles.iconBtnDestructive}>
            <Feather name="trash-2" color="#ff453a" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 24 }]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Feather name="file-text" color={theme.textMuted} size={48} style={{marginBottom: 16}} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No past receipts found.</Text>
            <Text style={[styles.emptySubtext, { color: theme.textMuted }]}>Generated receipts will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 },
  title: { fontSize: 24, fontWeight: '700' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  iconBtn: { padding: 8, borderRadius: 8, borderWidth: 1 },
  iconBtnDestructive: { padding: 8, backgroundColor: 'rgba(255, 69, 58, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255, 69, 58, 0.3)' },
  listContent: { padding: 20, flexGrow: 1 },
  card: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, paddingBottom: 12 },
  dateText: { fontSize: 16, fontWeight: '600' },
  totalAmount: { fontSize: 18, fontWeight: 'bold' },
  detailsContainer: { gap: 6 },
  tenantName: { fontSize: 15, marginBottom: 2 },
  monthText: { fontSize: 14, marginBottom: 8 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center' },
  breakdownText: { fontSize: 13 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 18, fontWeight: '600' },
  emptySubtext: { fontSize: 14, marginTop: 8 }
});
