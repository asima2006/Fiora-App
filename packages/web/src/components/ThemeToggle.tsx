import React from 'react';
import Style from './ThemeToggle.less';

interface ThemeToggleProps {
    compact?: boolean;
}

function ThemeToggle(props: ThemeToggleProps) {
    const { compact = false } = props;
    const [isDarkSidebar, setIsDarkSidebar] = React.useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('fiora_theme');
        return saved === 'dark-sidebar';
    });

    const toggleTheme = () => {
        const newTheme = !isDarkSidebar;
        setIsDarkSidebar(newTheme);
        
        if (typeof document !== 'undefined') {
            if (newTheme) {
                document.documentElement.classList.add('dark-sidebar');
                localStorage.setItem('fiora_theme', 'dark-sidebar');
            } else {
                document.documentElement.classList.remove('dark-sidebar');
                localStorage.setItem('fiora_theme', 'original');
            }
        }
        
        // Trigger a re-render of the app
        window.dispatchEvent(new Event('themechange'));
    };

    if (compact) {
        return (
            <button
                className={Style.compactToggle}
                onClick={toggleTheme}
                title={isDarkSidebar ? 'Switch to Original Theme' : 'Switch to Dark Sidebar'}
                aria-label={isDarkSidebar ? 'Switch to Original Theme' : 'Switch to Dark Sidebar'}
            >
                <i className={`iconfont icon-${isDarkSidebar ? 'light' : 'dark'}`} />
            </button>
        );
    }

    return (
        <div className={Style.themeToggle}>
            <label className={Style.label}>
                <span className={Style.labelText}>Dark Sidebar Theme</span>
                <div className={Style.switch}>
                    <input
                        type="checkbox"
                        checked={isDarkSidebar}
                        onChange={toggleTheme}
                        aria-label="Toggle dark sidebar theme"
                    />
                    <span className={Style.slider} />
                </div>
            </label>
            <p className={Style.description}>
                Enables a compact dark sidebar layout with high contrast design
            </p>
        </div>
    );
}

export default ThemeToggle;
