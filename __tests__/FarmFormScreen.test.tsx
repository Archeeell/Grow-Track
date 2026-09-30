import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { FarmFormScreen } from '../src/screens/FarmFormScreen';

// Mock the store hook
jest.mock('../src/store', () => ({
  useStore: jest.fn(() => ({
    farms: [],
    seeds: [
      { id: 'sugar-cane', name: 'Sugar Cane', growTimeMinutes: 242, reharvestIntervalMinutes: null, builtIn: true },
      { id: 'venus-guytrap', name: 'Venus Guytrap', growTimeMinutes: 1169, reharvestIntervalMinutes: null, builtIn: true }
    ],
    addFarm: jest.fn(),
    updateFarm: jest.fn(),
    deleteFarm: jest.fn(),
  }))
}));

describe('FarmFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { getByPlaceholderText } = render(<FarmFormScreen onBack={() => {}} />);
    expect(getByPlaceholderText('WORLD NAME')).toBeTruthy();
  });

  it('initializes with existing farm data when farmId is provided', () => {
    const existingFarm = {
      id: 'farm-1',
      name: 'TEST FARM',
      seedId: 'sugar-cane',
      seedName: 'Sugar Cane',
      plantedAt: '2026-09-29T10:00:00.000Z',
      readyAt: '2026-09-30T10:00:00.000Z',
      manualOverride: false,
      notificationsEnabled: true,
      lastNotifiedReadyAt: null,
      harvestedAt: null,
      createdAt: '2026-09-28T10:00:00.000Z',
    };

    // Override the mock to return the existing farm
    const mockUseStore = require('../src/store').useStore;
    mockUseStore.mockReturnValueOnce({
      farms: [existingFarm],
      seeds: [
        { id: 'sugar-cane', name: 'Sugar Cane', growTimeMinutes: 242, reharvestIntervalMinutes: null, builtIn: true },
        { id: 'venus-guytrap', name: 'Venus Guytrap', growTimeMinutes: 1169, reharvestIntervalMinutes: null, builtIn: true }
      ],
      addFarm: jest.fn(),
      updateFarm: jest.fn(),
      deleteFarm: jest.fn(),
    });

    const { getByPlaceholderText } = render(<FarmFormScreen farmId="farm-1" onBack={() => {}} />);
    expect(getByPlaceholderText('WORLD NAME').props.value).toBe('TEST FARM');
  });
});