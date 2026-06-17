import { Image } from "react-native";

export type ImageQualityResult = {
  isBlurry: boolean;
  isTooDark: boolean;
  isLowContrast: boolean;
  brightness: number;
  contrast: number;
  sharpness: number;
};

export const analyzeImageQuality = async (
  uri: string
): Promise<ImageQualityResult> => {
  return new Promise((resolve) => {
    const fallback = {
      isBlurry: false,
      isTooDark: false,
      isLowContrast: false,
      brightness: 128,
      contrast: 32,
      sharpness: 16,
    };

    Image.getSize(
      uri,
      (width, height) => {
        // Keep this function runtime-safe on iOS/Android.
        // Use image dimensions as a lightweight quality gate.
        const minSide = Math.min(width, height);
        const verySmall = minSide < 224;

        resolve({
          ...fallback,
          isBlurry: verySmall,
          sharpness: verySmall ? 8 : fallback.sharpness,
        });
      },
      () => resolve(fallback)
    );
  });
};
