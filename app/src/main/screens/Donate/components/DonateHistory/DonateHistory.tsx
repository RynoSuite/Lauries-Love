import React from 'react';

// components
import { PaymentList } from 'presentation/ui/organism';
import BottomSheetDonateTab from '../BottomSheetDonateTab/BottomSheetDonateTab';

// icons
import { IconHistory } from 'assets/icons-auto/components';

// styles
import colors from 'styles/colors';
import { TouchableOpacity, View } from 'react-native';

export default function DonateHistory({ historyOpen = false }) {
  const [isOpen, setIsOpen] = React.useState(historyOpen);

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={{ padding: 8, backgroundColor: 'white', borderRadius: '100%' }}
      >
        <IconHistory width={24} height={24} fill={colors.heading} />
      </TouchableOpacity>
      {isOpen && (
        <BottomSheetDonateTab
          title="Donation History"
          onClose={() => setIsOpen(false)}
          snapPoints={['90%']}
        >
          <View
            style={{
              justifyContent: 'flex-start',
              alignItems: 'center',
              height: '100%',
              width: '100%',
            }}
          >
            <View style={{ width: '100%', height: '100%' }}>
              <View>
                <PaymentList
                  cardProps={{
                    onPressViewReceipt: () => setIsOpen(false),
                  }}
                />
              </View>
              {/* <VStack w="100%" space="0" pb="6">
              <PaymentMethods
                onClick={closeModal}
                openPrevious={() => setIsOpen(true)}
              />
              <OptionButton
                variant="solid"
                onPress={() => setIsOpen(true)}
                borderBottomRadius="10px"
              >
                {t('donate.receipt.actions.contact')}
              </OptionButton>
            </VStack> */}
            </View>
          </View>
        </BottomSheetDonateTab>
      )}
    </>
  );
}
