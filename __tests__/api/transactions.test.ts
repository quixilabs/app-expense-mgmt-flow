import { createMocks } from 'node-mocks-http';
import transactionsHandler from '../../pages/api/transactions';
import { supabaseAdmin } from '../../lib/supabase-admin';

jest.mock('@clerk/nextjs/server', () => ({
  getAuth: jest.fn(() => ({ userId: 'test-user-id' })),
}));

jest.mock('../../lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
  },
}));

describe('/api/transactions', () => {
  it('returns user-specific transactions', async () => {
    const { req, res } = createMocks({
      method: 'GET',
    });

    const mockTransactions = [{ id: 1, description: 'Test Transaction', amount: 100 }];
    (supabaseAdmin.from().select().eq as jest.Mock).mockResolvedValue({ data: mockTransactions, error: null });

    await transactionsHandler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(mockTransactions);
    expect(supabaseAdmin.from).toHaveBeenCalledWith('transactions');
    expect(supabaseAdmin.from().select().eq).toHaveBeenCalledWith('user_id', 'test-user-id');
  });
});
