export const SUPPORTED_LANGUAGES = [
    { code: 'en', name: 'English', label: 'English' },
    { code: 'hi', name: 'Hindi', label: 'हिन्दी' },
    { code: 'pa', name: 'Punjabi', label: 'Punjabi' }, // Gurmukhi? Label in image seems mixed or Latin. Assuming latin or specific script preference not critical yet.
    { code: 'bn', name: 'Bengali', label: 'বাংলা' },
    { code: 'mr', name: 'Marathi', label: 'मराठी' },
    { code: 'gu', name: 'Gujarati', label: 'ગુજરાતી' },
    { code: 'ur', name: 'Urdu', label: 'اردو' },
    { code: 'or', name: 'Odia', label: 'ଓଡ଼ିଆ' },
    { code: 'ks', name: 'Kashmiri', label: 'Kashmiri' }, // Script varies
    { code: 'sa', name: 'Sanskrit', label: 'Sanskrit' },
    { code: 'ta', name: 'Tamil', label: 'தமிழ்' },
    { code: 'te', name: 'Telugu', label: 'తెలుగు' },
    { code: 'kn', name: 'Kannada', label: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', label: 'മലയാളം' },
    { code: 'tcy', name: 'Tulu', label: 'Tulu' },
    { code: 'kok', name: 'Konkani', label: 'Konkani' },
];

export const LANGUAGE_FLAGS: Record<string, string> = {
    en: '🇺🇸',
    hi: '🇮🇳',
    pa: '🇮🇳',
    bn: '🇮🇳',
    mr: '🇮🇳',
    gu: '🇮🇳',
    ur: '🇵🇰',
    or: '🇮🇳',
    ks: '🇮🇳',
    sa: '🇮🇳',
    ta: '🇮🇳',
    te: '🇮🇳',
    kn: '🇮🇳',
    ml: '🇮🇳',
    tcy: '🇮🇳',
    kok: '🇮🇳',
};
