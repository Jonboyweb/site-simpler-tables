import { setupServer } from 'msw/node';
import { handlers, errorHandlers } from './handlers';

export const server = setupServer(...handlers);
export const errorServer = setupServer(...errorHandlers);