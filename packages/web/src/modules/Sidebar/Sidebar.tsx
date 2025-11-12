import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import loadable from '@loadable/component';

import { isMobile } from '@fiora/utils/ua';
import { State } from '../../state/reducer';
import useIsLogin from '../../hooks/useIsLogin';
import Avatar from '../../components/Avatar';
import Tooltip from '../../components/Tooltip';
import IconButton from '../../components/IconButton';
import OnlineStatus from './OnlineStatus';
import useAction from '../../hooks/useAction';
import socket from '../../socket';
import Message from '../../components/Message';

import Admin from './Admin';
import Download from './Download';
// import Reward from './Reward';
// import About from './About';
import ProfileMenu from './ProfileMenu';

import Style from './Sidebar.less';
import useAero from '../../hooks/useAero';

const SelfInfoAsync = loadable(
    () =>
        // @ts-ignore
        import(/* webpackChunkName: "self-info" */ './SelfInfo'),
);
const SettingAsync = loadable(
    // @ts-ignore
    () => import(/* webpackChunkName: "setting" */ './Setting'),
);

function Sidebar() {
    const sidebarVisible = useSelector(
        (state: State) => state.status.sidebarVisible,
    );
    const action = useAction();
    const isLogin = useIsLogin();
    const isConnect = useSelector((state: State) => state.connect);
    const isAdmin = useSelector(
        (state: State) => state.user && state.user.isAdmin,
    );
    const avatar = useSelector(
        (state: State) => state.user && state.user.avatar,
    );

    const [selfInfoDialogVisible, toggleSelfInfoDialogVisible] =
        useState(false);
    const [adminDialogVisible, toggleAdminDialogVisible] = useState(false);
    const [downloadDialogVisible, toggleDownloadDialogVisible] =
        useState(false);
    // const [rewardDialogVisible, toggleRewardDialogVisible] = useState(false);
    // const [aboutDialogVisible, toggleAboutDialogVisible] = useState(false);
    const [settingDialogVisible, toggleSettingDialogVisible] = useState(false);
    const [profileMenuVisible, toggleProfileMenuVisible] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const aero = useAero();
    
    const username = useSelector(
        (state: State) => state.user && state.user.username,
    );
    
    const chatFilter = useSelector(
        (state: State) => state.status.chatFilter,
    );
    
    // Check if dark-sidebar theme is active
    const isDarkSidebar = typeof document !== 'undefined' && 
        document.documentElement.classList.contains('dark-sidebar');

    if (!sidebarVisible) {
        return null;
    }

    function logout() {
        action.logout();
        window.localStorage.removeItem('token');
        Message.success('You have logged out');
        socket.disconnect();
        socket.connect();
    }

    function renderTooltip(text: string, component: JSX.Element) {
        const children = <div>{component}</div>;
        if (isMobile) {
            return children;
        }
        return (
            <Tooltip
                placement="right"
                mouseEnterDelay={0.3}
                overlay={<span>{text}</span>}
            >
                {children}
            </Tooltip>
        );
    }

    function setChatFilter(filter: string) {
        action.setStatus('chatFilter', filter);
    }

    return (
        <>
            <div 
                className={`${Style.sidebar} ${sidebarExpanded ? Style.expanded : Style.collapsed} ${isDarkSidebar ? Style.darkTheme : ''}`}
                {...aero}
                data-expanded={sidebarExpanded}
            >
                {isLogin && avatar && (
                    <div className={Style.avatarContainer}>
                        <Avatar
                            className={Style.avatar}
                            src={avatar}
                            name={username || ''}
                            type="user"
                            onClick={() => {
                                if (isDarkSidebar) {
                                    toggleProfileMenuVisible(true);
                                } else {
                                    toggleSelfInfoDialogVisible(true);
                                }
                            }}
                        />
                        {sidebarExpanded && isDarkSidebar && (
                            <div className={Style.userInfo}>
                                <span className={Style.username}>{username}</span>
                            </div>
                        )}
                    </div>
                )}
                {isLogin && !isDarkSidebar && (
                    <OnlineStatus
                        className={Style.status}
                        status={isConnect ? 'online' : 'offline'}
                    />
                )}
                {isDarkSidebar && isLogin && (
                    <OnlineStatus
                        className={Style.statusDark}
                        status={isConnect ? 'online' : 'offline'}
                    />
                )}
                
                {/* Chat Filter Buttons */}
                {isLogin && (
                    <div className={Style.filterButtons}>
                        {renderTooltip(
                            'All Chats',
                            <IconButton
                                width={40}
                                height={40}
                                icon="chat"
                                iconSize={26}
                                className={chatFilter === 'all' ? Style.activeFilter : ''}
                                onClick={() => setChatFilter('all')}
                            />,
                        )}
                        {renderTooltip(
                            'Groups',
                            <IconButton
                                width={40}
                                height={40}
                                icon="groups"
                                iconSize={26}
                                className={chatFilter === 'groups' ? Style.activeFilter : ''}
                                onClick={() => setChatFilter('groups')}
                            />,
                        )}
                        {renderTooltip(
                            'Direct Messages',
                            <IconButton
                                width={40}
                                height={40}
                                icon="friends"
                                iconSize={26}
                                className={chatFilter === 'friends' ? Style.activeFilter : ''}
                                onClick={() => setChatFilter('friends')}
                            />,
                        )}
                        {renderTooltip(
                            'Communities',
                            <IconButton
                                width={40}
                                height={40}
                                icon="administrator"
                                iconSize={24}
                                className={chatFilter === 'communities' ? Style.activeFilter : ''}
                                onClick={() => setChatFilter('communities')}
                            />,
                        )}
                        {renderTooltip(
                            'Channels',
                            <div
                                className={chatFilter === 'channels' ? Style.activeFilter : ''}
                                onClick={() => setChatFilter('channels')}
                                role="button"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    borderRadius: '6px',
                                    position: 'relative',
                                    color: chatFilter === 'channels' ? 'var(--primary-text-color-10)' : 'rgba(255, 255, 255, 0.6)',
                                    transition: 'all 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    if (chatFilter !== 'channels') {
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (chatFilter !== 'channels') {
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                                    }
                                }}
                            >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    <line x1="9" y1="10" x2="15" y2="10"></line>
                                    <line x1="12" y1="14" x2="12" y2="14"></line>
                                </svg>
                            </div>,
                        )}
                    </div>
                )}
                
                <div className={Style.buttons}>
                    {isLogin &&
                        isAdmin &&
                        renderTooltip(
                            'Administrator',
                            <IconButton
                                width={40}
                                height={40}
                                icon="administrator"
                                iconSize={28}
                                onClick={() => toggleAdminDialogVisible(true)}
                            />,
                        )}
                    {/* <Tooltip
                        placement="right"
                        mouseEnterDelay={0.3}
                        overlay={<span>Source Code</span>}
                    >
                        <a
                            className={Style.linkButton}
                            href="https://github.com/yinxin630/fiora"
                            target="_black"
                            rel="noopener noreferrer"
                        >
                            <IconButton
                                width={40}
                                height={40}
                                icon="github"
                                iconSize={26}
                            />
                        </a>
                    </Tooltip> */}
                    {renderTooltip(
                        'Download APP',
                        <IconButton
                            width={40}
                            height={40}
                            icon="app"
                            iconSize={28}
                            onClick={() => toggleDownloadDialogVisible(true)}
                        />,
                    )}
                    {/* {renderTooltip(
                        'Reward',
                        <IconButton
                            width={40}
                            height={40}
                            icon="dashang"
                            iconSize={26}
                            onClick={() => toggleRewardDialogVisible(true)}
                        />,
                    )} */}
                    {/* {renderTooltip(
                        'About',
                        <IconButton
                            width={40}
                            height={40}
                            icon="about"
                            iconSize={26}
                            onClick={() => toggleAboutDialogVisible(true)}
                        />,
                    )} */}
                    {isLogin &&
                        renderTooltip(
                            'Settings',
                            <IconButton
                                width={40}
                                height={40}
                                icon="setting"
                                iconSize={26}
                                onClick={() => toggleSettingDialogVisible(true)}
                            />,
                        )}
                    {isLogin &&
                        !isDarkSidebar &&
                        renderTooltip(
                            'Logout',
                            <IconButton
                                width={40}
                                height={40}
                                icon="logout"
                                iconSize={26}
                                onClick={logout}
                            />,
                        )}
                </div>
                
                {/* Toggle expand/collapse button for dark sidebar */}
                {isDarkSidebar && (
                    <div className={Style.expandToggle}>
                        <IconButton
                            width={40}
                            height={40}
                            icon={sidebarExpanded ? "left" : "right"}
                            iconSize={20}
                            onClick={() => setSidebarExpanded(!sidebarExpanded)}
                        />
                    </div>
                )}

                {/* Dialogs */}
                {isLogin && selfInfoDialogVisible && (
                    <SelfInfoAsync
                        visible={selfInfoDialogVisible}
                        onClose={() => toggleSelfInfoDialogVisible(false)}
                    />
                )}
                {isLogin && isAdmin && (
                    <Admin
                        visible={adminDialogVisible}
                        onClose={() => toggleAdminDialogVisible(false)}
                    />
                )}
                <Download
                    visible={downloadDialogVisible}
                    onClose={() => toggleDownloadDialogVisible(false)}
                />
                {/* <Reward
                    visible={rewardDialogVisible}
                    onClose={() => toggleRewardDialogVisible(false)}
                />
                <About
                    visible={aboutDialogVisible}
                    onClose={() => toggleAboutDialogVisible(false)}
                /> */}
                {isLogin && settingDialogVisible && (
                    <SettingAsync
                        visible={settingDialogVisible}
                        onClose={() => toggleSettingDialogVisible(false)}
                    />
                )}
            </div>
            
            {/* Profile Menu for dark sidebar theme */}
            {isDarkSidebar && isLogin && avatar && username && (
                <ProfileMenu
                    visible={profileMenuVisible}
                    onClose={() => toggleProfileMenuVisible(false)}
                    avatar={avatar}
                    username={username}
                    bio="Welcome to Fiora"
                    onProfileClick={() => toggleSelfInfoDialogVisible(true)}
                    onSettingsClick={() => toggleSettingDialogVisible(true)}
                    onLogout={logout}
                />
            )}
        </>
    );
}

export default Sidebar;
