import React, { useContext, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import Style from './Chat.less';
import HeaderBar from './HeaderBar';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import GroupManagePanel from './GroupManagePanel';
import CommunityManagePanel from './CommunityManagePanel';
import ChannelInfo from '../Channels/ChannelInfo';
import JoinChannelPrompt from '../Channels/JoinChannelPrompt';
import { State, GroupMember } from '../../state/reducer';
import { ShowUserOrGroupInfoContext } from '../../context';
import useIsLogin from '../../hooks/useIsLogin';
import {
    getGroupOnlineMembers,
    getUserOnlineStatus,
    updateHistory,
} from '../../service';
import useAction from '../../hooks/useAction';
import useAero from '../../hooks/useAero';
import store from '../../state/store';

let lastMessageIdCache = '';

function Chat() {
    const isLogin = useIsLogin();
    const action = useAction();
    const hasUserInfo = useSelector((state: State) => !!state.user);
    const focus = useSelector((state: State) => state.focus);
    const linkman = useSelector((state: State) => state.linkmans[focus]);
    const communities = useSelector((state: State) => state.communities);
    const channels = useSelector((state: State) => state.channels);
    const chatFilter = useSelector((state: State) => state.status.chatFilter);
    const typingUsers = useSelector((state: State) => {
        const typing = state.linkmans[focus]?.typingUsers;
        return typing ? Object.values(typing) : [];
    });
    const [groupManagePanel, toggleGroupManagePanel] = useState(false);
    const [communityManagePanel, toggleCommunityManagePanel] = useState(false);
    const [channelInfoPanel, toggleChannelInfoPanel] = useState(false);
    const context = useContext(ShowUserOrGroupInfoContext);
    const aero = useAero();
    const self = useSelector((state: State) => state.user?._id) || '';
    
    // Check if current focus is a community
    const currentCommunity = communities.find(c => c._id === focus);
    
    // Check if current focus is a channel (by linkman type)
    const isChannel = linkman && linkman.type === 'channel';
    const currentChannel = isChannel ? channels.find(c => c._id === focus) : null;
    
    // Check if user is subscribed to the channel by checking if selfId is in subscribers array
    const isSubscribedToChannel = isChannel && currentChannel && 
        currentChannel.subscribers?.some((subscriberId: any) => 
            subscriberId.toString() === self.toString()
        );
    
    // Check if current group belongs to any community
    const isGroupInCommunity = linkman && linkman.type === 'group' && communities.some(community => 
        community.groups?.some((groupId: string) => groupId === linkman._id) ||
        community.announcementGroupId === linkman._id
    );

    function handleBodyClick(e: MouseEvent) {
        const { currentTarget } = e;
        let target = e.target as HTMLDivElement;
        do {
            if (target.getAttribute('data-float-panel') === 'true') {
                return;
            }
            // @ts-ignore
            target = target.parentElement;
        } while (target && target !== currentTarget);
        toggleGroupManagePanel(false);
        toggleCommunityManagePanel(false);
        toggleChannelInfoPanel(false);
    }
    useEffect(() => {
        document.body.addEventListener('click', handleBodyClick, false);
        return () => {
            document.body.removeEventListener('click', handleBodyClick, false);
        };
    }, []);

    async function fetchGroupOnlineMembers() {
        let onlineMembers: GroupMember[] | { cache: true } = [];
        if (isLogin) {
            onlineMembers = await getGroupOnlineMembers(focus);
        }
        if (Array.isArray(onlineMembers)) {
            action.setLinkmanProperty(focus, 'onlineMembers', onlineMembers);
        }
    }
    async function fetchUserOnlineStatus() {
        const isOnline = await getUserOnlineStatus(focus.replace(self, ''));
        action.setLinkmanProperty(focus, 'isOnline', isOnline);
    }
    useEffect(() => {
        if (!linkman) {
            return () => {};
        }
        const request =
            linkman.type === 'group'
                ? fetchGroupOnlineMembers
                : fetchUserOnlineStatus;
        request();
        const timer = setInterval(() => request(), 1000 * 60);
        return () => clearInterval(timer);
    }, [focus]);

    async function intervalUpdateHistory() {
        // Must get real-time state
        const state = store.getState();
        if (
            !window.document.hidden &&
            state.focus &&
            state.linkmans[state.focus] &&
            state.user?._id
        ) {
            const messageKeys = Object.keys(
                state.linkmans[state.focus].messages,
            );
            if (messageKeys.length > 0) {
                const lastMessageId =
                    state.linkmans[state.focus].messages[
                        messageKeys[messageKeys.length - 1]
                    ]._id;
                if (lastMessageId !== lastMessageIdCache) {
                    lastMessageIdCache = lastMessageId;
                    await updateHistory(state.focus, lastMessageId);
                }
            }
        }
    }
    useEffect(() => {
        const timer = setInterval(intervalUpdateHistory, 1000 * 30);
        return () => clearInterval(timer);
    }, [focus]);

    if (!hasUserInfo) {
        return <div className={Style.chat} />;
    }
    if (!linkman) {
        const renderEmptyState = () => {
            if (chatFilter === 'communities') {
                return (
                    <div className={Style.noCommunityHero}>
                        <div className={Style.noCommunityIcon}>
                            <svg
                                width="120"
                                height="120"
                                viewBox="0 0 120 120"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <circle cx="40" cy="46" r="16" fill="rgba(255,255,255,0.18)" />
                                <circle cx="80" cy="46" r="16" fill="rgba(255,255,255,0.18)" />
                                <circle cx="60" cy="32" r="18" fill="rgba(255,255,255,0.28)" />
                                <path
                                    d="M24 86c0-12.15 14.33-22 32-22s32 9.85 32 22"
                                    stroke="rgba(255,255,255,0.3)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M12 94c0-11 11.64-20 26-20"
                                    stroke="rgba(255,255,255,0.18)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                                <path
                                    d="M108 94c0-11-11.64-20-26-20"
                                    stroke="rgba(255,255,255,0.18)"
                                    strokeWidth="6"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <h2 className={Style.noCommunityTitle}>Create communities</h2>
                        <p className={Style.noCommunitySubtitle}>
                            Bring members together in topic-based groups and easily send them admin announcements.
                        </p>
                    </div>
                );
            }

            return (
                <>
                    <div className={Style.noLinkmanImage} />
                    <h2 className={Style.noLinkmanText}>
                        Find a group or friend, otherwise how to chat~~
                    </h2>
                </>
            );
        };

        return (
            <div className={Style.chat}>
                <HeaderBar id="" name="" type="" onClickFunction={() => {}} />
                <div className={Style.noLinkman}>
                    {renderEmptyState()}
                </div>
            </div>
        );
    }

    async function handleClickFunction() {
        if (currentCommunity) {
            // If viewing a community, show community manage panel
            toggleCommunityManagePanel(true);
        } else if (currentChannel) {
            // If viewing a channel, show channel info panel
            toggleChannelInfoPanel(true);
        } else if (linkman.type === 'group') {
            let onlineMembers: GroupMember[] | { cache: true} = [];
            if (isLogin) {
                onlineMembers = await getGroupOnlineMembers(focus);
            }
            if (Array.isArray(onlineMembers)) {
                action.setLinkmanProperty(
                    focus,
                    'onlineMembers',
                    onlineMembers,
                );
            }
            toggleGroupManagePanel(true);
        } else {
            // @ts-ignore
            context.showUserInfo(linkman);
        }
    }

    return (
        <div className={Style.chat} {...aero}>
            <HeaderBar
                id={linkman._id}
                name={linkman.name}
                type={linkman.type}
                avatar={linkman.avatar}
                onlineMembersCount={
                    isChannel 
                        ? currentChannel?.subscribers?.length 
                        : linkman.onlineMembers?.length
                }
                isOnline={linkman.isOnline}
                onClickFunction={handleClickFunction}
                typingUsers={typingUsers}
                isGroupInCommunity={isGroupInCommunity}
            />
            
            {/* Show JoinChannelPrompt if viewing a non-subscribed channel */}
            {isChannel && !isSubscribedToChannel && currentChannel ? (
                <JoinChannelPrompt
                    channelId={currentChannel._id}
                    channelName={currentChannel.name}
                    channelAvatar={currentChannel.avatar}
                    channelDescription={currentChannel.description}
                    subscriberCount={currentChannel.subscribers?.length || 0}
                />
            ) : (
                <>
                    <MessageList />
                    <ChatInput />
                </>
            )}

            {linkman.type === 'group' && (
                <GroupManagePanel
                    visible={groupManagePanel}
                    onClose={() => toggleGroupManagePanel(false)}
                    groupId={linkman._id}
                    avatar={linkman.avatar}
                    creator={linkman.creator}
                    onlineMembers={linkman.onlineMembers}
                />
            )}
            
            {isChannel && currentChannel && (
                <ChannelInfo
                    visible={channelInfoPanel}
                    onClose={() => toggleChannelInfoPanel(false)}
                    channelId={linkman._id}
                    avatar={linkman.avatar}
                    creator={linkman.creator}
                    onlineMembers={linkman.onlineMembers}
                />
            )}
            
            {currentCommunity && (
                <CommunityManagePanel
                    visible={communityManagePanel}
                    onClose={() => toggleCommunityManagePanel(false)}
                    communityId={currentCommunity._id}
                    communityName={currentCommunity.name}
                    communityAvatar={currentCommunity.avatar}
                />
            )}
        </div>
    );
}

export default Chat;
