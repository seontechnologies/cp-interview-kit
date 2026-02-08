import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Settings from '../src/pages/Settings';
import OrganizationSettings from '../src/pages/OrganizationSettings';
import Team from '../src/pages/Team';
import {
  renderWithProviders,
  mockUser,
  mockOwnerUser,
  mockOrganization,
  mockSession,
  mockApiKey,
  mockTeamMember,
} from './test-utils';
import * as api from '../src/services/api';
import * as authStore from '../src/store/authSlice';
import * as useAuthHooks from '../src/hooks/useAuth';

// Mock external modules
vi.mock('../src/services/api');
vi.mock('../src/store/authSlice');
vi.mock('../src/hooks/useAuth');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      checkAuth: vi.fn(),
    } as any);

    vi.mocked(api.fetchCurrentUser).mockResolvedValue(mockUser);
    vi.mocked(api.fetchOrganization).mockResolvedValue(mockOrganization);
    vi.mocked(api.fetchUserPreferences).mockResolvedValue({
      darkMode: false,
      emailDigest: true,
      compactView: false,
      timezone: 'UTC',
      dateFormat: 'MM/DD/YYYY',
    });
    vi.mocked(api.fetchUserSessions).mockResolvedValue([
      { ...mockSession, id: 'session-1', current: true, userAgent: 'Chrome' },
      { ...mockSession, id: 'session-2', current: false, userAgent: 'Firefox' },
    ]);
  });

  describe('Tab Navigation', () => {
    it.todo('should render all tabs');

    it('EXAMPLE: should switch tabs when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Profile' })
        ).toBeInTheDocument();
      });

      // Click on Preferences tab
      await user.click(screen.getByRole('button', { name: 'Preferences' }));
      expect(screen.getByText('Dark Mode')).toBeInTheDocument();

      // Click on Sessions tab
      await user.click(screen.getByRole('button', { name: 'Sessions' }));
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();

      // Click on Danger Zone tab
      await user.click(screen.getByRole('button', { name: 'Danger Zone' }));
      expect(
        screen.getByText(/permanently delete your account/i)
      ).toBeInTheDocument();
    });
  });

  describe('Profile Tab', () => {
    it.todo('should display user information');

    it('EXAMPLE: should disable email field', async () => {
      renderWithProviders(<Settings />);

      await waitFor(() => {
        const emailInput = screen.getByDisplayValue('test@example.com');
        expect(emailInput).toBeDisabled();
      });
    });

    it.todo('should update profile name');

    it.todo('should display organization area');
  });

  describe('Password Change', () => {
    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: 'Profile' })
        ).toBeInTheDocument();
      });

      // Fill in password fields - query by type since labels lack htmlFor
      const passwordInputs = screen.getAllByRole('textbox', { hidden: true });
      // Actually get password inputs by querying all inputs and filtering by type
      const allInputs = document.querySelectorAll('input[type="password"]');
      const currentPasswordInput = allInputs[0] as HTMLInputElement;
      const newPasswordInput = allInputs[1] as HTMLInputElement;
      const confirmPasswordInput = allInputs[2] as HTMLInputElement;

      await user.type(currentPasswordInput, 'oldpassword');
      await user.type(newPasswordInput, 'newpassword123');
      await user.type(confirmPasswordInput, 'differentpassword');

      const changeButton = screen.getByRole('button', {
        name: /change password/i,
      });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });
    });

    it.todo('should show error when password is too short');

    it.todo('should successfully change password with valid inputs');
  });

  describe('Preferences Tab', () => {
    it.todo('should display preference settings');

    it.todo('should toggle dark mode');

    it.todo('should reflect timezone changes');
  });

  describe('Sessions Tab', () => {
    it('should display active sessions', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await user.click(screen.getByRole('button', { name: 'Sessions' }));

      await waitFor(() => {
        expect(screen.getByText('Chrome')).toBeInTheDocument();
        expect(screen.getByText('Firefox')).toBeInTheDocument();
        expect(screen.getByText('Current')).toBeInTheDocument();
      });
    });

    it('should mark current session correctly', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await user.click(screen.getByRole('button', { name: 'Sessions' }));

      await waitFor(() => {
        const currentBadge = screen.getByText('Current');
        expect(currentBadge).toBeInTheDocument();
        expect(currentBadge).toHaveClass('bg-green-100');
      });
    });

    it('should not show revoke button for current session', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Settings />);

      await user.click(screen.getByRole('button', { name: 'Sessions' }));

      await waitFor(() => {
        expect(screen.getByText('Chrome')).toBeInTheDocument();
      });

      // Should only have one Revoke button (for Firefox session)
      const revokeButtons = screen.getAllByRole('button', { name: /revoke/i });
      expect(revokeButtons).toHaveLength(2); // One "Revoke" and one "Revoke All Sessions"
    });

    it.todo('should revoke individual session');
  });

  describe.todo('Danger Zone Tab');
});

