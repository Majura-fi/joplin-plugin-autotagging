import { ConsoleMessageHandler, LoggerBuilder, LoggerConfigurationBuilder, LogLevel } from 'simplr-logger';

const config = new LoggerConfigurationBuilder()
  .SetDefaultLogLevel(LogLevel.None)
  .AddWriteMessageHandler({Handler: new ConsoleMessageHandler()})
  .Build();

export const logger = new LoggerBuilder(config);
