import { act, render, waitFor } from '@testing-library/react-native';
import { useReducer } from 'react';

import ScanScreen from '@/app/(tabs)/scan';
import { ToastProvider } from '@/components/ui/Toast';
import { ScanSessionContext } from '@/features/detection/context/ScanSessionProvider';
import {
  initialScanSessionState,
  scanSessionReducer,
} from '@/features/detection/context/scanSessionReducer';
import {
  CaneGuardModelProvider,
} from '@/features/detection/model/useCaneGuardModel';
import { GuardModelProvider } from '@/features/detection/model/useGuardModel';

// The Scan tab must begin both native model loads on mount (lane L8) so the
// first verdict does not wait for a checklist visit. These mocks stand in for
// the two native runtimes; the assertion is that mounting the screen alone
// reaches them, with no picker, checklist or other user interaction.

const mockLoadTensorflowModel = jest.fn();
const mockGuardLoader = jest.fn();
const mockAssetDownloadAsync = jest.fn(async () => undefined);
const mockAsset = {
  localUri: 'file:///cached/caneguard_v1_mobilenetv2_float32.tflite',
  downloadAsync: mockAssetDownloadAsync,
};

jest.mock('expo-asset', () => ({
  Asset: { fromModule: jest.fn(() => mockAsset) },
}));

jest.mock('react-native-fast-tflite', () => ({
  loadTensorflowModel: (...args: unknown[]) => mockLoadTensorflowModel(...args),
}));

jest.mock('expo-image-picker', () => ({
  CameraType: { back: 'back' },
  PermissionStatus: { DENIED: 'denied', GRANTED: 'granted', UNDETERMINED: 'undetermined' },
  getPendingResultAsync: jest.fn(async () => null),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true, assets: null })),
  requestCameraPermissionsAsync: jest.fn(async () => ({
    canAskAgain: true,
    expires: 'never',
    granted: true,
    status: 'granted',
  })),
}));

jest.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'field_reporter', uuid: 'scan-model-start-user' } }),
}));

jest.mock('@/providers/LanguagePreferenceProvider', () => ({
  useFarmerCopy: () => jest.requireActual('@/constants/copy').FARMER_COPY.en,
}));

function Harness() {
  const [state, dispatch] = useReducer(scanSessionReducer, initialScanSessionState);

  return (
    <ToastProvider>
      <ScanSessionContext.Provider value={{ state, dispatch }}>
        <CaneGuardModelProvider>
          <GuardModelProvider loader={mockGuardLoader}>
            <ScanScreen />
          </GuardModelProvider>
        </CaneGuardModelProvider>
      </ScanSessionContext.Provider>
    </ToastProvider>
  );
}

describe('ScanScreen model warm-up', () => {
  beforeEach(() => {
    mockLoadTensorflowModel.mockResolvedValue({
      run: jest.fn(async () => [Float32Array.of(0.8).buffer]),
      inputs: [{ name: 'input', dataType: 'float32', shape: [1, 224, 224, 3] }],
      outputs: [{ name: 'output', dataType: 'float32', shape: [1, 5] }],
    });
    mockGuardLoader.mockResolvedValue({
      run: jest.fn(async () => [Float32Array.of(0.9).buffer]),
      inputs: [{ name: 'img', dataType: 'float32', shape: [1, 224, 224, 3] }],
      outputs: [{ name: 'p', dataType: 'float32', shape: [1, 1] }],
    });
  });

  it('starts the sugarcane model and the guard model loaders on mount alone', async () => {
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => {
      expect(mockLoadTensorflowModel).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockGuardLoader).toHaveBeenCalledTimes(1);
    });
  });
});
