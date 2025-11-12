import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TypingIndicator from '../../src/components/TypingIndicator';

describe('TypingIndicator Component', () => {
    it('renders nothing when no users are typing', () => {
        const { container } = render(<TypingIndicator usernames={[]} />);
        expect(container.firstChild).toBeNull();
    });

    it('displays single user typing correctly', () => {
        render(<TypingIndicator usernames={['Alice']} />);
        expect(screen.getByText(/Alice is typing.../)).toBeInTheDocument();
    });

    it('displays two users typing correctly', () => {
        render(<TypingIndicator usernames={['Alice', 'Bob']} />);
        expect(screen.getByText(/Alice and Bob are typing.../)).toBeInTheDocument();
    });

    it('displays multiple users typing correctly', () => {
        render(<TypingIndicator usernames={['Alice', 'Bob', 'Charlie']} />);
        expect(screen.getByText(/Alice and 2 others are typing.../)).toBeInTheDocument();
    });

    it('renders typing animation dots', () => {
        const { container } = render(<TypingIndicator usernames={['Alice']} />);
        const dots = container.querySelectorAll('.dots span');
        expect(dots).toHaveLength(3);
    });
});
