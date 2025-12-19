import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import axios from 'axios';

// Mock axios to prevent real network requests
vi.mock('axios');

describe('App Component', () => {
  beforeAll(() => {
    // Mock axios.get to return empty array
    vi.mocked(axios.get).mockResolvedValue({ data: [] });
    
    // Suppress console.error during tests (network errors are expected)
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });
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
    const modelsText = screen.getByText(/^Models \(/);
    expect(modelsText).toBeDefined();
  });
});
