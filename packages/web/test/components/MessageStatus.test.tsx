import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageStatus from '../../src/components/MessageStatus';

describe('MessageStatus Component', () => {
    it('renders sent status by default', () => {
        render(<MessageStatus />);
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    });

    it('renders delivered status correctly', () => {
        render(<MessageStatus delivered />);
        const status = screen.getByRole('img', { hidden: true }).parentElement;
        expect(status).toHaveClass('delivered');
    });

    it('renders read status correctly', () => {
        render(<MessageStatus read />);
        const status = screen.getByRole('img', { hidden: true }).parentElement;
        expect(status).toHaveClass('read');
    });

    it('displays correct tooltip for single recipient', () => {
        render(<MessageStatus delivered deliveredCount={1} totalRecipients={1} />);
        // Tooltip should show "Delivered"
    });

    it('displays correct tooltip for multiple recipients', () => {
        render(<MessageStatus delivered deliveredCount={5} totalRecipients={10} />);
        // Tooltip should show "Delivered to 5/10"
    });

    it('prioritizes read status over delivered', () => {
        render(<MessageStatus delivered read />);
        const status = screen.getByRole('img', { hidden: true }).parentElement;
        expect(status).toHaveClass('read');
    });
});
