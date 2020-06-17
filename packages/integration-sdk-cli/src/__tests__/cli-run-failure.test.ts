const mockCreateIntegrationLogger = jest.fn();

jest.doMock('@jupiterone/integration-sdk-runtime', () => ({
  ...(jest.requireActual('@jupiterone/integration-sdk-runtime') as any),
  createIntegrationLogger: mockCreateIntegrationLogger,
}));

import { mocked } from 'ts-jest/utils';
import { Polly } from '@pollyjs/core';
import NodeHttpAdapter from '@pollyjs/adapter-node-http';
import FSPersister from '@pollyjs/persister-fs';
import jwt from 'jsonwebtoken';

import { loadProjectStructure } from '@jupiterone/integration-sdk-private-test-utils';
import { SynchronizationJobStatus } from '@jupiterone/integration-sdk-core';

import { generateSynchronizationJob } from './util/synchronization';

import { createCli } from '../index';

import { setupSynchronizerApi } from './util/synchronization';

import * as log from '../log';

jest.mock('../log');

Polly.register(NodeHttpAdapter);
Polly.register(FSPersister);

const { createIntegrationLogger } = jest.requireActual(
  '@jupiterone/integration-sdk-runtime',
);

let polly: Polly;

beforeEach(() => {
  process.env.JUPITERONE_API_KEY = jwt.sign({ account: 'mochi' }, 'test');
  loadProjectStructure('validationFailure');

  polly = new Polly('run-cli-failure', {
    adapters: ['node-http'],
    persister: 'fs',
    logging: false,
    matchRequestsBy: {
      headers: false,
    },
  });

  mocked(mockCreateIntegrationLogger).mockReturnValue(
    createIntegrationLogger({ name: 'test' }),
  );

  jest.spyOn(process, 'exit').mockImplementation((code: number | undefined) => {
    throw new Error(`Process exited with code ${code}`);
  });
});

afterEach(() => {
  polly.disconnect();
});

test('aborts synchronization job if an error occurs', async () => {
  const job = generateSynchronizationJob();

  setupSynchronizerApi({ polly, job, baseUrl: 'https://api.us.jupiterone.io' });

  await createCli().parseAsync([
    'node',
    'j1-integration',
    'run',
    '--integrationInstanceId',
    'test',
  ]);

  expect(log.displaySynchronizationResults).toHaveBeenCalledTimes(1);
  expect(log.displaySynchronizationResults).toHaveBeenCalledWith({
    ...job,
    status: SynchronizationJobStatus.ABORTED,
  });
});

test('does not log errors that have been previously logged', async () => {
  const job = generateSynchronizationJob();

  setupSynchronizerApi({ polly, job, baseUrl: 'https://api.us.jupiterone.io' });

  const logger = createIntegrationLogger({ name: 'test' });

  const isHandledErrorSpy = jest.spyOn(logger, 'isHandledError');
  const validationFailureSpy = jest.spyOn(logger, 'validationFailure');
  const errorSpy = jest.spyOn(logger, 'error');

  jest.spyOn(logger, 'child').mockReturnValue(logger);

  mocked(mockCreateIntegrationLogger).mockReturnValue(logger);

  await createCli().parseAsync([
    'node',
    'j1-integration',
    'run',
    '--integrationInstanceId',
    'test',
  ]);

  expect(validationFailureSpy).toHaveBeenCalledTimes(1);

  const loggedError = validationFailureSpy.mock.calls[0][0];

  expect(isHandledErrorSpy).toHaveBeenCalledTimes(1);
  expect(isHandledErrorSpy).toHaveBeenCalledWith(loggedError);
  expect(isHandledErrorSpy).toHaveReturnedWith(true);

  expect(errorSpy).toHaveBeenCalledTimes(1);
});
