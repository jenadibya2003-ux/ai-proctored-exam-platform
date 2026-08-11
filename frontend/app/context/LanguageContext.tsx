"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type LanguageCode = "en" | "hi" | "or" | "ta" | "te" | "kn";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    dashboard: "Dashboard",
    myExams: "My Exams",
    practiceMocks: "Practice Mocks",
    results: "Results & Scorecards",
    performance: "Performance Analytics",
    profile: "Profile Settings",
    questionLibraries: "Question Libraries",
    exams: "Exams",
    mockExams: "Mock Exams",
    students: "Students",
    assignExams: "Assign Exams",
    liveMonitoring: "Live Monitoring",
    aiEvaluation: "AI Evaluation",
    userManagement: "User Management",
    proctoringLogs: "Proctoring Logs",
    systemAnalytics: "System Analytics",
    settings: "Settings",
    startExam: "Start Exam",
    viewScorecard: "View Scorecard",
    submitExam: "Submit Exam",
    previous: "Previous",
    next: "Next",
    savedSynced: "Saved & Synced",
    offlineMode: "Offline Mode",
    proctoringActive: "AI Proctoring Active",
    timeRemaining: "Time Remaining",
    selectLanguage: "Language",
  },
  hi: {
    dashboard: "डैशबोर्ड",
    myExams: "मेरी परीक्षाएं",
    practiceMocks: "मॉक अभ्यास",
    results: "परिणाम और स्कोरकार्ड",
    performance: "प्रदर्शन विश्लेषण",
    profile: "प्रोफ़ाइल सेटिंग्स",
    questionLibraries: "प्रश्न पुस्तकालय",
    exams: "परीक्षाएं",
    mockExams: "मॉक परीक्षाएं",
    students: "छात्र",
    assignExams: "परीक्षाएं सौंपें",
    liveMonitoring: "लाइव निगरानी",
    aiEvaluation: "एआई मूल्यांकन",
    userManagement: "उपयोगकर्ता प्रबंधन",
    proctoringLogs: "निगरानी लॉग",
    systemAnalytics: "सिस्टम विश्लेषण",
    settings: "सेटिंग्स",
    startExam: "परीक्षा शुरू करें",
    viewScorecard: "स्कोरकार्ड देखें",
    submitExam: "परीक्षा जमा करें",
    previous: "पिछला",
    next: "अगला",
    savedSynced: "सुरक्षित और सिंक किया गया",
    offlineMode: "ऑफलाइन मोड",
    proctoringActive: "एआई निगरानी सक्रिय",
    timeRemaining: "शेष समय",
    selectLanguage: "भाषा",
  },
  or: {
    dashboard: "ଡ୍ୟାସବୋର୍ଡ",
    myExams: "ମୋର ପରୀକ୍ଷା",
    practiceMocks: "ମକ୍ ଅଭ୍ୟାସ",
    results: "ଫଳାଫଳ ଏବଂ ସ୍କୋରକାର୍ଡ",
    performance: "ପ୍ରଦର୍ଶନ ବିଶ୍ଲେଷଣ",
    profile: "ପ୍ରୋଫାଇଲ୍ ସେଟିଂସ",
    questionLibraries: "ପ୍ରଶ୍ନ ଲାଇବ୍ରେରୀ",
    exams: "ପରୀକ୍ଷା ସମୂହ",
    mockExams: "ମକ୍ ପରୀକ୍ଷା",
    students: "ଛାତ୍ରଛାତ୍ରୀ",
    assignExams: "ପରୀକ୍ଷା ଆବଣ୍ଟନ",
    liveMonitoring: "ଲାଇଭ୍ ତଦାରଖ",
    aiEvaluation: "ଏଆଇ ମୂଲ୍ୟାଙ୍କନ",
    userManagement: "ବ୍ୟବହାରକାରୀ ପରିଚାଳନା",
    proctoringLogs: "ତଦାରଖ ଲଗ୍",
    systemAnalytics: "ସିଷ୍ଟମ୍ ବିଶ୍ଲେଷଣ",
    settings: "ସେଟିଂସ",
    startExam: "ପରୀକ୍ଷା ଆରମ୍ଭ କରନ୍ତୁ",
    viewScorecard: "ସ୍କୋରକାର୍ଡ ଦେଖନ୍ତୁ",
    submitExam: "ପରୀକ୍ଷା ଦାଖଲ କରନ୍ତୁ",
    previous: "ପୂର୍ବବର୍ତ୍ତୀ",
    next: "ପରବର୍ତ୍ତୀ",
    savedSynced: "ସୁରକ୍ଷିତ ଏବଂ ସିଙ୍କ୍ ହୋଇଛି",
    offlineMode: "ଅଫଲାଇନ୍ ମୋଡ୍",
    proctoringActive: "ଏଆଇ ତଦାରଖ ସକ୍ରିୟ",
    timeRemaining: "ବାକି ସମୟ",
    selectLanguage: "ଭାଷା",
  },
  ta: {
    dashboard: "முகப்பு",
    myExams: "எனது தேர்வுகள்",
    practiceMocks: "மாதிரி தேர்வுகள்",
    results: "முடிவுகள்",
    performance: "செயல்திறன்",
    profile: "சுயவிவரம்",
    questionLibraries: "வினா வங்கிகள்",
    exams: "தேர்வுகள்",
    mockExams: "மாதிரி தேர்வுகள்",
    students: "மாணவர்கள்",
    assignExams: "தேர்வுகளை ஒதுக்கு",
    liveMonitoring: "நேரலை கண்காணிப்பு",
    aiEvaluation: "AI மதிப்பீடு",
    userManagement: "பயனர் நிர்வாகம்",
    proctoringLogs: "கண்காணிப்பு பதிவுகள்",
    systemAnalytics: "கணினி பகுப்பாய்வு",
    settings: "அமைப்புகள்",
    startExam: "தேர்வை தொடங்கு",
    viewScorecard: "மதிப்பெண் அட்டையை பார்",
    submitExam: "தேர்வை சமர்ப்பி",
    previous: "முந்தைய",
    next: "அடுத்த",
    savedSynced: "சேமிக்கப்பட்டது",
    offlineMode: "ஆஃப்லைன் பயன்முறை",
    proctoringActive: "AI கண்காணிப்பு செயலில் உள்ளது",
    timeRemaining: "மீதமுள்ள நேரம்",
    selectLanguage: "மொழி",
  },
  te: {
    dashboard: "డాష్‌బోర్డ్",
    myExams: "నా పరీక్షలు",
    practiceMocks: "మాక్ ప్రాక్టీస్",
    results: "ఫలితాలు",
    performance: "పనితీరు విశ్లేషణ",
    profile: "ప్రొఫైల్ సెట్టింగ్‌లు",
    questionLibraries: "ప్రశ్న లైబ్రరీలు",
    exams: "పరీక్షలు",
    mockExams: "మాక్ పరీక్షలు",
    students: "విద్యార్థులు",
    assignExams: "పరీక్షలను కేటాయించండి",
    liveMonitoring: "లైవ్ పర్యవేక్షణ",
    aiEvaluation: "AI మూల్యాంకనం",
    userManagement: "యూజర్ మేనేజ్‌మెంట్",
    proctoringLogs: "పర్యవేక్షణ లాగ్‌లు",
    systemAnalytics: "సిస్టమ్ విశ్లేషణలు",
    settings: "సెట్టింగ్‌లు",
    startExam: "పరీక్ష ప్రారంభించండి",
    viewScorecard: "స్కోర్‌కార్డ్ చూడండి",
    submitExam: "పరీక్ష సమర్పించండి",
    previous: "మునుపటి",
    next: "తరువాతి",
    savedSynced: "సేవ్ మరియు సింక్ అయింది",
    offlineMode: "ఆఫ్‌లైన్ మోడ్",
    proctoringActive: "AI పర్యవేక్షణ సక్రియంగా ఉంది",
    timeRemaining: "మిగిలి ఉన్న సమయం",
    selectLanguage: "భాష",
  },
  kn: {
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    myExams: "ನನ್ನ ಪರೀಕ್ಷೆಗಳು",
    practiceMocks: "ಮಾಕ್ ಅಭ್ಯಾಸ",
    results: "ಫಲಿತಾಂಶಗಳು",
    performance: "ಕಾರ್ಯಕ್ಷಮತೆ",
    profile: "ಪ್ರೊಫೈಲ್ ಸಂಯೋಜನೆಗಳು",
    questionLibraries: "ಪ್ರಶ್ನೆ ಗ್ರಂಥಾಲಯಗಳು",
    exams: "ಪರೀಕ್ಷೆಗಳು",
    mockExams: "ಮಾಕ್ ಪರೀಕ್ಷೆಗಳು",
    students: "ವಿದ್ಯಾರ್ಥಿಗಳು",
    assignExams: "ಪರೀಕ್ಷೆ ನಿಯೋಜಿಸಿ",
    liveMonitoring: "ಲೈವ್ ಮೇಲ್ವಿಚಾರಣೆ",
    aiEvaluation: "AI ಮೌಲ್ಯಮಾಪನ",
    userManagement: "ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ",
    proctoringLogs: "ಮೇಲ್ವಿಚಾರಣೆ ಲಾಗ್‌ಗಳು",
    systemAnalytics: "ಸಿಸ್ಟಮ್ ವಿಶ್ಲೇಷಣೆ",
    settings: "ಸಂಯೋಜನೆಗಳು",
    startExam: "ಪರೀಕ್ಷೆ ಪ್ರಾರಂಭಿಸಿ",
    viewScorecard: "ಅಂಕಪಟ್ಟಿ ವೀಕ್ಷಿಸಿ",
    submitExam: "ಪರೀಕ್ಷೆ ಸಲ್ಲಿಸಿ",
    previous: "ಹಿಂದಿನ",
    next: "ಮುಂದಿನ",
    savedSynced: "ಸೇವ್ ಮತ್ತು ಸಿಂಕ್ ಆಗಿದೆ",
    offlineMode: "ಆಫ್‌ಲೈನ್ ಮೋಡ್",
    proctoringActive: "AI ಮೇಲ್ವಿಚಾರಣೆ ಸಕ್ರಿಯವಾಗಿದೆ",
    timeRemaining: "ಉಳಿದಿರುವ ಸಮಯ",
    selectLanguage: "ಭಾಷೆ",
  },
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>("en");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_language") as LanguageCode | null;
    if (saved && TRANSLATIONS[saved]) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang);
    window.dispatchEvent(new Event("languageChange"));
  };

  const t = (key: string): string => {
    return TRANSLATIONS[language]?.[key] || TRANSLATIONS["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
