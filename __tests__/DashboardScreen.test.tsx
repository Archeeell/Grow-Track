import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { DashboardScreen } from '../src/screens/DashboardScreen';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

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

jest.mock('../src/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    authState: { status: 'authenticated', account: { mode: 'guest', name: 'Guest' } },
    setAccount: jest.fn(),
    signOut: jest.fn(),
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

  it('renders sort dropdown button with "Sort: Recommended" by default', () => {
    const { getByLabelText, getByText } = render(<DashboardScreen {...defaultProps} />);
    expect(getByLabelText('Sort farms: Recommended')).toBeTruthy();
    expect(getByText('Sort:')).toBeTruthy();
    expect(getByText('Recommended')).toBeTruthy();
  });

  it('opens sort dropdown menu showing "SORT BY" and all 8 options when clicked', () => {
    const { getByLabelText, getByText, getAllByRole, queryByText } = render(
      <DashboardScreen {...defaultProps} />
    );

    expect(queryByText('SORT BY')).toBeNull();

    // Click sort button to open dropdown
    fireEvent.press(getByLabelText('Sort farms: Recommended'));

    expect(getByText('SORT BY')).toBeTruthy();
    const menuItems = getAllByRole('menuitem');
    expect(menuItems.length).toBe(8);
    expect(getByText('Ready first')).toBeTruthy();
    expect(getByText('Farthest harvest')).toBeTruthy();
    expect(getByText('Alphabetical A → Z')).toBeTruthy();
    expect(getByText('Alphabetical Z → A')).toBeTruthy();
    expect(getByText('Recently added')).toBeTruthy();
    expect(getByText('Recently updated')).toBeTruthy();
    expect(getByText('Favorite first')).toBeTruthy();
  });

  it('selects "Alphabetical A → Z" option, updates sort label, and closes dropdown', () => {
    const { getByLabelText, getByText, queryByText } = render(
      <DashboardScreen {...defaultProps} />
    );

    fireEvent.press(getByLabelText('Sort farms: Recommended'));
    fireEvent.press(getByText('Alphabetical A → Z'));

    expect(queryByText('SORT BY')).toBeNull();
    expect(getByLabelText('Sort farms: Alphabetical A → Z')).toBeTruthy();
  });

  it('renders list view by default and toggles to grid view when grid button is pressed', () => {
    const { getByLabelText } = render(<DashboardScreen {...defaultProps} />);

    const listBtn = getByLabelText('List view');
    const gridBtn = getByLabelText('Grid view');
    expect(listBtn).toBeTruthy();
    expect(gridBtn).toBeTruthy();

    // Toggle to grid view
    fireEvent.press(gridBtn);
    expect(getByLabelText('READY FARM, ready. Open farm details')).toBeTruthy();

    // Toggle back to list view
    fireEvent.press(listBtn);
    expect(getByLabelText('Filter farms: All farms')).toBeTruthy();
  });

  it('renders guest usage indicator showing "Guest · 2 / 5 farms" and "Saved on this device"', () => {
    const { getByText } = render(<DashboardScreen {...defaultProps} />);
    
    // Check guest account info is visible (specific text to avoid collision with greeting)
    expect(getByText(/2 \/ 5 farms/)).toBeTruthy();
    expect(getByText('Saved on this device')).toBeTruthy();
  });
});
