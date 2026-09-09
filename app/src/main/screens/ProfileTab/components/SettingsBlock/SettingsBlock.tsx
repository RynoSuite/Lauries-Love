import React, { FunctionComponent } from 'react';
import { Text, View } from 'react-native';

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
  </View>
);

export default React.memo(SettingsBlock);
