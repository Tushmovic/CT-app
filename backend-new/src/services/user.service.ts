import { AppDataSource } from '../config/database';
import { User } from '../models/user.model';
import { UserRole, UserStatus } from '../types';
import { AuthService } from './auth.service';
import { Like } from 'typeorm';

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private authService = new AuthService();

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }

  async findByJerseyNumber(jerseyNumber: string): Promise<User | null> {
    return this.userRepository.findOneBy({ jerseyNumber });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userRepository.update(id, { lastLogin: new Date() });
  }

  async getPendingUsers(): Promise<User[]> {
    return this.userRepository.find({
      where: { status: UserStatus.PENDING },
      order: { registrationDate: 'DESC' }
    });
  }

  async getActiveClients(): Promise<User[]> {
    return this.userRepository.find({
      where: { 
        role: UserRole.CLIENT,
        status: UserStatus.APPROVED 
      },
      order: { name: 'ASC' }
    });
  }

  async getAllUsers(searchTerm?: string): Promise<User[]> {
    const where: any = {};
    
    if (searchTerm) {
      where.name = Like(`%${searchTerm}%`);
    }

    return this.userRepository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  async approveUser(userId: string, jerseyNumber: string, password: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const passwordHash = await this.authService.hashPassword(password);

    user.status = UserStatus.APPROVED;
    user.jerseyNumber = jerseyNumber;
    user.passwordHash = passwordHash;
    user.isFirstLogin = true;

    return this.userRepository.save(user);
  }

  async rejectUser(userId: string): Promise<void> {
    await this.userRepository.update(userId, { status: UserStatus.REJECTED });
  }

  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await this.authService.hashPassword(newPassword);
    await this.userRepository.update(userId, { 
      passwordHash,
      isFirstLogin: true 
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await this.authService.validatePassword(oldPassword, user.passwordHash);
    if (!isValid) {
      return false;
    }

    const passwordHash = await this.authService.hashPassword(newPassword);
    user.passwordHash = passwordHash;
    user.isFirstLogin = false;
    
    await this.userRepository.save(user);
    return true;
  }
}