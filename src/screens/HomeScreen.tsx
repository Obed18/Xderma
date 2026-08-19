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
import {
  Info,
} from "lucide-react-native";

import { Camera, Images, ImagePlus, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
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
  const stackNavigation = useNavigation<any>();
  const appNavigation = navigation ?? stackNavigation;
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

      appNavigation.navigate('ResultsScreen', {
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
            <BlurView intensity={50} style={styles.header}>
                <View>
                    <Text style={styles.title2}>Home</Text>
                </View>
            </BlurView>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
              <View style={styles.mainHistory}>
        <Animated.View entering={FadeInUp.duration(700)} style={styles.card}>
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
                <ImagePlus color="#9CA3AF" size={32} />
              </>
            )}
            {!selectedImage && (
              <Text style={styles.uploadText}>Select an image to analyze</Text>
            )}
          </View>
            {!selectedImage && (
              <View style={styles.buttonRow}>
                <TouchableOpacity style={styles.browseBtn} onPress={pickImage}>
                  <Images color="#00E0FF" size={18} />
                  <Text style={styles.browseText}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cameraBtn} onPress={openCamera}>
                  <Camera color="#A5B4FC" size={18} />
                  <Text style={styles.cameraText}>Camera</Text>
                </TouchableOpacity>
              </View>
            )}

          {selectedImage && (
            <View style={styles.symptomsContainer}>
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

            {/* <View style={styles.advisory}>
              <View style={styles.row}>
                <Info size={18} color="#00E0FF" />
                <Text style={styles.advisoryTitle}>Clinical Advisory</Text>
              </View>
              <Text style={styles.advisoryText}>
                XDerma provides AI screening support only. It is not a medical diagnosis and should not replace an in-person dermatology evaluation.
              </Text>
            </View> */}

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
      </View>
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
    backgroundColor: '#b1dcf7',
  },
  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0A0D0C',
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
      mainHistory: {
        flex: 1,
        paddingHorizontal: 16,
        borderTopLeftRadius: 27,
        borderTopRightRadius: 27,
        backgroundColor: "#0A0D0C",
        paddingTop: 16,
    paddingBottom: 70,
    },

    header: {
        padding: 16,
        paddingTop: 60,
        borderRadius: 16,
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#b1dcf7",
    },

    title2: {
        color: "#000",
        fontSize: 22,
        fontWeight: "bold",
    },

  title: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 20,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#374151',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 50,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#1f29377c',
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
    marginTop: 6,
    marginBottom: 20,
    gap: 15,
    justifyContent: 'center',
  },
  browseBtn: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#00E0FF34',
    padding: 15,
    borderRadius: 14,
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00E0FF10',
  },
  browseText: {
    color: '#00E0FF',
    fontFamily: 'Poppins_600SemiBold',
  },
  cameraBtn: {
    flexDirection: 'row',
    backgroundColor: '#a5b4fc18',
    borderWidth: 1,
    borderColor: '#a5b4fc3b',
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
    borderRadius: 14,
  },
  cameraText: {
    color: '#A5B4FC',
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
  advisory: {
    backgroundColor: "#102235",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(0, 224, 255, 0.22)",
  },
  advisoryTitle: {
    color: "#00E0FF",
    marginLeft: 6,
    fontWeight: "600",
  },
  advisoryText: {
    color: "#AEB8C7",
    marginTop: 8,
    lineHeight: 20,
  },
    row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    borderRadius: 20,
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
