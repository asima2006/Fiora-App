/* eslint-disable react/no-array-index-key */
/* eslint-disable react/button-has-type */
/* eslint-disable no-use-before-define */
import React, { useEffect, useState } from 'react';
import Style from './AdminDashboard.less';

interface SystemStats {
    totalUsers: number;
    activeUsers: number;
    totalGroups: number;
    totalMessages: number;
    totalCommunities: number;
    totalChannels: number;
    storageUsed: number;
    onlineUsers: number;
}

interface UserGrowth {
    date: string;
    newUsers: number;
    activeUsers: number;
}

interface MessageStats {
    date: string;
    messages: number;
}

function AdminDashboard() {
    const [stats, setStats] = useState<SystemStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalGroups: 0,
        totalMessages: 0,
        totalCommunities: 0,
        totalChannels: 0,
        storageUsed: 0,
        onlineUsers: 0,
    });

    const [userGrowth, setUserGrowth] = useState<UserGrowth[]>([]);
    const [messageStats, setMessageStats] = useState<MessageStats[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // TODO: Replace with actual API calls
            
            // Mock data for demonstration
            setStats({
                totalUsers: 15234,
                activeUsers: 4567,
                totalGroups: 892,
                totalMessages: 456789,
                totalCommunities: 145,
                totalChannels: 678,
                storageUsed: 15.7, // GB
                onlineUsers: 234,
            });

            // Mock user growth data (last 7 days)
            const mockUserGrowth: UserGrowth[] = [];
            const mockMessageStats: MessageStats[] = [];
            const now = Date.now();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now - i * 24 * 60 * 60 * 1000);
                const dateStr = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                });
                
                mockUserGrowth.push({
                    date: dateStr,
                    newUsers: Math.floor(Math.random() * 100) + 50,
                    activeUsers: Math.floor(Math.random() * 500) + 300,
                });
                
                mockMessageStats.push({
                    date: dateStr,
                    messages: Math.floor(Math.random() * 5000) + 2000,
                });
            }
            
            setUserGrowth(mockUserGrowth);
            setMessageStats(mockMessageStats);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
        
        // Refresh data every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toString();
    };

    if (loading && stats.totalUsers === 0) {
        return (
            <div className={Style.adminDashboard}>
                <div className={Style.loading}>
                    <div className={Style.spinner} />
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={Style.adminDashboard}>
            <div className={Style.header}>
                <h1>Admin Dashboard</h1>
                <button
                    className={Style.refreshButton}
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    <i className="iconfont icon-refresh" />
                    Refresh
                </button>
            </div>

            <div className={Style.statsGrid}>
                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#3b82f6' }}>
                        <i className="iconfont icon-user" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {formatNumber(stats.totalUsers)}
                        </div>
                        <div className={Style.statLabel}>Total Users</div>
                        <div className={Style.statSubtext}>
                            {stats.onlineUsers} online now
                        </div>
                    </div>
                </div>

                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#10b981' }}>
                        <i className="iconfont icon-group" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {formatNumber(stats.totalGroups)}
                        </div>
                        <div className={Style.statLabel}>Total Groups</div>
                        <div className={Style.statSubtext}>
                            {stats.activeUsers} active users
                        </div>
                    </div>
                </div>

                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#f59e0b' }}>
                        <i className="iconfont icon-message" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {formatNumber(stats.totalMessages)}
                        </div>
                        <div className={Style.statLabel}>Total Messages</div>
                        <div className={Style.statSubtext}>
                            {formatNumber(stats.totalMessages / 30)} per day avg
                        </div>
                    </div>
                </div>

                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#8b5cf6' }}>
                        <i className="iconfont icon-community" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {formatNumber(stats.totalCommunities)}
                        </div>
                        <div className={Style.statLabel}>Communities</div>
                        <div className={Style.statSubtext}>
                            {stats.totalChannels} channels
                        </div>
                    </div>
                </div>

                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#ec4899' }}>
                        <i className="iconfont icon-channel" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {formatNumber(stats.totalChannels)}
                        </div>
                        <div className={Style.statLabel}>Channels</div>
                        <div className={Style.statSubtext}>
                            Broadcast enabled
                        </div>
                    </div>
                </div>

                <div className={Style.statCard}>
                    <div className={Style.statIcon} style={{ background: '#06b6d4' }}>
                        <i className="iconfont icon-storage" />
                    </div>
                    <div className={Style.statContent}>
                        <div className={Style.statValue}>
                            {stats.storageUsed.toFixed(1)} GB
                        </div>
                        <div className={Style.statLabel}>Storage Used</div>
                        <div className={Style.statSubtext}>
                            {((stats.storageUsed / 100) * 100).toFixed(0)}% of quota
                        </div>
                    </div>
                </div>
            </div>

            <div className={Style.chartsSection}>
                <div className={Style.chartCard}>
                    <h3>User Growth (Last 7 Days)</h3>
                    <div className={Style.simpleChart}>
                        {userGrowth.map((item, index) => (
                            <div key={index} className={Style.chartBar}>
                                <div className={Style.barLabel}>{item.date}</div>
                                <div className={Style.barContainer}>
                                    <div
                                        className={Style.barFill}
                                        style={{
                                            height: `${(item.newUsers / 150) * 100}%`,
                                            background: '#3b82f6',
                                        }}
                                    />
                                </div>
                                <div className={Style.barValue}>{item.newUsers}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={Style.chartCard}>
                    <h3>Message Activity (Last 7 Days)</h3>
                    <div className={Style.simpleChart}>
                        {messageStats.map((item, index) => (
                            <div key={index} className={Style.chartBar}>
                                <div className={Style.barLabel}>{item.date}</div>
                                <div className={Style.barContainer}>
                                    <div
                                        className={Style.barFill}
                                        style={{
                                            height: `${(item.messages / 7000) * 100}%`,
                                            background: '#10b981',
                                        }}
                                    />
                                </div>
                                <div className={Style.barValue}>
                                    {formatNumber(item.messages)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className={Style.reportsSection}>
                <h2>Quick Reports</h2>
                <div className={Style.reportGrid}>
                    <button className={Style.reportButton}>
                        <i className="iconfont icon-document" />
                        <span>User Activity Report</span>
                    </button>
                    <button className={Style.reportButton}>
                        <i className="iconfont icon-document" />
                        <span>Message Statistics</span>
                    </button>
                    <button className={Style.reportButton}>
                        <i className="iconfont icon-document" />
                        <span>Storage Report</span>
                    </button>
                    <button className={Style.reportButton}>
                        <i className="iconfont icon-document" />
                        <span>System Health</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AdminDashboard;
