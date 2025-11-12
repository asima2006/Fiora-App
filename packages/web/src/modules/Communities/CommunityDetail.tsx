import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { State } from '../../state/reducer';
import useAction from '../../hooks/useAction';
import {
    getCommunityInfo,
    leaveCommunity,
    joinCommunity,
} from '../../service';
import IconButton from '../../components/IconButton';
import Message from '../../components/Message';
import ManageCommunityDialog from './ManageCommunityDialog';
import CommunityGroupItem from './CommunityGroupItem';
import './CommunityDetail.less';

interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

interface CommunityGroup {
    _id: string;
    name: string;
    avatar: string;
}

interface CommunityChannel {
    _id: string;
    name: string;
    avatar: string;
    description: string;
}

interface CommunityInfo {
    _id: string;
    name: string;
    avatar: string;
    description: string;
    ownerId: string;
    announcementGroupId?: string;
    members: CommunityMember[];
    groups: CommunityGroup[];
    channels: CommunityChannel[];
    createTime: string;
}

interface Props {
    communityId: string;
    onClose: () => void;
}

function CommunityDetail({ communityId, onClose }: Props) {
    const action = useAction();
    const userId = useSelector((state: State) => state.user?._id);
    const [communityInfo, setCommunityInfo] = useState<CommunityInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManagement, setShowManagement] = useState(false);

    useEffect(() => {
        async function fetchCommunityInfo() {
            setLoading(true);
            const info = await getCommunityInfo(communityId);
            if (info) {
                setCommunityInfo(info);
            }
            setLoading(false);
        }
        fetchCommunityInfo();
    }, [communityId]);

    if (loading) {
        return (
            <div className="community-detail">
                <div className="loading">Loading community information...</div>
            </div>
        );
    }

    if (!communityInfo) {
        return (
            <div className="community-detail">
                <div className="error">Failed to load community information</div>
            </div>
        );
    }

    const currentMember = communityInfo.members.find((m) => m.userId === userId);
    const isOwner = communityInfo.ownerId === userId;
    const isAdmin = currentMember && (currentMember.role === 'admin' || currentMember.role === 'owner');
    const isMember = !!currentMember;
    const canManage = isOwner || isAdmin;

    const handleLeave = async () => {
        if (!isMember) return;

        const result = await leaveCommunity(communityId);
        if (result) {
            Message.success('Successfully left the community');
            action.removeCommunity(communityId);
            onClose();
        }
    };

    const handleJoin = async () => {
        if (isMember) return;

        const result = await joinCommunity(communityId);
        if (result) {
            Message.success('Successfully joined the community');
            // Refresh community info
            const info = await getCommunityInfo(communityId);
            if (info) {
                setCommunityInfo(info);
            }
        }
    };

    const owners = communityInfo.members.filter((m) => m.role === 'owner');
    const admins = communityInfo.members.filter((m) => m.role === 'admin');
    const members = communityInfo.members.filter((m) => m.role === 'member');

    return (
        <div className="community-detail">
            <div className="community-detail-header">
                <div className="community-detail-info">
                    <img
                        className="community-detail-avatar"
                        src={communityInfo.avatar}
                        alt={communityInfo.name}
                    />
                    <div className="community-detail-text">
                        <h2>{communityInfo.name}</h2>
                        <p>{communityInfo.description}</p>
                    </div>
                </div>
                <IconButton
                    className="close-button"
                    width={24}
                    height={24}
                    icon="close"
                    iconSize={24}
                    onClick={onClose}
                />
            </div>

            <div className="community-detail-stats">
                <div className="stat">
                    <span className="stat-value">{communityInfo.members.length}</span>
                    <span className="stat-label">Members</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{communityInfo.groups.length}</span>
                    <span className="stat-label">Groups</span>
                </div>
                <div className="stat">
                    <span className="stat-value">{communityInfo.channels.length}</span>
                    <span className="stat-label">Channels</span>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="community-detail-actions">
                {!isMember && (
                    <button type="button" className="action-button join" onClick={handleJoin}>
                        Join Community
                    </button>
                )}
                {isMember && !isOwner && (
                    <button type="button" className="action-button leave" onClick={handleLeave}>
                        Leave Community
                    </button>
                )}
                {canManage && (
                    <button
                        type="button"
                        className="action-button manage"
                        onClick={() => setShowManagement(!showManagement)}
                    >
                        {showManagement ? 'Hide Management' : 'Manage Community'}
                    </button>
                )}
            </div>

            {/* Announcement Group */}
            {communityInfo.announcementGroupId && (
                <div className="community-section">
                    <h3>Announcements</h3>
                    <CommunityGroupItem
                        group={{
                            _id: communityInfo.announcementGroupId,
                            name: 'Announcements',
                        }}
                        isAnnouncement
                        lastMessage="Welcome to the community!"
                        onClick={() => {
                            Message.info('Opening announcement group...');
                        }}
                    />
                </div>
            )}

            {/* Groups List */}
            <div className="community-section">
                <h3>Groups ({communityInfo.groups.length}/{50})</h3>
                <div className="groups-list">
                    {communityInfo.groups.length === 0 ? (
                        <div className="empty-state">No groups yet</div>
                    ) : (
                        communityInfo.groups.map((group) => {
                            // Skip announcement group as it's shown separately
                            if (group._id === communityInfo.announcementGroupId) {
                                return null;
                            }
                            return (
                                <CommunityGroupItem
                                    key={group._id}
                                    group={group}
                                    onClick={() => {
                                        Message.info(`Opening ${group.name}...`);
                                    }}
                                />
                            );
                        })
                    )}
                </div>
            </div>

            {/* Channels List */}
            {communityInfo.channels.length > 0 && (
                <div className="community-section">
                    <h3>Channels ({communityInfo.channels.length})</h3>
                    <div className="channels-list">
                        {communityInfo.channels.map((channel) => (
                            <div key={channel._id} className="channel-item">
                                <img
                                    className="channel-avatar"
                                    src={channel.avatar}
                                    alt={channel.name}
                                />
                                <div className="channel-info">
                                    <span className="channel-name">{channel.name}</span>
                                    <span className="channel-description">
                                        {channel.description}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Members List */}
            <div className="community-section">
                <h3>Members ({communityInfo.members.length})</h3>
                <div className="members-list">
                    {/* Owners */}
                    {owners.length > 0 && (
                        <div className="member-role-group">
                            <h4 className="role-header owner-header"> Owner</h4>
                            {owners.map((member) => (
                                <div key={member.userId} className="member-item">
                                    <span className="member-id">{member.userId}</span>
                                    <span className="role-badge owner">Owner</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Admins */}
                    {admins.length > 0 && (
                        <div className="member-role-group">
                            <h4 className="role-header admin-header"> Admins ({admins.length})</h4>
                            {admins.map((member) => (
                                <div key={member.userId} className="member-item">
                                    <span className="member-id">{member.userId}</span>
                                    <span className="role-badge admin">Admin</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Members */}
                    {members.length > 0 && (
                        <div className="member-role-group">
                            <h4 className="role-header member-header">👥 Members ({members.length})</h4>
                            <div className="member-scroll">
                                {members.slice(0, 20).map((member) => (
                                    <div key={member.userId} className="member-item">
                                        <span className="member-id">{member.userId}</span>
                                        <span className="role-badge member">Member</span>
                                    </div>
                                ))}
                                {members.length > 20 && (
                                    <div className="member-item more">
                                        +{members.length - 20} more members
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Management Dialog (Only for admins/owners) */}
            {showManagement && canManage && (
                <ManageCommunityDialog
                    communityId={communityId}
                    communityName={communityInfo.name}
                    isOwner={isOwner}
                    members={communityInfo.members}
                    groupsCount={communityInfo.groups.length}
                    onClose={() => setShowManagement(false)}
                    onUpdate={async () => {
                        const info = await getCommunityInfo(communityId);
                        if (info) {
                            setCommunityInfo(info);
                        }
                    }}
                />
            )}
        </div>
    );
}

export default CommunityDetail;
