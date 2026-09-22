import React, { FunctionComponent } from 'react';
import { Text, View } from 'react-native';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

// types
import { ItemsProfileTabType } from '../../ProfileTab.types';

// components
import ButtonModalTabs from '../../../../../components/ButtonModalTabs/ButtonModalTabs';

// constants
import { LIST_BUTTONS_SETTINGS_BLOCK } from './SettingsBlock.constants';

// styles
import styles from './SettingsBlock.styles';

type SettingsBlockProps = {
  setSelectTypeModal: React.Dispatch<
    React.SetStateAction<ItemsProfileTabType | null>
  >;
};

/**
 * Which build, and whether an over-the-air update is running.
 *
 * Added during the board review because there was no way to answer either
 * question from a phone. A tester on an old build and a tester whose update
 * never arrived look identical from the outside — both just say "I don't see
 * the fix" — and that cost a whole round of guessing.
 *
 * "embedded" means the app is running the JavaScript that shipped inside the
 * build. Anything else is the short id of the update that is running, which
 * matches the id printed when the update was published.
 *
 * Wrapped because a diagnostic must never be the thing that breaks the screen
 * it is on: expo-updates throws on these getters when updates are disabled.
 */
function versionLine(): string {
  const version = Constants.expoConfig?.version ?? '?';
  const build =
    Constants.expoConfig?.ios?.buildNumber ??
    String(Constants.expoConfig?.android?.versionCode ?? '?');

  let running = 'embedded';
  try {
    if (!Updates.isEmbeddedLaunch && Updates.updateId) {
      running = Updates.updateId.slice(0, 8);
    }
  } catch {
    running = 'unknown';
  }
  return `v${version} (${build}) · ${running}`;
}

const SettingsBlock: FunctionComponent<SettingsBlockProps> = ({
  setSelectTypeModal,
}) => (
  <View style={styles.container}>
    <Text style={styles.title}>Settings</Text>
    {LIST_BUTTONS_SETTINGS_BLOCK.map((item, index) => (
      <ButtonModalTabs
        key={index}
        Icon={item.Icon}
        label={item.title}
        onPress={() => setSelectTypeModal(item.type)}
        tone={item.type === 'deleteAccount' ? 'danger' : 'default'}
      />
    ))}
    <Text style={styles.versionLine}>{versionLine()}</Text>
  </View>
);

export default React.memo(SettingsBlock);
