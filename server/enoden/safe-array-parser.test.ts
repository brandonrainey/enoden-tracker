import { describe, expect, it } from 'vitest';
import { ParseError, parseLooOolSchedule } from './safe-array-parser.js';
import { MALICIOUS_SCHEDULE_SCRIPTS, SAMPLE_SCHEDULE_SCRIPT } from './__fixtures__/sample-schedule.js';

describe('parseLooOolSchedule', () => {
  it('parses the real fixture into typed TLD/STP/STN/DTX arrays', () => {
    const result = parseLooOolSchedule(SAMPLE_SCHEDULE_SCRIPT);

    expect(result.STP).toHaveLength(16);
    expect(result.STN).toHaveLength(16);
    expect(result.STN[1]).toBe('藤沢');
    expect(result.STN[15]).toBe('鎌倉');
    expect(result.DTX).toEqual(['下り', '上り']);

    expect(result.TLD).toHaveLength(3);
    expect(result.TLD[2]).toEqual([
      315, 364, 2, '$200', 0, 1, 1, '', '1', '', 12, 315, 15, 320, 15, 342, 6, 350, 6, 359, 1, '+364', 1,
    ]);
  });

  it('rejects malicious/injected content instead of executing it', () => {
    for (const script of MALICIOUS_SCHEDULE_SCRIPTS) {
      expect(() => parseLooOolSchedule(script)).toThrow(ParseError);
    }
  });

  it('rejects a script missing one of the required variables', () => {
    expect(() => parseLooOolSchedule('STP=new Array(1);STN=new Array("a");DTX=new Array("a");')).toThrow(
      ParseError,
    );
  });

  it('rejects malformed STP/STN lengths', () => {
    const badScript = `
      TLD=new Array([1,2,1,"$1",0,1,1,"","1","",4,1,1,2,1]);
      STP=new Array(0,1);
      STN=new Array('','藤沢');
      DTX=new Array('下り','上り');
    `;
    expect(() => parseLooOolSchedule(badScript)).toThrow(ParseError);
  });
});
