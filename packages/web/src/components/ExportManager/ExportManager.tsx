import React, { useState, useEffect, useRef } from 'react';
import {
    exportMessages,
    exportAllConversations,
    saveDraft,
    getDraft,
    deleteDraft,
} from '../../service';
import Message from '../Message';

interface ExportManagerProps {
    linkmanId: string;
    linkmanName: string;
    linkmanType: 'group' | 'friend';
}

/**
 * Export Manager Component
 * Provides UI for exporting conversations and managing drafts
 */
const ExportManager: React.FC<ExportManagerProps> = ({
    linkmanId,
    linkmanName,
    linkmanType,
}) => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState<'json' | 'txt' | 'html'>(
        'json',
    );
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showExportModal, setShowExportModal] = useState(false);

    /**
     * Handle export of current conversation
     */
    const handleExportConversation = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            const result = await exportMessages(
                linkmanId,
                exportFormat,
                startDate || undefined,
                endDate || undefined,
            );

            if (result) {
                // Create and trigger download
                const blob = new Blob([result.exportData], {
                    type: result.mimeType,
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                Message.success(
                    `Successfully exported ${result.messageCount} messages!`,
                );
                setShowExportModal(false);
            }
        } catch (error) {
            Message.error('Failed to export messages. Please try again.');
            console.error('Export error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    /**
     * Handle export of all conversations
     */
    const handleExportAll = async () => {
        if (isExporting) return;

        setIsExporting(true);
        try {
            const result = await exportAllConversations(exportFormat);

            if (result) {
                // Create and trigger download
                const blob = new Blob([result.exportData], {
                    type: result.mimeType,
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                Message.success(
                    `Successfully exported ${result.conversationCount} conversations with ${result.totalMessages} messages!`,
                );
                setShowExportModal(false);
            }
        } catch (error) {
            Message.error(
                'Failed to export all conversations. Please try again.',
            );
            console.error('Export all error:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* Export Button */}
            <button
                type="button"
                onClick={() => setShowExportModal(true)}
                className="export-button"
                title="Export conversation"
            >
                <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path d="M10 2a1 1 0 011 1v8.586l2.293-2.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 11.586V3a1 1 0 011-1z" />
                    <path d="M3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
                </svg>
                Export
            </button>

            {/* Export Modal */}
            {showExportModal && (
                <div className="export-modal-overlay">
                    <div className="export-modal">
                        <div className="export-modal-header">
                            <h2>Export Conversation</h2>
                            <button
                                type="button"
                                onClick={() => setShowExportModal(false)}
                                className="close-button"
                            >
                                ×
                            </button>
                        </div>

                        <div className="export-modal-body">
                            {/* Conversation Info */}
                            <div className="export-info">
                                <strong>Conversation:</strong> {linkmanName} (
                                {linkmanType})
                            </div>

                            {/* Format Selection */}
                            <div className="export-field">
                                <label htmlFor="export-format">
                                    Export Format:
                                    <select
                                        id="export-format"
                                        value={exportFormat}
                                        onChange={(e) =>
                                            setExportFormat(
                                                e.target.value as
                                                    | 'json'
                                                    | 'txt'
                                                    | 'html',
                                            )
                                        }
                                        className="export-select"
                                    >
                                        <option value="json">
                                            JSON (Structured Data)
                                        </option>
                                        <option value="txt">
                                            TXT (Plain Text)
                                        </option>
                                        <option value="html">
                                            HTML (Styled Document)
                                        </option>
                                    </select>
                                </label>
                            </div>

                            {/* Date Range Filters */}
                            <div className="export-field">
                                <label htmlFor="start-date">
                                    Start Date (Optional):
                                    <input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) =>
                                            setStartDate(e.target.value)
                                        }
                                        className="export-input"
                                    />
                                </label>
                            </div>

                            <div className="export-field">
                                <label htmlFor="end-date">
                                    End Date (Optional):
                                    <input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) =>
                                            setEndDate(e.target.value)
                                        }
                                        className="export-input"
                                    />
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="export-actions">
                                <button
                                    type="button"
                                    onClick={handleExportConversation}
                                    disabled={isExporting}
                                    className="export-button-primary"
                                >
                                    {isExporting
                                        ? 'Exporting...'
                                        : 'Export This Conversation'}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleExportAll}
                                    disabled={isExporting}
                                    className="export-button-secondary"
                                >
                                    {isExporting
                                        ? 'Exporting...'
                                        : 'Export All Conversations'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .export-button {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 12px;
                    background: transparent;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .export-button:hover {
                    background: #f0f0f0;
                    border-color: #999;
                }

                .export-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                }

                .export-modal {
                    background: white;
                    border-radius: 8px;
                    width: 90%;
                    max-width: 500px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .export-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    border-bottom: 1px solid #eee;
                }

                .export-modal-header h2 {
                    margin: 0;
                    font-size: 20px;
                    color: #333;
                }

                .close-button {
                    background: none;
                    border: none;
                    font-size: 30px;
                    cursor: pointer;
                    color: #999;
                    line-height: 1;
                }

                .close-button:hover {
                    color: #333;
                }

                .export-modal-body {
                    padding: 20px;
                }

                .export-info {
                    margin-bottom: 20px;
                    padding: 12px;
                    background: #f5f5f5;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .export-field {
                    margin-bottom: 16px;
                }

                .export-field label {
                    display: block;
                    margin-bottom: 6px;
                    font-size: 14px;
                    color: #666;
                }

                .export-select,
                .export-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                }

                .export-actions {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-top: 24px;
                }

                .export-button-primary,
                .export-button-secondary {
                    padding: 12px 20px;
                    border: none;
                    border-radius: 4px;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .export-button-primary {
                    background: #1890ff;
                    color: white;
                }

                .export-button-primary:hover:not(:disabled) {
                    background: #40a9ff;
                }

                .export-button-secondary {
                    background: #f0f0f0;
                    color: #333;
                }

                .export-button-secondary:hover:not(:disabled) {
                    background: #e0e0e0;
                }

                .export-button-primary:disabled,
                .export-button-secondary:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
        </>
    );
};

/**
 * Draft Manager Hook
 * Manages draft messages with auto-save functionality
 */
export function useDraftManager(linkmanId: string) {
    const [draft, setDraft] = useState('');
    const draftTimeout = useRef<NodeJS.Timeout>();
    const [isLoading, setIsLoading] = useState(true);

    // Load draft on mount
    useEffect(() => {
        async function loadDraft() {
            setIsLoading(true);
            try {
                const result = await getDraft(linkmanId);
                if (result?.content) {
                    setDraft(result.content);
                }
            } catch (error) {
                console.error('Failed to load draft:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadDraft();

        // Cleanup on unmount
        return () => {
            if (draftTimeout.current) {
                clearTimeout(draftTimeout.current);
            }
        };
    }, [linkmanId]);

    // Save draft with debounce
    const updateDraft = (content: string) => {
        setDraft(content);

        // Clear existing timeout
        if (draftTimeout.current) {
            clearTimeout(draftTimeout.current);
        }

        // Save draft after 1 second of inactivity
        draftTimeout.current = setTimeout(async () => {
            try {
                await saveDraft(linkmanId, content);
                console.log('Draft saved');
            } catch (error) {
                console.error('Failed to save draft:', error);
            }
        }, 1000);
    };

    // Clear draft
    const clearDraft = async () => {
        try {
            await deleteDraft(linkmanId);
            setDraft('');
        } catch (error) {
            console.error('Failed to clear draft:', error);
        }
    };

    return {
        draft,
        updateDraft,
        clearDraft,
        isLoading,
    };
}

export default ExportManager;
