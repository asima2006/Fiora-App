import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import './styles/normalize.less';
import './styles/iconfont.less';
import './styles/darkSidebar.less';
import './styles/responsive.less';

// import { isMobile } from '@fiora/utils/ua';
import inobounce from './utils/inobounce';

import Style from './App.less';
import { State } from './state/reducer';
import LoginAndRegister from './modules/LoginAndRegister/LoginAndRegister';
import Sidebar from './modules/Sidebar/Sidebar';
import FunctionBarAndLinkmanList from './modules/FunctionBarAndLinkmanList/FunctionBarAndLinkmanList';
import UserInfo from './modules/UserInfo';
import GroupInfo from './modules/GroupInfo';
import CommunityInfo from './modules/CommunityInfo';
import CommunityManagePanel from './modules/Chat/CommunityManagePanel';
// import ChannelDiscovery from './modules/Channels/ChannelDiscovery';
import ChannelInfo from './modules/Channels/ChannelInfo';
import { ShowUserOrGroupInfoContext } from './context';
import Chat from './modules/Chat/Chat';
import globalStyles from './globalStyles';
import InviteInfo from './modules/InviteInfo';
import CommunityInviteInfo from './modules/CommunityInviteInfo';
import ChannelInviteInfo from './modules/ChannelInviteInfo';

/**
 * Get window width percentage - Now full screen
 */
function getWidthPercent() {
    return 1; // Full width
}

/**
 * Get window height percentage - Now full screen
 */
function getHeightPercent() {
    return 1; // Full height
}

function App() {
    const isReady = useSelector((state: State) => state.status.ready);
    // const chatFilter = useSelector((state: State) => state.status.chatFilter);
    // const focus = useSelector((state: State) => state.focus);
    const $app = useRef(null);

    // Apply saved theme on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const savedTheme = localStorage.getItem('fiora_theme');
            if (savedTheme === 'dark-sidebar') {
                document.documentElement.classList.add('dark-sidebar');
            }
        }
    }, []);

    // Calculate window height/width percentage
    const [width, setWidth] = useState(getWidthPercent());
    const [height, setHeight] = useState(getHeightPercent());
    useEffect(() => {
        window.onresize = () => {
            setWidth(getWidthPercent());
            setHeight(getHeightPercent());
        };

        // @ts-ignore
        inobounce($app.current);
    }, []);

    // Main style - Dark gradient background instead of anime image
    const style = useMemo(
        () => ({
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        }),
        [],
    );

    // Chat window style
    const childStyle = useMemo(
        () => ({
            width: `${width * 100}%`,
            height: `${height * 100}%`,
            left: `${((1 - width) / 2) * 100}%`,
            top: `${((1 - height) / 2) * 100}%`,
        }),
        [width, height],
    );

    const [userInfoDialog, toggleUserInfoDialog] = useState(false);
    const [userInfo, setUserInfo] = useState(null);

    const [groupInfoDialog, toggleGroupInfoDialog] = useState(false);
    const [groupInfo, setGroupInfo] = useState(null);

    const [communityInfoDialog, toggleCommunityInfoDialog] = useState(false);
    const [communityInfo, setCommunityInfo] = useState<any>(null);
    const [communityManagePanelDialog, toggleCommunityManagePanelDialog] = useState(false);
    const [communityManageInfo, setCommunityManageInfo] = useState<any>(null);

    const [channelInfoDialog, toggleChannelInfoDialog] = useState(false);
    const [channelInfo, setChannelInfo] = useState<any>(null);

    const contextValue = useMemo(
        () => ({
            showUserInfo(user: any) {
                setUserInfo(user);
                toggleUserInfoDialog(true);
            },
            showGroupInfo(group: any) {
                setGroupInfo(group);
                toggleGroupInfoDialog(true);
            },
            showCommunityInfo(community: any) {
                setCommunityInfo(community);
                toggleCommunityInfoDialog(true);
            },
            showCommunityManagePanel(community: any) {
                setCommunityManageInfo(community);
                toggleCommunityManagePanelDialog(true);
            },
            showChannelInfo(channel: any) {
                setChannelInfo(channel);
                toggleChannelInfoDialog(true);
            },
        }),
        [],
    );

    if (!isReady) {
        return null;
    }

    return (
        <div
            className={`${Style.app} ${globalStyles}`}
            style={style}
            ref={$app}
        >
            <ShowUserOrGroupInfoContext.Provider
                value={(contextValue as unknown) as null}
            >
                <div className={Style.child} style={childStyle}>
                    <Sidebar />
                    <FunctionBarAndLinkmanList />
                    <Chat />
                </div>
                <LoginAndRegister />
                <InviteInfo />
                <CommunityInviteInfo />
                <ChannelInviteInfo />
                <UserInfo
                    visible={userInfoDialog}
                    onClose={() => toggleUserInfoDialog(false)}
                    // @ts-ignore
                    user={userInfo}
                />
                <GroupInfo
                    visible={groupInfoDialog}
                    onClose={() => toggleGroupInfoDialog(false)}
                    // @ts-ignore
                    group={groupInfo}
                />
                <CommunityInfo
                    visible={communityInfoDialog}
                    onClose={() => toggleCommunityInfoDialog(false)}
                    // @ts-ignore
                    community={communityInfo}
                />
                <CommunityManagePanel
                    visible={communityManagePanelDialog}
                    onClose={() => toggleCommunityManagePanelDialog(false)}
                    // @ts-ignore
                    communityId={communityManageInfo?._id || ''}
                    communityName={communityManageInfo?.name || ''}
                    communityAvatar={communityManageInfo?.avatar || ''}
                />
                <ChannelInfo
                    visible={channelInfoDialog}
                    onClose={() => toggleChannelInfoDialog(false)}
                    // @ts-ignore
                    channel={channelInfo}
                />
            </ShowUserOrGroupInfoContext.Provider>
        </div>
    );
}

export default App;
