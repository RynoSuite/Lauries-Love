import React, { FunctionComponent, useMemo, useState } from 'react';
import { ScrollView } from 'react-native';

// components
import BottomSheetProfileTab from '../BottomSheetProfileTab/BottomSheetProfileTab';
import ButtonSelectProfileTab from '../ButtonSelectProfileTab/ButtonSelectProfileTab';

// styles
import styles from './CheckboxProfileTabModal.styles';

type CheckboxProfileTabModalProps = {
  title: string;
  options: Array<{ text: string; value: string }>;
  prevSelect: string[];
  onClose: () => void;
  onSave: (value: string[]) => void;
  scrollEnabled?: boolean;
};

const CheckboxProfileTabModal: FunctionComponent<
  CheckboxProfileTabModalProps
> = ({
  title,
  options,
  prevSelect = [],
  onClose,
  onSave,
  scrollEnabled = false,
}) => {
  const [selected, setSelected] = useState<string[]>(prevSelect);

  const isDisabled = useMemo(
    () => selected === prevSelect || !selected,
    [selected, prevSelect],
  );

  const onSelected = (value: string) => {
    setSelected([value]);
  };

  const onSubmit = () => {
    onSave(selected);
  };

  return (
    <BottomSheetProfileTab
      title={title}
      disabled={isDisabled}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        style={styles.scrollContainer}
        contentContainerStyle={styles.container}
      >
        {options.map(item => (
          <ButtonSelectProfileTab
            key={`button-gender-${item.value}`}
            title={item.text}
            onPress={() => onSelected(item.value)}
            isSelected={selected.includes(item.value)}
            isCheckbox
          />
        ))}
      </ScrollView>
    </BottomSheetProfileTab>
  );
};

export default CheckboxProfileTabModal;
