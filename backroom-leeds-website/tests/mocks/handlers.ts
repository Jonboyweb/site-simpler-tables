import { rest } from 'msw';

export const handlers = [
  // Super Admin API Mocks
  rest.get('/api/admin/users', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        users: [
          { 
            id: 'user1', 
            name: 'Super Admin User', 
            email: 'admin@backroomleeds.com', 
            role: 'super_admin' 
          }
        ]
      })
    )
  }),

  rest.post('/api/admin/users', (req, res, ctx) => {
    const { name, email, role } = req.body as any;
    return res(
      ctx.status(201),
      ctx.json({ 
        id: 'new-user', 
        name, 
        email, 
        role 
      })
    )
  }),

  // Manager API Mocks
  rest.get('/api/bookings/tonight', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        bookings: [
          {
            id: 'booking1',
            customerName: 'John Doe',
            tableNumber: 5,
            status: 'confirmed',
            time: '21:00'
          }
        ]
      })
    )
  }),

  // Door Staff API Mocks
  rest.post('/api/check-in', (req, res, ctx) => {
    const { bookingId } = req.body as any;
    return res(
      ctx.status(200),
      ctx.json({ 
        success: true, 
        message: 'Check-in successful', 
        bookingId 
      })
    )
  }),
];

export const errorHandlers = [
  rest.get('/api/admin/users', (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ message: 'Internal Server Error' })
    )
  }),
];