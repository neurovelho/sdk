import Logger from 'bunyan';
import { EventEmitter } from 'events';
import { v4 as uuid } from 'uuid';

import {
  ExecutionContext,
  IntegrationError,
  IntegrationEvent,
  IntegrationExecutionContext,
  IntegrationInstance,
  IntegrationInstanceConfigFieldMap,
  IntegrationInvocationConfig,
  IntegrationLogger as IntegrationLoggerType,
  IntegrationProviderAuthenticationError,
  IntegrationProviderAuthorizationError,
  IntegrationStepExecutionContext,
  IntegrationValidationError,
  InvocationConfig,
  Metric,
  PROVIDER_AUTH_ERROR_DESCRIPTION,
  StepExecutionContext,
  StepMetadata,
  SynchronizationJob,
  UNEXPECTED_ERROR_CODE,
  UNEXPECTED_ERROR_REASON,
} from '@jupiterone/integration-sdk-core';

// eslint-disable-next-line
const bunyanFormat = require('bunyan-format');

interface CreateLoggerInput<
  TExecutionContext extends ExecutionContext,
  TStepExecutionContext extends StepExecutionContext
> {
  name: string;
  invocationConfig?: InvocationConfig<TExecutionContext, TStepExecutionContext>;
  pretty?: boolean;
  serializers?: Logger.Serializers;
}

interface CreateIntegrationLoggerInput
  extends CreateLoggerInput<
    IntegrationExecutionContext,
    IntegrationStepExecutionContext
  > {
  invocationConfig?: IntegrationInvocationConfig;
}

export function createLogger<
  TExecutionContext extends ExecutionContext,
  TStepExecutionContext extends StepExecutionContext
>({
  name,
  pretty,
  serializers,
}: CreateLoggerInput<
  TExecutionContext,
  TStepExecutionContext
>): IntegrationLogger {
  const loggerConfig: Logger.LoggerOptions = {
    name,
    level: (process.env.LOG_LEVEL || 'info') as Logger.LogLevel,
    serializers: {
      err: Logger.stdSerializers.err,
    },
  };

  if (pretty) {
    loggerConfig.streams = [{ stream: bunyanFormat({ outputMode: 'short' }) }];
  }

  const logger = Logger.createLogger(loggerConfig);

  if (serializers) {
    logger.addSerializers(serializers);
  }

  const errorSet = new Set<Error>();

  return new IntegrationLogger({
    logger,
    errorSet,
  });
}

/**
 * Create a logger for the integration that will include invocation details and
 * serializers common to all integrations.
 */
export function createIntegrationLogger({
  name,
  invocationConfig,
  pretty,
  serializers,
}: CreateIntegrationLoggerInput): IntegrationLogger {
  const serializeInstanceConfig = createInstanceConfigSerializer(
    invocationConfig?.instanceConfigFields,
  );

  return createLogger({
    name,
    pretty,
    serializers: {
      integrationInstanceConfig: serializeInstanceConfig,
      // since config is serializable from
      instance: (instance: IntegrationInstance) => ({
        ...instance,
        config: instance.config
          ? serializeInstanceConfig(instance.config)
          : undefined,
      }),
      ...serializers,
    },
  });
}

function createInstanceConfigSerializer(
  fields?: IntegrationInstanceConfigFieldMap,
) {
  return (config: any) => {
    if (!config) {
      return config;
    } else {
      const serialized: any = {};
      for (const k of Object.keys(config)) {
        const field = fields && fields[k];
        if (field) {
          serialized[k] = field.mask
            ? `****${config[k].substr(-4)}`
            : config[k];
        } else {
          serialized[k] = '***';
        }
      }
      return serialized;
    }
  };
}

interface EventLookup {
  event: IntegrationEvent;
  metric: Metric;
}

interface IntegrationLoggerInput {
  logger: Logger;
  errorSet: Set<Error>;
}

