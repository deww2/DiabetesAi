import Constants from 'expo-constants';
import { logger } from './utils/logger';

const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest?.debuggerHost;
const backendUrl = debuggerHost.split(":")[0];

const API_URL = `http://${backendUrl}:5000/api`;
logger.info('Backend URL set', { backendUrl, API_URL });

export default API_URL;
