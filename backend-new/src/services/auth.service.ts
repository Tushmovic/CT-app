import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redisClient } from '../config/redis';
import { User } from '../models/user.model';
import { JwtPayload, UserRole } from '../types';
import { AppDataSource } from '../config/database';

export class AuthService {
  private readonly SALT_ROUNDS = 10;
  private readonly userRepository = AppDataSource.getRepository(User);

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = { userId: user.id, role: user.role };
    
    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
      { expiresIn: '7d' }
    );

    // Store refresh token in Redis
    await redisClient.setex(
      `refresh:${user.id}`,
      7 * 24 * 60 * 60, // 7 days in seconds
      refreshToken
    );

    return { accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const decoded = jwt.verify(
        refreshToken, 
        process.env.JWT_REFRESH_SECRET || 'default-refresh-secret'
      ) as { userId: string };
      
      const storedToken = await redisClient.get(`refresh:${decoded.userId}`);
      
      if (storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }

      const user = await this.userRepository.findOneBy({ id: decoded.userId });
      if (!user) {
        throw new Error('User not found');
      }

      const payload: JwtPayload = { userId: user.id, role: user.role };
      
      return jwt.sign(
        payload,
        process.env.JWT_SECRET || 'default-secret',
        { expiresIn: '15m' }
      );
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async revokeTokens(userId: string): Promise<void> {
    await redisClient.del(`refresh:${userId}`);
  }

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = jwt.verify(
        token, 
        process.env.JWT_SECRET || 'default-secret'
      ) as JwtPayload;
      
      // Check if user still exists and is active
      const user = await this.userRepository.findOneBy({ id: decoded.userId });
      if (!user || user.status !== 'APPROVED') {
        throw new Error('User not found or inactive');
      }
      
      return decoded;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}