import {logger} from "firebase-functions";
import {LogEntry, LogSeverity} from "firebase-functions/logger";

const formatError = (error: Error): Record<string, any> => {
    return {
        ...error,
        message: error.message,
        stack: error.stack
    };
};

const formatData = (payload?: object) => {
    let formattedInfo: Record<string, any> | null = {};
    let formattedError: Record<string, any> | null = {};

    if (payload) {
        for (const [key, value] of Object.entries(payload)) {
            if (value instanceof Error) {
                formattedError = formatError(value);
            } else if (typeof value === 'object' && value !== null) {
                formattedInfo[key] = {...value};
            } else {
                formattedInfo[key] = value;
            }
        }
    }

    formattedInfo = Object.keys(formattedInfo).length ? formattedInfo : null;
    formattedError = Object.keys(formattedError).length ? formattedError : null;

    return {formattedInfo, formattedError};
};

const log = (severity: LogSeverity, message: string, data?: any) => {
    const {formattedInfo, formattedError} = formatData(data);

    const entry: LogEntry = {
        severity,
        message,
        ...(formattedInfo && {info: formattedInfo}),
        ...(formattedError && {error: formattedError}),
    };

    // 'logger.error()' and 'logger.info()' has inconsistent of parsing of jsonPayload, that's why I'm using 'logger.write()' instead.
    logger.write(entry);
};

export const logInfo = (message: string, data?: object) => log('INFO', message, data);
export const logWarning = (message: string, data?: object) => log('WARNING', message, data);
export const logError = (message: string, data?: object) => log('ERROR', message, data);