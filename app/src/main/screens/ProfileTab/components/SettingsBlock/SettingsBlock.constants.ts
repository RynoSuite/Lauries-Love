import {
  IconFileTextProfile,
  IconLayout,
  IconLogOutProfile,
  IconShieldProfile,
  IconTrashProfile,
} from 'assets/icons-auto/components';
import { IconType } from 'assets/icons-auto/icon.types';
import { ItemsProfileTabType } from '../../ProfileTab.types';

export const LIST_BUTTONS_SETTINGS_BLOCK: Array<{
  id: string;
  title: string;
  type: ItemsProfileTabType;
  Icon: (originalProps: IconType) => React.JSX.Element;
}> = [
  {
    id: 'appearance',
    title: 'Appearance',
    type: 'appearance',
    Icon: IconLayout,
  },
  {
    id: 'privacy',
    title: 'Privacy policy',
    type: 'privacy',
    Icon: IconShieldProfile,
  },
  {
    id: 'terms',
    title: 'Terms and conditions',
    type: 'terms',
    Icon: IconFileTextProfile,
  },
  {
    id: 'logout',
    title: 'Logout',
    type: 'logout',
    Icon: IconLogOutProfile,
  },
  {
    id: 'delete',
    title: 'Delete account',
    type: 'deleteAccount',
    Icon: IconTrashProfile,
  },
];
