/**
 * API Logger Utility
 * Centralized logging for API requests, responses, and errors.
 * Logs are only active in development mode (__DEV__).
 */

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

/**
 * Maps HTTP status codes to readable labels
 */
const getStatusLabel = (status) => {
    const labels = {
        200: 'SUCCESS',
        201: 'CREATED',
        204: 'NO CONTENT',
        400: 'BAD REQUEST',
        401: 'UNAUTHORIZED',
        403: 'FORBIDDEN',
        404: 'NOT FOUND',
        500: 'SERVER ERROR',
        502: 'BAD GATEWAY',
        503: 'SERVICE UNAVAILABLE',
    };
    return labels[status] || 'UNKNOWN';
};

/**
 * Masks sensitive headers like Authorization
 */
const maskHeaders = (headers) => {
    if (!headers) return null;
    const masked = { ...headers };
    if (masked.Authorization) {
        masked.Authorization = 'Bearer **********' + masked.Authorization.slice(-4);
    }
    if (masked.authorization) {
        masked.authorization = 'Bearer **********' + masked.authorization.slice(-4);
    }
    return masked;
};

/**
 * Limits data output for large arrays or objects to keep terminal clean
 */
const formatDataPreview = (data) => {
    if (Array.isArray(data) && data.length > 5) {
        return [
            ...data.slice(0, 5),
            `... and ${data.length - 5} more items (omitted for readability)`
        ];
    }
    return data;
};

/**
 * Logs the start of an API request.
 * @param {string} method - HTTP method
 * @param {string} url - Full URL
 * @param {any} body - Request body
 * @param {any} headers - Request headers
 * @returns {number | null} - Start timestamp
 */
export const logRequest = (method, url, body = null, headers = null) => {
    if (!isDev) return null;

    const startTime = Date.now();
    const time = new Date().toLocaleTimeString();
    const safeHeaders = maskHeaders(headers);

    console.log(`\n%c🚀 API REQUEST: ${method} ${url}`, 'color: #2196F3; font-weight: bold;');
    /*
    console.groupCollapsed(
        `%c==============================\n🚀 API REQUEST\n==============`,
        'color: #2196F3; font-weight: bold;'
    );
    */
    console.log(`Method:  %c${method}`, 'font-weight: bold;');
    console.log(`URL:     %c${url}`, 'color: #2196F3;');
    console.log(`⏱️ Time:   ${time}`);
    
    if (safeHeaders) {
        console.log('Headers:', JSON.stringify(safeHeaders, null, 2));
    }
    
    if (body) {
        console.log('Body:');
        console.log(typeof body === 'string' ? JSON.parse(body) : body);
    }
    
    console.groupEnd();
    return startTime;
};

/**
 * Logs a successful API response.
 */
export const logResponse = (method, url, data, startTime, status = 200) => {
    if (!isDev) return;

    const endTime = Date.now();
    const duration = startTime ? `${endTime - startTime}ms` : 'N/A';
    const time = new Date().toLocaleTimeString();
    const statusLabel = getStatusLabel(status);
    const previewData = formatDataPreview(data);

    console.log(`%c📦 API RESPONSE: ${status} ${statusLabel} (${duration})`, 'color: #4CAF50; font-weight: bold;');
    /*
    console.groupCollapsed(
        `%c## 📦 RESPONSE\n==============`,
        'color: #4CAF50; font-weight: bold;'
    );
    */
    console.log(`Status:  %c${status} ${statusLabel}`, 'color: #4CAF50; font-weight: bold;');
    console.log(`Method:  ${method}`);
    console.log(`URL:     ${url}`);
    console.log(`⏱️ Time:   ${time}`);
    console.log(`⏱️ Duration: ${duration}`);
    console.log(`Data:`);
    console.log(JSON.stringify(previewData, null, 2));
    console.log(`%c==============================`, 'color: #4CAF50; font-weight: bold;');
    console.groupEnd();
};

/**
 * Logs an API error.
 */
export const logError = (method, url, error, startTime, status = null) => {
    if (!isDev) return;

    const endTime = Date.now();
    const duration = startTime ? `${endTime - startTime}ms` : 'N/A';
    const time = new Date().toLocaleTimeString();
    const statusLabel = status ? getStatusLabel(status) : 'FAILED';

    console.log(`%c❌ API ERROR: ${status || '---'} ${statusLabel} (${duration})`, 'color: #F44336; font-weight: bold;');
    /*
    console.groupCollapsed(
        `%c==============================\n❌ API ERROR\n===========`,
        'color: #F44336; font-weight: bold;'
    );
    */
    console.log(`Status:  %c${status || '---'} ${statusLabel}`, 'color: #F44336; font-weight: bold;');
    console.log(`Method:  %c${method}`, 'font-weight: bold;');
    console.log(`URL:     %c${url}`, 'color: #F44336;');
    console.log(`Error:   %c${error.message || error}`, 'color: #F44336; font-weight: bold;');
    
    if (error.response) {
        console.log('Error Data:', JSON.stringify(formatDataPreview(error.response), null, 2));
    }

    console.log(`⏱️ Time:   ${time}`);
    console.log(`⏱️ Duration: ${duration}`);
    console.log(`%c==============================`, 'color: #F44336; font-weight: bold;');
    console.groupEnd();
};
