# BREAKING NEWS WALA — Staging Environment & Release Workflow Runbook
## स्टेजिंग वातावरण एवं रिलीज़ प्रबंधन प्रक्रिया नियमावली
### Document ID: DOC-STAGING-RELEASE-V1.0
### Scope: Branching Strategy, Staging Deployment, QA Validation & Main Promotion Protocol

---

## 1. विजन एवं उद्देश्य (Vision & Purpose)

BREAKING NEWS WALA प्लेटफ़ॉर्म पर निरंतर विकास (Continuous Development) और 24×7 लाइव न्यूज़ ब्रॉडकास्टिंग को सुरक्षित रखने के लिए दोहरे वातावरण (Two-Tier Deployment Architecture) का अनुपालन अनिवार्य है:

```
[ Feature / Bugfix Development ]
               │
               ▼
   [ Branch: staging ] ──► (Automated CI & Staging Build) ──► [ Live Staging Environment ]
                                                                       │
                                                       (QA, Fact-Check & Peer Review)
                                                                       │
                                                                       ▼
                                                          [ Merge into Branch: main ]
                                                                       │
                                                                       ▼
                                                       [ Live Production Web App ]
```

1. **स्टेजिंग वातावरण (`staging` branch)**: सभी नए फ़ीचर्स, UI बदलाव, AI न्यूज़ एजेंट्स, ई-पेपर अपडेट्स और बग-फिक्सेस पहले `staging` ब्रांच में मर्ज होंगे। यहाँ लाइव स्टेजिंग फॉर्मेट में गहन टेस्टिंग होगी।
2. **प्रोडक्शन वातावरण (`main` branch)**: स्टेजिंग पर पूर्ण स्वीकृति, तथ्य-जांच और रिग्रेशन टेस्टिंग पास होने के बाद ही कोड को `main` ब्रांच में मर्ज करके लाइव प्रोडक्शन पर रिलीज़ किया जाएगा।

---

## 2. गिट शाखा रणनीति (Git Branching Strategy)

### 2.1 शाखाओं की भूमिकाएं (Branch Roles)
| शाखा (Branch) | उद्देश्य (Purpose) | डिप्लॉयमेंट टार्गेट (Deployment) | सुरक्षा नियम (Protection Rule) |
| :--- | :--- | :--- | :--- |
| **`main`** | प्रोडक्शन-रेडी कोड (Production Releases) | Live Website (`breakingnewswala.com`) | केवल स्टेजिंग से टेस्टेड PRs ही अनुमत |
| **`staging`** | प्री-प्रोडक्शन एकीकरण व QA (Release Candidates) | Staging Portal (`breakingnewswala.com/testing`) | सभी फ़ीचर्स का अंतिम एकीकरण स्थल |
| **`feature/*`** | नया फ़ीचर विकास (New Features) | Local Dev Environment | `staging` से ब्रांच करें |
| **`fix/*`** | बग सुधार (Bugfixes & Hotfixes) | Local Dev Environment | `staging` से ब्रांच करें |

---

## 3. चरणबद्ध विकास एवं डिप्लॉयमेंट गाइड (Step-by-Step Developer Lifecycle)

### चरण 1: नई फ़ीचर ब्रांच बनाना (Create Feature Branch)
```bash
# 1. नवीनतम स्टेजिंग शाखा पर जाएं और अपडेट लें
git checkout staging
git pull origin staging

# 2. नए फ़ीचर के लिए समर्पित ब्रांच बनाएं
git checkout -b feature/your-feature-name
```

### चरण 2: स्थानीय विकास एवं सत्यापन (Local Development & Audit)
स्थानीय स्तर पर काम पूरा करने के बाद कोड क्वालिटी और बिल्ड सत्यापित करें:
```bash
# टाइप-चेकिंग एवं लिंटिंग (Zero Errors Required)
npm run lint

# प्रोडक्शन बंडल बिल्ड परीक्षण
npm run build

# स्थानीय सर्वर चलाकर जांचें
npm run dev
```

### चरण 3: स्टेजिंग में पुश एवं PR (Push to Staging)
```bash
# 1. अपने बदलाव कमिट करें
git add .
git commit -m "feat(scope): detailed description of your changes"

# 2. स्टेजिंग में पुश करें
git checkout staging
git pull origin staging
git merge feature/your-feature-name
git push origin staging
```
> **नोट**: GitHub Actions का `staging-deploy.yml` वर्कफ़्लो स्टेजिंग पर पुश होते ही ऑटोमेटेड बिल्ड, टाइप-चेक और आर्टिफ़ैक्ट वेरिफिकेशन चलाएगा।

---

## 4. स्टेजिंग सत्यापन चेकलिस्ट (Staging QA Verification Checklist)

स्टेजिंग से कोड को `main` में प्रमोट करने से पूर्व निम्नलिखित 7 बिंदुओं की पुष्टि अनिवार्य है:

- [ ] **1. UI/UX एवं मोबाइल रिस्पॉन्सिवनेस**: 360px (बजट मोबाइल) से 1440px (डेस्कटॉप) तक लेआउट की जांच।
- [ ] **2. 10-बिंदु संपादकीय तथ्य-जांच**: न्यूज़ फ़ीड, ई-पेपर एवं वीडियो बुलेटिन में सही डेटा प्रदर्शित हो रहा है।
- [ ] **3. वैधानिक पेजेस व लिंक्स**: प्राइवेसी, टर्म्स, पेमेंट्स/रिफंड, शिकायत निवारण पेजेस सही लोड हो रहे हैं।
- [ ] **4. रोल-बेस्ड ऑथराइजेशन (RBAC)**: रीडर, रिपोर्टर, एडिटर व मास्टर एडमिन की अनुमतियां सुरक्षित हैं।
- [ ] **5. API एवं नेटवर्क एरर्स**: ब्राउज़र कंसोल में कोई अप्रत्याशित रेड एरर या 404/500 नहीं है।
- [ ] **6. टाइप-चेकिंग (Clean TSC)**: `npm run lint` 0 एरर के साथ पास हो रहा है।
- [ ] **7. प्रोडक्शन बिल्ड (Clean Build)**: `npm run build` सफल हो रहा है।

---

## 5. मेन (प्रोडक्शन) में प्रमोशन प्रोटोकॉल (Promotion to Main Protocol)

जब स्टेजिंग पर सभी टेस्ट सफलतापूर्वक पास हो जाएं:

```bash
# 1. मेन शाखा पर स्विच करें और नवीनतम अपडेट लें
git checkout main
git pull origin main

# 2. जांची-परखी स्टेजिंग शाखा को मेन में मर्ज करें
git merge staging -m "release: promote verified staging changes to main (vX.Y.Z)"

# 3. प्रोडक्शन रिलीज़ को GitHub पर पुश करें
git push origin main
```

---

## 6. आपातकालीन हॉटफिक्स प्रोटोकॉल (Emergency Hotfix Protocol)
यदि लाइव प्रोडक्शन (`main`) पर कोई क्रिटिकल बग उत्पन्न होता है:
1. `main` से `hotfix/issue-description` ब्रांच बनाएं।
2. त्वरित सुधार लागू करें और स्थानीय स्तर पर `npm run lint && npm run build` से सत्यापित करें।
3. हॉटफिक्स को पहले `staging` में मर्ज करके जांचें, फिर तत्काल `main` में मर्ज करें।
4. दोनों शाखाएं (`staging` एवं `main`) हमेशा समकालिक (synchronized) रहनी चाहिए।
