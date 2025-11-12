import React, { useState } from 'react';
import Dialog from '../../components/Dialog';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Message from '../../components/Message';
import { createCommunity } from '../../service';
import useAction from '../../hooks/useAction';

interface CreateCommunityDialogProps {
    visible: boolean;
    onClose: () => void;
}

function CreateCommunityDialog({ visible, onClose }: CreateCommunityDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const action = useAction();

    async function handleCreate() {
        if (!name.trim()) {
            Message.warning('Please enter a community name');
            return;
        }

        setLoading(true);
        const [err, result] = await createCommunity(name, description);
        setLoading(false);

        if (err) {
            Message.error(err);
            return;
        }

        Message.success('Community created successfully!');
        action.addCommunity(result as any);
        setName('');
        setDescription('');
        onClose();
    }

    return (
        <Dialog
            className="create-community-dialog"
            visible={visible}
            title="Create Community"
            onClose={onClose}
        >
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <label htmlFor="community-name" style={{ display: 'block', marginBottom: '5px' }}>
                        Community Name:
                    </label>
                    <Input
                        value={name}
                        onChange={setName}
                        placeholder="Enter community name"
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label htmlFor="community-description" style={{ display: 'block', marginBottom: '5px' }}>
                        Description
                    </label>
                    <Input
                        id="community-description"
                        value={description}
                        onChange={setDescription}
                        placeholder="Enter description (optional)"
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" onClick={handleCreate}>
                        {loading ? 'Creating...' : 'Create'}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}

export default CreateCommunityDialog;
