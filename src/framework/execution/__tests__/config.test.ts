import { loadConfigFromEnvironmentVariables } from '../config';
import { IntegrationInstanceConfigFieldMap } from '../types/config';

beforeEach(() => {
  process.env.STRING_VARIABLE = 'string';
  process.env.BOOLEAN_VARIABLE = 'true';
});

afterEach(() => {
  delete process.env.STRING_VARIABLE;
  delete process.env.BOOLEAN_VARIABLE;
});

test('loads config fields from environment variables', () => {
  const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
    stringVariable: {
      type: 'string',
    },
    booleanVariable: {
      type: 'boolean',
    },
  };

  const config = loadConfigFromEnvironmentVariables(instanceConfigFields);

  expect(config).toEqual({
    stringVariable: 'string',
    booleanVariable: true,
  });
});

test('throws error if expected environment is not set for config field', () => {
  const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
    mySuperAwesomeEnvironmentVariable: {
      type: 'string',
    },
  };

  expect(() =>
    loadConfigFromEnvironmentVariables(instanceConfigFields),
  ).toThrow(
    'Expected environment variable "MY_SUPER_AWESOME_ENVIRONMENT_VARIABLE" for config field "mySuperAwesomeEnvironmentVariable" to be set.',
  );
});

test('throws error if expected environment boolean field does not match "true" or "false"', () => {
  process.env.BOOLEAN_VARIABLE = 'mochi';
  const instanceConfigFields: IntegrationInstanceConfigFieldMap = {
    booleanVariable: {
      type: 'boolean',
    },
  };

  expect(() =>
    loadConfigFromEnvironmentVariables(instanceConfigFields),
  ).toThrow(
    'Expected boolean value for field "booleanVariable" but received "mochi".',
  );
});
