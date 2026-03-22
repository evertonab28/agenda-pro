import { route as betterRoute } from '../utils/route';

export const route = (name: string, params?: any) => {
  return betterRoute(name, params);
};
