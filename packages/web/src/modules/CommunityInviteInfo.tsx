import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import fetch from '../utils/fetch';
import Dialog from '../components/Dialog';
import Avatar from '../components/Avatar';

import Style from './InfoDialog.less';
import { State } from '../state/reducer';
import Button from '../components/Button';
import { joinCommunity } from '../service';
import useAction from '../hooks/useAction';
import Message from '../components/Message';
import { getOSSFileUrl } from '../utils/uploadFile';

type CommunityBasicInfo = {
    name: string;
    avatar: string;
    description: string;
    memberCount: number;
};

function CommunityInviteInfo() {
    const communityId = window.sessionStorage.getItem('inviteCommunityId') || '';
    const action = useAction();
    const [visible, updateVisible] = useState(!!communityId);
    const [community, updateCommunity] = useState<CommunityBasicInfo>();
    const [largerAvatar, toggleLargetAvatar] = useState(false);
    const selfId = useSelector((state: State) => state.user?._id);
    const hasCommunity = useSelector((state: State) =>
        state.communities?.some((c: any) => c._id === communityId)
    );

    useEffect(() => {
        if (!communityId) {
            return;
        }
        (async () => {
            const [error, communityInfo] = await fetch('getCommunityBasicInfo', {
                communityId,
            });
            if (!error) {
                updateCommunity((communityInfo as unknown) as CommunityBasicInfo);
            }
        })();
    }, [communityId]);

    function clearInviteId() {
        window.sessionStorage.removeItem('inviteCommunityId');
    }

    function handleClose() {
        updateVisible(false);
        clearInviteId();
    }

    async function handleJoinCommunity() {
        const communityRes = await joinCommunity(communityId);

        if (communityRes) {
            // Add community to state
            communityRes.type = 'community';
            action.addLinkman(communityRes, false);

            // Add announcement group if it was returned
            if (communityRes.announcementGroup) {
                communityRes.announcementGroup.type = 'group';
                action.addLinkman(communityRes.announcementGroup, true);

                // Add messages for announcement group
                if (communityRes.announcementGroup.messages && Array.isArray(communityRes.announcementGroup.messages)) {
                    action.addLinkmanHistoryMessages(
                        communityRes.announcementGroup._id,
                        communityRes.announcementGroup.messages
                    );
                }
            }

            Message.success(
                `Joined community "${communityRes.name}"! You've been added to the announcement group.`
            );
        }
        clearInviteId();
        handleClose();
    }

    function handleFocusCommunity() {
        action.setFocus(communityId);
        clearInviteId();
        handleClose();
    }

    return (
        <Dialog
            className={Style.infoDialog}
            visible={visible}
            onClose={handleClose}
            title="Invite you to join the community"
        >
            {visible && community && (
                <div className={Style.coantainer}>
                    <div className={Style.header}>
                        <Avatar
                            size={60}
                            src={community.avatar}
                            name={community.name}
                            type="group"
                            onMouseEnter={() => toggleLargetAvatar(true)}
                            onMouseLeave={() => toggleLargetAvatar(false)}
                        />
                        <img
                            className={`${Style.largeAvatar} ${
                                largerAvatar ? 'show' : 'hide'
                            }`}
                            src={getOSSFileUrl(community.avatar)}
                            alt="Community avatar"
                        />
                        <p>{community.name}</p>
                    </div>
                    <div className={Style.info}>
                        {community.description && (
                            <div className={Style.onlineStatus}>
                                <p className={Style.onlineText}>Description:</p>
                                <div>{community.description}</div>
                            </div>
                        )}
                        <div className={Style.onlineStatus}>
                            <p className={Style.onlineText}>Members:</p>
                            <div>{community.memberCount} people</div>
                        </div>
                        <div style={{ 
                            padding: '10px', 
                            background: '#f0f9ff', 
                            borderRadius: '8px', 
                            marginTop: '10px',
                            fontSize: '12px',
                            color: '#0369a1'
                        }}>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>ℹ️ What happens when you join:</p>
                            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                                <li>You'll become a member of this community</li>
                                <li>You'll be automatically added to the announcement group</li>
                                <li>You can request to join other groups from admins</li>
                            </ul>
                        </div>
                        {selfId ? (
                            hasCommunity ? (
                                <Button onClick={handleFocusCommunity}>View Community</Button>
                            ) : (
                                <Button onClick={handleJoinCommunity}>
                                    Join Community
                                </Button>
                            )
                        ) : (
                            <Button
                                onClick={() =>
                                    action.setStatus(
                                        'loginRegisterDialogVisible',
                                        true,
                                    )
                                }
                            >
                                Login / Register
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </Dialog>
    );
}

export default CommunityInviteInfo;
