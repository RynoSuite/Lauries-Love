import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';
import colors from 'styles/colors';

// import { Loader } from 'presentation/ui/atoms';
import { PaymentListProps } from './payment-list.model';
import { DonationCard } from 'presentation/ui/molecules';
import { PaginationResponse, Payment } from 'data/models';
import { usePaymentProvider } from 'providers/PaymentProvider/PaymentProvider';

export default function PaymentList(props: PaymentListProps) {
  const { cardProps } = props;

  const [data, setData] = React.useState<PaginationResponse<Payment> | null>(
    null,
  );
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const { listPayments, isLoading } = usePaymentProvider();

  const loadData = async (page: number = 0) => {
    const response = await listPayments(page);
    if (response) {
      setData(response);
      if (page === 0) {
        setPayments(response.data);
      } else setPayments([...payments, ...response.data]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const { t } = useTranslation('screens');

  const renderFooter = () => {
    if (!isLoading) {
      return renderDivider();
    }
    return (
      <View
        style={{
          marginVertical: 10,
          flexDirection: 'row',
          justifyContent: 'center',
        }}
      >
        {/* <Loader /> */}
      </View>
    );
  };

  const renderDivider = () => {
    return <View style={{ marginVertical: 2 }} />;
  };

  //   if (isLoading && !data) {
  //     return <Loader />;
  //   }

  return (
    <View style={{ width: '100%', paddingBottom: 80, alignItems: 'center' }}>
      {payments && payments.length > 0 ? (
        <FlatList
          style={{ width: '100%' }}
          refreshing={isLoading || refreshing}
          data={payments}
          showsVerticalScrollIndicator={false}
          keyExtractor={item => `donation-${item.id}`}
          ItemSeparatorComponent={renderDivider}
          ListFooterComponent={renderFooter}
          onEndReached={() => {
            if (data && data.page < data.pageCount) {
              loadData(data.page + 1);
            }
          }}
          onEndReachedThreshold={0}
          renderItem={({ item }) => <DonationCard item={item} {...cardProps} />}
          onRefresh={() => {
            setRefreshing(true);
            loadData(0);
            setRefreshing(false);
          }}
        />
      ) : (
        <View>
          <Text style={{ color: colors.muted, fontSize: 15 }}>
            {t('donate.history.empty')}
          </Text>
        </View>
      )}
    </View>
  );
}
