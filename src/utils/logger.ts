import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

declare global {
  // eslint-disable-next-line no-var
  var logger: pino.Logger;
}

// Assign to global so it can be used without importing everywhere
// @ts-ignore
global.logger = logger;

export default logger;
