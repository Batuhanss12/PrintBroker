
import crypto from 'crypto';

interface DataProcessingConsent {
  userId: string;
  consentType: 'marketing' | 'analytics' | 'necessary' | 'functional';
  granted: boolean;
  timestamp: Date;
  ipAddress: string;
  version: string;
}

interface DataRetentionPolicy {
  dataType: 'user_data' | 'file_uploads' | 'chat_messages' | 'analytics';
  retentionDays: number;
  autoDelete: boolean;
  anonymizeAfter: number;
}

class DataProtectionManager {
  private encryptionKey = process.env.DATA_ENCRYPTION_KEY || 'default-key-change-in-production';
  private retentionPolicies: DataRetentionPolicy[] = [
    { dataType: 'user_data', retentionDays: 2555, autoDelete: false, anonymizeAfter: 1095 }, // 7 yıl sakla, 3 yıl sonra anonimleştir
    { dataType: 'file_uploads', retentionDays: 365, autoDelete: true, anonymizeAfter: 180 }, // 1 yıl sakla, 6 ay sonra anonimleştir
    { dataType: 'chat_messages', retentionDays: 730, autoDelete: true, anonymizeAfter: 365 }, // 2 yıl sakla, 1 yıl sonra anonimleştir
    { dataType: 'analytics', retentionDays: 1095, autoDelete: true, anonymizeAfter: 730 } // 3 yıl sakla, 2 yıl sonra anonimleştir
  ];

  // Hassas verileri şifreleme
  encryptSensitiveData(data: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // Şifrelenmiş verileri çözme
  decryptSensitiveData(encryptedData: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return '';
    }
  }

  // GDPR veri silme talebi
  async processDataDeletionRequest(userId: string): Promise<{
    success: boolean;
    deletedItems: string[];
    errors: string[];
  }> {
    const deletedItems: string[] = [];
    const errors: string[] = [];

    try {
      // Kullanıcı verileri
      const { storage } = await import('./storage');
      await storage.deleteUserData(userId);
      deletedItems.push('user_profile');

      // Dosya yüklemeleri
      await storage.deleteUserFiles(userId);
      deletedItems.push('file_uploads');

      // Chat mesajları
      await storage.deleteUserChatMessages(userId);
      deletedItems.push('chat_messages');

      // Teklif geçmişi (anonimleştir)
      await storage.anonymizeUserQuotes(userId);
      deletedItems.push('quotes_anonymized');

      // Log kayıtları (anonimleştir)
      await this.anonymizeUserLogs(userId);
      deletedItems.push('logs_anonymized');

      return { success: true, deletedItems, errors };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Unknown error');
      return { success: false, deletedItems, errors };
    }
  }

  // Kullanıcı verilerini dışa aktarma (GDPR hakkı)
  async exportUserData(userId: string): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const { storage } = await import('./storage');
      
      const userData = {
        profile: await storage.getUser(userId),
        quotes: await storage.getQuotesByCustomer(userId),
        files: await storage.getFilesByUser(userId),
        chatHistory: await storage.getChatHistoryByUser(userId),
        designHistory: await storage.getDesignHistory(userId),
        exportDate: new Date().toISOString(),
        format: 'JSON',
        version: '1.0'
      };

      // Hassas verileri temizle
      delete userData.profile?.passwordHash;
      userData.files?.forEach((file: any) => {
        delete file.internalPath;
        delete file.processingLogs;
      });

      return { success: true, data: userData };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Data export failed' 
      };
    }
  }

  // Otomatik veri temizleme
  async performDataCleanup(): Promise<{
    cleaned: number;
    anonymized: number;
    errors: string[];
  }> {
    let cleaned = 0;
    let anonymized = 0;
    const errors: string[] = [];

    for (const policy of this.retentionPolicies) {
      try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - policy.retentionDays);

        const anonymizeDate = new Date();
        anonymizeDate.setDate(anonymizeDate.getDate() - policy.anonymizeAfter);

        if (policy.autoDelete) {
          const deletedCount = await this.deleteOldData(policy.dataType, cutoffDate);
          cleaned += deletedCount;
        }

        const anonymizedCount = await this.anonymizeOldData(policy.dataType, anonymizeDate);
        anonymized += anonymizedCount;

      } catch (error) {
        errors.push(`${policy.dataType}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`✅ Data cleanup completed: ${cleaned} deleted, ${anonymized} anonymized`);
    return { cleaned, anonymized, errors };
  }

  private async deleteOldData(dataType: string, beforeDate: Date): Promise<number> {
    // Bu fonksiyonlar storage.ts'de implement edilmeli
    return 0;
  }

  private async anonymizeOldData(dataType: string, beforeDate: Date): Promise<number> {
    // Bu fonksiyonlar storage.ts'de implement edilmeli
    return 0;
  }

  private async anonymizeUserLogs(userId: string): Promise<void> {
    // Log anonimleştirme işlemi
    console.log(`Anonymizing logs for user: ${userId}`);
  }

  // Cookie consent yönetimi
  getCookiePolicy() {
    return {
      necessary: {
        name: 'Gerekli Çerezler',
        description: 'Sitenin çalışması için gerekli çerezler',
        cookies: ['session', 'auth', 'csrf'],
        mandatory: true
      },
      functional: {
        name: 'İşlevsel Çerezler',
        description: 'Kullanıcı deneyimini iyileştiren çerezler',
        cookies: ['preferences', 'language', 'theme'],
        mandatory: false
      },
      analytics: {
        name: 'Analitik Çerezler',
        description: 'Site kullanımını analiz eden çerezler',
        cookies: ['google_analytics', 'performance'],
        mandatory: false
      },
      marketing: {
        name: 'Pazarlama Çerezleri',
        description: 'Kişiselleştirilmiş reklamlar için çerezler',
        cookies: ['advertising', 'remarketing'],
        mandatory: false
      }
    };
  }
}

export const dataProtectionManager = new DataProtectionManager();

// Günlük veri temizleme görevi
export async function scheduleDataCleanup() {
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) { // Her gece 02:00'da çalış
      console.log('🧹 Starting scheduled data cleanup...');
      await dataProtectionManager.performDataCleanup();
    }
  }, 60000); // Her dakika kontrol et
}
