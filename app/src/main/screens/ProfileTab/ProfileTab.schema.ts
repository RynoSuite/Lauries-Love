import { z } from 'zod';

export const nameModalsProfileContainerSchema = z.enum([
  'role',
  'address',
  'age',
  'gender',
  'cancerType',
  'subCancerType',
  'diagnosedYear',
]);

export const nameModalsSettingsContainerSchema = z.enum([
  'appearance',
  'privacy',
  'terms',
  'logout',
  'deleteAccount',
]);

export const nameModalsProfileTabContainerSchema = z.union([
  nameModalsProfileContainerSchema,
  nameModalsSettingsContainerSchema,
]);

export const nameModalsInformationSchema = z.enum([
  'fullName',
  'email',
  'phone',
  'password',
  'avatar',
]);
