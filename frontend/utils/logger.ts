import { Platform } from 'react-native';

class Logger {
  private static instance: Logger;
  private isDevelopment: boolean;

  private constructor() {
    this.isDevelopment = __DEV__;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `[${timestamp}] [${level}] ${message}`;
    if (data) {
      formattedMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
    }
    return formattedMessage;
  }

  public debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      const formattedMessage = this.formatMessage('DEBUG', message, data);
      if (Platform.OS === 'web') {
        console.debug(formattedMessage);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  public info(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('INFO', message, data);
    if (Platform.OS === 'web') {
      console.info(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  public warn(message: string, data?: any): void {
    const formattedMessage = this.formatMessage('WARN', message, data);
    if (Platform.OS === 'web') {
      console.warn(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }

  public error(message: string, error?: any): void {
    const formattedMessage = this.formatMessage('ERROR', message, error);
    if (Platform.OS === 'web') {
      console.error(formattedMessage);
    } else {
      console.log(formattedMessage);
    }
  }
}

export const logger = Logger.getInstance(); 