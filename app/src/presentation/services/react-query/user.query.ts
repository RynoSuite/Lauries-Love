import { makeAxiosHttpClient } from 'main/factories/http';
import { useQuery, useMutation } from '@tanstack/react-query';
import { appConfig } from 'main/config/app.config';
import { PaginationResponse, User, UserDBInput } from 'data/models';
import { UserModel } from 'domain/models';
// import { useAppDispatch, useAppSelector } from 'presentation/store/hooks';
// import { saveUser } from 'presentation/store/user';
// import { makeRemoteStorageAdapter } from 'main/factories/storage';
// import { selectCurrentUser } from 'presentation/store/selectors/user.selector';

import { RequestKeys } from './queries.model';

type Variables = Partial<User>;

// export function useUpdateUser() {
//   const dispatch = useAppDispatch();

//   const user = useAppSelector(selectCurrentUser);
//   return useMutation({
//     mutationFn: async ({ id, ...body }: Variables) => {
//       if (!id || user?.id) return null;
//       const req = await makeAxiosHttpClient().request({
//         method: 'put',
//         url: `${appConfig.apiUrl}/users/${user?.id || id}`,
//         body,
//       });
//       return req;
//     },
//     onError: err => {
//       console.error(err);
//     },
//     onSuccess: async data => {
//       if (!data) return;
//       if (data.body && data.statusCode === 200) {
//         const newUser = {
//           ...data.body,
//         };
//         if (
//           newUser?.profilePicture &&
//           user?.profilePicture !== newUser.profilePicture
//         ) {
//           const pic = await makeRemoteStorageAdapter().getFile(
//             newUser.profilePicture,
//             {
//               cacheControl: 'no-cache',
//             },
//           );
//           newUser.profileImgUrl = pic;
//         } else {
//           newUser.profileImgUrl = user?.profileImgUrl;
//         }

//         dispatch(saveUser(newUser));
//       }
//     },
//   });
// }

export const useGetUsersReq = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const url = `${appConfig.apiUrl}/users`;
  return useQuery({
    enabled,
    queryKey: [RequestKeys.userList],
    queryFn: async () => {
      const res = await makeAxiosHttpClient().request({
        method: 'get',
        url,
      });

      const users = res.body?.data || [];

      // Rebuild fix (logic): the old filter dropped anyone with an empty
      // diagnosisYear — but supporters/caregivers/family legitimately have
      // none, so they were invisible in Connect. Only drop profiles that
      // never completed onboarding (no name at all).
      const filteredUsers = users.filter(
        (user: UserModel) => !!(user.displayName || user.firstName),
      );

      return {
        ...res.body,
        data: filteredUsers,
      } as PaginationResponse<UserModel>;
    },
    throwOnError: err => {
      console.error(err?.message);
      return false;
    },
    // 10s staleTime was overriding the 5-min global default and refetched the
    // entire users list on every tab hop. Match the global default.
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Viewport-aware users query for the MAP: only fetches profiles inside the
 * visible region (users_in_bbox RPC) instead of the whole community.
 * bbox values are rounded to ~1km so tiny pans reuse the cache.
 */
export const useGetUsersInRegionReq = (
  region: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null,
) => {
  const url = `${appConfig.apiUrl}/users`;
  // Pad the box 25% beyond the viewport so markers exist while panning.
  const bbox = region
    ? {
        minLat: +(region.latitude - region.latitudeDelta * 0.625).toFixed(2),
        maxLat: +(region.latitude + region.latitudeDelta * 0.625).toFixed(2),
        minLng: +(region.longitude - region.longitudeDelta * 0.625).toFixed(2),
        maxLng: +(region.longitude + region.longitudeDelta * 0.625).toFixed(2),
      }
    : null;
  return useQuery({
    queryKey: [RequestKeys.userList, 'bbox', bbox],
    enabled: !!bbox,
    queryFn: async () => {
      const res = await makeAxiosHttpClient().request({
        method: 'get',
        url,
        params: { ...bbox, limit: 500 },
      });
      const users = (res.body?.data || []).filter(
        (user: UserModel) => !!(user.displayName || user.firstName),
      );
      return { ...res.body, data: users } as PaginationResponse<UserModel>;
    },
    placeholderData: prev => prev, // keep old markers while the next box loads
    staleTime: 5 * 60 * 1000,
    throwOnError: err => {
      console.error(err?.message);
      return false;
    },
  });
};

// export const useCreateUser = () => {
//   return useMutation({
//     mutationFn: async (body: UserDBInput): Promise<User> => {
//       const req = await makeAxiosHttpClient().request({
//         method: 'post',
//         url: `${appConfig.apiUrl}/users`,
//         body,
//       });
//       return req.body;
//     },
//     onError: error => {
//       console.error(error);
//     },
//   });
// };
