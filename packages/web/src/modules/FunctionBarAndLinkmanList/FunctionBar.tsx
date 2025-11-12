/* eslint-disable react/jsx-indent, indent */
import React, { useState, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import IconButton from '../../components/IconButton';
import Avatar from '../../components/Avatar';
import {
    Tabs,
    TabPane,
    TabContent,
    ScrollableInkTabBar,
} from '../../components/Tabs';
import CreateGroup from './CreateGroup';
import CreateCommunityDialog from '../Communities/CreateCommunityDialog';
import CreateChannelDialog from '../Channels/CreateChannelDialog';
import CommunitiesHeader from '../Communities/CommunitiesHeader';
import { ShowUserOrGroupInfoContext } from '../../context';
import { search, searchCommunities, searchChannels } from '../../service';
import { State } from '../../state/reducer';

import Style from './FunctionBar.less';
import Input from '../../components/Input';
import Message from '../../components/Message';

type SearchResult = {
    users: any[];
    groups: any[];
    communities?: any[];
    channels?: any[];
};

function FunctionBar() {
    const [keywords, setKeywords] = useState('');
    const [addButtonVisible, toggleAddButtonVisible] = useState(true);
    const [searchResultVisible, toggleSearchResultVisible] = useState(false);
    const [searchResultActiveKey, setSearchResultActiveKey] = useState('all');
    const [createGroupDialogVisible, toggleCreateGroupDialogVisible] = useState(
        false,
    );
    const [createCommunityVisible, toggleCreateCommunityVisible] = useState(false);
    const [createChannelVisible, toggleCreateChannelVisible] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult>({
        users: [],
        groups: [],
        communities: [],
        channels: [],
    });

    const context = useContext(ShowUserOrGroupInfoContext);
    const chatFilter = useSelector((state: State) => state.status.chatFilter);
    
    // Dynamic placeholder based on chat filter
    let placeholder = 'Search groups/users';
    if (chatFilter === 'communities') {
        placeholder = 'Search communities';
    } else if (chatFilter === 'channels') {
        placeholder = 'Search channelss';
    } else if (chatFilter === 'groups') {
        placeholder = 'Search groups';
    } else if (chatFilter === 'friends') {
        placeholder = 'Search users';
    }    function resetSearch() {
        toggleSearchResultVisible(false);
        toggleAddButtonVisible(true);
        setSearchResultActiveKey('all');
        setSearchResult({ users: [], groups: [] });
        setKeywords('');
    }

    function handleBodyClick(e: any) {
        if (
            e.target.getAttribute('placeholder') === placeholder ||
            !searchResultVisible
        ) {
            return;
        }

        const { currentTarget } = e;
        let { target } = e;
        do {
            if (target.className.indexOf(Style.searchResult) > -1) {
                return;
            }
            target = target.parentElement;
        } while (target && target !== currentTarget);

        resetSearch();
    }
    useEffect(() => {
        document.body.addEventListener('click', handleBodyClick, false);
        return () => {
            document.body.removeEventListener('click', handleBodyClick, false);
        };
    });

    function handleFocus() {
        toggleAddButtonVisible(false);
        toggleSearchResultVisible(true);
    }

    function handleInputEnter() {
        setTimeout(async () => {
            if (keywords) {
                if (chatFilter === 'communities') {
                    const [err, result] = await searchCommunities(keywords);
                    if (!err && result?.length) {
                        setSearchResult({ users: [], groups: [], communities: result });
                    } else {
                        Message.warning('No content found, try a different keyword~');
                        setSearchResult({ users: [], groups: [], communities: [] });
                    }
                } else if (chatFilter === 'channels') {
                    const [err, result] = await searchChannels(keywords);
                    if (!err && result?.length) {
                        setSearchResult({ users: [], groups: [], channels: result });
                    } else {
                        Message.warning('No content found, try a different keyword~');
                        setSearchResult({ users: [], groups: [], channels: [] });
                    }
                } else {
                    const result = await search(keywords);
                    if (result?.users?.length || result?.groups?.length) {
                        setSearchResult(result);
                    } else {
                        Message.warning('No content found, try a different keyword~');
                        setSearchResult({ users: [], groups: [] });
                    }
                }
            }
        }, 0);
    }

    function renderSearchUsers(count = 999) {
        const { users } = searchResult;
        count = Math.min(count, users.length);

        function handleClick(targetUser: any) {
            // @ts-ignore
            context.showUserInfo(targetUser);
            resetSearch();
        }

        const usersDom = [];
        for (let i = 0; i < count; i++) {
            usersDom.push(
                <div
                    key={users[i]._id}
                    onClick={() => handleClick(users[i])}
                    role="button"
                >
                    <Avatar size={40} src={users[i].avatar} name={users[i].username} type="user" />
                    <p>{users[i].username}</p>
                </div>,
            );
        }
        return usersDom;
    }

    function renderSearchGroups(count = 999) {
        const { groups } = searchResult;
        count = Math.min(count, groups.length);

        function handleClick(targetGroup: any) {
            // @ts-ignore
            context.showGroupInfo(targetGroup);
            resetSearch();
        }

        const groupsDom = [];
        for (let i = 0; i < count; i++) {
            groupsDom.push(
                <div
                    key={groups[i]._id}
                    onClick={() => handleClick(groups[i])}
                    role="button"
                >
                    <Avatar size={40} src={groups[i].avatar} name={groups[i].name} type="group" />
                    <div>
                        <p>{groups[i].name}</p>
                        <p>{groups[i].members} members</p>
                    </div>
                </div>,
            );
        }
        return groupsDom;
    }

    function renderSearchCommunities(count = 999) {
        const { communities = [] } = searchResult;
        count = Math.min(count, communities.length);

        function handleClick(targetCommunity: any) {
            // @ts-ignore
            if (context?.showCommunityInfo) {
                context.showCommunityInfo(targetCommunity);
            }
            resetSearch();
        }

        const communitiesDom = [];
        for (let i = 0; i < count; i++) {
            communitiesDom.push(
                <div
                    key={communities[i]._id}
                    onClick={() => handleClick(communities[i])}
                    role="button"
                >
                    <Avatar size={40} src={communities[i].avatar} name={communities[i].name} type="group" />
                    <div>
                        <p>{communities[i].name}</p>
                        <p>{communities[i].description || 'No description'}</p>
                    </div>
                </div>,
            );
        }
        return communitiesDom;
    }

    function renderSearchChannels(count = 999) {
        const { channels = [] } = searchResult;
        count = Math.min(count, channels.length);

        function handleClick() {
            // TODO: Implement showChannelInfo - channel info dialog not yet implemented
            resetSearch();
        }

        const channelsDom = [];
        for (let i = 0; i < count; i++) {
            channelsDom.push(
                <div
                    key={channels[i]._id}
                    onClick={() => handleClick()}
                    role="button"
                >
                    <Avatar size={40} src={channels[i].avatar} name={channels[i].name} type="group" />
                    <div>
                        <p>{channels[i].name}</p>
                        <p>{channels[i].description || 'No description'}</p>
                    </div>
                </div>,
            );
        }
        return channelsDom;
    }

    let tabContent;
    if (chatFilter === 'communities') {
        tabContent = (
            <TabPane tab="All" key="all">
                {(searchResult.communities || []).length === 0 ? (
                    <p className={Style.none}>
                        No content found, try a different keyword~
                    </p>
                ) : (
                    <div className={`${Style.groupList} ${Style.only}`}>
                        {renderSearchCommunities()}
                    </div>
                )}
            </TabPane>
        );
    } else if (chatFilter === 'channels') {
        tabContent = (
            <TabPane tab="All" key="all">
                {(searchResult.channels || []).length === 0 ? (
                    <p className={Style.none}>
                        No content found, try a different keyword~
                    </p>
                ) : (
                    <div className={`${Style.groupList} ${Style.only}`}>
                        {renderSearchChannels()}
                    </div>
                )}
            </TabPane>
        );
    } else {
        tabContent = (
            <>
                <TabPane tab="All" key="all">
                    {/* eslint-disable react/jsx-indent */}
                    {searchResult.users.length === 0 &&
                    searchResult.groups.length === 0 ? (
                        <p className={Style.none}>
                            No content found, try a different keyword~
                        </p>
                    ) : (
                        <div className={Style.allList}>
                            <div
                                style={{
                                    display:
                                        searchResult.users.length > 0
                                            ? 'block'
                                            : 'none',
                                }}
                            >
                                <p>Users</p>
                                <div className={Style.userList}>
                                    {renderSearchUsers(3)}
                                </div>
                                <div
                                    className={Style.more}
                                    style={{
                                        display:
                                            searchResult.users.length > 3
                                                ? 'block'
                                                : 'none',
                                    }}
                                >
                                    <span
                                        onClick={() =>
                                            setSearchResultActiveKey('user')
                                        }
                                        role="button"
                                    >
                                        View more
                                    </span>
                                </div>
                            </div>
                            <div
                                style={{
                                    display:
                                        searchResult.groups.length > 0
                                            ? 'block'
                                            : 'none',
                                }}
                            >
                                <p>Groups</p>
                                <div className={Style.groupList}>
                                    {renderSearchGroups(3)}
                                </div>
                                <div
                                    className={Style.more}
                                    style={{
                                        display:
                                            searchResult.groups.length > 3
                                                ? 'block'
                                                : 'none',
                                    }}
                                >
                                    <span
                                        onClick={() =>
                                            setSearchResultActiveKey('group')
                                        }
                                        role="button"
                                    >
                                        View more
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* eslint-enable react/jsx-indent */}
                </TabPane>
                <TabPane tab="Users" key="user">
                    {searchResult.users.length === 0 ? (
                        <p className={Style.none}>
                            No content found, try a different keyword~~
                        </p>
                    ) : (
                        <div className={`${Style.userList} ${Style.only}`}>
                            {renderSearchUsers()}
                        </div>
                    )}
                </TabPane>
                <TabPane tab="Groups" key="group">
                    {searchResult.groups.length === 0 ? (
                        <p className={Style.none}>
                            No content found, try a different keyword~~
                        </p>
                    ) : (
                        <div className={`${Style.groupList} ${Style.only}`}>
                            {renderSearchGroups()}
                        </div>
                    )}
                </TabPane>
            </>
        );
    }

    return (
        <div className={Style.functionBar}>
            {chatFilter === 'communities' ? (
                // Show header for communities instead of search
                <CommunitiesHeader />
            ) : (
                // Show search bar for all other filters
                <>
                    <form
                        className={Style.form}
                        autoComplete="off"
                        onSubmit={(e) => e.preventDefault()}
                    >
                        <Input
                            className={`${Style.input} ${
                                searchResultVisible ? Style.inputFocus : ''
                            }`}
                            type="text"
                            placeholder={placeholder}
                            value={keywords}
                            // @ts-ignore
                            onChange={setKeywords}
                            onFocus={handleFocus}
                            onEnter={handleInputEnter}
                        />
                    </form>
                    <i className={`iconfont icon-search ${Style.searchIcon}`} />
                </>
            )}
            <IconButton
                className={Style.createGroupButton}
                style={{ display: addButtonVisible ? 'block' : 'none' }}
                width={40}
                height={40}
                icon="add"
                iconSize={38}
                onClick={() => {
                    if (chatFilter === 'groups') {
                        toggleCreateGroupDialogVisible(true);
                    } else if (chatFilter === 'communities') {
                        toggleCreateCommunityVisible(true);
                    } else if (chatFilter === 'channels') {
                        toggleCreateChannelVisible(true);
                    } else {
                        // Default to creating a group for 'all' and 'friends' filters
                        toggleCreateGroupDialogVisible(true);
                    }
                }}
            />
            <Tabs
                className={Style.searchResult}
                style={{ display: searchResultVisible ? 'flex' : 'none' }}
                activeKey={searchResultActiveKey}
                onChange={setSearchResultActiveKey}
                renderTabBar={() => <ScrollableInkTabBar />}
                renderTabContent={() => <TabContent />}
            >
                {tabContent}
            </Tabs>
            <CreateGroup
                visible={createGroupDialogVisible}
                onClose={() => toggleCreateGroupDialogVisible(false)}
            />
            <CreateCommunityDialog
                visible={createCommunityVisible}
                onClose={() => toggleCreateCommunityVisible(false)}
            />
            <CreateChannelDialog
                visible={createChannelVisible}
                onClose={() => toggleCreateChannelVisible(false)}
            />
        </div>
    );
}

export default FunctionBar;
