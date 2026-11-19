import { renderHook } from '@testing-library/react-native';

import { useGuardModel } from '@/features/detection/model/useGuardModel.web';

describe('useGuardModel.web', () => {
  // Proves: the required guard always fails closed on web (never an unguarded V2 pass-through) and its run throws.
  it('fails closed on web', async () => {
    const { result } = await renderHook(() => useGuardModel());
    expect(result.current.state).toBe('error');
    expect(result.current.errorKind).toBe('unsupported');
    await expect(result.current.run([])).rejects.toMatchObject({
      code: 'GUARD_UNSUPPORTED_PLATFORM',
    });
  });
});
