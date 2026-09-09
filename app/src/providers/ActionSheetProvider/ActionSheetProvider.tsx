import React, {
  createContext,
  FunctionComponent,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import ActionSheet, {
  type ActionSheetItem,
} from 'components/ActionSheet/ActionSheet';

export type ShowSheetOptions = {
  title?: string;
  message?: string;
  items: ActionSheetItem[];
};

type ActionSheetContext = {
  showSheet: (options: ShowSheetOptions) => void;
  hideSheet: () => void;
};

const actionSheetContext = createContext({} as ActionSheetContext);

/**
 * One sheet for the whole app.
 *
 * Alert.alert is a system component: it renders in the platform's colours
 * rather than ours, so every choice in a dark app produced a white box, and it
 * cannot carry icons. Replacing it screen by screen meant threading modal
 * state through a dozen components; this holds it once at the root so a call
 * site is a single showSheet(...).
 */
const ActionSheetProvider: FunctionComponent<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [options, setOptions] = useState<ShowSheetOptions | null>(null);

  const showSheet = useCallback((next: ShowSheetOptions) => {
    setOptions(next);
  }, []);
  const hideSheet = useCallback(() => setOptions(null), []);

  const value = useMemo(() => ({ showSheet, hideSheet }), [showSheet, hideSheet]);

  return (
    <actionSheetContext.Provider value={value}>
      {children}
      <ActionSheet
        visible={!!options}
        title={options?.title}
        message={options?.message}
        items={options?.items ?? []}
        onClose={hideSheet}
      />
    </actionSheetContext.Provider>
  );
};

export const useActionSheet = () => useContext(actionSheetContext);

export default ActionSheetProvider;
