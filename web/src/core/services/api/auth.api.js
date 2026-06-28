import { api } from './client.api.js';

export const sendOtp = async (phone) => {
    const response = await api.post('/auth/send-otp', { phone });
    return response.data;
};

export const verifyOtp = async (phone, otp) => {
    const response = await api.post('/auth/verify-otp', { phone, otp });
    return response.data;
};

export const getDevOtpMetadata = async (phone) => {
    const response = await api.get(`/auth/dev-otp-metadata/${phone}`);
    return response.data;
};
