import { IntegrationError } from '../../errors';

export class IntegrationLocalConfigFieldMissingError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'LOCAL_CONFIG_FIELD_MISSING',
      message,
    });
  }
}

export class IntegrationLocalConfigFieldTypeMismatch extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'LOCAL_CONFIG_FIELD_TYPE_MISMATCH',
      message,
    });
  }
}
export class IntegrationConfigLoadError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'CONFIG_LOAD_ERROR',
      message,
    });
  }
}

export class IntegrationConfigValidationError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'CONFIG_FIELD_TYPE_MISMATCH',
      message,
    });
  }
}

export class IntegrationStepStartStateUnknownStepIdsError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'UNKNOWN_STEP_ID_SPECIFIED_IN_START_STATE',
      message,
    });
  }
}

export class IntegrationUnaccountedStepStartStatesError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'UNACCOUNTED_STEP_START_STATES',
      message,
    });
  }
}

export class IntegrationDuplicateKeyError extends IntegrationError {
  constructor(message: string) {
    super({
      code: 'DUPLICATE_KEY_DETECTED',
      fatal: true,
      message,
    });
  }
}

export class IntegrationValidationError extends IntegrationError {
  constructor(message: string, code?: string) {
    super({
      code: code ?? 'CONFIG_VALIDATION_ERROR',
      expose: true,
      message,
    });
  }
}
