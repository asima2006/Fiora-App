import React from 'react';
import ViewAllButton from './ViewAllButton';
import './CommunityListItem.less';

interface GroupPreview {
    _id: string;
    name: string;
    avatar?: string;
}

interface Props {
    community: {
        _id: string;
        name: string;
        avatar: string;
        description?: string;
        announcementGroupId?: string;
        announcementGroup?: GroupPreview;
        groupPreviews?: GroupPreview[];
        hasMoreGroups?: boolean;
        hiddenGroupsCount?: number;
        membersCount?: number;
        groupsCount?: number;
        createTime: string;
    };
    onOpenDetail: () => void;
    onSelectGroup?: (groupId: string) => void;
    isActive?: boolean;
}

function CommunityListItem({
    community,
    onOpenDetail,
    onSelectGroup,
    isActive = false,
}: Props) {
    const {
        announcementGroup,
        groupPreviews = [],
        hasMoreGroups,
        hiddenGroupsCount,
    } = community;
    const hasSubItems = Boolean(announcementGroup || groupPreviews.length > 0);
    const itemClassName = `community-list-item${isActive ? ' active' : ''}`;
    const remainingCount = hiddenGroupsCount && hiddenGroupsCount > 0 ? hiddenGroupsCount : undefined;

    const subtitle = community.description
        || (community.membersCount !== undefined
            ? `${community.membersCount} ${community.membersCount === 1 ? 'member' : 'members'}`
            : 'Community');

    const handleKeyActivate = (event: React.KeyboardEvent, callback: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            callback();
        }
    };

    const handleGroupClick = (groupId?: string) => {
        if (groupId && onSelectGroup) {
            onSelectGroup(groupId);
            return;
        }
        onOpenDetail();
    };

    const renderGroupAvatar = (group?: GroupPreview) => {
        if (!group) {
            return null;
        }
        if (group.avatar) {
            return <img src={group.avatar} alt={group.name} />;
        }
        const initial = group.name ? group.name.charAt(0).toUpperCase() : '#';
        return <span className="fallback-avatar">{initial}</span>;
    };

    return (
        <div className={itemClassName}>
            <div
                className="community-card-header"
                onClick={onOpenDetail}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => handleKeyActivate(event, onOpenDetail)}
            >
                <div className="community-avatar">
                    <img src={community.avatar} alt={community.name} />
                </div>
                <div className="community-header-text">
                    <div className="community-name-row">
                        <h3 className="community-name">{community.name}</h3>
                    </div>
                    <p className="community-subtitle">{subtitle}</p>
                </div>
                <span className="community-chevron" aria-hidden="true">&rsaquo;</span>
            </div>

            {hasSubItems && (
                <div className="community-sub-list">
                    {announcementGroup && (
                        <div
                            className="community-sub-item announcement"
                            onClick={() => handleGroupClick(announcementGroup._id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) =>
                                handleKeyActivate(event, () => handleGroupClick(announcementGroup._id))}
                        >
                            <div className="sub-avatar announcement-icon">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M4 9h3.5L14 4v16l-6.5-5H4V9z"
                                        fill="currentColor"
                                    />
                                    <path
                                        d="M16 9.5a2.5 2.5 0 010 5M18 8a4 4 0 010 8"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                            <div className="sub-info">
                                <span className="sub-name">{announcementGroup.name || 'Announcements'}</span>
                                <span className="sub-meta">Announcements</span>
                            </div>
                        </div>
                    )}

                    {groupPreviews.map((group) => (
                        <div
                            key={group._id}
                            className="community-sub-item"
                            onClick={() => handleGroupClick(group._id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) =>
                                handleKeyActivate(event, () => handleGroupClick(group._id))}
                        >
                            <div className="sub-avatar">{renderGroupAvatar(group)}</div>
                            <div className="sub-info">
                                <span className="sub-name">{group.name}</span>
                                <span className="sub-meta">Group</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {hasMoreGroups && (
                <ViewAllButton onClick={onOpenDetail} count={remainingCount} />
            )}
        </div>
    );
}

export default CommunityListItem;
