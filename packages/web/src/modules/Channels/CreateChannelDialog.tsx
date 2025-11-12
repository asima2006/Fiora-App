import React, { useState } from 'react';
import Dialog from '../../components/Dialog';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Message from '../../components/Message';
import { createChannel } from '../../service';
import useAction from '../../hooks/useAction';

interface CreateChannelDialogProps {
    visible: boolean;
    onClose: () => void;
}

function CreateChannelDialog({ visible, onClose }: CreateChannelDialogProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const action = useAction();

    async function handleCreate() {
        if (!name.trim()) {
            Message.warning('Please enter a channel name');
            return;
        }

        setLoading(true);
        const [err, result] = await createChannel(name, description);
        setLoading(false);

        if (err) {
            Message.error(err);
            return;
        }

        Message.success('Channel created successfully!');
        action.addChannel(result as any);
        setName('');
        setDescription('');
        onClose();
    }

    return (
        <Dialog
            className="create-channel-dialog"
            visible={visible}
            title="Create Channel"
            onClose={onClose}
        >
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                    <p style={{ marginBottom: '5px' }}>Channel Name *</p>
                    <Input
                        value={name}
                        onChange={setName}
                        placeholder="Enter channel name"
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ marginBottom: '5px' }}>Description</p>
                    <Input
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

export default CreateChannelDialog;
