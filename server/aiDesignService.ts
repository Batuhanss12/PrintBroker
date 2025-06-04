import OpenAI from "openai";

interface DesignRequest {
  prompt: string;
  style?: string;
  dimensions?: string;
  printType?: 'sheet_label' | 'roll_label' | 'general_printing';
  colors?: string[];
  brand?: string;
  industry?: string;
}

interface DesignSuggestion {
  title: string;
  prompt: string;
  category: string;
  tags: string[];
}

class AIDesignService {
  private openai: OpenAI | null = null;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
  }

  isAvailable(): boolean {
    return this.openai !== null;
  }

  // Generate design prompts based on user input
  async generateDesignPrompts(input: {
    businessType?: string;
    productType?: string;
    style?: string;
    colors?: string[];
  }): Promise<DesignSuggestion[]> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are a professional graphic designer creating design prompts for printing services. 
    Generate 6 creative, detailed design prompts based on the user's requirements.
    Focus on professional, print-ready designs suitable for business use.
    Consider printing constraints like resolution, color modes, and material compatibility.`;

    const userPrompt = `Create design prompts for:
    Business Type: ${input.businessType || 'general business'}
    Product Type: ${input.productType || 'label'}
    Style: ${input.style || 'modern'}
    Colors: ${input.colors?.join(', ') || 'flexible'}
    
    Return exactly 6 design suggestions in JSON format with title, prompt, category, and tags.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result.suggestions || [];
    } catch (error) {
      console.error("Error generating design prompts:", error);
      throw new Error("Failed to generate design prompts");
    }
  }

  // Generate design image using DALL-E 3
  async generateDesignImage(request: DesignRequest): Promise<{
    url: string;
    revisedPrompt: string;
    dimensions: string;
  }> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    // Enhance prompt for print quality
    const enhancedPrompt = this.enhancePromptForPrinting(request);

    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        size: this.getOptimalSize(request.dimensions),
        quality: "hd",
        style: "natural",
        n: 1,
      });

      return {
        url: response.data[0].url!,
        revisedPrompt: response.data[0].revised_prompt || enhancedPrompt,
        dimensions: request.dimensions || "1024x1024"
      };
    } catch (error) {
      console.error("Error generating design image:", error);
      throw new Error("Failed to generate design image");
    }
  }

  // Optimize existing design for printing
  async optimizeDesignForPrint(imageUrl: string, printType: string): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const optimizationPrompt = `Analyze this design and provide optimization suggestions for ${printType} printing:
    - Color mode recommendations (CMYK vs RGB)
    - Resolution requirements
    - Bleed and margin suggestions
    - Material compatibility
    - Text readability improvements`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: optimizationPrompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 500,
      });

      return response.choices[0].message.content || "No optimization suggestions available";
    } catch (error) {
      console.error("Error optimizing design:", error);
      throw new Error("Failed to optimize design");
    }
  }

  // Generate printing specifications based on design
  async generatePrintSpecs(designUrl: string, printType: string): Promise<{
    recommendedMaterial: string;
    colorMode: string;
    resolution: string;
    bleed: string;
    finishOptions: string[];
  }> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const specsPrompt = `Analyze this design and recommend optimal printing specifications for ${printType}.
    Provide technical recommendations in JSON format including material, color mode, resolution, bleed, and finish options.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: specsPrompt },
              { type: "image_url", image_url: { url: designUrl } }
            ]
          }
        ],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        recommendedMaterial: result.material || "Standard paper",
        colorMode: result.colorMode || "CMYK",
        resolution: result.resolution || "300 DPI",
        bleed: result.bleed || "3mm",
        finishOptions: result.finishOptions || ["Matte", "Gloss"]
      };
    } catch (error) {
      console.error("Error generating print specs:", error);
      return {
        recommendedMaterial: "Standard paper",
        colorMode: "CMYK",
        resolution: "300 DPI",
        bleed: "3mm",
        finishOptions: ["Matte", "Gloss"]
      };
    }
  }

  private enhancePromptForPrinting(request: DesignRequest): string {
    let enhancedPrompt = request.prompt;

    // Add print-specific enhancements
    enhancedPrompt += " Professional quality design suitable for commercial printing.";
    
    if (request.printType === 'sheet_label') {
      enhancedPrompt += " Clean label design with clear typography, high contrast, suitable for product labeling.";
    } else if (request.printType === 'roll_label') {
      enhancedPrompt += " Repeatable label design optimized for roll printing, consistent spacing and alignment.";
    } else {
      enhancedPrompt += " High-resolution design optimized for professional printing.";
    }

    if (request.colors && request.colors.length > 0) {
      enhancedPrompt += ` Using primary colors: ${request.colors.join(', ')}.`;
    }

    if (request.brand) {
      enhancedPrompt += ` Brand-consistent design for ${request.brand}.`;
    }

    enhancedPrompt += " Vector-style graphics, clean lines, print-ready quality, 300 DPI equivalent detail.";

    return enhancedPrompt;
  }

  private getOptimalSize(dimensions?: string): "1024x1024" | "1024x1792" | "1792x1024" {
    if (!dimensions) return "1024x1024";
    
    if (dimensions.includes("portrait") || dimensions.includes("vertical")) {
      return "1024x1792";
    } else if (dimensions.includes("landscape") || dimensions.includes("horizontal")) {
      return "1792x1024";
    }
    
    return "1024x1024";
  }

  // Get design templates for different industries
  getDesignTemplates(): DesignSuggestion[] {
    return [
      {
        title: "Modern Business Card",
        prompt: "Minimalist business card design with clean typography, professional color scheme, modern geometric elements",
        category: "Business Cards",
        tags: ["professional", "minimal", "corporate"]
      },
      {
        title: "Product Label Design",
        prompt: "Eye-catching product label with bold typography, vibrant colors, clear product information hierarchy",
        category: "Labels",
        tags: ["product", "retail", "branding"]
      },
      {
        title: "Restaurant Menu",
        prompt: "Elegant restaurant menu design with appetizing food photography, sophisticated typography, warm color palette",
        category: "Menus",
        tags: ["food", "hospitality", "elegant"]
      },
      {
        title: "Event Poster",
        prompt: "Dynamic event poster with bold graphics, attention-grabbing headlines, vibrant colors and modern layout",
        category: "Posters",
        tags: ["events", "marketing", "bold"]
      },
      {
        title: "Corporate Brochure",
        prompt: "Professional tri-fold brochure with corporate imagery, structured layout, brand colors and clear information hierarchy",
        category: "Brochures",
        tags: ["corporate", "information", "professional"]
      },
      {
        title: "Logo Design",
        prompt: "Modern logo design with unique symbol, clean typography, scalable vector graphics, memorable brand identity",
        category: "Logos",
        tags: ["branding", "identity", "memorable"]
      }
    ];
  }
}

export const aiDesignService = new AIDesignService();
export { DesignRequest, DesignSuggestion };