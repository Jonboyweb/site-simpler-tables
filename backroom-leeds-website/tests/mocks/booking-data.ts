import { faker } from '@faker-js/faker';

export const mockBookingData = {
  ref: `BRL-${new Date().getFullYear()}-${faker.string.alphanumeric(6).toUpperCase()}`,
  table: faker.number.int({ min: 1, max: 16 }),
  time: faker.date.future().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  size: faker.number.int({ min: 1, max: 8 }),
  name: faker.person.fullName(),
  date: faker.date.future().toISOString().split('T')[0],
  email: faker.internet.email(),
  specialRequests: faker.lorem.sentence(),
};