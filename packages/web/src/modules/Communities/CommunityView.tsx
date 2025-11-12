/* eslint-disable no-alert */
/* eslint-disable react/button-has-type */
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import fetch from '../../utils/fetch';
import { State } from '../../state/reducer';
import './CommunityView.less';

interface CommunityMember {
    userId: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: string;
}

interface Group {
    _id: string;
    name: string;
    avatar: string;
}

interface Channel {
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
    members: CommunityMember[];
    groups: Group[];
    channels: Channel[];
    createTime: string;
}

interface CommunityViewProps {
    communityId: string;
    onClose: () => void;
}

function CommunityView({ communityId, onClose }: CommunityViewProps) {
    const [community, setCommunity] = useState<CommunityInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'groups' | 'channels' | 'members'>('groups',);
    const user = useSelector((state: State) => state.user);

    const fetchCommunityInfo = async () => {
        setLoading(true);
        const result = await fetch('getCommunityInfo', { communityId });
        if (result) {
            setCommunity(result as unknown as CommunityInfo);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchCommunityInfo();
    }, [communityId]);

    const handleUpdateMemberRole = async (
        memberId: string,
        role: 'admin' | 'member',
    ) => {
        const result = await fetch('updateMemberRole', {
            communityId,
            memberId,
            role,
        });
        if (result) {
            fetchCommunityInfo();
        }
    };

    const handleDeleteCommunity = async () => {
        if (
            !window.confirm(
                'Are you sure you want to delete this community? This action cannot be undone.',
            )
        ) {
            return;
        }

        const result = await fetch('deleteCommunity', { communityId });
        if (result) {
            onClose();
        }
    };

    if (loading) {
        return (
            <div className="community-view">
                <div className="community-loading">Loading...</div>
            </div>
        );
    }

    if (!community) {
        return (
            <div className="community-view">
                <div className="community-error">Community not found</div>
            </div>
        );
    }

    const isOwner = user && community.ownerId === user._id;
    const currentMember = community.members.find(
        (m) => user && m.userId === user._id,
    );
    // const isAdmin =
    //     currentMember && (currentMember.role === 'admin' || currentMember.role === 'owner');

    return (
        <div className="community-view">
            <div className="community-view-header">
                <button className="community-back-btn" onClick={onClose}>
                    ← Back
                </button>
                <div className="community-view-info">
                    <img
                        src={community.avatar}
                        alt={community.name}
                        className="community-view-avatar"
                    />
                    <div className="community-view-details">
                        <h2>{community.name}</h2>
                        <p>{community.description}</p>
                        <div className="community-view-stats">
                            {community.members.length} members •{' '}
                            {community.groups.length} groups •{' '}
                            {community.channels.length} channels
                        </div>
                    </div>
                </div>
                {isOwner && (
                    <button
                        className="community-delete-btn"
                        onClick={handleDeleteCommunity}
                    >
                        Delete Community
                    </button>
                )}
            </div>

            <div className="community-view-tabs">
                <button
                    className={`community-tab ${
                        activeTab === 'groups' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('groups')}
                >
                    Groups ({community.groups.length})
                </button>
                <button
                    className={`community-tab ${
                        activeTab === 'channels' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('channels')}
                >
                    Channels ({community.channels.length})
                </button>
                <button
                    className={`community-tab ${
                        activeTab === 'members' ? 'active' : ''
                    }`}
                    onClick={() => setActiveTab('members')}
                >
                    Members ({community.members.length})
                </button>
            </div>

            <div className="community-view-content">
                {activeTab === 'groups' && (
                    <div className="community-groups">
                        {community.groups.length === 0 ? (
                            <div className="community-empty">
                                No groups in this community yet
                            </div>
                        ) : (
                            community.groups.map((group) => (
                                <div key={group._id} className="community-group-item">
                                    <img
                                        src={group.avatar}
                                        alt={group.name}
                                        className="community-group-avatar"
                                    />
                                    <div className="community-group-name">
                                        {group.name}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'channels' && (
                    <div className="community-channels">
                        {community.channels.length === 0 ? (
                            <div className="community-empty">
                                No channels in this community yet
                            </div>
                        ) : (
                            community.channels.map((channel) => (
                                <div
                                    key={channel._id}
                                    className="community-channel-item"
                                >
                                    <img
                                        src={channel.avatar}
                                        alt={channel.name}
                                        className="community-channel-avatar"
                                    />
                                    <div className="community-channel-info">
                                        <div className="community-channel-name">
                                            {channel.name}
                                        </div>
                                        <div className="community-channel-description">
                                            {channel.description}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'members' && (
                    <div className="community-members">
                        {community.members.map((member) => (
                            <div key={member.userId} className="community-member-item">
                                <div className="community-member-info">
                                    <div className="community-member-id">
                                        User ID: {member.userId}
                                    </div>
                                    <div className="community-member-role">
                                        <span
                                            className={`community-role-badge ${member.role}`}
                                        >
                                            {member.role.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="community-member-joined">
                                        Joined:{' '}
                                        {new Date(member.joinedAt).toLocaleDateString()}
                                    </div>
                                </div>
                                {isOwner && member.role !== 'owner' && (
                                    <div className="community-member-actions">
                                        {member.role === 'member' ? (
                                            <button
                                                className="community-promote-btn"
                                                onClick={() =>
                                                    handleUpdateMemberRole(
                                                        member.userId,
                                                        'admin',
                                                    )
                                                }
                                            >
                                                Promote to Admin
                                            </button>
                                        ) : (
                                            <button
                                                className="community-demote-btn"
                                                onClick={() =>
                                                    handleUpdateMemberRole(
                                                        member.userId,
                                                        'member',
                                                    )
                                                }
                                            >
                                                Demote to Member
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CommunityView;
