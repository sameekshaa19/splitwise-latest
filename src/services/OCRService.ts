interface OCRLineItem {
  name: string;
  quantity?: number;
  unitPrice?: number;
  total: number;
  category?: 'vegetarian' | 'non-vegetarian' | 'other';
}

interface OCRResult {
  vendor?: string;
  date?: string;
  items: OCRLineItem[];
  subtotal?: number;
  tax?: number;
  total: number;
  currency: string;
  confidence: number;
  rawText?: string;
}

export class OCRService {
  private static async performOCR(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      const response = await fetch(imageUri);
      const blob = await response.blob();
      formData.append('image', blob);

      const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'K87899142388957',
        },
        body: formData,
      });

      const result = await ocrResponse.json();

      if (result.IsErroredOnProcessing) {
        throw new Error(result.ErrorMessage?.[0] || 'OCR processing failed');
      }

      return result.ParsedResults?.[0]?.ParsedText || '';
    } catch (error) {
      console.error('OCR API error:', error);
      return '';
    }
  }

  private static parseReceiptText(text: string): OCRResult {
    const lines = text.split('\n').filter(line => line.trim());
    const items: OCRLineItem[] = [];
    let vendor: string | undefined;
    let date: string | undefined;
    let subtotal: number | undefined;
    let tax: number | undefined;
    let total = 0;
    let confidence = 0.5;

    const priceRegex = /(?:Rs\.?|₹|INR)?\s*(\d+(?:\.\d{2})?)/i;
    const dateRegex = /(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/;
    const totalKeywords = ['total', 'grand total', 'amount', 'net amount', 'payable'];
    const taxKeywords = ['tax', 'gst', 'vat', 'cgst', 'sgst'];
    const subtotalKeywords = ['subtotal', 'sub total', 'sub-total', 'amount before tax'];

    vendor = lines[0]?.trim();

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const dateMatch = lines[i].match(dateRegex);
      if (dateMatch) {
        date = dateMatch[1];
        break;
      }
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();
      const originalLine = lines[i].trim();

      const isTotalLine = totalKeywords.some(kw => line.includes(kw));
      const isTaxLine = taxKeywords.some(kw => line.includes(kw));
      const isSubtotalLine = subtotalKeywords.some(kw => line.includes(kw));

      const priceMatch = originalLine.match(priceRegex);

      if (isTotalLine && priceMatch) {
        total = parseFloat(priceMatch[1]);
        confidence = Math.min(confidence + 0.2, 1);
      } else if (isTaxLine && priceMatch) {
        tax = parseFloat(priceMatch[1]);
        confidence = Math.min(confidence + 0.1, 1);
      } else if (isSubtotalLine && priceMatch) {
        subtotal = parseFloat(priceMatch[1]);
        confidence = Math.min(confidence + 0.1, 1);
      } else if (priceMatch && !isTotalLine && !isTaxLine && !isSubtotalLine) {
        const price = parseFloat(priceMatch[1]);
        if (price > 0 && price < 10000) {
          const itemName = originalLine.replace(priceRegex, '').trim();
          if (itemName.length > 2) {
            const category = this.detectCategory(itemName);
            items.push({
              name: itemName,
              total: price,
              category,
            });
          }
        }
      }
    }

    if (items.length > 0) {
      confidence = Math.min(confidence + 0.2, 1);
    }

    if (total === 0 && items.length > 0) {
      total = items.reduce((sum, item) => sum + item.total, 0);
      if (tax) total += tax;
      confidence = Math.max(confidence - 0.2, 0.3);
    }

    return {
      vendor,
      date,
      items,
      subtotal,
      tax,
      total,
      currency: 'INR',
      confidence: Math.round(confidence * 100) / 100,
      rawText: text,
    };
  }

  private static detectCategory(itemName: string): 'vegetarian' | 'non-vegetarian' | 'other' {
    const name = itemName.toLowerCase();

    const nonVegKeywords = ['chicken', 'mutton', 'lamb', 'beef', 'pork', 'fish', 'prawns',
                            'shrimp', 'egg', 'meat', 'kebab', 'tandoori chicken'];
    const vegKeywords = ['paneer', 'aloo', 'gobi', 'dal', 'sabzi', 'roti', 'naan',
                        'rice', 'salad', 'veg', 'vegetable'];

    if (nonVegKeywords.some(kw => name.includes(kw))) {
      return 'non-vegetarian';
    }

    if (vegKeywords.some(kw => name.includes(kw))) {
      return 'vegetarian';
    }

    return 'other';
  }

  public static async scanReceipt(imageUri: string): Promise<OCRResult> {
    try {
      const text = await this.performOCR(imageUri);

      if (!text || text.trim().length === 0) {
        throw new Error('No text could be extracted from the image');
      }

      const result = this.parseReceiptText(text);

      if (result.items.length === 0 && result.total === 0) {
        throw new Error('Could not parse receipt data. Please add items manually.');
      }

      return result;
    } catch (error) {
      console.error('Receipt scanning error:', error);
      throw error;
    }
  }

  public static mockScan(): OCRResult {
    return {
      vendor: 'Test Restaurant',
      date: new Date().toISOString().split('T')[0],
      items: [
        { name: 'Caesar Salad', total: 14.99, category: 'vegetarian' },
        { name: 'Grilled Chicken', total: 22.99, category: 'non-vegetarian' },
        { name: 'Garlic Bread', total: 8.99, category: 'vegetarian' },
        { name: 'Wine (Bottle)', total: 28.99, category: 'other' },
      ],
      subtotal: 75.96,
      tax: 7.60,
      total: 83.56,
      currency: 'INR',
      confidence: 0.85,
    };
  }
}
