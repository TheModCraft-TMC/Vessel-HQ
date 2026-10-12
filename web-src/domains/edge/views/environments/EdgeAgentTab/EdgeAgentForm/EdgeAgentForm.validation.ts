import { number, object, SchemaOf, string } from 'yup';

import {
  edgeAsyncIntervalsValidation,
  EdgeAsyncIntervalsValues,
} from '@/domains/edge/components/EdgeAsyncIntervalsForm';
import { validation as urlValidation } from '@/core/components/PortainerTunnelAddrField';
import { isBE } from '@/shared/feature-flags/feature-flags.service';
import { useNameValidation } from '@/domains/environments';
import { metadataValidation } from '@/domains/environments';

import { FormValues } from './types';

export function useValidationSchema(): SchemaOf<FormValues> {
  const nameValidation = useNameValidation();

  return object().shape({
    name: nameValidation,
    portainerUrl: urlValidation(),
    tunnelServerAddr: string(),
    pollFrequency: number().required(),
    meta: metadataValidation(),
    edge: isBE
      ? edgeAsyncIntervalsValidation()
      : (null as unknown as SchemaOf<EdgeAsyncIntervalsValues>),
  });
}
