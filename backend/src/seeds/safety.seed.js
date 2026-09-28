const { SAFETY_CATEGORIES, LANGUAGES } = require('../utils/constants');

const seedSafetyGuides = () => {
  return [
    {
      title: 'Safe Handling and Storage of Used Batteries',
      language: LANGUAGES.EN,
      category: SAFETY_CATEGORIES.BATTERY,
      description: 'Batteries contain toxic chemicals, lead, and flammable electrolytes that can catch fire.',
      dos: [
        'Store in a cool, dry, ventilated area',
        'Tape terminals of lithium and lead batteries',
        'Wear heavy rubber gloves and safety glasses'
      ],
      donts: [
        'Do not puncture, smash, or throw batteries into fire',
        'Do not store near combustible scrap',
        'Do not dismantle or drain battery acid yourself'
      ],
      priority: 1,
      isActive: true
    },
    {
      title: 'इस्तेमाल की गई बैटरी को सुरक्षित रखने और संभालने का तरीका',
      language: LANGUAGES.HI,
      category: SAFETY_CATEGORIES.BATTERY,
      description: 'बैटरियों में जहरीले रसायन और सीसा होते हैं जो आग या त्वचा को नुकसान पहुंचा सकते हैं।',
      dos: [
        'सूखी और ठंडी जगह पर रखें',
        'स्पार्क से बचने के लिए बैटरी के दोनों सिरों पर टेप लगाएं',
        'हाथों में मोटे दस्ताने और आंखों पर चश्मा पहनें'
      ],
      donts: [
        'बैटरी को कभी आग में न फेंकें और न ही हथौड़े से तोड़ें',
        'कागज या प्लास्टिक के कचरे के पास न रखें',
        'बैटरी का तेजाब खुद से निकालने की कोशिश कभी न करें'
      ],
      priority: 1,
      isActive: true
    },
    {
      title: 'वापरलेल्या बॅटरी हाताळताना घ्यावयाची सुरक्षितता',
      language: LANGUAGES.MR,
      category: SAFETY_CATEGORIES.BATTERY,
      description: 'बॅटरीमध्ये विषारी रसायने आणि शिसे असतात, ज्यामुळे आग लागण्याची शक्यता असते.',
      dos: [
        'बॅटरी नेहमी कोरड्या आणि हवेशीर जागेत ठेवा',
        'शॉर्ट सर्किट टाळण्यासाठी टोकांना चिकटपट्टी (टेप) लावा',
        'रबरी हातमोजे आणि संरक्षणात्मक गॉगल वापरा'
      ],
      donts: [
        'बॅटरी आगीत टाकू नका किंवा फोडू नका',
        'प्लास्टिक किंवा कागदाच्या ढिगाऱ्याजवळ ठेवू नका',
        'बॅटरीमधील ॲसिड स्वतःहून काढण्याचा प्रयत्न करू नका'
      ],
      priority: 1,
      isActive: true
    },
    {
      title: 'Hazardous CRT Glass & Vacuum Tube Handling',
      language: LANGUAGES.EN,
      category: SAFETY_CATEGORIES.CRT,
      description: 'CRT tubes are under high vacuum and contain high levels of leaded glass.',
      dos: ['Handle CRT monitors carefully by outer chassis', 'Keep face shield and leather gloves on'],
      donts: ['Never smash CRT bulbs with hammers; implosion will throw glass', 'Do not inhale phosphor powder'],
      priority: 2,
      isActive: true
    },
    {
      title: 'पुराने टीवी और मॉनिटर (CRT) को सुरक्षित रूप से संभालना',
      language: LANGUAGES.HI,
      category: SAFETY_CATEGORIES.CRT,
      description: 'पुराने टीवी और स्क्रीन के शीशे में सीसा (लेड) और जहरीला पाउडर होता है।',
      dos: ['टीवी को हमेशा उसके बाहरी फ्रेम से पकड़ें', 'काम करते समय मास्क और दस्ताने पहनें'],
      donts: ['कांच की ट्यूब पर हथौड़ा न मारें', 'शीशे के अंदर सफेद पाउडर को हाथ न लगाएं'],
      priority: 2,
      isActive: true
    },
    {
      title: 'जुने टीव्ही आणि सीआरटी (CRT) सुरक्षित हाताळणी',
      language: LANGUAGES.MR,
      category: SAFETY_CATEGORIES.CRT,
      description: 'सीआरटी काचेमध्ये विषारी शिसे असते जे आरोग्यासाठी अत्यंत घातक आहे.',
      dos: ['मॉनिटर नेहमी बाहेरून सुरक्षितपणे पकडा', 'जाड हातमोजे आणि चष्मा वापरा'],
      donts: ['काचेवर थेट हातोड्याने आघात करू नका', 'काचेतील पावडरीच्या संपर्कात येऊ नका'],
      priority: 2,
      isActive: true
    },
    {
      title: 'Strict Prohibition on Wire and Scrap Burning',
      language: LANGUAGES.EN,
      category: SAFETY_CATEGORIES.BURNING,
      description: 'Open burning of PVC cables or plastics releases deadly dioxins and toxic fumes.',
      dos: ['Use mechanical wire strippers or sell directly to authorized recyclers'],
      donts: ['Never set fire to wire piles to extract copper', 'Do not breathe fumes from burning scrap'],
      priority: 1,
      isActive: true
    },
    {
      title: 'तार और प्लास्टिक कचरा जलाने पर पूर्ण प्रतिबंध',
      language: LANGUAGES.HI,
      category: SAFETY_CATEGORIES.BURNING,
      description: 'तार और प्लास्टिक जलाने से निकलने वाला काला धुआं फेफड़ों को भारी नुकसान पहुंचाता है।',
      dos: ['तांबा निकालने के लिए वायर स्ट्रिपर मशीन का इस्तेमाल करें'],
      donts: ['तांबा निकालने के लिए तारों में कभी आग न लगाएं', 'धुएं के पास कभी सांस न लें'],
      priority: 1,
      isActive: true
    },
    {
      title: 'केबल्स व प्लास्टिक कचरा जाळण्यावर पूर्ण बंदी',
      language: LANGUAGES.MR,
      category: SAFETY_CATEGORIES.BURNING,
      description: 'प्लास्टिक किंवा वायर जाळल्याने निघणारा विषारी धूर फुफ्फुसांसाठी घातक ठरतो.',
      dos: ['तांबे काढण्यासाठी वायर स्ट्रिपिंग यंत्र वापरा'],
      donts: ['तांबे काढण्यासाठी आग लावणे कायद्याने गुन्हा आहे', 'विषारी धुरामध्ये उघड्या तोंडाने थांबू नका'],
      priority: 1,
      isActive: true
    },
    {
      title: 'Acid Leaching and Chemical Extraction Hazards',
      language: LANGUAGES.EN,
      category: SAFETY_CATEGORIES.CHEMICAL,
      description: 'Backyard acid leaching of PCBs produces fatal toxic gases and water contamination.',
      dos: ['Hand over intact PCBs to authorized hydrometallurgical recycling facilities'],
      donts: ['Never use nitric or hydrochloric acid baths', 'Never dump acid waste into open drains'],
      priority: 3,
      isActive: true
    },
    {
      title: 'General Personal Protective Equipment (PPE) Guidelines',
      language: LANGUAGES.EN,
      category: SAFETY_CATEGORIES.GENERAL,
      description: 'Everyday protective practices every informal collector should practice.',
      dos: ['Always wear puncture-resistant gloves and safety boots', 'Wash hands with soap thoroughly'],
      donts: ['Do not handle sharp scrap bare-handed', 'Do not overload your vehicle above safe limits'],
      priority: 4,
      isActive: true
    }
  ];
};

module.exports = seedSafetyGuides;
