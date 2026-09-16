export const ROLE_OPTIONS = [
  { id: 'no-preference', label: 'No preference' },
  { id: 'patient', label: 'Patient' },
  { id: 'caregiver', label: 'Caregiver' },
  { id: 'family-member', label: 'Family Member' },
  { id: 'friend', label: 'Friend' },
];

export const AGE_OPTIONS = [
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

export const DIAGNOSIS_OPTIONS = [
  { id: 'no-preference', label: 'No preference' },
  ...Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => {
    const year = 2000 + i;
    return { id: `${year}`, label: `${year}` };
  }),
];

// Filter options, so every value a member can STORE has to be filterable —
// otherwise choosing non-binary or prefer-not-to-say quietly removes you from
// the map for everyone using the gender filter.
export const GENDER_OPTIONS = [
  { id: 'no-preference', label: 'No preference' },
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'prefer-not-to-say', label: 'Prefer not to say' },
];

export const CANCER_OPTIONS = [
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
