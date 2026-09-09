import { StyleSheet } from 'react-native';
import colors from 'styles/colors';

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface2,
  },
  progressDotActive: {
    backgroundColor: colors.magenta,
  },
  stepLabel: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.heading,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    marginBottom: 20,
  },
  categoryList: {
    gap: 12,
  },
  categoryItem: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  categoryItemActive: {
    borderColor: colors.primary[500],
    backgroundColor: colors.surface2,
  },
  categoryText: {
    fontSize: 16,
    color: colors.heading,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: colors.surface,
    padding: 14,
    fontSize: 16,
    color: colors.heading,
    textAlignVertical: 'top',
  },
  charCount: {
    alignSelf: 'flex-end',
    marginTop: 6,
    fontSize: 12,
    color: colors.faint,
  },
  footer: {
    marginTop: 'auto',
    paddingVertical: 16,
  },
  summaryRow: {
    marginBottom: 4,
    fontSize: 14,
    color: colors.body,
  },
  summaryLabel: {
    fontWeight: '700',
    color: colors.heading,
  },
});
