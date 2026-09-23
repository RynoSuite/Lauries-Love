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

/**
 * Why an update has not arrived.
 *
 * Build 162 reported "embedded" after several updates had been published, so
 * expo-updates is running — the native module answered — but is either not
 * fetching or failing to. A silent failure is the one thing that cannot be
 * diagnosed from a laptop, so the app asks on its own and shows the answer.
 *
 * checkForUpdateAsync() reaches u.expo.dev with this build's channel and
 * runtime version, which is exactly the request that is not landing.
 */
function useUpdateCheck(): string {
  const [state, setState] = React.useState('checking…');

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const channel = Updates.channel ?? 'none';
        const runtime = Updates.runtimeVersion ?? '?';
        const res = await Updates.checkForUpdateAsync();
        if (cancelled) return;
        setState(
          res.isAvailable
            ? `${channel}/${runtime}: update available`
            : `${channel}/${runtime}: none offered`,
        );
      } catch (error: any) {
        if (cancelled) return;
        // The message is the point — "not configured", a network error and a
        // signature failure are three different problems that look identical
        // from outside.
        setState(`error: ${String(error?.message ?? error).slice(0, 60)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

const SettingsBlock: FunctionComponent<SettingsBlockProps> = ({
  setSelectTypeModal,
}) => {
  const updateState = useUpdateCheck();

  return (
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
      <Text style={styles.versionLine}>{updateState}</Text>
    </View>
  );
};

export default React.memo(SettingsBlock);
