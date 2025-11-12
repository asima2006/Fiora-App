/* eslint-disable camelcase */
import 'core-js/stable';
import 'regenerator-runtime/runtime';

import React from 'react';
import ReactDom from 'react-dom';
import { Provider } from 'react-redux';

import config from '@fiora/config/client';
import setCssVariable from './utils/setCssVariable';
import App from './App';
import store from './state/store';
import getData from './localStorage';

// Register Service Worker
if (window.location.protocol === 'https:' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register(`/service-worker.js`);
    });
}

// If frontend monitoring is configured, dynamically load and start monitoring
if (config.frontendMonitorAppId) {
    // @ts-ignore
    import(/* webpackChunkName: "frontend-monitor" */ 'wpk-reporter').then(
        (module) => {
            const WpkReporter = module.default;

            const __wpk = new WpkReporter({
                bid: config.frontendMonitorAppId,
                spa: true,
                rel: config.frontendMonitorAppId,
                uid: () => localStorage.getItem('username') || '',
                plugins: [],
            });

            __wpk.installAll();
        },
    );
}

// Update css variable
const { primaryColor, primaryTextColor } = getData();
setCssVariable(primaryColor, primaryTextColor);

// Request Notification permission
if (
    window.Notification &&
    (window.Notification.permission === 'default' ||
        window.Notification.permission === 'denied')
) {
    window.Notification.requestPermission();
}

if (window.location.pathname !== '/') {
    const { pathname } = window.location;
    window.history.pushState({}, 'fiora', '/');
    if (pathname.startsWith('/invite/group/')) {
        const groupId = pathname.replace(`/invite/group/`, '');
        window.sessionStorage.setItem('inviteGroupId', groupId);
    } else if (pathname.startsWith('/invite/community/')) {
        const communityId = pathname.replace(`/invite/community/`, '');
        window.sessionStorage.setItem('inviteCommunityId', communityId);
    } else if (pathname.startsWith('/channel/')) {
        const channelId = pathname.replace(`/channel/`, '');
        window.sessionStorage.setItem('inviteChannelId', channelId);
    }
}

ReactDom.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('app'),
);
