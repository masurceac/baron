import { OpenOrderAIResponseJsonOrg } from '../order-suggestion';
import { SelfTrainingAIResponseJsonOrg } from '../self-training';

export * from './utils';
export * from './types';
export * from './prompt';

export type JsonOrgResponseSchema =
  | OpenOrderAIResponseJsonOrg
  | SelfTrainingAIResponseJsonOrg;
