import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import bookingHandler from '@/pages/api/bookings';
import { mockBookingData } from '../fixtures/table-booking';

describe('Bookings API', () => {
  it('creates a booking successfully', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: mockBookingData,
    });

    await bookingHandler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData())).toMatchObject({
      bookingId: expect.any(String),
      status: 'confirmed',
      depositAmount: 50,
    });
  });

  it('validates booking data', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        // Incomplete booking data
        customerDetails: { name: 'Incomplete' },
      },
    });

    await bookingHandler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'Invalid booking data',
    });
  });

  it('enforces table booking constraints', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      body: {
        ...mockBookingData,
        tableSelection: { tableId: 3 }, // Known unavailable table
      },
    });

    await bookingHandler(req, res);

    expect(res._getStatusCode()).toBe(409);
    expect(JSON.parse(res._getData())).toMatchObject({
      error: 'Table not available',
    });
  });
});