export class IntegrationLogger extends EventEmitter
  implements IntegrationLoggerType {
  private _logger: Logger;
  private _errorSet: Set<Error>;

  constructor(input: IntegrationLoggerInput) {
    super();
    this._logger = input.logger;
    this._errorSet = input.errorSet;
  }

  isHandledError(err: Error) {
    return this._errorSet.has(err);
  }

  debug(...params: any[]) {
    return this._logger.debug(...params);
  }
  info(...params: any[]) {
    return this._logger.info(...params);
  }
  warn(...params: any[]) {
    this.trackHandledError(params[0]);
    return this._logger.warn(...params);
  }
  fatal(...params: any[]) {
    return this._logger.fatal(...params);
  }

  trace(...params: any[]) {
    if (params.length === 0) {
      return;
    }

    let additionalFields: Record<string, any> = {};
    let remainingArgs: any[] = params;

    if (params[0] instanceof Error) {
      additionalFields = { err: params[0] };
      remainingArgs = params.slice(1);
    } else if (typeof params[0] === 'object') {
      additionalFields = params[0];
      remainingArgs = params.slice(1);
    }

    return this._logger.trace(
      { verbose: true, ...additionalFields },
      ...remainingArgs,
    );
  }

  error(...params: any[]) {
    this.trackHandledError(params[0]);
    this._logger.error(...params);
  }

  child(options: object = {}, simple?: boolean) {
    const childLogger = new IntegrationLogger({
      errorSet: this._errorSet,
      logger: this._logger.child(options, simple),
    });

    // pass events to parent
    childLogger.on('event', (data) => this.emit('event', data));
    childLogger.on('metric', (data) => this.emit('metric', data));

    return childLogger;
  }

  emit<T extends EventLookup, K extends keyof EventLookup>(
    name: K,
    data: T[K],
  ) {
    return super.emit(name, data);
  }

  stepStart(step: StepMetadata) {
    const name = 'step_start';
    const description = `Starting step "${step.name}"...`;
    this.info({ step: step.id }, description);
    this.publishEvent({ name, description });
  }

  stepSuccess(step: StepMetadata) {
    const name = 'step_end';
    const description = `Completed step "${step.name}".`;
    this.info({ step: step.id }, description);
    this.publishEvent({ name, description });
  }

  stepFailure(step: StepMetadata, err: Error) {
    const name = 'step_failure';
    const { errorId, description } = createErrorEventDescription(
      err,
      `Step "${step.name}" failed to complete due to error.`,
    );

    this.error({ errorId, err, step: step.id }, description);
    this.publishEvent({ name, description });
  }

  synchronizationUploadStart(job: SynchronizationJob) {
    const name = 'sync_upload_start';
    const description = 'Uploading collected data for synchronization...';
    this.info(
      {
        synchronizationJobId: job.id,
      },
      description,
    );
    this.publishEvent({ name, description });
  }

  synchronizationUploadEnd(job: SynchronizationJob) {
    const name = 'sync_upload_end';
    const description = 'Upload complete.';
    this.info(
      {
        synchronizationJobId: job.id,
      },
      description,
    );
    this.publishEvent({ name, description });
  }

  validationFailure(err: Error) {
    const name = 'validation_failure';
    const { errorId, description } = createErrorEventDescription(
      err,
      `Error occurred while validating integration configuration.`,
    );

    if (isUserConfigError(err)) {
      this.warn({ errorId, err }, description);
    } else {
      this.error({ errorId, err }, description);
    }

    this.publishEvent({ name, description });
  }

  publishMetric(metric: Omit<Metric, 'timestamp'>) {
    const metricWithTimestamp = {
      ...metric,
      timestamp: Date.now(),
    };

    this.info({ metric: metricWithTimestamp }, 'Collected metric.');

    // emit the metric so that consumers can collect the metric
    // and publish it if needed
    return this.emit('metric', metricWithTimestamp);
  }

  publishEvent(event: IntegrationEvent) {
    return this.emit('event', event);
  }

  publishErrorEvent(options) {
    const {
      name,
      message,
      err,

      // `logData` is only logged (it is used to log data that should
      // not be shown to customer but might be helpful for troubleshooting)
      logData,

      // `eventData` is added to error description but not logged
      eventData,
    } = options;

    const { errorId, description } = createErrorEventDescription(
      err,
      message,
      eventData,
    );

    this._logger.error({ ...logData, errorId, err }, description);
    this.publishEvent({ name, description });
  }

  private trackHandledError(logArg: any): void {
    if (logArg instanceof Error) {
      this._errorSet.add(logArg);
    } else if (logArg?.err instanceof Error) {
      this._errorSet.add(logArg.err);
    }
  }
}

type NameValuePair = [string, any];

export function createErrorEventDescription(
  err: Error | IntegrationError,
  message: string,

  /**
   * Optional data that will be added as name/value pairs to the
   * event description.
   */
  eventData?: object,
) {
  const errorId = uuid();

  let errorCode: string;
  let errorReason: string;

  if (err instanceof IntegrationError) {
    errorCode = err.code;
    errorReason = err.message;
  } else {
    errorCode = UNEXPECTED_ERROR_CODE;
    errorReason = UNEXPECTED_ERROR_REASON;
  }

  if (isProviderAuthError(err)) {
    // add additional instructions to the displayed message
    // if we know that this is an auth error
    message += PROVIDER_AUTH_ERROR_DESCRIPTION;
  }

  const nameValuePairs: NameValuePair[] = [
    ['errorCode', errorCode],
    ['errorId', errorId],
    ['reason', errorReason],
  ];

  if (eventData) {
    for (const key of Object.keys(eventData)) {
      nameValuePairs.push([key, eventData[key]]);
    }
  }

  const errorDetails = nameValuePairs
    .map((nameValuePair) => {
      return `${nameValuePair[0]}=${JSON.stringify(nameValuePair[1])}`;
    })
    .join(', ');

  return {
    errorId,
    description: `${message} (${errorDetails})`,
  };
}

type UserConfigError =
  | IntegrationValidationError
  | IntegrationProviderAuthenticationError;

export function isUserConfigError(err: Error): err is UserConfigError {
  return (
    err instanceof IntegrationValidationError ||
    err instanceof IntegrationProviderAuthenticationError
  );
}

type ProviderAuthError =
  | IntegrationProviderAuthorizationError
  | IntegrationProviderAuthenticationError;

export function isProviderAuthError(err: Error): err is ProviderAuthError {
  return (
    err instanceof IntegrationProviderAuthorizationError ||
    err instanceof IntegrationProviderAuthenticationError
  );
}
