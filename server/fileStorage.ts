import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

// Using promisify to convert callback-based fs functions to Promise-based
const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);
const unlinkAsync = promisify(fs.unlink);
const mkdirAsync = promisify(fs.mkdir);
const accessAsync = promisify(fs.access);
const readdirAsync = promisify(fs.readdir);

/**
 * Enhanced file storage service to handle uploads and retrieval
 * This provides a robust abstraction that could later be swapped with S3 or other storage
 */
export class FileStorage {
  private baseDir: string;
  private subDirs: string[];
  
  constructor(baseDir: string = './public/assets') {
    this.baseDir = baseDir;
    this.subDirs = ['logos', 'images', 'uploads', 'receipts', 'icons', 'profile', 'banners', 'payments'];
  }
  
  /**
   * Initialize the storage system, ensuring directories exist
   */
  async initialize(): Promise<void> {
    try {
      // Check if base directory exists
      await accessAsync(this.baseDir, fs.constants.F_OK);
    } catch (error) {
      // Create base directory if it doesn't exist
      await mkdirAsync(this.baseDir, { recursive: true });
      console.log(`Created base directory: ${this.baseDir}`);
    }
    
    // Create subdirectories if they don't exist
    for (const dir of this.subDirs) {
      const dirPath = path.join(this.baseDir, dir);
      try {
        await accessAsync(dirPath, fs.constants.F_OK);
      } catch (error) {
        await mkdirAsync(dirPath, { recursive: true });
        console.log(`Created subdirectory: ${dirPath}`);
      }
    }
  }
  
  /**
   * Store a file (base64 data, Buffer, or string content)
   */
  async storeFile(
    fileName: string, 
    data: string | Buffer, 
    subDir: string = 'uploads'
  ): Promise<string> {
    await this.initialize();
    
    const dirPath = path.join(this.baseDir, subDir);
    const filePath = path.join(dirPath, fileName);
    
    // If data is base64 encoded (data URI), convert to buffer
    if (typeof data === 'string' && data.startsWith('data:')) {
      const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        throw new Error('Invalid base64 data URI format');
      }
      
      const buffer = Buffer.from(matches[2], 'base64');
      await writeFileAsync(filePath, buffer);
    } else {
      // Store as is (either Buffer or raw string content)
      await writeFileAsync(filePath, data);
    }
    
    // Return public URL path to the file
    return `/assets/${subDir}/${fileName}`;
  }
  
  /**
   * Get a file by name from a subdirectory
   */
  async getFile(fileName: string, subDir: string = 'uploads'): Promise<Buffer> {
    const filePath = path.join(this.baseDir, subDir, fileName);
    return await readFileAsync(filePath);
  }
  
  /**
   * Delete a file
   */
  async deleteFile(fileName: string, subDir: string = 'uploads'): Promise<void> {
    const filePath = path.join(this.baseDir, subDir, fileName);
    await unlinkAsync(filePath);
  }
  
  /**
   * List all files in a subdirectory
   */
  async listFiles(subDir: string = 'uploads'): Promise<string[]> {
    const dirPath = path.join(this.baseDir, subDir);
    
    try {
      return await readdirAsync(dirPath);
    } catch (error) {
      return [];
    }
  }
  
  /**
   * Get public URL path for a file
   */
  getPublicUrl(fileName: string, subDir: string = 'uploads'): string {
    return `/assets/${subDir}/${fileName}`;
  }
}

// Export a singleton instance
export const fileStorage = new FileStorage();