import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import HomePage from '@/app/page';
import EventsPage from '@/app/events/page';
import BookingPage from '@/app/booking/page';
import AdminDashboard from '@/app/admin/page';

expect.extend(toHaveNoViolations);

describe('Accessibility Audit', () => {
  describe('Home Page', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<HomePage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Events Page', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<EventsPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Booking Page', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<BookingPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Admin Dashboard', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<AdminDashboard />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});