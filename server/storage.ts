import {
  users,
  quotes,
  printerQuotes,
  orders,
  ratings,
  files,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserRole(id: string, role: string): Promise<void>;

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
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByPrinter(printerId: string): Promise<Order[]>;
  updateOrderStatus(id: string, status: string): Promise<void>;

  // Rating operations
  createRating(rating: InsertRating): Promise<Rating>;
  updatePrinterRating(printerId: string): Promise<void>;

  // File operations
  createFile(file: InsertFile): Promise<File>;
  getFilesByQuote(quoteId: string): Promise<File[]>;

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

  async getFilesByQuote(quoteId: string): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(eq(files.quoteId, quoteId))
      .orderBy(desc(files.createdAt));
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
}

export const storage = new DatabaseStorage();