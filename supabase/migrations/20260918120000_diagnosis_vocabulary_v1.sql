-- The full diagnosis vocabulary, so the legacy members' diagnoses have somewhere
-- to land.
--
-- 2,105 of the 2,221 imported members carry a diagnosis in the legacy export and
-- NONE of it was imported, because `value_definitions` only ever held 11 of the
-- 36 diagnosis types the old platform offered. There was nowhere to put
-- "Mesothelioma" or "Neuroendocrine Tumors", so the whole field was skipped.
--
-- This adds the missing entries. `scripts/import-diagnoses.mjs` then writes
-- profiles.diagnosis_type_ids / diagnosis_subtype_ids.
--
-- ── Three near-duplicates are aliased, NOT added ────────────────────────────
--
-- Adding a second row for the same disease splits its members across two
-- options that look identical in the picker — the exact bug the legacy data
-- already has (see the Ovarian note below). So these map onto rows that exist:
--
--   legacy 090 "Colorectal (Bowel) Cancer"          -> 003 Colorectal Cancer  (123 members)
--   legacy 103 "Leukemia (CML, CLL, AML, ALL...)"   -> 007 Leukemia            (51 members)
--   legacy 113 + 114 "Ovarian Cancer"               -> 009 Ovarian Cancer      (28 + 66)
--
-- The legacy database has TWO Ovarian Cancer rows with identical labels and its
-- members split 28/66 between them. Mapping both onto one row fixes that for
-- free. `CML (Leukemia - Chronic Myeloid)` IS added separately — the old picker
-- offered it as a distinct choice and 11 members chose it deliberately.
--
-- The alias map lives in the import script, not here, because one legacy_id
-- column cannot record two source codes.
--
-- ── Two labels are corrected, and they are medical, not cosmetic ────────────
--
-- The legacy subtypes read "Ductal Sarcoma (DCIS)" and "Ductal Sarcoma In Situ
-- (DCIS)". DCIS is Ductal **Carcinoma** In Situ; a sarcoma is a different
-- disease entirely, arising in connective tissue rather than the milk ducts.
-- The abbreviation makes the intent unambiguous, so both become one correctly
-- named row — which also merges the 39 and 48 members who were split across
-- what were always the same thing.
--
-- "Pyhllodes Tumor" becomes "Phyllodes Tumor". A transposition, 1 member.
--
-- ── Ordering ───────────────────────────────────────────────────────────────
--
-- The existing nine keep their curated order — the most commonly diagnosed
-- first, which is what a member scanning a picker wants. Everything new sorts
-- alphabetically after them, and the two catch-alls stay pinned at the end.

begin;

-- ── DIAGNOSIS_TYPE ─────────────────────────────────────────────────────────
insert into public.value_definitions (definition_type, value, description, sort, legacy_id)
values
  ('DIAGNOSIS_TYPE', '010', 'Appendiceal Adenocarcinoma',        10, '125'),
  ('DIAGNOSIS_TYPE', '011', 'Bile Duct Cancer',                  11, '010'),
  ('DIAGNOSIS_TYPE', '012', 'Bladder Cancer',                    12, '020'),
  ('DIAGNOSIS_TYPE', '013', 'Bone Cancer',                       13, '030'),
  ('DIAGNOSIS_TYPE', '014', 'Brain & Nervous System Cancer',     14, '040'),
  ('DIAGNOSIS_TYPE', '015', 'Cancer of Unknown Primary (CUP)',   15, '060'),
  ('DIAGNOSIS_TYPE', '016', 'Cervical Cancer',                   16, '070'),
  ('DIAGNOSIS_TYPE', '017', 'CML (Leukemia - Chronic Myeloid)',  17, '080'),
  ('DIAGNOSIS_TYPE', '018', 'DCIS: Ductal Carcinoma in Situ',    18, '126'),
  ('DIAGNOSIS_TYPE', '019', 'Esophageal Cancer',                 19, '100'),
  ('DIAGNOSIS_TYPE', '020', 'Eye Cancer',                        20, '101'),
  ('DIAGNOSIS_TYPE', '021', 'Kidney Cancer',                     21, '102'),
  ('DIAGNOSIS_TYPE', '022', 'Liver Cancer',                      22, '104'),
  ('DIAGNOSIS_TYPE', '023', 'MDS',                               23, '107'),
  ('DIAGNOSIS_TYPE', '024', 'Mesothelioma',                      24, '109'),
  ('DIAGNOSIS_TYPE', '025', 'Multiple Myeloma',                  25, '110'),
  ('DIAGNOSIS_TYPE', '026', 'Neuroendocrine Tumors (NET)',       26, '111'),
  ('DIAGNOSIS_TYPE', '027', 'Oral Cancer',                       27, '112'),
  ('DIAGNOSIS_TYPE', '028', 'Sarcoma',                           28, '117'),
  ('DIAGNOSIS_TYPE', '029', 'Stomach Cancer',                    29, '118'),
  ('DIAGNOSIS_TYPE', '030', 'Testicular Cancer',                 30, '119'),
  ('DIAGNOSIS_TYPE', '031', 'Thymoma',                           31, '120'),
  ('DIAGNOSIS_TYPE', '032', 'Thyroid Cancer',                    32, '121'),
  ('DIAGNOSIS_TYPE', '033', 'Uterine Cancer',                    33, '122')
