import axios from 'axios';
import FormData from 'form-data';

interface IdeogramRequest {
  image_request: {
    prompt: string;
    aspect_ratio?: string;
    model?: string;
    magic_prompt_option?: string;
    seed?: number;
    style_type?: string;
    negative_prompt?: string;
  };
}

interface IdeogramResponse {
  created: string;
  data: Array<{
    url: string;
    is_image_safe: boolean;
    prompt: string;
    resolution: string;
    seed: number;
  }>;
}

class IdeogramService {
  private apiKey: string;
  private baseUrl = 'https://api.ideogram.ai/generate';

  constructor() {
    this.apiKey = process.env.IDEOGRAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('IDEOGRAM_API_KEY environment variable not set - design generation will be disabled');
    }
  }

  async generateImage(prompt: string, options: {
    aspectRatio?: 'ASPECT_1_1' | 'ASPECT_10_16' | 'ASPECT_16_10' | 'ASPECT_9_16' | 'ASPECT_16_9' | 'ASPECT_3_2' | 'ASPECT_2_3';
    model?: 'V_1' | 'V_1_TURBO' | 'V_2' | 'V_2_TURBO';
    styleType?: 'AUTO' | 'GENERAL' | 'REALISTIC' | 'DESIGN' | 'RENDER_3D' | 'ANIME';
    magicPrompt?: 'AUTO' | 'ON' | 'OFF';
    negativePrompt?: string;
    seed?: number;
  } = {}): Promise<IdeogramResponse> {
    if (!this.apiKey) {
      throw new Error('Ideogram API key not configured. Please contact administrator.');
    }
    try {
      const requestData: IdeogramRequest = {
        image_request: {
          prompt,
          aspect_ratio: options.aspectRatio || 'ASPECT_1_1',
          model: options.model || 'V_2',
          style_type: options.styleType || 'AUTO',
          magic_prompt_option: options.magicPrompt || 'AUTO',
          negative_prompt: options.negativePrompt,
          seed: options.seed,
        }
      };

      const response = await axios.post<IdeogramResponse>(
        this.baseUrl,
        requestData,
        {
          headers: {
            'Api-Key': this.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // 60 seconds timeout
        }
      );

      return response.data;
    } catch (error) {
      console.error('Ideogram API error:', error);
      throw new Error('Failed to generate image with Ideogram API');
    }
  }

  async generateMultipleImages(prompts: string[], options: Parameters<typeof this.generateImage>[1] = {}): Promise<IdeogramResponse[]> {
    const promises = prompts.map(prompt => this.generateImage(prompt, options));
    return Promise.all(promises);
  }

  // Batch generation with rate limiting
  async generateBatch(requests: Array<{ prompt: string; options?: Parameters<typeof this.generateImage>[1] }>, batchSize = 3): Promise<IdeogramResponse[]> {
    if (!this.apiKey) {
      throw new Error('Ideogram API key not configured. Please contact administrator.');
    }

    const results: IdeogramResponse[] = [];

    for (let i = 0; i < requests.length; i += batchSize) {
      const batch = requests.slice(i, i + batchSize);
      const batchPromises = batch.map(req => this.generateImage(req.prompt, req.options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Rate limiting delay between batches
      if (i + batchSize < requests.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return results;
  }
}

export const ideogramService = new IdeogramService();
export type { IdeogramRequest, IdeogramResponse };