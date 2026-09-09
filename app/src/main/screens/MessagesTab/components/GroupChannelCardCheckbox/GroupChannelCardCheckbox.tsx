import React from 'react';
import { Text, TouchableOpacity, View, Image } from 'react-native';
import colors from 'styles/colors';
import { FONT_RALEWAY_500 } from 'styles/fonts';
import { IconCheckbox } from 'assets/icons-auto/components';

interface Channel {
  name: string;
  coverUrl?: string;
}

interface GroupChannelCardCheckboxProps {
  channel: Channel;
  isSelected: boolean;
  toggleSelected: () => void;
}

const GroupChannelCardCheckbox: React.FC<GroupChannelCardCheckboxProps> = ({ channel, isSelected, toggleSelected }) => {
  const { name, coverUrl } = channel;

  return (
    <TouchableOpacity
      onPress={toggleSelected}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: colors.surface2,
        borderWidth: isSelected ? 1 : 0,
        borderColor: isSelected ? colors.heading : 'transparent',
      }}
    >
      {coverUrl ? (
        <Image
          source={{ uri: coverUrl }}
          style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 12,
            backgroundColor: colors.secondary[600],
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: 'white', fontSize: 18 }}>💬</Text>
        </View>
      )}

      <Text
        style={{
          flex: 1,
          fontFamily: FONT_RALEWAY_500,
          fontSize: 16,
          color: colors.heading,
        }}
      >
        {name}
      </Text>

      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.heading,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isSelected && (
          <IconCheckbox width={14} height={14} stroke={colors.heading} />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default GroupChannelCardCheckbox;
