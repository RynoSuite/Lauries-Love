import React, { FunctionComponent, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

// types
import { RootProfileTabParamList } from 'main/navigators/ProfileTabStacks/ProfileTabStacks.types';

// components
import BackgroundScreen from 'components/BackgroundScreen/BackgroundScreen';
import HeaderTabScreen from 'components/HeaderTabScreen/HeaderTabScreen';

// providers
import { useToastProvider } from 'providers/ToastProvider/ToastProvider';

// backend
import {
  addSupportAgent,
  listSupportStaffDetailed,
  removeSupportStaff,
  searchAddableUsers,
  AddableUser,
  StaffMemberDetailed,
} from 'services/supabase/supabase.support';

// styles
import styles from './ProfileTabSupportStaff.styles';
import colors from 'styles/colors';
import { useActionSheet } from 'providers/ActionSheetProvider/ActionSheetProvider';

type Props = {
  navigation: NativeStackNavigationProp<RootProfileTabParamList>;
};

const ProfileTabSupportStaff: FunctionComponent<Props> = ({ navigation }) => {
  const { showSheet } = useActionSheet();
  const { showToast } = useToastProvider();
  const [staff, setStaff] = useState<StaffMemberDetailed[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddableUser[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setStaff(await listSupportStaffDetailed());
    } catch (e) {
      if (__DEV__) console.warn('load staff failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const runSearch = async (text: string) => {
    setQuery(text);
    if (text.trim().length < 2) {
      setResults([]);
      return;
    }
    try {
      setSearching(true);
      const staffIds = new Set(staff.map(s => s.id));
      const found = await searchAddableUsers(text);
      setResults(found.filter(u => !staffIds.has(u.id)));
    } catch (e) {
      if (__DEV__) console.warn('search failed', e);
    } finally {
      setSearching(false);
    }
  };

  const add = async (u: AddableUser) => {
    try {
      await addSupportAgent(u.id);
      showToast({ type: 'success', message: `${u.name} added as an agent.` });
      setQuery('');
      setResults([]);
      await load();
    } catch (e: any) {
      showToast({ type: 'error', message: e?.message ?? 'Could not add agent.' });
    }
  };

  const confirmRemove = (m: StaffMemberDetailed) => {
    showSheet({
      title: 'Remove staff member',
      message: `Remove ${m.name} from the support team?`,
      items: [
        {
          label: 'Remove',
          destructive: true,
          onPress: async () => {
            try {
              await removeSupportStaff(m.id);
              showToast({ type: 'success', message: `${m.name} removed.` });
              await load();
            } catch (e: any) {
              showToast({
                type: 'error',
                message: e?.message ?? 'Could not remove.',
              });
            }
          },
        },
      ],
    });
  };

  return (
    <BackgroundScreen>
      <HeaderTabScreen
        title="Manage agents"
        onPressLeft={() => navigation.goBack()}
      />
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          <Text style={styles.sectionTitle}>Add an agent</Text>
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={runSearch}
            placeholder="Search members by name…"
            autoCapitalize="none"
          />
          {searching && (
            <ActivityIndicator style={{ marginTop: 10 }} color={colors.primary[500]} />
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <Text style={styles.hint}>No matching members.</Text>
          )}
          {results.map(u => (
            <View key={u.id} style={[styles.row, { marginTop: 8 }]}>
              <View style={styles.rowMain}>
                <Text style={styles.name}>{u.name}</Text>
                {!!u.email && <Text style={styles.sub}>{u.email}</Text>}
              </View>
              <TouchableOpacity onPress={() => add(u)}>
                <Text style={styles.addBtn}>Add</Text>
              </TouchableOpacity>
            </View>
          ))}

          <Text style={styles.sectionTitle}>Current team</Text>
          {loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary[500]} />
          ) : (
            staff.map(m => (
              <View key={m.id} style={styles.row}>
                <View style={styles.rowMain}>
                  <Text style={styles.name}>{m.name}</Text>
                  {!!m.email && <Text style={styles.sub}>{m.email}</Text>}
                </View>
                <Text
                  style={[
                    styles.roleTag,
                    m.role === 'owner' ? styles.owner : styles.agent,
                  ]}
                >
                  {m.role}
                </Text>
                <TouchableOpacity onPress={() => confirmRemove(m)}>
                  <Text style={styles.remove}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </BackgroundScreen>
  );
};

export default ProfileTabSupportStaff;
