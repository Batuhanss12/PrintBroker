import {
  users,
  quotes,
  printerQuotes,
  orders,
  ratings,
  files,
  chatRooms,
  chatMessages,
  contracts,
  type User,
  type UpsertUser,
  type InsertQuote,
  type Quote,
  type InsertPrinterQuote,
  type PrinterQuote,
  type InsertOrder,
  type Order,
  type InsertRating,
  type Rating,
  type InsertFile,
  type File,
  type InsertChatRoom,
  type ChatRoom,
  type InsertChatMessage,
  type ChatMessage,
  type InsertContract,
  type Contract,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<void>;
  updateUserCreditBalance(id: string, newBalance: string): Promise<void>;
  updateUserSubscription(id: string, status: string): Promise<void>;

  // Quote operations
  createQuote(quote: InsertQuote): Promise<Quote>;
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByCustomer(customerId: string): Promise<Quote[]>;
  getQuotesForPrinter(): Promise<Quote[]>;
  updateQuoteStatus(id: string, status: string): Promise<void>;

  // Printer quote operations
  createPrinterQuote(printerQuote: InsertPrinterQuote): Promise<PrinterQuote>;
  getPrinterQuotesByQuote(quoteId: string): Promise<PrinterQuote[]>;
  getPrinterQuotesByPrinter(printerId: string): Promise<PrinterQuote[]>;

  // Order operations
  createOrder(order: InsertOrder): Promise<Order>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByPrinter(printerId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updatePrinterRating(printerId: string): Promise<void>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: string, data: Partial<File>): Promise<File>;
  getFilesByQuote(quoteId: string): Promise<File[]>;
  getFilesByUser(userId: string): Promise<File[]>;
  getDesign(id: string): Promise<File | undefined>;

  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserStats(): Promise<any>;
  getRecentActivity(): Promise<any[]>;

  // Design operations
  saveDesignGeneration(data: {
    userId: string;
    prompt: string;
    options: any;
    result: any;
    createdAt: Date;
  }): Promise<any>; // Replace any with a more specific type

  getDesignHistory(userId: string, options: { page: number; limit: number }): Promise<{
    designs: any[]; // Replace any with a more specific type
    total: number;
    page: number;
    totalPages: number;
  }>;

  getDesignTemplates(): Promise<any[]>; // Replace any with a more specific type

  // Chat operations
  createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom>;
  getChatRoom(id: string): Promise<ChatRoom | undefined>;
  getChatRoomByQuote(quoteId: string, customerId: string, printerId: string): Promise<ChatRoom | undefined>;
  getChatRoomsByUser(userId: string): Promise<ChatRoom[]>;

  sendMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getMessages(roomId: string, limit?: number): Promise<ChatMessage[]>;
  markMessagesAsRead(roomId: string, userId: string): Promise<void>;
  getUnreadMessageCount(userId: string): Promise<number>;

  // Contract operations
  createContract(contract: InsertContract): Promise<Contract>;
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByCustomer(customerId: string): Promise<Contract[]>;
  getContractsByPrinter(printerId: string): Promise<Contract[]>;
  updateContractStatus(id: string, status: string): Promise<void>;
  signContract(id: string, userId: string, signature: string): Promise<void>;

  createUser(userData: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ 
        role: role as any,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserCreditBalance(userId: string, newBalance: string): Promise<void> {
    await db.update(users)
      .set({ 
        creditBalance: newBalance,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserSubscription(userId: string, status: 'active' | 'inactive' | 'suspended'): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    await db.update(users)
      .set({ 
        subscriptionStatus: status,
        subscriptionExpiresAt: expiresAt,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  // Quote operations
  async createQuote(quote: InsertQuote): Promise<Quote> {
    const [newQuote] = await db.insert(quotes).values(quote).returning();
    return newQuote;
  }

  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await db.select().from(quotes).where(eq(quotes.id, id));
    return quote;
  }

  async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.customerId, customerId))
      .orderBy(desc(quotes.createdAt));
  }

  async getQuotesForPrinter(): Promise<Quote[]> {
    return await db
      .select()
      .from(quotes)
      .where(eq(quotes.status, "pending"))
      .orderBy(desc(quotes.createdAt));
  }

  async updateQuoteStatus(id: string, status: string): Promise<void> {
    await db
      .update(quotes)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(quotes.id, id));
  }

  // Printer quote operations
  async createPrinterQuote(printerQuote: InsertPrinterQuote): Promise<PrinterQuote> {
    const [newPrinterQuote] = await db.insert(printerQuotes).values(printerQuote).returning();
    return newPrinterQuote;
  }

  async getPrinterQuotesByQuote(quoteId: string): Promise<PrinterQuote[]> {
    return await db
      .select()
      .from(printerQuotes)
      .where(eq(printerQuotes.quoteId, quoteId))
      .orderBy(desc(printerQuotes.createdAt));
  }

  async getPrinterQuotesByPrinter(printerId: string): Promise<PrinterQuote[]> {
    return await db
      .select()
      .from(printerQuotes)
      .where(eq(printerQuotes.printerId, printerId))
      .orderBy(desc(printerQuotes.createdAt));
  }

  // Order operations
  async createOrder(order: InsertOrder): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    return newOrder;
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id));
    return order;
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, customerId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrdersByPrinter(printerId: string): Promise<Order[]> {
    return await db
      .select()
      .from(orders)
      .where(eq(orders.printerId, printerId))
      .orderBy(desc(orders.createdAt));
  }

  async updateOrderStatus(id: string, status: string): Promise<void> {
    await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id));
  }

  // Rating operations
  async createRating(rating: InsertRating): Promise<Rating> {
    const [newRating] = await db.insert(ratings).values(rating).returning();
    await this.updatePrinterRating(rating.printerId);
    return newRating;
  }

  async updatePrinterRating(printerId: string): Promise<void> {
    const [result] = await db
      .select({
        avgRating: sql<number>`avg(${ratings.rating})`,
        totalRatings: sql<number>`count(${ratings.rating})`,
      })
      .from(ratings)
      .where(eq(ratings.printerId, printerId));

    if (result) {
      await db
        .update(users)
        .set({
          rating: result.avgRating.toString(),
          totalRatings: result.totalRatings,
          updatedAt: new Date(),
        })
        .where(eq(users.id, printerId));
    }
  }

  // File operations
  async createFile(file: InsertFile): Promise<File> {
    const [newFile] = await db.insert(files).values(file).returning();
    return newFile;
  }

  async updateFile(id: string, data: Partial<File>): Promise<File> {
    const [updatedFile] = await db
      .update(files)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(files.id, id))
      .returning();
    return updatedFile;
  }

  async getFilesByQuote(quoteId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.quoteId, quoteId))
      .orderBy(desc(files.createdAt));
  }

  async getFilesByUser(userId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.uploadedBy, userId))
      .orderBy(desc(files.createdAt));
  }

  async getFileById(id: string): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file;
  }

  async getDesign(id: string): Promise<File | undefined> {
    const [design] = await db.select().from(files).where(eq(files.id, id));
    return design;
  }

  async deleteFile(id: string): Promise<void> {
    await db.delete(files).where(eq(files.id, id));
  }

  async deleteFilesByUserAndType(userId: string, fileType: string): Promise<number> {
    const result = await db
      .delete(files)
      .where(
        sql`${files.uploadedBy} = ${userId} AND ${files.fileType} = ${fileType}`
      )
      .returning({ id: files.id });
    return result.length;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUserStats(): Promise<any> {
    const [customerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "customer"));

    const [printerCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.role, "printer"));

    const [quoteCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(quotes);

    const [orderCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders);

    return {
      customers: customerCount?.count || 0,
      printers: printerCount?.count || 0,
      quotes: quoteCount?.count || 0,
      orders: orderCount?.count || 0,
    };
  }

  async getRecentActivity(): Promise<any[]> {
    const recentQuotes = await db
      .select({
        id: quotes.id,
        type: sql<string>`'quote'`,
        description: quotes.title,
        createdAt: quotes.createdAt,
      })
      .from(quotes)
      .orderBy(desc(quotes.createdAt))
      .limit(5);

    const recentOrders = await db
      .select({
        id: orders.id,
        type: sql<string>`'order'`,
        description: sql<string>`'Order ' || ${orders.id}`,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .orderBy(desc(orders.createdAt))
      .limit(5);

    return [...recentQuotes, ...recentOrders]
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);
  }

  async saveDesignGeneration(data: {
    userId: string;
    prompt: string;
    options: any;
    result: any;
    createdAt: Date;
  }) {
    // Since we don't have a designs table, we'll store in a JSON file or memory
    // In production, you'd want to create a proper database table
    const designHistory = this.getStoredDesigns();
    const newDesign = {
      id: crypto.randomUUID(),
      ...data
    };
    designHistory.push(newDesign);
    this.storeDesigns(designHistory);
    return newDesign;
  }

  async getDesignHistory(userId: string, options: { page: number; limit: number }) {
    const designHistory = this.getStoredDesigns();
    const userDesigns = designHistory
      .filter(design => design.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const start = (options.page - 1) * options.limit;
    const end = start + options.limit;

    return {
      designs: userDesigns.slice(start, end),
      total: userDesigns.length,
      page: options.page,
      totalPages: Math.ceil(userDesigns.length / options.limit)
    };
  }

  async getDesignTemplates() {
    return [
      {
        id: '1',
        name: 'Logo Tasarımı',
        prompt: 'Modern ve minimal logo tasarımı, {company_name} için profesyonel görünüm',
        category: 'logo',
        thumbnail: '/api/files/template-logo.jpg'
      },
      {
        id: '2',
        name: 'Etiket Tasarımı',
        prompt: 'Ürün etiketi tasarımı, {product_name} için çekici ve bilgilendirici',
        category: 'label',
        thumbnail: '/api/files/template-label.jpg'
      },
      {
        id: '3',
        name: 'Kartvizit Tasarımı',
        prompt: 'Profesyonel kartvizit tasarımı, {company_name} için kurumsal kimlik',
        category: 'business_card',
        thumbnail: '/api/files/template-card.jpg'
      },
      {
        id: '4',
        name: 'Broşür Kapağı',
        prompt: 'Çekici broşür kapağı tasarımı, {service_name} için pazarlama materyali',
        category: 'brochure',
        thumbnail: '/api/files/template-brochure.jpg'
      },
      {
        id: '5',
        name: 'Poster Tasarımı',
        prompt: 'Etkileyici poster tasarımı, {event_name} için göz alıcı reklam',
        category: 'poster',
        thumbnail: '/api/files/template-poster.jpg'
      }
    ];
  }

  private getStoredDesigns(): any[] {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'design-history.json');
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
      return [];
    } catch {
      return [];
    }
  }

  private storeDesigns(designs: any[]) {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(process.cwd(), 'design-history.json');
      fs.writeFileSync(filePath, JSON.stringify(designs, null, 2));
    } catch (error) {
      console.error('Error storing designs:', error);
    }
  }

  // Chat operations
  async createChatRoom(chatRoom: InsertChatRoom): Promise<ChatRoom> {
    const [room] = await db
      .insert(chatRooms)
      .values(chatRoom)
      .returning();
    return room;
  }

  async getChatRoom(id: string): Promise<ChatRoom | undefined> {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(eq(chatRooms.id, id));
    return room;
  }

  async getChatRoomByQuote(quoteId: string, customerId: string, printerId: string): Promise<ChatRoom | undefined> {
    const [room] = await db
      .select()
      .from(chatRooms)
      .where(
        and(
          eq(chatRooms.quoteId, quoteId),
          eq(chatRooms.customerId, customerId),
          eq(chatRooms.printerId, printerId)
        )
      );
    return room;
  }

  async getChatRoomsByUser(userId: string): Promise<ChatRoom[]> {
    const rooms = await db
      .select()
      .from(chatRooms)
      .where(
        or(
          eq(chatRooms.customerId, userId),
          eq(chatRooms.printerId, userId)
        )
      )
      .orderBy(desc(chatRooms.lastMessageAt));
    return rooms;
  }

  async sendMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();

    // Update room's last message timestamp
    await db
      .update(chatRooms)
      .set({ 
        lastMessageAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(chatRooms.id, message.roomId));

    return newMessage;
  }

  async getMessages(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.roomId, roomId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(limit);

    return messages.reverse(); // Return in chronological order
  }

  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    await db
      .update(chatMessages)
      .set({ isRead: true })
      .where(
        and(
          eq(chatMessages.roomId, roomId),
          sql`${chatMessages.senderId} != ${userId}`,
          eq(chatMessages.isRead, false)
        )
      );
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    const userRooms = await db
      .select({ id: chatRooms.id })
      .from(chatRooms)
      .where(
        or(
          eq(chatRooms.customerId, userId),
          eq(chatRooms.printerId, userId)
        )
      );

    const roomIds = userRooms.map(room => room.id);

    if (roomIds.length === 0) return 0;

    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          sql`${chatMessages.roomId} = ANY(${roomIds})`,
          sql`${chatMessages.senderId} != ${userId}`,
          eq(chatMessages.isRead, false)
        )
      );

    return result?.count || 0;
  }

  // Contract operations
  async createContract(contract: InsertContract): Promise<Contract> {
    const [newContract] = await db.insert(contracts).values(contract).returning();
    return newContract;
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id));
    return contract;
  }

  async getContractsByCustomer(customerId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.customerId, customerId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractsByPrinter(printerId: string): Promise<Contract[]> {
    return await db
      .select()
      .from(contracts)
      .where(eq(contracts.printerId, printerId))
      .orderBy(desc(contracts.createdAt));
  }

  async updateContractStatus(id: string, status: string): Promise<void> {
    await db
      .update(contracts)
      .set({ 
        status: status as any,
        updatedAt: new Date()
      })
      .where(eq(contracts.id, id));
  }

  async updateContract(id: string, updateData: Partial<Contract>): Promise<void> {
    await db
      .update(contracts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(contracts.id, id));
  }

  async signContract(id: string, userId: string, signature: string): Promise<void> {
    const contract = await this.getContract(id);
    if (!contract) return;

    const updateData: any = { updatedAt: new Date() };

    if (contract.customerId === userId) {
      updateData.customerSignature = signature;
      updateData.customerSignedAt = new Date();
      if (contract.printerSignedAt) {
        updateData.status = 'fully_approved';
      } else {
        updateData.status = 'customer_approved';
      }
    } else if (contract.printerId === userId) {
      updateData.printerSignature = signature;
      updateData.printerSignedAt = new Date();
      if (contract.customerSignedAt) {
        updateData.status = 'fully_approved';
      } else {
        updateData.status = 'printer_approved';
      }
    }

    await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id));
  }

  async createUser(userData: InsertUser): Promise<User> {
    try {
      console.log("Inserting user data to database:", userData);
      const [newUser] = await db.insert(users).values(userData).returning();
      console.log("User inserted successfully:", newUser);
      return newUser;
    } catch (error) {
      console.error("Database insert error:", error);
      throw new Error(`Kullanıcı oluşturma hatası: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
    }
  }
}

export const storage = new DatabaseStorage();