import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import Feather from '@expo/vector-icons/Feather';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, THEMES, ThemeId } from '../context/ThemeContext';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, themeId, setThemeId, availableThemes } = useTheme();

  const [landlordName, setLandlordName] = useState('');
  const [landlordPhone, setLandlordPhone] = useState('');
  const [landlordAddress, setLandlordAddress] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [unitRate, setUnitRate] = useState('');
  const [saveDirectory, setSaveDirectory] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const ln = await AsyncStorage.getItem('landlordName');
    const la = await AsyncStorage.getItem('landlordAddress');
    const lp = await AsyncStorage.getItem('landlordPhone');
    const tn = await AsyncStorage.getItem('tenantName');
    const ur = await AsyncStorage.getItem('unitRate');
    const sd = await AsyncStorage.getItem('saveDirectory');
    if (ln) setLandlordName(ln);
    if (lp) setLandlordPhone(lp);
    if (la) setLandlordAddress(la);
    if (tn) setTenantName(tn);
    if (ur) setUnitRate(ur);
    if (sd) setSaveDirectory(sd);
  };

  const saveSettings = async () => {
    await AsyncStorage.setItem('landlordName', landlordName);
    await AsyncStorage.setItem('landlordPhone', landlordPhone);
    await AsyncStorage.setItem('landlordAddress', landlordAddress);
    await AsyncStorage.setItem('tenantName', tenantName);
    await AsyncStorage.setItem('unitRate', unitRate);
    Alert.alert('Settings Saved', 'Default details have been updated successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  const pickSaveDirectory = async () => {
    try {
      const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
      if (permissions && permissions.granted) {
        setSaveDirectory(permissions.directoryUri);
        await AsyncStorage.setItem('saveDirectory', permissions.directoryUri);
        Alert.alert('Folder Selected', 'PDFs and history exports will now save directly into your selected folder.');
      } else {
        Alert.alert('Selection Cancelled', 'No folder was chosen.');
      }
    } catch (e: any) {
      console.log('Error picking directory', e);
      Alert.alert('Folder Picker Error', e?.message || 'Could not launch folder picker.');
    }
  };

  const clearSaveDirectory = async () => {
    setSaveDirectory('');
    await AsyncStorage.removeItem('saveDirectory');
  };

  const getReadablePath = (uri: string) => {
    try {
      return decodeURIComponent(uri).split('tree/')[1] || uri;
    } catch {
      return 'Custom Folder Selected';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* THEMES SECTION */}
        <View style={styles.sectionHeader}>
          <Feather name="droplet" color={theme.primary} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance & Theme</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
          Choose a modern design system used by top tier tech applications.
        </Text>

        <View style={styles.themesContainer}>
          {availableThemes.map((item) => {
            const isSelected = item.id === themeId;
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setThemeId(item.id)}
                activeOpacity={0.8}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: item.cardBg,
                    borderColor: isSelected ? item.primary : item.cardBorder,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.themeCardTop}>
                  <View style={styles.swatchesRow}>
                    <View style={[styles.swatch, { backgroundColor: item.previewSwatches[0], borderColor: item.cardBorder, borderWidth: 1 }]} />
                    <View style={[styles.swatch, { backgroundColor: item.previewSwatches[1], borderColor: item.cardBorder, borderWidth: 1, marginLeft: -6 }]} />
                    <View style={[styles.swatch, { backgroundColor: item.previewSwatches[2], marginLeft: -6 }]} />
                  </View>

                  {isSelected ? (
                    <View style={[styles.activeBadge, { backgroundColor: item.badgeBg }]}>
                      <Feather name="check" color={item.primary} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.activeBadgeText, { color: item.primary }]}>Active</Text>
                    </View>
                  ) : (
                    <View style={[styles.inactiveBadge, { borderColor: item.borderColor }]}>
                      <Text style={[styles.inactiveBadgeText, { color: item.textMuted }]}>Select</Text>
                    </View>
                  )}
                </View>

                <View style={{ marginTop: 10 }}>
                  <Text style={[styles.themeName, { color: item.text }]}>{item.name}</Text>
                  <Text style={[styles.themeTagline, { color: item.textSecondary }]}>{item.tagline}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />

        {/* DEFAULT DATA SETTINGS */}
        <View style={styles.sectionHeader}>
          <Feather name="file-text" color={theme.primary} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Default Data Settings</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: theme.textSecondary }]}>
          These values will pre-fill every new receipt you generate.
        </Text>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Landlord Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
            value={landlordName} 
            onChangeText={setLandlordName} 
            placeholder="e.g. Saiful Hasan Khan" 
            placeholderTextColor={theme.textMuted} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Landlord Phone Number (WhatsApp)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
            value={landlordPhone} 
            onChangeText={setLandlordPhone} 
            placeholder="e.g. 919876543210 (Include Country Code)" 
            placeholderTextColor={theme.textMuted} 
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Landlord Address</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor, height: 80 }]} 
            value={landlordAddress} 
            onChangeText={setLandlordAddress} 
            placeholder="Address" 
            placeholderTextColor={theme.textMuted} 
            multiline 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Tenant Name</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
            value={tenantName} 
            onChangeText={setTenantName} 
            placeholder="e.g. Shoeb Ahmad Khan" 
            placeholderTextColor={theme.textMuted} 
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Unit Rate (₹)</Text>
          <TextInput 
            style={[styles.input, { backgroundColor: theme.inputBg, color: theme.text, borderColor: theme.borderColor }]} 
            value={unitRate} 
            onChangeText={setUnitRate} 
            placeholder="7.5" 
            placeholderTextColor={theme.textMuted} 
            keyboardType="numeric" 
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.borderColor }]} />

        {/* STORAGE SETTINGS */}
        <View style={styles.sectionHeader}>
          <Feather name="folder" color={theme.primary} size={18} style={{ marginRight: 8 }} />
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Storage Settings</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.primary }]}>Auto-Save Folder (Android Only)</Text>
          <Text style={[styles.sectionDesc, { color: theme.textSecondary, marginBottom: 12 }]}>
            If set, generated PDFs and exported JSONs will be saved here automatically instead of showing the Share menu.
          </Text>
          
          <TouchableOpacity 
            style={[
              styles.folderBtn, 
              { 
                backgroundColor: theme.badgeBg, 
                borderColor: theme.primary,
              }
            ]} 
            onPress={pickSaveDirectory}
          >
            <Feather name="folder" color={theme.primary} size={20} style={{marginRight: 8}} />
            <Text style={[styles.folderBtnText, { color: theme.primary }]}>
              {saveDirectory ? 'Change Folder' : 'Select a Folder'}
            </Text>
          </TouchableOpacity>

          {saveDirectory ? (
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12}}>
              <Text style={{color: theme.primary, flex: 1, fontSize: 13}} numberOfLines={2}>
                Selected: {getReadablePath(saveDirectory)}
              </Text>
              <TouchableOpacity onPress={clearSaveDirectory} style={{padding: 8}}>
                <Text style={{color: '#ff453a', fontSize: 13, fontWeight: 'bold'}}>Clear</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <View style={[styles.footerContainer, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity onPress={saveSettings} activeOpacity={0.85}>
          <LinearGradient colors={theme.primaryGradient} style={styles.saveButton}>
            <Text style={[styles.saveButtonText, { color: theme.primaryBtnText }]}>Save Defaults</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionDesc: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  themeCard: {
    width: '48%',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  themeCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swatchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inactiveBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inactiveBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  themeName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  themeTagline: {
    fontSize: 11,
  },

  divider: { height: 1, marginVertical: 20 },
  inputGroup: { marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  input: { padding: 16, borderRadius: 12, fontSize: 16, borderWidth: 1 },
  folderBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderStyle: 'dashed' },
  folderBtnText: { fontSize: 16, fontWeight: '600' },
  
  footerContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  saveButton: { padding: 18, borderRadius: 16, alignItems: 'center', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveButtonText: { fontSize: 18, fontWeight: 'bold' }
});
