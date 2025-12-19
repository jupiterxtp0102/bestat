import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App Component', () => {
  it('renders the app header', () => {
    render(<App />);
    const header = screen.getByText(/3D Model Manager/i);
    expect(header).toBeDefined();
  });

  it('renders upload section', () => {
    render(<App />);
    const uploadText = screen.getByText(/Upload Model/i);
    expect(uploadText).toBeDefined();
  });

  it('renders models list section', () => {
    render(<App />);
    const modelsText = screen.getByText(/Models/i);
    expect(modelsText).toBeDefined();
  });
});
