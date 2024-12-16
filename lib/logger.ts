import { format, transports, createLogger } from "winston";

const logFormat = format.printf(function (info) {
  return `${info.timestamp}-${info.level}: ${info.message}`;
});

const logger = createLogger({
  transports: [
    new transports.Console({
      level: process.env.NODE_ENV === "development" ? "verbose" : "info",
      format: format.combine(format.timestamp(), format.colorize(), logFormat),
    }),
  ],
});

export default logger;
