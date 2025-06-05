import axios from 'axios';

interface DesignItem {
  id: string;
  name: string;
  width: number;
  height: number;
  filePath: string;
  canRotate: boolean;
}

interface LayoutSettings {
  sheetWidth: number;
  sheetHeight: number;
  margin: number;
  spacing: number;
}

interface LayoutRequest {
  designs: DesignItem[];
  settings: LayoutSettings;
  outputPath: string;
}

interface LayoutResponse {
  success: boolean;
  arrangements: any[];
  pdfPath?: string;
  message: string;
  statistics: {
    totalDesigns: number;
    arrangedDesigns: number;
    efficiency: number;
  };
}

export class FastApiClient {
  private baseUrl: string;

  constructor(port: number = 8001) {
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('FastAPI health check failed:', error);
      return false;
    }
  }

  async generateLayout(request: LayoutRequest): Promise<LayoutResponse> {
    try {
      console.log('🚀 Sending layout request to FastAPI microservice');
      
      const response = await axios.post(
        `${this.baseUrl}/generate-layout`, 
        request,
        { 
          timeout: 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ FastAPI response received');
      return response.data;

    } catch (error) {
      console.error('FastAPI layout request failed:', error);
      
      if (axios.isAxiosError(error)) {
        throw new Error(`FastAPI error: ${error.response?.data?.detail || error.message}`);
      }
      
      throw new Error(`Layout generation failed: ${error.message}`);
    }
  }

  async startMicroservice(): Promise<boolean> {
    try {
      const { spawn } = await import('child_process');
      const path = await import('path');
      
      const scriptPath = path.join(__dirname, 'layout_microservice.py');
      const process = spawn('python3', [scriptPath, '--port', '8001', '--host', '0.0.0.0'], {
        detached: true,
        stdio: 'pipe'
      });

      process.unref();
      
      // Give it time to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return await this.healthCheck();
      
    } catch (error) {
      console.error('Failed to start FastAPI microservice:', error);
      return false;
    }
  }
}

export const fastApiClient = new FastApiClient();