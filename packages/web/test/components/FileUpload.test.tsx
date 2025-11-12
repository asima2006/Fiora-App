import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../../src/components/FileUpload';

describe('FileUpload Component', () => {
    const mockOnUpload = jest.fn();

    beforeEach(() => {
        mockOnUpload.mockClear();
    });

    it('renders the upload area correctly', () => {
        render(<FileUpload onUpload={mockOnUpload} />);
        
        expect(screen.getByText(/Click or drag files here to upload/i)).toBeInTheDocument();
        expect(screen.getByText(/Max size:/i)).toBeInTheDocument();
    });

    it('shows dragging state when files are dragged over', () => {
        const { container } = render(<FileUpload onUpload={mockOnUpload} />);
        const uploadArea = container.querySelector('.fileUpload');

        fireEvent.dragEnter(uploadArea!);
        expect(uploadArea).toHaveClass('dragging');

        fireEvent.dragLeave(uploadArea!);
        expect(uploadArea).not.toHaveClass('dragging');
    });

    it('handles file drop correctly', async () => {
        const { container } = render(<FileUpload onUpload={mockOnUpload} />);
        const uploadArea = container.querySelector('.fileUpload');

        const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
        const dataTransfer = {
            files: [file],
        };

        mockOnUpload.mockResolvedValue(undefined);

        fireEvent.drop(uploadArea!, { dataTransfer });

        await waitFor(() => {
            expect(mockOnUpload).toHaveBeenCalledWith(file);
        });
    });

    it('validates file size', async () => {
        const maxSize = 1024; // 1KB
        render(<FileUpload onUpload={mockOnUpload} maxSize={maxSize} />);

        const largeFile = new File(['x'.repeat(2048)], 'large.txt', {
            type: 'text/plain',
        });

        // Mock file input change
        const input = screen.getByRole('button').querySelector('input[type="file"]');
        Object.defineProperty(input, 'files', {
            value: [largeFile],
        });

        fireEvent.change(input!);

        // Should not call onUpload for oversized file
        await waitFor(() => {
            expect(mockOnUpload).not.toHaveBeenCalled();
        });
    });

    it('handles multiple file uploads', async () => {
        render(<FileUpload onUpload={mockOnUpload} />);

        const file1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
        const file2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

        const input = screen.getByRole('button').querySelector('input[type="file"]');
        Object.defineProperty(input, 'files', {
            value: [file1, file2],
        });

        mockOnUpload.mockResolvedValue(undefined);

        fireEvent.change(input!);

        await waitFor(() => {
            expect(mockOnUpload).toHaveBeenCalledTimes(2);
            expect(mockOnUpload).toHaveBeenCalledWith(file1);
            expect(mockOnUpload).toHaveBeenCalledWith(file2);
        });
    });

    it('disables upload when disabled prop is true', () => {
        const { container } = render(<FileUpload onUpload={mockOnUpload} disabled />);
        const uploadArea = container.querySelector('.fileUpload');

        expect(uploadArea).toHaveClass('disabled');

        const input = screen.getByRole('button').querySelector('input[type="file"]');
        expect(input).toBeDisabled();
    });

    it('shows upload progress', async () => {
        render(<FileUpload onUpload={mockOnUpload} />);

        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByRole('button').querySelector('input[type="file"]');
        
        Object.defineProperty(input, 'files', {
            value: [file],
        });

        mockOnUpload.mockImplementation(
            () => new Promise((resolve) => setTimeout(resolve, 500)),
        );

        fireEvent.change(input!);

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });
    });

    it('handles upload errors gracefully', async () => {
        render(<FileUpload onUpload={mockOnUpload} />);

        const file = new File(['test'], 'test.txt', { type: 'text/plain' });
        const input = screen.getByRole('button').querySelector('input[type="file"]');
        
        Object.defineProperty(input, 'files', {
            value: [file],
        });

        mockOnUpload.mockRejectedValue(new Error('Upload failed'));

        fireEvent.change(input!);

        await waitFor(() => {
            expect(screen.getByText('test.txt')).toBeInTheDocument();
        });
    });
});
