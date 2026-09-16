import {
  IconSmileyFace,
  IconTabHeart,
  IconTabHome,
  IconTabUser,
} from 'assets/icons-auto/components';

export const AGE_RANGES = [
  {
    id: '18-34',
    label: '18 - 34',
  },
  {
    id: '35-44',
    label: '35 - 44',
  },
  {
    id: '45-59',
    label: '45 - 59',
  },
  {
    id: '60-plus',
    label: '60+',
  },
];

export const CANCER_TYPES = [
  {
    id: 'no-preference',
    label: 'No preference',
  },
  {
    id: 'bile-duct-cancer',
    label: 'Bile Duct Cancer',
  },
  {
    id: 'bladder-cancer',
    label: 'Bladder Cancer',
  },
  {
    id: 'bone-cancer',
    label: 'Bone Cancer',
  },
  {
    id: 'brain-nervous-system-cancer',
    label: 'Brain & Nervous System Cancer',
  },
  {
    id: 'breast-cancer',
    label: 'Breast Cancer',
  },
  {
    id: 'cancer-unknown-primary',
    label: 'Cancer of Unknown Primary (CUP)',
  },
  {
    id: 'cervical-cancer',
    label: 'Cervical Cancer',
  },
  {
    id: 'cml',
    label: 'CML (Leukemia - Chronic Myeloid)',
  },
  {
    id: 'colorectal-cancer',
    label: 'Colorectal (Bowel) Cancer',
  },
  {
    id: 'esophageal-cancer',
    label: 'Esophageal Cancer',
  },
  {
    id: 'eye-cancer',
    label: 'Eye Cancer',
  },
  {
    id: 'kidney-cancer',
    label: 'Kidney Cancer',
  },
  {
    id: 'leukemia',
    label: 'Leukemia (CML, CLL, AML, ALL...)',
  },
  {
    id: 'liver-cancer',
    label: 'Liver Cancer',
  },
  {
    id: 'lung-cancer',
    label: 'Lung Cancer',
  },
  {
    id: 'lymphoma',
    label: 'Lymphoma',
  },
  {
    id: 'mds',
    label: 'MDS',
  },
  {
    id: 'melanoma',
    label: 'Melanoma',
  },
  {
    id: 'mesothelioma',
    label: 'Mesothelioma',
  },
  {
    id: 'multiple-myeloma',
    label: 'Multiple Myeloma',
  },
  {
    id: 'neuroendocrine-tumors',
    label: 'Neuroendocrine Tumors (NET)',
  },
  {
    id: 'oral-cancer',
    label: 'Oral Cancer',
  },
  {
    id: 'ovarian-cancer',
    label: 'Ovarian Cancer',
  },
  {
    id: 'pancreatic-cancer',
    label: 'Pancreatic Cancer',
  },
  {
    id: 'prostate-cancer',
    label: 'Prostate Cancer',
  },
  {
    id: 'sarcoma',
    label: 'Sarcoma',
  },
  {
    id: 'stomach-cancer',
    label: 'Stomach Cancer',
  },
  {
    id: 'testicular-cancer',
    label: 'Testicular Cancer',
  },
  {
    id: 'thyroid-cancer',
    label: 'Thyroid Cancer',
  },
  {
    id: 'uterine-cancer',
    label: 'Uterine Cancer',
  },
  {
    id: 'other',
    label: 'Other',
  },
];

// The canonical gender vocabulary. The web app mirrors these exact ids in
// `web/src/components/ProfileFields.tsx`; both write to the same column, so
// they have to agree character for character.
export const GENRES = [
  {
    id: 'male',
    label: 'Male',
  },
  {
    id: 'female',
    label: 'Female',
  },
  {
    // Offered on web since launch. Added here rather than dropped there:
    // taking an answer away from members who already chose it is the worse
    // side of that trade.
    id: 'non-binary',
    label: 'Non-binary',
  },
  {
    id: 'prefer-not-to-say',
    label: 'Prefer not to say',
  },
];

export const SUB_CANCER_TYPES = [
  {
    id: 'no-preference',
    label: 'No preference',
  },
  {
    id: 'angiosarcoma',
    label: 'Angiosarcoma',
  },
  {
    id: 'ductal-sarcoma',
    label: 'Ductal Sarcoma (DCIS)',
  },
  {
    id: 'ductal-sarcoma-in-situ',
    label: 'Ductal Sarcoma In Situ (DCIS)',
  },
  {
    id: 'her2-positive',
    label: 'HER2 Positive',
  },
  {
    id: 'inflammatory-breast-cancer',
    label: 'Inflammatory Breast Cancer',
  },
  {
    id: 'invasive-ductal-carcinoma',
    label: 'Invasive Ductal Carcinoma (IDC)',
  },
  {
    id: 'invasive-lobular-carcinoma',
    label: 'Invasive Lobular Carcinoma (ILC)',
  },
  {
    id: 'male-breast-cancer',
    label: 'Male Breast Cancer',
  },
  {
    id: 'metastatic',
    label: 'Metastatic',
  },
  {
    id: 'molecular-subtypes-breast',
    label: 'Molecular Subtypes of the Breast',
  },
  {
    id: 'non-metastatic',
    label: 'Non Metastatic',
  },
];

export const USER_TYPES = [
  {
    id: 'patient',
    label: 'Warrior (patient)',
    icon: IconTabHeart,
  },
  {
    id: 'family-member',
    label: 'Family member',
    icon: IconTabHome,
  },
  {
    id: 'caregiver',
    label: 'Caregiver',
    icon: IconTabUser,
  },
  {
    id: 'friend',
    label: 'Friend',
    icon: IconSmileyFace,
  },
];
