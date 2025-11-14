# Logo Assets Setup

## 📁 File Structure Required

Please save your logo images to these locations:

```
Mata/
└── assets/
    └── images/
        ├── logo-splash.png      (Logo 2 - Circular badge with cat)
        ├── logo-icon.png        (Logo 1 - Cat head only, square crop)
        ├── logo-splash@2x.png   (2x resolution)
        ├── logo-splash@3x.png   (3x resolution)
        └── logo-icon@2x.png     (2x resolution)
```

## 🎨 Logo Specifications

### Logo 2 - Splash Screen (Circular Badge)
- **Use for**: Splash screen, loading animations, in-app loaders
- **Recommended size**: 
  - `logo-splash.png`: 512x512px
  - `logo-splash@2x.png`: 1024x1024px
  - `logo-splash@3x.png`: 1536x1536px
- **Format**: PNG with transparency
- **Background**: Transparent or dark (#111827)

### Logo 1 - App Icon (Cat Head)
- **Use for**: Android launcher icon, iOS home screen icon
- **Recommended size**:
  - `logo-icon.png`: 1024x1024px (square crop of cat head)
  - `logo-icon@2x.png`: 2048x2048px
- **Format**: PNG with transparency
- **Background**: Transparent (will be placed on adaptive background)

## 🚀 Current Implementation

✅ **LoadingLogo.tsx** - Animated logo component (rotate + glow)
✅ **SplashScreen.tsx** - Initial app loading screen
✅ **RecommendationsScreen** - Uses LoadingLogo for signal calculation
✅ **App.tsx** - Displays SplashScreen on app launch

## 📝 Next Steps

### If you have the logo files ready:

1. **Save logo-splash.png** to `Mata/assets/images/`
2. **Save logo-icon.png** to `Mata/assets/images/`

### To use actual logo image instead of CSS-drawn logo:

**Option A**: Update LoadingLogo.tsx to use Image component
```tsx
import { Image } from 'react-native';

// Replace the CSS-drawn cat with:
<Animated.Image
  source={require('../../assets/images/logo-splash.png')}
  style={[styles.logoImage, { transform: [{ rotate }] }]}
/>
```

**Option B**: Keep CSS-drawn version for now (works without image files)

## 🎯 Animation Details

Current animation (Option B - Rotate + Glow):
- ⭐ Full 360° rotation (2s per rotation)
- 💜 Purple glow ring pulse (1.5s breathing)
- 👁️ Cat eye glow intensity animation
- 🎨 Gold accent shimmer effect

## 📱 App Icon Setup (Future)

For native app icons, we'll need to generate multiple sizes:

### Android (`android/app/src/main/res/`)
- `mipmap-mdpi/ic_launcher.png` (48x48)
- `mipmap-hdpi/ic_launcher.png` (72x72)
- `mipmap-xhdpi/ic_launcher.png` (96x96)
- `mipmap-xxhdpi/ic_launcher.png` (144x144)
- `mipmap-xxxhdpi/ic_launcher.png` (192x192)

### iOS (`ios/Mata/Images.xcassets/AppIcon.appiconset/`)
- Multiple sizes from 20x20 to 1024x1024

**Tool recommendation**: Use [icon.kitchen](https://icon.kitchen) or [appicon.co](https://appicon.co) to auto-generate all sizes from your 1024x1024 logo.