on conflict do nothing;

-- ── DIAGNOSIS_SUB_TYPE ─────────────────────────────────────────────────────
-- The existing rows are STAGES (Stage I-IV, In Remission) plus two receptor
-- statuses. The legacy ones are histological subtypes. They are different axes
-- of the same question and coexist deliberately — a member can be both
-- "Invasive Ductal Carcinoma" and "Stage II".
insert into public.value_definitions (definition_type, value, description, sort, legacy_id)
values
  ('DIAGNOSIS_SUB_TYPE', '010', 'Angiosarcoma',                        10, '030'),
  ('DIAGNOSIS_SUB_TYPE', '011', 'Ductal Carcinoma In Situ (DCIS)',     11, '050'),
  ('DIAGNOSIS_SUB_TYPE', '012', 'Inflammatory Breast Cancer',          12, '060'),
  ('DIAGNOSIS_SUB_TYPE', '013', 'Invasive Ductal Carcinoma (IDC)',     13, '070'),
  ('DIAGNOSIS_SUB_TYPE', '014', 'Invasive Lobular Carcinoma (ILC)',    14, '080'),
  ('DIAGNOSIS_SUB_TYPE', '015', 'Male Breast Cancer',                  15, '090'),
  ('DIAGNOSIS_SUB_TYPE', '016', 'Metastatic',                          16, '010'),
  ('DIAGNOSIS_SUB_TYPE', '017', 'Molecular Subtypes of the Breast',    17, '100'),
  ('DIAGNOSIS_SUB_TYPE', '018', 'Non Metastatic',                      18, '020'),
  ('DIAGNOSIS_SUB_TYPE', '019', 'Paget Disease of the Nipple',         19, '110'),
  ('DIAGNOSIS_SUB_TYPE', '020', 'Phyllodes Tumor',                     20, '120')
on conflict do nothing;

-- Traceability for the rows that already existed and are reused by the import.
-- Ovarian carries '113' rather than both of its source codes; the import script
-- holds the full alias map, and this is a breadcrumb rather than the mapping.
update public.value_definitions set legacy_id = '090' where definition_type = 'DIAGNOSIS_TYPE' and value = '003' and legacy_id is null;
update public.value_definitions set legacy_id = '103' where definition_type = 'DIAGNOSIS_TYPE' and value = '007' and legacy_id is null;
update public.value_definitions set legacy_id = '113' where definition_type = 'DIAGNOSIS_TYPE' and value = '009' and legacy_id is null;

do $$
declare types int; subs int;
begin
  select count(*) into types from public.value_definitions where definition_type = 'DIAGNOSIS_TYPE';
  select count(*) into subs  from public.value_definitions where definition_type = 'DIAGNOSIS_SUB_TYPE';
  raise notice 'diagnosis types: % (expected 35), subtypes: % (expected 19)', types, subs;
end $$;

commit;
