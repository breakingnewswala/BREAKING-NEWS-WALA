export type CardLayout =
  | 'single'
  | 'double' // 50-50 Up & Down (आधी ऊपर, आधी नीचे)
  | 'split-v' // 35-65 Up & Down (35% ऊपर, 65% नीचे)
  | 'double-h' // 50-50 Left & Right
  | 'grid-3' // 2 Top, 1 Bottom Wide
  | 'grid-3-bottom' // 1 Top Wide, 2 Bottom
  | 'grid-4' // 4 Photos (2 Top, 2 Bottom 2x2 Grid)
  | 'full'
  | 'inset-circle'
  | 'split-h';
export type AspectRatio = '4:5' | '1:1' | '9:16';
export type FrameDesign =
  | 'jacket-original'
  | 'jacket-breaking-red'
  | 'jacket-investigation'
  | 'jacket-quote'
  | 'custom-png';

export interface NewsCardImages {
  main: string;
  second?: string;
  third?: string;
  fourth?: string;
  insetCircle?: string;
}

export interface ImageCropSettings {
  x: number; // 0 to 100 percentage (0 = Left, 50 = Center, 100 = Right)
  y: number; // 0 to 100 percentage (0 = Top, 50 = Center, 100 = Bottom)
  zoom: number; // 1.0 to 2.5
}

export interface NewsCardImagePositions {
  main?: ImageCropSettings;
  second?: ImageCropSettings;
  third?: ImageCropSettings;
  fourth?: ImageCropSettings;
  insetCircle?: ImageCropSettings;
}

export interface NewsCardData {
  id?: string;
  title?: string;
  headline: string;
  formattedHeadline: string;
  highlightWords: string[];
  location: string;
  summary: string;
  category: string;
  
  // Branding ("जैकेट" elements)
  brandName: string;
  brandTagline: string;
  brandLogoType: 'default' | 'custom';
  customLogoUrl?: string;
  customHeaderPng?: string; // Uploaded header PNG (IMAGE NEWS.png)
  customFooterPng?: string; // Uploaded footer PNG (Footer.png)
  footersByDesign?: Partial<Record<FrameDesign, string>>; // Separate footer graphic per frame template
  customFrameOverlayPng?: string; // Full overlay PNG
  customArrowPng?: string; // Custom pointer arrow PNG (ARROW.png)
  frameDesign?: FrameDesign; // Multiple frame styles
  lockHeader?: boolean; // Lock header PNG to prevent accidental changes
  lockFooter?: boolean; // Lock footer PNG to prevent accidental changes
  hideDefaultHeaderInCustomFrame?: boolean; // When custom-png is active, hide default header if user desires
  hideDefaultFooterInCustomFrame?: boolean; // When custom-png is active, hide default footer if user desires
  customBreakingRibbonPng?: string; // Uploaded or custom Breaking News ribbon PNG
  breakingRibbonOffsetY?: number; // Vertical offset of ribbon (-60px to +60px, default 0)
  breakingRibbonScale?: number; // Scaling percentage of ribbon (55% to 95%, default 70%)
  
  // Template specific attributes
  speakerName?: string; // For jacket-quote (बयान देने वाले का नाम)
  speakerTitle?: string; // For jacket-quote (पद / पदवी)
  breakingUrgencyBadge?: string; // For jacket-breaking-red (e.g. ⚡ सुपर ब्रेकिंग)
  investigationCaseNumber?: string; // For jacket-investigation (e.g. पड़ताल / एक्सक्लूसिव)
  showSuperBreakingWatermark?: boolean; // ⚡ सुपर ब्रेकिंग एक्सक्लूसिव वॉटरमार्क (15% ओपेसिटी)
  breakingWatermarkText?: string; // e.g. '⚡ सुपर ब्रेकिंग'
  breakingWatermarkOpacity?: number; // default 0.15
  
  // Badges
  calloutTag: string;
  showCallout: boolean;
  newsUpdateBadge: string;
  showNewsUpdateBadge: boolean;
  showAiGenerated?: boolean;
  aiGeneratedText?: string;
  
  // Contact & Social
  socialHandle: string;
  whatsappNumber: string;
  
  // Layout & Styling
  layout: CardLayout;
  images: NewsCardImages;
  imagePositions?: NewsCardImagePositions;
  insetPosition: { x: number; y: number }; // percentage coordinates
  aspectRatio: AspectRatio;
  headlineFontSize: number;
  headlineAlign?: 'justify' | 'center' | 'left';
  highlightColor: string; // default "#FFDE00"
  darkOverlayOpacity: number; // 0 to 1
  dateStr?: string;
}

export interface AIAnalysisResult {
  headline: string;
  highlightWords: string[];
  formattedHeadline: string;
  location: string;
  summary: string;
  category?: string;
  hasPerson?: boolean;
  description?: string;
  isAiGeneratedPhoto?: boolean;
  pickedImages?: {
    main?: string;
    second?: string;
  };
  suggestedImagePrompt?: string;
}
