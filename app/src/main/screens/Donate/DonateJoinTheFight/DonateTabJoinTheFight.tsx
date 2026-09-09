import React, { FunctionComponent } from 'react';
import {
  ImageBackground,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// types
import { RootDonateTabParamList } from 'main/navigators/DonateTabStacks/DonateTabStacks.types';

// components
import BackgroundDonate from '../components/BackgroundDonate/BackgroundDonate';

// icons
import { IconArrowLeft, IconClock } from 'assets/icons-auto/components';

// styles
import styles from './DonateTabJoinTheFight.styles';
import colors from 'styles/colors';

type ClientsMainScreenProps = {
  navigation: NativeStackNavigationProp<RootDonateTabParamList>;
};

const DonateTabJoinTheFight: FunctionComponent<ClientsMainScreenProps> = ({
  navigation,
}) => {
  return (
    <BackgroundDonate>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <IconArrowLeft width={28} height={28} stroke={colors.heading} strokeWidth={2} />
          </TouchableOpacity>
          <ImageBackground
            resizeMode="cover"
            source={require('assets/images/join-the-fight-screen.jpg')}
            style={styles.bannerContainer}
            imageStyle={{ borderRadius: 6 }}
          >
            <View style={styles.banner}>
              <View>
                <Text style={styles.bannerTitle}>Join the Fight:</Text>
                <Text style={styles.bannerTitle}>Support Laurie’s Love</Text>
              </View>
              <View style={styles.tag}>
                <IconClock
                  width={14}
                  height={14}
                  stroke={'#000'}
                  strokeWidth={2}
                />
                <Text style={styles.tagText}>2 min read</Text>
              </View>
            </View>
            <View style={{ flex: 1 }} />
          </ImageBackground>

          <View style={styles.textContainer}>
            <Text style={styles.title}>Join Our Fight</Text>
            <Text style={styles.text}>
              Join our fight dear friends, Laurie's Love was born in October
              2021 from a realization that those in need must find a connection
              to share experiences, learn, and find comfort through their cancer
              journey. This has been a very fast-moving process to have an app
              created and tested in just 10 months. We could not have done this
              without your help and support.
            </Text>
            <Text style={styles.text}>
              My hope is that Laurie’s Love members find the comfort throughout
              their cancer journey as I did through the support of friends,
              family, and other warriors experiencing the same journey. These
              are relationships that go deep and have left an indelible mark in
              my heart….I am and will be forever grateful.
            </Text>
            <Text style={styles.title}>Seeking Supporters and Donors</Text>
            <Text style={styles.text}>
              So, what's next? The hard work of finding those who believe in
              what we are doing and want to share this message. We believe in
              this app and what it can do for those touched by cancer. To move
              forward, the search for donors has started. The costs associated
              with being able to grow Laurie's Love and share this tool are
              high, but we know we'll find the right supporters.
            </Text>
            <Text style={styles.title}>Progress and Next Steps</Text>
            <Text style={styles.text}>
              We have already raised $35,000 just within a short amount of time,
              but we'll need more to get the custom app created. We thank you
              again for your time. And please stay tuned, we hope to have more
              updates and good news as we navigate this process.
            </Text>
            <Text style={styles.text}>Many thanks again,</Text>

            <Text style={styles.text}>
              Tara Zuzga and the Laurie's Love Board of Directors
            </Text>
            <Text style={styles.text}>www.laurieslove.org</Text>
          </View>
        </View>
      </ScrollView>
    </BackgroundDonate>
  );
};

export default DonateTabJoinTheFight;
