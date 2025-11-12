import React from 'react';
import './CommunityGroupItem.less';

interface Props {
    group: {
        _id: string;
        name: string;
        avatar?: string;
    };
    isAnnouncement?: boolean;
    unreadCount?: number;
    lastMessage?: string;
    timestamp?: Date;
    onClick: () => void;
}

function CommunityGroupItem({ 
    group, 
    isAnnouncement = false, 
    unreadCount = 0,
    lastMessage,
    timestamp,
    onClick 
}: Props) {
    const formatTime = (date?: Date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        } if (days === 1) {
            return 'Yesterday';
        } if (days < 7) {
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } 
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
    };

    const getInitial = (text: string) => (text ? text.charAt(0).toUpperCase() : '#');

    const renderGroupIcon = () => {
        if (isAnnouncement) {
            return (
                <div className="announcement-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 9h3.5L14 4v16l-6.5-5H4V9z"/>
                        <path d="M16 9.5a2.5 2.5 0 010 5M18 8a4 4 0 010 8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
            );
        }
        if (group.avatar) {
            return <img src={group.avatar} alt={group.name} />;
        }
        return (
            <div className="group-icon-fallback">
                {getInitial(group.name)}
            </div>
        );
    };

    return (
        <div 
            className={`community-group-item ${isAnnouncement ? 'announcement' : ''}`} 
            onClick={onClick}
            role="button"
            tabIndex={0}
        >
            <div className="group-icon">
                {renderGroupIcon()}
            </div>
            <div className="group-info">
                <div className="group-header">
                    <h4 className="group-name">{group.name}</h4>
                    {timestamp && (
                        <span className="group-time">{formatTime(timestamp)}</span>
                    )}
                </div>
                {lastMessage && (
                    <p className="group-last-message">{lastMessage}</p>
                )}
            </div>
            {unreadCount > 0 && (
                <div className="unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</div>
            )}
        </div>
    );
}

export default CommunityGroupItem;
