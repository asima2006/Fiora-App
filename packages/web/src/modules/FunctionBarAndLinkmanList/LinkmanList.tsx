import React, { useEffect, useState, useContext } from 'react';
import { useSelector } from 'react-redux';

import { Linkman, State } from '../../state/reducer';
import LinkmanComponent from './Linkman';
import useAction from '../../hooks/useAction';
import useIsLogin from '../../hooks/useIsLogin';
import { getMyCommunities } from '../../service';
import CreateCommunityDialog from '../Communities/CreateCommunityDialog';
import { ShowUserOrGroupInfoContext } from '../../context';
import Style from './LinkmanList.less';

function LinkmanList() {
    const linkmans = useSelector((state: State) => state.linkmans);
    const communities = useSelector((state: State) => state.communities);
    const channels = useSelector((state: State) => state.channels);
    const chatFilter = useSelector((state: State) => state.status.chatFilter);
    // const selfId = useSelector((state: State) => state.user?._id);
    const action = useAction();
    const isLogin = useIsLogin();
    const [showCreateCommunity, setShowCreateCommunity] = useState(false);
    const context = useContext(ShowUserOrGroupInfoContext);

    // Fetch communities and channels on mount (only if logged in)
    useEffect(() => {
        if (!isLogin) {
            return;
        }

        async function fetchData() {
            const [commErr, commResult] = await getMyCommunities();
            if (!commErr && commResult) {
                action.setCommunities(commResult);
            } else if (commErr) {
                // eslint-disable-next-line no-console
                console.error('Error loading communities:', commErr);
            }

            // Channels are already loaded in socket.ts on login
            // No need to fetch them again here as it causes messages to be lost
            // The channels state is populated from socket.ts
        }
        fetchData();
    }, [isLogin]);    

    function renderLinkman(linkman: Linkman) {
        const messages = Object.values(linkman.messages);
        const lastMessage =
            messages.length > 0 ? messages[messages.length - 1] : null;

        let time = new Date(linkman.createTime);
        let preview = 'No messages yet';
        if (lastMessage) {
            time = new Date(lastMessage.createTime);
            const { type } = lastMessage;
            preview = type === 'text' ? `${lastMessage.content}` : `[${type}]`;
            if (linkman.type === 'group') {
                preview = `${lastMessage.from.username}: ${preview}`;
            }
        }
        return (
            <LinkmanComponent
                key={linkman._id}
                id={linkman._id}
                name={linkman.name}
                avatar={linkman.avatar}
                preview={preview}
                time={time}
                unread={linkman.unread}
                type={linkman.type}
            />
        );
    }

    function renderCommunity(community: any) {
        const time = new Date(community.createTime);
        const preview = community.description || `${community.membersCount || 0} members`;
        
        // Check user's role in this community
        // const userMember = community.members?.find((m: any) => m.userId === selfId);

        const handleGroupClick = (groupId: string) => {
            // Open the group chat
            action.setFocus(groupId);
        };

        const handleCommunityClick = () => {
            // Show community info dialog
            if (context) {
                context.showCommunityInfo(community);
            }
        };

        return (
            <div key={community._id} className={Style.communityContainer}>
                <div className={Style.communityHeader}>
                    <LinkmanComponent
                        key={`community-${community._id}`}
                        id={community._id}
                        name={community.name}
                        avatar={community.avatar}
                        preview={preview}
                        time={time}
                        unread={0}
                        type="group"
                        onClick={handleCommunityClick}
                    />
                    {/* {userMember?.role === 'owner' && <span className={Style.ownerBadge}>👑</span>}
                    {userMember?.role === 'admin' && <span className={Style.adminBadge}>⭐</span>} */}
                </div>
                {(community.announcementGroup || (community.groupPreviews && community.groupPreviews.length > 0)) && (
                    <div className={Style.communityGroupsList}>
                        {community.announcementGroup && (
                            <div
                                key={`announcement-${community.announcementGroup._id}`}
                                className={`${Style.communityGroupItem} ${Style.announcementGroup}`}
                                onClick={() => handleGroupClick(community.announcementGroup._id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleGroupClick(community.announcementGroup._id)}
                            >
                                <div className={Style.groupIcon}>
                                    {community.announcementGroup.avatar ? (
                                        <img src={community.announcementGroup.avatar} alt={community.announcementGroup.name} />
                                    ) : (
                                        <span>📢</span>
                                    )}
                                </div>
                                <span className={Style.groupName}>{community.announcementGroup.name || 'Announcements'}</span>
                                {linkmans[community.announcementGroup._id] && linkmans[community.announcementGroup._id].unread > 0 && (
                                    <div className={Style.groupUnreadBadge}>
                                        {linkmans[community.announcementGroup._id].unread > 99 ? '99+' : linkmans[community.announcementGroup._id].unread}
                                    </div>
                                )}
                            </div>
                        )}
                        {community.groupPreviews && community.groupPreviews.map((group: any) => (
                            <div
                                key={group._id}
                                className={Style.communityGroupItem}
                                onClick={() => handleGroupClick(group._id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleGroupClick(group._id)}
                            >
                                <div className={Style.groupIcon}>
                                    {group.avatar ? (
                                        <img src={group.avatar} alt={group.name} />
                                    ) : (
                                        <span>{group.name.charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <span className={Style.groupName}>{group.name}</span>
                                {linkmans[group._id] && linkmans[group._id].unread > 0 && (
                                    <div className={Style.groupUnreadBadge}>
                                        {linkmans[group._id].unread > 99 ? '99+' : linkmans[group._id].unread}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    function renderChannel(channel: any) {
        // Get the linkman for this channel to access messages and unread count
        const channelLinkman = linkmans[channel._id];
        
        if (!channelLinkman) {
            return null;
        }
        
        const messages = Object.values(channelLinkman.messages);
        const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
        
        let time = new Date(channel.createTime || Date.now());
        let preview = 'No announcements yet';
        
        if (lastMessage) {
            time = new Date(lastMessage.createTime);
            const { type } = lastMessage;
            const messageContent = type === 'text' ? `${lastMessage.content}` : `[${type}]`;
            // Show username with message like groups do
            preview = `${lastMessage.from.username}: ${messageContent}`;
        }
        
        return (
            <LinkmanComponent
                key={channel._id}
                id={channel._id}
                name={channel.name}
                avatar={channel.avatar || ''}
                preview={preview}
                time={time}
                unread={channelLinkman.unread}
                type="group"
            />
        );
    }

    function getLinkmanLastTime(linkman: Linkman): number {
        let time = linkman.createTime;
        const messages = Object.values(linkman.messages);
        if (messages.length > 0) {
            time = messages[messages.length - 1].createTime;
        }
        return new Date(time).getTime();
    }

    function sort(linkman1: Linkman, linkman2: Linkman): number {
        return getLinkmanLastTime(linkman1) < getLinkmanLastTime(linkman2)
            ? 1
            : -1;
    }

    function filterLinkman(linkman: Linkman): boolean {
        // Exclude channels from regular linkman lists
        const isChannel = channels.some(channel => channel._id === linkman._id);
        if (isChannel) {
            return false;
        }
        
        if (chatFilter === 'all') {
            return true;
        }
        if (chatFilter === 'groups') {
            return linkman.type === 'group';
        }
        if (chatFilter === 'friends') {
            return linkman.type === 'friend' || linkman.type === 'temporary';
        }
        return true;
    }

    // Render based on filter
    const renderContent = () => {
        if (chatFilter === 'communities') {
            return (
                <>
                    {communities.map(renderCommunity)}
                </>
            );
        }
        if (chatFilter === 'channels') {
            return channels.map(renderChannel);
        }
        if (chatFilter === 'all') {
            // Show only linkmans (exclude channels from "All Chats")
            return Object.values(linkmans)
                .filter(filterLinkman)
                .sort(sort)
                .map(renderLinkman);
        }
        // For groups and friends filters
        return Object.values(linkmans)
            .filter(filterLinkman)
            .sort(sort)
            .map(renderLinkman);
    };

    return (
        <div className={Style.linkmanList}>
            {renderContent()}
            
            {/* Create Community Dialog */}
            {showCreateCommunity && (
                <CreateCommunityDialog
                    visible={showCreateCommunity}
                    onClose={() => setShowCreateCommunity(false)}
                />
            )}
        </div>
    );
}

export default LinkmanList;
