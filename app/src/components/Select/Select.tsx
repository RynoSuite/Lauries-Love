import { LinearGradient } from 'expo-linear-gradient';
import React, { Dispatch, useState, useRef, ElementRef, useMemo } from 'react';
import {
  FlatList,
  Modal,
  Text,
  TouchableOpacity,
  View,
  LayoutRectangle,
  Pressable,
  Dimensions,
  TextInput,
} from 'react-native';

import colors from 'styles/colors';
import styles from './Select.styles';
import { FONT_RALEWAY_500 } from 'styles/fonts';
import { IconCheckbox, IconChevronDown } from 'assets/icons-auto/components';

type Props = {
  options: { id: string; label: string }[];
  onSelect: Dispatch<{ id: string; label: string }[]>;
  selected: { id: string; label: string }[];
  showSearch?: boolean;
  disabled?: boolean;
};

export default function Select({
  options,
  onSelect,
  selected,
  showSearch = false,
  disabled = false,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [buttonLayout, setButtonLayout] = useState<LayoutRectangle | null>(
    null,
  );

  const toggleModal = () => setIsOpen(!isOpen);

  const buttonRef = useRef<ElementRef<typeof TouchableOpacity>>(null);

  const screenHeight = Dimensions.get('window').height;

  const screenWidth = Dimensions.get('window').width;

  function isSelected(item: { id: string }) {
    return selected.some(selectedItem => selectedItem.id === item.id);
  }

  function handleSelection(item: { id: string; label: string }) {
    if (item.id === 'no-preference') {
      onSelect([]);
    } else {
      const newSelection = isSelected(item)
        ? selected.filter(selectedItem => selectedItem.id !== item.id)
        : [
            ...selected.filter(
              selectedItem => selectedItem.id !== 'no-preference',
            ),
            item,
          ];

      onSelect(newSelection);
    }
  }

  function renderItem({ item }: { item: { id: string; label: string } }) {
    return (
      <TouchableOpacity
        onPress={() => {
          handleSelection(item);
        }}
        style={styles.dropdownItem}
      >
        <Text
          style={{
            fontFamily: FONT_RALEWAY_500,
            fontSize: 16,
            color: colors.heading,
          }}
        >
          {item.label}
        </Text>

        <View
          style={[
            styles.checkboxContainer,
            isSelected(item) && styles.selectedCheckbox,
          ]}
        >
          {isSelected(item) && (
            <IconCheckbox width={14} height={14} stroke={colors.neutral[100]} />
          )}
        </View>
      </TouchableOpacity>
    );
  }

  const filteredOptions = useMemo(() => {
    const q = query.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View>
      <LinearGradient
        colors={['rgba(178, 93, 149, 1)', 'rgba(255, 162, 60, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[
          styles.gradientBorder,
          {
            opacity: disabled ? 0.5 : 1,
          },
        ]}
      >
        <Pressable
          disabled={disabled}
          ref={buttonRef}
          onPress={() => {
            buttonRef.current?.measure(
              (
                x: number,
                y: number,
                width: number,
                height: number,
                pageX: number,
                pageY: number,
              ) => {
                setButtonLayout({ x: pageX, y: pageY, width, height });
                toggleModal();
              },
            );
          }}
          style={[
            styles.button,
            isOpen && [styles.buttonOpen, { width: screenWidth - 36 }],
          ]}
        >
          <Text
            style={[
              styles.selectedText,
              {
                color:
                  selected.length === 0
                    ? colors.neutral[600]
                    : colors.primary[600],
              },
            ]}
          >
            {selected.length === 0
              ? 'No preference'
              : selected.map(item => item.label).join(', ')}
          </Text>
          <IconChevronDown
            width={24}
            height={24}
            stroke={colors.muted}
          />
        </Pressable>
      </LinearGradient>
      <Modal
        visible={isOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={toggleModal}
      >
        <Pressable onPress={toggleModal} style={styles.modalContainer}>
          {buttonLayout && (
            <Pressable
              onPress={e => e.stopPropagation()}
              style={[
                styles.dropdownContainer,
                {
                  top:
                    buttonLayout.y + buttonLayout.height + 254 > screenHeight
                      ? buttonLayout.y - 254 - 8
                      : buttonLayout.y + buttonLayout.height + 8,
                  left: buttonLayout.x,
                  width: buttonLayout.width,
                  height: showSearch ? 254 : 'auto',
                },
              ]}
            >
              {showSearch && (
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search..."
                  placeholderTextColor={colors.neutral[500]}
                />
              )}
              <FlatList
                data={filteredOptions}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ gap: 1 }}
                showsVerticalScrollIndicator={false}
              />
            </Pressable>
          )}
        </Pressable>
      </Modal>
    </View>
  );
}
