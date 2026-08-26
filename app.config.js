const { validateQaEnvironment } = require('./scripts/qa-env');

module.exports = ({ config }) => {
  const isQa =
    process.env.EXPO_PUBLIC_QA_MODE === 'true' ||
    process.env.EAS_BUILD_PROFILE === 'qa';

  if (isQa) {
    validateQaEnvironment(process.env, {
      localEnvFilePath: '.env.qa.local',
    });
  }

  return config;
};
