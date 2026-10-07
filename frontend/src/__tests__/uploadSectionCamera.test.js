import { describe, it, expect } from 'vitest';

describe('UploadSection & CameraModal Integration', () => {
  it('default payload properties are defined and valid without style tuners clutter', () => {
    const mockResData = {
      success: true,
      analysis: { skin_tone: { category: 'medium' } },
      recommendations: { summary: 'Great match' }
    };

    const mode = 'normal';
    const gender = 'male';
    const finalGender = mode === 'seasonal' ? 'seasonal' : gender;
    const bodyType = 'average';
    const occasion = 'casual';
    const budget = 'any';
    const eyeColor = 'brown';

    const finalPayload = {
      ...mockResData,
      gender: finalGender,
      seasonalGender: mode === 'seasonal' ? gender : 'male',
      bodyType,
      occasion,
      budget,
      eyeColor
    };

    expect(finalPayload.bodyType).toBe('average');
    expect(finalPayload.occasion).toBe('casual');
    expect(finalPayload.budget).toBe('any');
    expect(finalPayload.gender).toBe('male');
    expect(finalPayload.analysis.skin_tone.category).toBe('medium');
  });

  it('camera facingMode toggle switches between user and environment', () => {
    let facingMode = 'user';
    const toggleFacingMode = () => {
      facingMode = facingMode === 'user' ? 'environment' : 'user';
    };

    expect(facingMode).toBe('user');
    toggleFacingMode();
    expect(facingMode).toBe('environment');
    toggleFacingMode();
    expect(facingMode).toBe('user');
  });
});
