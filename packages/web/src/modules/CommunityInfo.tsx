import React, { useState, useEffect, useContext } from 'react';
import { useSelector } from 'react-redux';

import { getOSSFileUrl } from '../utils/uploadFile';
import Dialog from '../components/Dialog';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Message from '../components/Message';
import { State } from '../state/reducer';
import useAction from '../hooks/useAction';
import { joinCommunity, getCommunityInfo, leaveCommunity } from '../service';
import { ShowUserOrGroupInfoContext } from '../context';

import Style from './InfoDialog.less';

interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

interface CommunityInfoProps {
    visible: boolean;
    community?: {
        _id: string;
        name: string;
        avatar: string;
        members?: CommunityMember[];
        ownerId: string;
    };
    onClose: () => void;
}

function CommunityInfo(props: CommunityInfoProps) {
    const { visible, onClose, community } = props;

    const action = useAction();
    const context = useContext(ShowUserOrGroupInfoContext);
    const selfId = useSelector((state: State) => state.user?._id);
    const hasCommunity = useSelector(
        (state: State) => !!state.communities.find((c) => c._id === community?._id),
    );
    const [largerAvatar, toggleLargetAvatar] = useState(false);
    const [fullCommunityData, setFullCommunityData] = useState<any>(null);

    // Fetch full community data when dialog opens
    useEffect(() => {
        if (community?._id && visible) {
            getCommunityInfo(community._id).then((data) => {
                if (data) {
                    setFullCommunityData(data);
                }
            });
        }
    }, [community?._id, visible]);

    if (!community) {
        return null;
    }

    // Use full data if available, otherwise use props
    const communityData = fullCommunityData || community;
    const members = communityData.members || [];
    
    // Check if user is admin or owner
    const userMember = members.find((m: CommunityMember) => m.userId === selfId);
    const isOwner = userMember && userMember.role === 'owner';
    const isAdmin = userMember && userMember.role === 'admin';
    const isAdminOrOwner = isOwner || isAdmin;

    async function handleJoinCommunity() {
        onClose();

        if (!community) {
            return;
        }
        const communityRes = await joinCommunity(community._id);
        if (communityRes) {
            // Refresh community list
            action.setFocus(community._id);
        }
    }

    function handleFocusCommunity() {
        onClose();

        if (!community) {
            return;
        }
        action.setFocus(community._id);
    }

    function handleManageCommunity() {
        onClose();
        if (context && community) {
            context.showCommunityManagePanel(community);
        }
    }

    function handleShareCommunity() {
        if (!community) {
            return;
        }
        const inviteLink = `${window.location.origin}/invite/community/${community._id}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(inviteLink).then(() => {
            Message.success('Community invite link copied to clipboard!');
        }).catch(() => {
            Message.error('Failed to copy link');
        });
    }

    async function handleLeaveCommunity() {
        if (!community) {
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to leave "${community.name}"? You will be removed from all community groups.`
        );

        if (!confirmed) {
            return;
        }

        const result = await leaveCommunity(community._id);
        if (result) {
            Message.success('Successfully left the community');
            action.removeLinkman(community._id);
            onClose();
        }
    }

    const memberCount = members.length || communityData.membersCount || 0;

    return (
        <Dialog
            className={Style.infoDialog}
            visible={visible}
            onClose={onClose}
        >
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
                        alt="Community Avatar"
                    />
                    <p>{community.name}</p>
                </div>
                <div className={Style.info}>
                    <div className={Style.onlineStatus}>
                        <p className={Style.onlineText}>Members:</p>
                        <div>{memberCount} people</div>
                    </div>
                    {isOwner && (
                        <div className={Style.onlineStatus}>
                            <p className={Style.onlineText}>Role:</p>
                            <div>
                                <span className={Style.roleBadge} style={{ background: '#f59e0b' }}>
                                    Owner
                                </span>
                            </div>
                        </div>
                    )}
                    {isAdmin && !isOwner && (
                        <div className={Style.onlineStatus}>
                            <p className={Style.onlineText}>Role:</p>
                            <div>
                                <span className={Style.roleBadge} style={{ background: '#3b82f6' }}>
                                    ⭐ Admin
                                </span>
                            </div>
                        </div>
                    )}
                    {hasCommunity ? (
                        <>
                            {isAdminOrOwner && (
                                <>
                                    <Button onClick={handleShareCommunity}>
                                        📤 Share Invite Link
                                    </Button>
                                    <Button onClick={handleManageCommunity}>
                                        Manage Community
                                    </Button>
                                </>
                            )}
                            {!isAdminOrOwner && (
                                <Button onClick={handleFocusCommunity}>
                                    View Groups
                                </Button>
                            )}
                            {!isOwner && (
                                <Button type="danger" onClick={handleLeaveCommunity}>
                                    Leave Community
                                </Button>
                            )}
                        </>
                    ) : (
                        <Button onClick={handleJoinCommunity}>Join Community</Button>
                    )}
                </div>
            </div>
        </Dialog>
    );
}

export default CommunityInfo;
