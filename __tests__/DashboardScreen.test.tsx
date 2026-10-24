import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DashboardScreen } from '../src/screens/DashboardScreen';

jest.mock('react-native-safe-area-context', () => {
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
    SafeAreaView: ({ children, style }: { children: React.ReactNode; style?: any }) => (
      <View style={style}>{children}</View>
    ),
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('../src/hooks/useNow', () => ({
  useNow: () => new Date('2026-10-24T12:00:00.000Z').getTime(),
}));

jest.mock('../src/store', () => ({
  useStore: jest.fn(() => ({
    farms: [
      {
        id: 'farm-1',
        name: 'READY FARM',
        seedId: 'pepper',
        seedName: 'Pepper',
        plantedAt: '2026-10-24T10:00:00.000Z',
        readyAt: '2026-10-24T11:00:00.000Z', // Past now -> Ready
        manualOverride: false,
        notificationsEnabled: true,
        lastNotifiedReadyAt: null,
        harvestedAt: null,
        pinned: false,
        createdAt: '2026-10-24T10:00:00.000Z',
      },
      {
        id: 'farm-2',
        name: 'GROWING FARM',
        seedId: 'pepper',
        seedName: 'Pepper',
        plantedAt: '2026-10-24T11:30:00.000Z',
        readyAt: '2026-10-24T15:00:00.000Z', // Future -> Growing
        manualOverride: false,
        notificationsEnabled: true,
        lastNotifiedReadyAt: null,
        harvestedAt: null,
        pinned: true,
        createdAt: '2026-10-24T11:30:00.000Z',
      },
    ],
    seeds: [],
    resetFarm: jest.fn(),
    harvestFarm: jest.fn(),
    swapFarm: jest.fn(),
    replantFarm: jest.fn(),
    updateFarm: jest.fn(),
  })),
}));

describe('DashboardScreen Toolbar & Filter Dropdown', () => {
  const defaultProps = {
    onAddFarm: jest.fn(),
    onOpenSeeds: jest.fn(),
    onEditFarm: jest.fn(),
    onNavigate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders filter dropdown button with "All farms" by default', () => {
    const { getByLabelText, getByText } = render(<DashboardScreen {...defaultProps} />);
    expect(getByLabelText('Filter farms: All farms')).toBeTruthy();
    expect(getByText('Pinned')).toBeTruthy();
  });

  it('opens dropdown menu showing "SHOW FARMS" and all 5 options when clicked', () => {
    const { getByLabelText, getByText, getAllByRole, queryByText } = render(
      <DashboardScreen {...defaultProps} />
    );

    expect(queryByText('SHOW FARMS')).toBeNull();

    // Click filter button to open dropdown
    fireEvent.press(getByLabelText('Filter farms: All farms'));

    expect(getByText('SHOW FARMS')).toBeTruthy();
    const menuItems = getAllByRole('menuitem');
    expect(menuItems.length).toBe(5);
  });

  it('selects "Ready" option, updates button label, and closes dropdown', () => {
    const { getByLabelText, getAllByRole, queryByText } = render(
      <DashboardScreen {...defaultProps} />
    );

    fireEvent.press(getByLabelText('Filter farms: All farms'));

    // Select "Ready" (index 1 of menu items: All, Ready, Growing, Harvested, Pinned)
    const menuItems = getAllByRole('menuitem');
    fireEvent.press(menuItems[1]);

    // Dropdown is closed
    expect(queryByText('SHOW FARMS')).toBeNull();
    // Filter button now displays "Ready"
    expect(getByLabelText('Filter farms: Ready')).toBeTruthy();
  });

  it('toggles Pinned filter when Pinned button is pressed', () => {
    const { getByLabelText } = render(<DashboardScreen {...defaultProps} />);
    const pinnedBtn = getByLabelText('Filter pinned farms');

    fireEvent.press(pinnedBtn);
    // When pinned is active, filter dropdown displays "All farms" as inactive
    expect(getByLabelText('Filter farms: All farms')).toBeTruthy();
  });
});
