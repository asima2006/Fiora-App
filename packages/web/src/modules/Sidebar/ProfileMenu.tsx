import React from 'react';
import Style from './ProfileMenu.less';

interface ProfileMenuProps {
    visible: boolean;
    onClose: () => void;
    avatar: string;
    username: string;
    bio?: string;
    onProfileClick: () => void;
    onSettingsClick: () => void;
    onNotificationsClick?: () => void;
    onFeaturesClick?: () => void;
    onPrivacyClick?: () => void;
    onLogout: () => void;
}

function ProfileMenu(props: ProfileMenuProps) {
    const {
        visible,
        onClose,
        avatar,
        username,
        bio = 'Welcome to Fiora',
        onProfileClick,
        onSettingsClick,
        onNotificationsClick,
        onFeaturesClick,
        onPrivacyClick,
        onLogout,
    } = props;

    if (!visible) {
        return null;
    }

    const menuItems = [
        { icon: 'user', label: 'Profile', onClick: onProfileClick },
        { icon: 'setting', label: 'Settings', onClick: onSettingsClick },
        ...(onNotificationsClick
            ? [
                {
                    icon: 'notification',
                    label: 'Notifications',
                    onClick: onNotificationsClick,
                },
            ]
            : []),
        ...(onFeaturesClick
            ? [{ icon: 'star', label: 'Features', onClick: onFeaturesClick }]
            : []),
        ...(onPrivacyClick
            ? [
                {
                    icon: 'shield',
                    label: 'Privacy & Terms',
                    onClick: onPrivacyClick,
                },
            ]
            : []),
        { icon: 'logout', label: 'Logout', onClick: onLogout, danger: true },
    ];

    return (
        <>
            <div
                className={Style.overlay}
                onClick={onClose}
                role="presentation"
            />
            <div
                className={Style.profileMenu}
                role="dialog"
                aria-label="Profile Menu"
            >
                <div className={Style.header}>
                    <img src={avatar} alt={username} className={Style.avatar} />
                    <div className={Style.userInfo}>
                        <h3 className={Style.username}>@{username}</h3>
                        <p className={Style.bio}>{bio}</p>
                    </div>
                </div>
                <div className={Style.divider} />
                <nav className={Style.menuItems} role="menu">
                    {menuItems.map((item) => (
                        // eslint-disable-next-line react/button-has-type
                        <button
                            key={item.label}
                            className={`${Style.menuItem} ${
                                item.danger ? Style.danger : ''
                            }`}
                            onClick={() => {
                                item.onClick();
                                onClose();
                            }}
                            role="menuitem"
                            tabIndex={0}
                            aria-label={item.label}
                        >
                            <i className={`iconfont icon-${item.icon}`} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
            </div>
        </>
    );
}

export default ProfileMenu;
