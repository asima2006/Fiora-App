/* eslint-disable indent */
import { createContext } from 'react';

// eslint-disable-next-line import/prefer-default-export
export const ShowUserOrGroupInfoContext = createContext<{
    showUserInfo: (user: any) => void;
    showGroupInfo: (group: any) => void;
    showCommunityInfo: (community: any) => void;
    showCommunityManagePanel: (community: any) => void;
    showChannelInfo: (channel: any) => void;
} | null>(null);
