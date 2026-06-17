import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated from 'react-native-reanimated';
import { FadeInUp } from 'react-native-reanimated';import Loader from './Loader';
import { useXderma } from '../context/AppContext';
import { analyzeImageQuality } from "../utils/imageQuality";
import SmartLoader from "./SmartLoader";
import { Image as RNImage } from "react-native";

type SelectedImage = {
  uri: string;
};

const { width } = Dimensions.get('window');
const ANALYSIS_DURATION_MS = 8 * 1000;

const SAMPLE_IMAGES: SelectedImage[] = [
  { uri: RNImage.resolveAssetSource(require('../assets/sd1.webp')).uri },
  { uri: RNImage.resolveAssetSource(require('../assets/sd2.webp')).uri },
  { uri: RNImage.resolveAssetSource(require('../assets/sd3.jpg')).uri },
];

export default function SkinAnalysisScreen({ navigation }: any) {
  const { t } = useXderma();
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showScanLoader, setShowScanLoader] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
  if (showScanLoader) {
    const timer = setTimeout(() => {
      setShowScanLoader(false);

      // 👉 HERE you open your result modal later
      // setShowResult(true);

    }, 4000); // scanner duration

    return () => clearTimeout(timer);
  }
}, [showScanLoader]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImage({ uri: result.assets[0].uri });
    }
  };

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({ quality: 1 });
    if (!result.canceled) {
      setSelectedImage({ uri: result.assets[0].uri });
    }
  };

const handleAnalyze = async () => {
  if (!selectedImage || isAnalyzing) return;

  try {
    const result = await analyzeImageQuality(selectedImage.uri);

    if (result.isBlurry || result.isTooDark || result.isLowContrast) {
      let message = "";

      if (result.isBlurry) message += "• Image is blurry\n";
      if (result.isTooDark) message += "• Lighting is too low\n";
      if (result.isLowContrast) message += "• Poor contrast\n";

      alert(`⚠️ Image Quality Issue\n\n${message}\nPlease retake a clearer photo.`);
      return;
    }

    // Phase 1
    setIsAnalyzing(true);

  } catch (error) {
    console.log(error);
  }
};

return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.card}>
          <Text style={styles.badge}>{t('skinAnalysis.badge')}</Text>
          <Text style={styles.title}>{t('skinAnalysis.title')}</Text>
          <Text style={styles.subtitle}>
            {t('skinAnalysis.subtitle')}
          </Text>

          <View style={[styles.uploadBox, selectedImage ? styles.uploadBoxSelected : null]}>
            {selectedImage ? (
              <>
                <Image source={{ uri: selectedImage.uri }} style={styles.preview} />
                <TouchableOpacity
                  accessibilityLabel={t('skinAnalysis.removeImage')}
                  style={styles.removeBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <X color="#FFFFFF" size={18} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Upload color="#9CA3AF" size={32} />
                <Text style={styles.uploadText}>{t('skinAnalysis.dropImage')}</Text>
                <Text style={styles.smallText}>{t('skinAnalysis.browseHint')}</Text>
              </>
            )}

            {!selectedImage && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.browseBtn} onPress={pickImage}>
                  <Upload color="#A5B4FC" size={18} />
                  <Text style={styles.browseText}>{t('skinAnalysis.browseFiles')}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
                  <Camera color="#00FFC6" size={18} />
                  <Text style={styles.cameraText}>{t('skinAnalysis.useCamera')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {selectedImage && (
            <View style={styles.symptomsContainer}>
              <Text style={styles.symptomsLabel}>{t('skinAnalysis.symptomsLabel')}</Text>
              <TextInput
                style={styles.symptomsInput}
                placeholder={t('skinAnalysis.symptomsPlaceholder')}
                placeholderTextColor="#9CA3AF"
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
                numberOfLines={4}
              />
            </View>
          )}

          <View style={styles.samplesContainer}>
            <Text style={styles.sampleTitle}>{t('skinAnalysis.sampleTitle')}</Text>
            <View style={styles.samplesRow}>
              {SAMPLE_IMAGES.map((img, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.sampleBtn,
                    selectedImage?.uri === img.uri && styles.sampleBtnSelected,
                  ]}
                  onPress={() => setSelectedImage(img)}
                >
                  <Image source={{ uri: img.uri }} style={styles.sampleImg} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.analyzeBtn,
              { backgroundColor: selectedImage && !isAnalyzing ? '#00FFC6' : '#1F2937' },
            ]}
            disabled={!selectedImage || isAnalyzing}
            onPress={handleAnalyze}
          >
            <Text
              style={[
                styles.analyzeText,
                { color: selectedImage && !isAnalyzing ? '#000000' : '#9CA3AF' },
              ]}
            >
              {isAnalyzing ? t('skinAnalysis.analyzing') : t('skinAnalysis.analyze')}
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            {t('skinAnalysis.footer')}
          </Text>
        </Animated.View>
      </ScrollView>

        <Modal transparent animationType="fade" visible={isAnalyzing}>
            <BlurView intensity={45} tint="dark" style={styles.modalOverlay}>
              <SmartLoader
                onComplete={() => {
                  setIsAnalyzing(false);
                  setShowScanLoader(true); // move to next phase
                }}
              />
            </BlurView>
          </Modal>

          <Modal transparent animationType="fade" visible={showScanLoader}>
            <BlurView intensity={45} tint="dark" style={styles.modalOverlay}>
              <Loader
                route={{ params: { image: selectedImage?.uri } }}
              />
            </BlurView>
        </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  logo: {
    color: '#38BDF8',
    fontSize: 22,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#111827',
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#064E3B',
    color: '#34D399',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    marginBottom: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  title: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  uploadBoxSelected: {
    borderColor: '#22C55E',
    backgroundColor: '#00ffc81f',
  },
  uploadText: {
    color: '#E5E7EB',
    marginTop: 10,
    fontFamily: 'Poppins_500Medium',
  },
  smallText: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 10,
  },
  browseBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#6366F1',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  browseText: {
    color: '#A5B4FC',
    fontFamily: 'Poppins_600SemiBold',
  },
  cameraBtn: {
    flexDirection: 'row',
    backgroundColor: '#022C22',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
    gap: 6,
  },
  cameraText: {
    color: '#00FFC6',
    fontFamily: 'Poppins_600SemiBold',
  },
  preview: {
    width: width * 0.7,
    height: 180,
    borderRadius: 12,
  },
  removeBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FCA5A5',
  },
  samplesContainer: {
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
  },
  sampleTitle: {
    color: '#D1D5DB',
    marginBottom: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  samplesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sampleBtn: {
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 14,
    padding: 3,
  },
  sampleBtnSelected: {
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
  },
  sampleImg: {
    width: width / 4,
    height: width / 4,
    borderRadius: 10,
  },
  analyzeBtn: {
    backgroundColor: '#1F2937',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  analyzeText: {
    fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  symptomsContainer: {
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#1f29375e',
  },
  symptomsLabel: {
    color: '#F9FAFB',
    fontSize: 16,
    marginBottom: 10,
    fontFamily: 'Poppins_600SemiBold',
  },
  symptomsInput: {
    color: '#F9FAFB',
    fontSize: 14,
    padding: 12,
    backgroundColor: '#3741518f',
    height: 60,
    borderRadius: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
  },
  loaderModal: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: 'rgba(17, 24, 39, 0.88)',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  loaderTitle: {
    color: '#F9FAFB',
    fontSize: 20,
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
  },
  loaderSubtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Poppins_400Regular',
  },
});
