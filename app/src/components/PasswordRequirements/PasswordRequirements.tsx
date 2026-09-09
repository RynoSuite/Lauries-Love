import React, { FunctionComponent } from 'react';
import { Text, View } from 'react-native';

// styles
import styles from './PasswordRequirements.styles';

/**
 * The password rules, shown as a live checklist.
 *
 * These are the single source of truth: `isPasswordValid` is every rule
 * passing, so the list and the validation cannot disagree. The screen used to
 * hold its own regex and tell you afterwards that the password was
 * "incomplete" without saying what was missing — the rules were in the
 * paragraph above, which nobody reads.
 *
 * The app had two different password rules. Registration demanded eight
 * characters but only allowed the symbols @$!%*?&- , so a password containing
 * "#" was rejected with no explanation. Changing your password in settings
 * asked for six characters and accepted almost any symbol — meaning a password
 * you could set there could not have been created at sign-up. These rules are
 * the union that makes sense: the longer minimum, and no restriction on which
 * symbols are allowed.
 */
export type PasswordRule = {
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 8 characters', test: p => p.length >= 8 },
  { label: 'One lowercase letter', test: p => /[a-z]/.test(p) },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One number', test: p => /[0-9]/.test(p) },
  {
    label: 'One special character',
    test: p => /[^A-Za-z0-9]/.test(p),
  },
];

export function isPasswordValid(password: string) {
  return PASSWORD_RULES.every(rule => rule.test(password));
}

type PasswordRequirementsProps = {
  password: string;
};

/**
 * The tick and the cross, drawn from two bars each.
 *
 * The icon set's IconCheck is a filled box glyph rather than a tick, and it
 * takes its colour from `fill`, so a `stroke` prop on it did nothing — it
 * rendered as a green square. Two rotated bars are unambiguous, size cleanly
 * at 14px, and take whatever colour they are given.
 */
const Mark: FunctionComponent<{ met: boolean }> = ({ met }) => (
  <View style={styles.mark}>
    {met ? (
      <>
        <View style={[styles.bar, styles.tickShort]} />
        <View style={[styles.bar, styles.tickLong]} />
      </>
    ) : (
      <>
        <View style={[styles.bar, styles.crossA]} />
        <View style={[styles.bar, styles.crossB]} />
      </>
    )}
  </View>
);

const PasswordRequirements: FunctionComponent<PasswordRequirementsProps> = ({
  password,
}) => (
  <View style={styles.container}>
    {PASSWORD_RULES.map(rule => {
      // An untouched field shows every rule as outstanding rather than as
      // already satisfied, so the list reads as a set of things to do.
      const met = password.length > 0 && rule.test(password);
      return (
        <View key={rule.label} style={styles.row}>
          <Mark met={met} />
          <Text style={[styles.label, met && styles.labelMet]}>
            {rule.label}
          </Text>
        </View>
      );
    })}
  </View>
);

export default PasswordRequirements;
