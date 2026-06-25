import React, { useState } from 'react';
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
  Alert,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, Upload, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useXderma } from '../context/AppContext';
import { analyzeImageQuality } from '../utils/imageQuality';
import {
  SkinAnalysisApiError,
  analyzeSkinImage,
} from '../services/skinAnalysisApi';
import { Image as RNImage } from 'react-native';
import Loader from './Loader';

type SelectedImage = {
  uri: string;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
};

const { width } = Dimensions.get('window');
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp'];

const SAMPLE_IMAGES: SelectedImage[] = [
  { uri: RNImage.resolveAssetSource(require('../assets/sd1.webp')).uri, fileName: 'sample-1.webp', mimeType: 'image/jpeg' },
  { uri: RNImage.resolveAssetSource(require('../assets/sd2.webp')).uri, fileName: 'sample-2.webp', mimeType: 'image/jpeg' },
  { uri: RNImage.resolveAssetSource(require('../assets/sd3.jpg')).uri, fileName: 'sample-3.jpg', mimeType: 'image/jpeg' },
];

const getImageMimeType = (image: SelectedImage) => {
  if (image.mimeType) {
    return image.mimeType;
  }

  const source = image.fileName || image.uri;
  const extension = source.split('?')[0]?.split('.').pop()?.toLowerCase();

  if (extension === 'png') return 'image/png';
  if (extension === 'bmp') return 'image/bmp';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';

  return 'image/jpeg';
};

const validateSelectedImage = (image: SelectedImage) => {
  const mimeType = getImageMimeType(image);

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return 'Please choose a JPG, PNG, or BMP image.';
  }

  if (image.fileSize && image.fileSize > MAX_IMAGE_SIZE) {
    return 'Please choose an image smaller than 10 MB.';
  }

  return null;
};

const imageFromAsset = (asset: ImagePicker.ImagePickerAsset): SelectedImage => ({
  uri: asset.uri,
  fileName: asset.fileName || `xderma-image.${asset.uri.split('.').pop() || 'jpg'}`,
  fileSize: asset.fileSize,
  mimeType: asset.mimeType || getImageMimeType({ uri: asset.uri, fileName: asset.fileName }),
});

export default function SkinAnalysisScreen({ navigation }: any) {
  const { t } = useXderma();
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const setValidatedImage = (image: SelectedImage) => {
    const validationError = validateSelectedImage(image);

    if (validationError) {
      Alert.alert('Unsupported image', validationError);
      return;
    }

    setSelectedImage(image);
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access to upload a skin image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
    });

    if (!result.canceled) {
      setValidatedImage(imageFromAsset(result.assets[0]));
    }
  };

  const openCamera = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow camera access to capture a skin image.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.92,
    });

    if (!result.canceled) {
      setValidatedImage(imageFromAsset(result.assets[0]));
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isAnalyzing) return;

    const validationError = validateSelectedImage(selectedImage);

    if (validationError) {
      Alert.alert('Image issue', validationError);
      return;
    }

    try {
      const result = await analyzeImageQuality(selectedImage.uri);

      if (result.isBlurry || result.isTooDark || result.isLowContrast) {
        let message = '';

        if (result.isBlurry) message += '- Image is blurry\n';
        if (result.isTooDark) message += '- Lighting is too low\n';
        if (result.isLowContrast) message += '- Poor contrast\n';

        Alert.alert('Image quality issue', `${message}\nPlease retake a clearer photo.`);
        return;
      }

      setIsAnalyzing(true);
      const prediction = await analyzeSkinImage({
        uri: selectedImage.uri,
        fileName: selectedImage.fileName,
        mimeType: getImageMimeType(selectedImage),
      });

      navigation.navigate('ResultsScreen', {
        image: selectedImage.uri,
        symptoms,
        prediction,
      });
    } catch (error) {
      const message =
        error instanceof SkinAnalysisApiError
          ? error.message
          : 'Something went wrong while analyzing the image. Please try again.';

      Alert.alert('Analysis failed', message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.card}>
          <Text style={styles.badge}>{t('skinAnalysis.badge')}</Text>
          <Text style={styles.title}>{t('skinAnalysis.title')}</Text>
          <Text style={styles.subtitle}>{t('skinAnalysis.subtitle')}</Text>

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
                  key={img.uri}
                  style={[
                    styles.sampleBtn,
                    selectedImage?.uri === img.uri && styles.sampleBtnSelected,
                  ]}
                  onPress={() => setValidatedImage(img)}
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

          <Text style={styles.footerText}>{t('skinAnalysis.footer')}</Text>
        </Animated.View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={isAnalyzing}>
        <BlurView intensity={45} tint="dark" style={styles.modalOverlay}>
          <Loader route={{ params: { image: selectedImage?.uri } }} />
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
    minHeight: 84,
    borderRadius: 10,
    textAlignVertical: 'top',
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
    backgroundColor: 'rgba(17, 24, 39, 0.92)',
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
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
});
