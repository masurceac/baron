import { factoryGetter } from './factory';

export const getAuth = () => {
  const result = factoryGetter('auth');
  if (!result) {
    throw new Error('Auth not found');
  }
  return result;
};
export const getOptionalAuth = () => {
  const result = factoryGetter('auth');

  return result;
};
export const getClerkClient = () => factoryGetter('clerkClient');
export const getRecaptchaSecretKey = () => factoryGetter('recaptchaSecretKey');
export const getRequest = () => factoryGetter('request');
export const getDatabase = () => factoryGetter('db');
