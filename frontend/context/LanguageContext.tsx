'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES } from '../constants/languages';

type LanguageContextType = {
    language: string;
    setLanguage: (lang: string) => void;
    t: (key: string) => string;
    dir: 'ltr' | 'rtl';
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Basic dictionaries (We can move these to JSON files later if they grow)
const dictionaries: Record<string, Record<string, string>> = {
    en: {
        'app.title': 'MindRadix',
        'sidebar.dashboard': 'Dashboard',
        'sidebar.articles': 'Articles',
        'sidebar.new_article': 'New Article',
        'sidebar.profile': 'Profile',
        'sidebar.settings': 'Settings',
        'article.create.title': 'Create New Article',
        'article.create.submit': 'Submit Article',
        'common.language': 'Language',
        'common.save': 'Save',
        'status.draft': 'Draft',
        'status.published': 'Published',
        'article.likes': 'Likes',
        'article.comments': 'Comments',
        'article.by': 'By',
        'article.add_to_cart': 'Add to Cart',
        'article.buy_now': 'Buy Now for',
        'article.attachments': 'Attachments & Resources',
        'article.download': 'Download',
        'article.premium': 'Premium Content',
        'article.purchase_unlock': 'Purchase this article to unlock full access and attachments.',
        'article.post_comment': 'Post Comment',
        'article.share_thoughts': 'Share your thoughts...',
        'article.no_comments': 'No comments yet. Be the first to share!',
        'article.back_library': 'Back to Library',
    },
    hi: {
        'app.title': 'MindRadix',
        'sidebar.dashboard': 'डैशबोर्ड',
        'sidebar.articles': 'लेख',
        'sidebar.new_article': 'नया लेख',
        'sidebar.profile': 'प्रोफ़ाइल',
        'sidebar.settings': 'सेटिंग्स',
        'article.create.title': 'नया लेख बनाएँ',
        'article.create.submit': 'लेख जमा करें',
        'common.language': 'भाषा',
        'common.save': 'सहेजें',
        'status.draft': 'ड्राफ्ट',
        'status.published': 'प्रकाशित',
        'article.likes': 'पसंद',
        'article.comments': 'टिप्पणियाँ',
        'article.by': 'द्वारा',
        'article.add_to_cart': 'कार्ट में जोड़ें',
        'article.buy_now': 'अभी खरीदें',
        'article.attachments': 'संलग्नक और संसाधन',
        'article.download': 'डाउनलोड',
        'article.premium': 'प्रीमियम सामग्री',
        'article.purchase_unlock': 'पूर्ण एक्सेस और संलग्नकों को अनलॉक करने के लिए इस लेख को खरीदें।',
        'article.post_comment': 'टिप्पणी पोस्ट करें',
        'article.share_thoughts': 'अपने विचार साझा करें...',
        'article.no_comments': 'अभी तक कोई टिप्पणी नहीं। साझा करने वाले पहले व्यक्ति बनें!',
        'article.back_library': 'लाइब्रेरी पर वापस जाएं',
    }
    // Add others as needed or fallback to English
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<string>('en');

    useEffect(() => {
        const stored = localStorage.getItem('MindRadix_language');
        if (stored && SUPPORTED_LANGUAGES.some(l => l.code === stored)) {
            setLanguage(stored);
        }
    }, []);

    const changeLanguage = (lang: string) => {
        setLanguage(lang);
        localStorage.setItem('MindRadix_language', lang);

        // Trigger Google Translate
        if (typeof window !== 'undefined' && (window as any).google && (window as any).google.translate) {
            const select = document.querySelector('.goog-te-combo') as HTMLSelectElement;
            if (select) {
                select.value = lang;
                select.dispatchEvent(new Event('change'));
            }
        }
    };

    const t = (key: string): string => {
        const dict = dictionaries[language] || dictionaries['en'];
        return dict[key] || dictionaries['en'][key] || key;
    };

    const dir = ['ur', 'ks'].includes(language) ? 'rtl' : 'ltr';

    return (
        <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t, dir }}>
            <div dir={dir} className={language}>
                {children}
            </div>
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
