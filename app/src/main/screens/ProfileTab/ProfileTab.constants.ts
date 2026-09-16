// These `value`s are written to the profile and compared by every filter with
// strict equality, so they have to be the ids in `constants/onboarding.ts` —
// not something that merely looks like them. Three of the seven below were
// wrong, and each wrong one is invisible: the member picks "45-59", the filter
// asks for "45-59", and they still do not appear.
//
//   value: '55-59'  under the label '45-59'  — a typo; matched no filter at all
//   value: '60+'                             — onboarding writes '60-plus'
//   value: 'any'    under "Prefer Not To Say" — onboarding writes 'prefer-not-to-say'
//
// The legacy database shows the damage: 26 members carry '60+' and 6 carry
// '55-59', values that exist in no filter list anywhere.
export const GENDER_OPTIONS = [
  { text: 'Male', value: 'male' },
  { text: 'Female', value: 'female' },
  { text: 'Non-binary', value: 'non-binary' },
  { text: 'Prefer Not To Say', value: 'prefer-not-to-say' },
];

export const AGE_OPTIONS = [
  { text: '18-34', value: '18-34' },
  { text: '35-44', value: '35-44' },
  { text: '45-59', value: '45-59' },
  { text: '60+', value: '60-plus' },
];

export const CANCER_TYPE_OPTIONS = [
  {
    value: 'no-preference',
    text: 'No preference',
  },
  {
    value: 'bile-duct-cancer',
    text: 'Bile Duct Cancer',
  },
  {
    value: 'bladder-cancer',
    text: 'Bladder Cancer',
  },
  {
    value: 'bone-cancer',
    text: 'Bone Cancer',
  },
  {
    value: 'brain-nervous-system-cancer',
    text: 'Brain & Nervous System Cancer',
  },
  {
    value: 'breast-cancer',
    text: 'Breast Cancer',
  },
  {
    value: 'cancer-unknown-primary',
    text: 'Cancer of Unknown Primary (CUP)',
  },
  {
    value: 'cervical-cancer',
    text: 'Cervical Cancer',
  },
  {
    value: 'cml',
    text: 'CML (Leukemia - Chronic Myeloid)',
  },
  {
    value: 'colorectal-cancer',
    text: 'Colorectal (Bowel) Cancer',
  },
  {
    value: 'esophageal-cancer',
    text: 'Esophageal Cancer',
  },
  {
    value: 'eye-cancer',
    text: 'Eye Cancer',
  },
  {
    value: 'kidney-cancer',
    text: 'Kidney Cancer',
  },
  {
    value: 'leukemia',
    text: 'Leukemia (CML, CLL, AML, ALL...)',
  },
  {
    value: 'liver-cancer',
    text: 'Liver Cancer',
  },
  {
    value: 'lung-cancer',
    text: 'Lung Cancer',
  },
  {
    value: 'lymphoma',
    text: 'Lymphoma',
  },
  {
    value: 'mds',
    text: 'MDS',
  },
  {
    value: 'melanoma',
    text: 'Melanoma',
  },
  {
    value: 'mesothelioma',
    text: 'Mesothelioma',
  },
  {
    value: 'multiple-myeloma',
    text: 'Multiple Myeloma',
  },
  {
    value: 'neuroendocrine-tumors',
    text: 'Neuroendocrine Tumors (NET)',
  },
  {
    value: 'oral-cancer',
    text: 'Oral Cancer',
  },
  {
    value: 'ovarian-cancer',
    text: 'Ovarian Cancer',
  },
  {
    value: 'pancreatic-cancer',
    text: 'Pancreatic Cancer',
  },
  {
    value: 'prostate-cancer',
    text: 'Prostate Cancer',
  },
  {
    value: 'sarcoma',
    text: 'Sarcoma',
  },
  {
    value: 'stomach-cancer',
    text: 'Stomach Cancer',
  },
  {
    value: 'testicular-cancer',
    text: 'Testicular Cancer',
  },
  {
    value: 'thyroid-cancer',
    text: 'Thyroid Cancer',
  },
];