describe('Organization Settings Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: mockOwnerUser,
      setUser: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      checkAuth: vi.fn(),
    } as any);

    vi.mocked(api.fetchOrganization).mockResolvedValue(mockOrganization);
    vi.mocked(api.fetchOrganizationSettings).mockResolvedValue({
      maxUsers: 10,
      maxDashboards: 50,
    });
    vi.mocked(api.fetchApiKeys).mockResolvedValue([mockApiKey]);
    vi.mocked(api.fetchTeamMembers).mockResolvedValue([mockTeamMember]);
  });

  describe('Organization Details', () => {
    it('should disable inputs for non-owner', async () => {
      vi.mocked(authStore.useAuthStore).mockReturnValue({
        user: mockUser, // Regular user, not owner
        setUser: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
        checkAuth: vi.fn(),
      } as any);

      renderWithProviders(<OrganizationSettings />);

      await waitFor(() => {
        expect(
          screen.getByDisplayValue('Test Organization')
        ).toBeInTheDocument();
      });

      const nameInput = screen.getByDisplayValue('Test Organization');
      expect(nameInput).toBeDisabled();
    });
  });

  describe('API Keys', () => {
    it('should display API keys', async () => {
      renderWithProviders(<OrganizationSettings />);

      await waitFor(() => {
        expect(screen.getByText('Production Key')).toBeInTheDocument();
      });
    });

    it('should create new API key', async () => {
      const user = userEvent.setup();
      const createKeyMock = vi.mocked(api.createApiKey).mockResolvedValue({
        key: 'sk_test_newkey123456789',
      });

      renderWithProviders(<OrganizationSettings />);

      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /create key/i })
        ).toBeInTheDocument();
      });

      await user.click(screen.getByRole('button', { name: /create key/i }));

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText(/production api key/i)
        ).toBeInTheDocument();
      });

      await user.type(
        screen.getByPlaceholderText(/production api key/i),
        'Test API Key'
      );

      const selectElement = document.querySelector(
        'select'
      ) as HTMLSelectElement;
      await user.selectOptions(selectElement, '90');

      // Get all Create Key buttons and click the one in the modal (type="submit")
      const createButtons = screen.getAllByRole('button', {
        name: /^create key$/i,
      });
      const submitButton = createButtons.find(
        (btn) => btn.getAttribute('type') === 'submit'
      );
      await user.click(submitButton!);

      await waitFor(() => {
        expect(createKeyMock).toHaveBeenCalledWith({
          name: 'Test API Key',
          expiresIn: 90,
        });
      });
    });

    it.todo('should revoke API key');
  });

  describe('Role Checking', () => {
    it('should identify owner role', async () => {
      renderWithProviders(<OrganizationSettings />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: 'Organization Settings',
            level: 1,
          })
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Transfer Ownership')).toBeInTheDocument();
      expect(screen.getByText('Delete Organization')).toBeInTheDocument();
    });

    it('should not show owner actions for non-owner', async () => {
      vi.mocked(authStore.useAuthStore).mockReturnValue({
        user: mockUser, // Regular admin, not owner
        setUser: vi.fn(),
        logout: vi.fn(),
        isAuthenticated: true,
        isLoading: false,
        checkAuth: vi.fn(),
      } as any);

      renderWithProviders(<OrganizationSettings />);

      await waitFor(() => {
        expect(
          screen.getByRole('heading', {
            name: 'Organization Settings',
            level: 1,
          })
        ).toBeInTheDocument();
      });

      expect(screen.queryByText('Transfer Ownership')).not.toBeInTheDocument();
    });
  });
});

describe('Team Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(authStore.useAuthStore).mockReturnValue({
      user: mockUser,
      setUser: vi.fn(),
      logout: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
      checkAuth: vi.fn(),
    } as any);

    vi.mocked(useAuthHooks.useHasRole).mockReturnValue(true);

    vi.mocked(api.fetchTeamMembers).mockResolvedValue([
      mockTeamMember,
      {
        ...mockTeamMember,
        id: 'member-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'viewer',
      },
      {
        ...mockTeamMember,
        id: 'member-3',
        name: 'Owner User',
        email: 'owner@example.com',
        role: 'owner',
      },
    ]);
  });

  describe('Member List Display', () => {
    it('should display team members', async () => {
      renderWithProviders(<Team />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      });
    });
  });

  // TODO: Something is wrong with the user search: when you search
  // for a user, it invites you to invite a user which already exists
  // with that email in the organization.
  describe.todo('User Search');

  describe.todo('Invite Member');

  describe('Permissions', () => {
    it('should hide role dropdown for users without permission', async () => {
      vi.mocked(useAuthHooks.useHasRole).mockReturnValue(false);

      renderWithProviders(<Team />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Should show role as text, not dropdown
      const memberRow = screen.getByText('John Doe').closest('tr');
      const roleCell = memberRow?.querySelector('td:nth-child(2)');
      expect(roleCell?.querySelector('select')).not.toBeInTheDocument();
    });

    it('should hide remove button for users without permission', async () => {
      vi.mocked(useAuthHooks.useHasRole).mockReturnValue(false);

      renderWithProviders(<Team />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('button', { name: /remove/i })
      ).not.toBeInTheDocument();
    });
  });
});
