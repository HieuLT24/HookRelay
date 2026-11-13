import { ACCESS_TOKEN_KEY } from '../../config/env';

export const getAccessToken = () => sessionStorage.getItem(ACCESS_TOKEN_KEY);
export const saveAccessToken = (token) => sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
export const clearAccessToken = () => sessionStorage.removeItem(ACCESS_TOKEN_KEY);
