import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from '../utils/api-error';
import { createOpaqueToken, hashToken } from '../utils/crypto';

type Registration = {
  email: string; password: string; firstName: string; lastName: string; dateOfBirth: Date;
  phone: string; address: string; city: string; state: string; postalCode: string;
};

function signAccessToken(user: { id: string; role: string }) {
  return jwt.sign({ role: user.role }, env.JWT_ACCESS_SECRET, { subject: user.id, expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] });
}

function signRefreshToken(user: { id: string }) {
  return jwt.sign({ tokenType: 'refresh' }, env.JWT_REFRESH_SECRET, { subject: user.id, expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` });
}

async function persistRefreshToken(userId: string, token: string) {
  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
}

function tokenPair(user: { id: string; role: string }) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

export async function register(input: Registration) {
  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: 'APPLICANT',
      applicant: { create: {
        firstName: input.firstName, lastName: input.lastName, dateOfBirth: input.dateOfBirth,
        phone: input.phone, address: input.address, city: input.city, state: input.state, postalCode: input.postalCode,
      } },
    },
    select: { id: true, email: true, role: true, applicant: true },
  });
  const tokens = tokenPair(user);
  await persistRefreshToken(user.id, tokens.refreshToken);
  return { user, ...tokens };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email }, include: { applicant: true } });
  if (!user || !user.isActive || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new ApiError(401, 'Email or password is incorrect.');
  }
  const tokens = tokenPair(user);
  await persistRefreshToken(user.id, tokens.refreshToken);
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return { user: safeUser, ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  } catch {
    throw new ApiError(401, 'Refresh token is invalid or expired.');
  }
  if (typeof payload.sub !== 'string' || payload.tokenType !== 'refresh') throw new ApiError(401, 'Refresh token is invalid.');

  const oldHash = hashToken(refreshToken);
  const nextTokens = await prisma.$transaction(async (transaction) => {
    const stored = await transaction.refreshToken.findFirst({
      where: { tokenHash: oldHash, userId: payload.sub, revokedAt: null, expiresAt: { gt: new Date() }, user: { isActive: true } },
      include: { user: { select: { id: true, role: true } } },
    });
    if (!stored) throw new ApiError(401, 'Refresh token has been revoked.');
    const consumed = await transaction.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null, expiresAt: { gt: new Date() } },
      data: { revokedAt: new Date() },
    });
    if (consumed.count !== 1) throw new ApiError(401, 'Refresh token has already been used.');
    const accessToken = signAccessToken(stored.user);
    const newRefreshToken = signRefreshToken(stored.user);
    await transaction.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: hashToken(newRefreshToken),
        expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });
    return { accessToken, refreshToken: newRefreshToken };
  });
  return nextTokens;
}

export async function logout(refreshToken: string) {
  await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

async function sendResetEmail(email: string, token: string) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || !env.PASSWORD_RESET_URL) return;
  const resetUrl = new URL(env.PASSWORD_RESET_URL);
  resetUrl.searchParams.set('token', token);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.MAIL_FROM,
      to: [email],
      subject: 'Reset your PAMS password',
      html: `<p>Use this link to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl.toString()}">Reset password</a></p>`,
    }),
  });
  if (!response.ok) throw new ApiError(502, 'Password reset email could not be sent.');
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email, isActive: true }, select: { id: true, email: true } });
  if (!user) return;

  const token = createOpaqueToken();
  await prisma.$transaction([
    prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
    }),
  ]);

  try {
    await sendResetEmail(user.email, token);
  } catch (error) {
    console.error('Password reset delivery failed:', error instanceof Error ? error.message : 'Unknown delivery error');
  }
  if (env.NODE_ENV !== 'production') console.info(`Development password reset token for ${user.email}: ${token}`);
}

export async function resetPassword(token: string, password: string) {
  const tokenHash = hashToken(token);
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction(async (transaction) => {
    const reset = await transaction.passwordReset.findFirst({
      where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userId: true },
    });
    if (!reset) throw new ApiError(400, 'Password reset token is invalid or expired.');
    await transaction.user.update({ where: { id: reset.userId }, data: { passwordHash } });
    await transaction.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } });
    await transaction.refreshToken.updateMany({ where: { userId: reset.userId, revokedAt: null }, data: { revokedAt: new Date() } });
  });
}