import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applicationUpdateSchema,
  loginSchema,
  paginationSchema,
  paymentCreateSchema,
  paymentWebhookSchema,
  registerSchema,
} from '../src/validators';

const validRegistration = {
  email: ' Citizen@Example.com ',
  password: 'correct-horse-battery-staple',
  firstName: 'Asha',
  lastName: 'Rao',
  dateOfBirth: '1990-01-01',
  phone: '+91 98765 43210',
  address: '10 Market Road',
  city: 'New Delhi',
  state: 'Delhi',
  postalCode: '110001',
};

test('registration normalizes email and never accepts a caller-selected role', () => {
  const parsed = registerSchema.parse({ ...validRegistration, role: 'ADMIN' });
  assert.equal(parsed.email, 'citizen@example.com');
  assert.equal('role' in parsed, false);
});

test('login rejects malformed email and empty passwords', () => {
  assert.equal(loginSchema.safeParse({ email: 'not-an-email', password: '' }).success, false);
});

test('payment create ignores caller-supplied amount', () => {
  const parsed = paymentCreateSchema.parse({ applicationId: 'app_1', amount: 0.01 });
  assert.deepEqual(parsed, { applicationId: 'app_1' });
});

test('payment callbacks require the provider amount and currency', () => {
  assert.equal(paymentWebhookSchema.safeParse({ paymentId: 'pay_1', providerRef: 'ref_1', status: 'PAID', amount: 1500, currency: 'INR' }).success, true);
  assert.equal(paymentWebhookSchema.safeParse({ paymentId: 'pay_1', providerRef: 'ref_1', status: 'PAID', amount: -1, currency: 'INR' }).success, false);
});

test('empty application updates and oversized pagination are rejected', () => {
  assert.equal(applicationUpdateSchema.safeParse({}).success, false);
  assert.equal(paginationSchema.safeParse({ page: 1, pageSize: 101 }).success, false);
});
