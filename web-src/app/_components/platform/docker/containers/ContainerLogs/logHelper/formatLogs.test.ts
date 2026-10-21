import { formatJSONLine as sharedFormatJSONLine } from '@/shared/docker/helpers/logHelper/formatJSONLogs';
import { formatLogs as sharedFormatLogs } from '@/shared/docker/helpers/logHelper/formatLogs';
import {
  formatZerologLogs as sharedFormatZerologLogs,
  ZerologRegex as sharedZerologRegex,
} from '@/shared/docker/helpers/logHelper/formatZerologLogs';

import { formatJSONLine } from './formatJSONLogs';
import { formatLogs } from './formatLogs';
import { formatZerologLogs, ZerologRegex } from './formatZerologLogs';

it('uses the canonical shared formatters at the container log entrypoints', () => {
  expect(formatLogs).toBe(sharedFormatLogs);
  expect(formatJSONLine).toBe(sharedFormatJSONLine);
  expect(formatZerologLogs).toBe(sharedFormatZerologLogs);
  expect(ZerologRegex).toBe(sharedZerologRegex);
});
