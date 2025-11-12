import React from 'react';
import './ViewAllButton.less';

interface Props {
    onClick: () => void;
    count?: number;
}

function ViewAllButton({ onClick, count }: Props) {
    return (
        <div className="view-all-button" onClick={onClick} role="button" tabIndex={0}>
            <span className="view-all-text">View all</span>
            {count !== undefined && count > 0 && (
                <span className="view-all-count">+{count}</span>
            )}
            <svg className="view-all-arrow" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
    );
}

export default ViewAllButton;
