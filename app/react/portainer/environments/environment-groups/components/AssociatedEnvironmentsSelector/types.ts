import { Environment } from '@/domains/environments';

export type EnvironmentTableData = Pick<Environment, 'Name' | 'Id'>;
