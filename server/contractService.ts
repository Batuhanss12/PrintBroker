import { storage } from "./storage";
import { type InsertContract } from "@shared/schema";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export class ContractService {
  
  async generateContract(orderId: string, customerId: string, printerId: string): Promise<string> {
    // Get order details
    const order = await storage.getOrder(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Get quote details  
    const quote = await storage.getQuote(order.quoteId);
    if (!quote) {
      throw new Error('Quote not found');
    }

    // Get customer and printer info
    const customer = await storage.getUser(customerId);
    const printer = await storage.getUser(printerId);
    
    if (!customer || !printer) {
      throw new Error('Customer or printer not found');
    }

    // Generate contract number
    const contractNumber = this.generateContractNumber();

    // Create contract data
    const contractData: InsertContract = {
      orderId,
      customerId,
      printerId,
      contractNumber,
      title: `Baskı Hizmet Sözleşmesi - ${quote.title}`,
      description: quote.description || 'Matbaa hizmet sözleşmesi',
      terms: this.generateStandardTerms(quote, order),
      totalAmount: order.totalAmount,
      status: 'draft',
      validUntil: this.getValidUntilDate(),
    };

    // Save contract to database
    const contract = await storage.createContract(contractData);

    // Generate PDF
    const pdfPath = await this.generateContractPDF(contract, customer, printer, quote, order);
    
    // Update contract with PDF path
    await storage.updateContract(contract.id, { contractPdfPath: pdfPath });

    return contract.id;
  }

  private generateContractNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `MTB-${timestamp.slice(-8)}-${random}`;
  }

  private generateStandardTerms(quote: any, order: any): string {
    return `
MATBIXX B2B BASKI HİZMET SÖZLEŞMESİ

1. TARAFLAR
Müşteri: ${quote.customerId}
Matbaacı: ${order.printerId}

2. HİZMET KAPSAMI
Proje: ${quote.title}
Açıklama: ${quote.description || 'Baskı hizmeti'}
Toplam Tutar: ${order.totalAmount} TL

3. ÖDEME KOŞULLARI
- Ödeme işlemi Matbixx platformu üzerinden gerçekleştirilecektir
- Ödeme tamamlandıktan sonra üretim süreci başlatılacaktır
- İade koşulları Matbixx platformu şartlarına tabidir

4. TESLİMAT
- Tahmini teslimat süresi: ${order.estimatedDays || 'Belirtilmemiş'} gün
- Teslimat adresi müşteri tarafından belirtilecektir
- Kargo masrafları ayrıca hesaplanacaktır

5. KALİTE GARANTİSİ
- Ürün kalitesi endüstri standartlarına uygun olacaktır
- Üretim hatalarından kaynaklanan problemler ücretsiz düzeltilecektir
- Müşteri onayı sonrası değişiklik talepleri ek ücrete tabidir

6. GENEL ŞARTLAR
- Bu sözleşme Türkiye Cumhuriyeti yasalarına tabidir
- Anlaşmazlıklar öncelikle dostane yollarla çözülmeye çalışılacaktır
- Platform üzerinden iletişim kurulması zorunludur

7. KABUL VE ONAY
Bu sözleşmeyi dijital olarak imzalayarak yukarıdaki şartları kabul etmiş sayılırsınız.

Sözleşme Tarihi: ${new Date().toLocaleDateString('tr-TR')}
Sözleşme Numarası: ${this.generateContractNumber()}
    `.trim();
  }

  private getValidUntilDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days validity
    return date;
  }

  private async generateContractPDF(contract: any, customer: any, printer: any, quote: any, order: any): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads');
        const contractsDir = path.join(uploadsDir, 'contracts');
        
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        if (!fs.existsSync(contractsDir)) {
          fs.mkdirSync(contractsDir, { recursive: true });
        }

        const filename = `contract_${contract.contractNumber}.pdf`;
        const filepath = path.join(contractsDir, filename);

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Header
        doc.fontSize(20).text('MATBIXX B2B BASKI HİZMET SÖZLEŞMESİ', { align: 'center' });
        doc.moveDown();

        // Contract details
        doc.fontSize(12);
        doc.text(`Sözleşme No: ${contract.contractNumber}`);
        doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')}`);
        doc.text(`Geçerlilik: ${contract.validUntil?.toLocaleDateString('tr-TR')}`);
        doc.moveDown();

        // Parties
        doc.fontSize(14).text('TARAFLAR', { underline: true });
        doc.fontSize(12);
        doc.text(`Müşteri: ${customer.firstName} ${customer.lastName}`);
        doc.text(`E-posta: ${customer.email}`);
        doc.text(`Şirket: ${customer.companyName || 'Belirtilmemiş'}`);
        doc.moveDown();

        doc.text(`Matbaacı: ${printer.firstName} ${printer.lastName}`);
        doc.text(`E-posta: ${printer.email}`);
        doc.text(`Şirket: ${printer.companyName || 'Belirtilmemiş'}`);
        doc.moveDown();

        // Project details
        doc.fontSize(14).text('PROJE DETAYLARI', { underline: true });
        doc.fontSize(12);
        doc.text(`Proje: ${quote.title}`);
        doc.text(`Açıklama: ${quote.description || 'Baskı hizmeti'}`);
        doc.text(`Toplam Tutar: ${order.totalAmount} TL`);
        doc.moveDown();

        // Terms
        doc.fontSize(14).text('ŞARTLAR VE KOŞULLAR', { underline: true });
        doc.fontSize(10);
        
        const terms = contract.terms.split('\n');
        terms.forEach((term: string) => {
          if (term.trim()) {
            doc.text(term.trim(), { align: 'left' });
          }
        });

        // Signature areas
        doc.moveDown(2);
        doc.fontSize(12);
        
        const pageHeight = doc.page.height;
        const currentY = doc.y;
        
        if (pageHeight - currentY < 150) {
          doc.addPage();
        }
        
        doc.text('İMZA ALANLARI', { underline: true });
        doc.moveDown();
        
        // Customer signature
        doc.text('MÜŞTERİ İMZASI:');
        doc.moveTo(150, doc.y).lineTo(350, doc.y).stroke();
        doc.moveDown(2);
        
        // Printer signature  
        doc.text('MATBAACI İMZASI:');
        doc.moveTo(150, doc.y).lineTo(350, doc.y).stroke();
        doc.moveDown();

        // Footer
        doc.fontSize(8).text('Bu sözleşme Matbixx B2B platform üzerinden oluşturulmuştur.', { align: 'center' });

        doc.end();

        stream.on('finish', () => {
          resolve(`/uploads/contracts/${filename}`);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  async getContractById(contractId: string) {
    return await storage.getContract(contractId);
  }

  async getContractsByUser(userId: string, userType: 'customer' | 'printer') {
    if (userType === 'customer') {
      return await storage.getContractsByCustomer(userId);
    } else {
      return await storage.getContractsByPrinter(userId);
    }
  }

  async signContract(contractId: string, userId: string, signature: string) {
    await storage.signContract(contractId, userId, signature);
    
    // Check if both parties have signed
    const contract = await storage.getContract(contractId);
    if (contract?.status === 'fully_approved') {
      // Both parties signed - contract is now active
      console.log(`Contract ${contractId} fully executed`);
    }
    
    return contract;
  }

  async updateContractStatus(contractId: string, status: string) {
    await storage.updateContractStatus(contractId, status);
  }
}

export const contractService = new ContractService();