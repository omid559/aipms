import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class FileCleanupService {
  private uploadDir: string;
  private outputDir: string;
  private maxFileAgeHours: number;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(maxFileAgeHours: number = 24) {
    this.uploadDir = path.join(__dirname, '../../../uploads');
    this.outputDir = path.join(__dirname, '../../../output');
    this.maxFileAgeHours = maxFileAgeHours;
  }

  /**
   * Start automatic cleanup service
   */
  start(intervalMinutes: number = 60): void {
    console.log(`🧹 File cleanup service started (running every ${intervalMinutes} minutes)`);
    console.log(`📁 Files older than ${this.maxFileAgeHours} hours will be deleted`);

    // Run cleanup immediately on start
    this.cleanup().catch((error) => {
      console.error('Error during initial cleanup:', error);
    });

    // Schedule periodic cleanup
    this.cleanupInterval = setInterval(() => {
      this.cleanup().catch((error) => {
        console.error('Error during scheduled cleanup:', error);
      });
    }, intervalMinutes * 60 * 1000);
  }

  /**
   * Stop automatic cleanup service
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🧹 File cleanup service stopped');
    }
  }

  /**
   * Clean up old files in both upload and output directories
   */
  async cleanup(): Promise<{
    uploadsCleaned: number;
    outputsCleaned: number;
    totalSpaceFreed: number;
  }> {
    console.log('🧹 Running file cleanup...');

    const now = Date.now();
    const maxAge = this.maxFileAgeHours * 60 * 60 * 1000;

    let uploadsCleaned = 0;
    let outputsCleaned = 0;
    let totalSpaceFreed = 0;

    // Clean uploads directory
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      const uploadFiles = await fs.readdir(this.uploadDir);

      for (const file of uploadFiles) {
        const filePath = path.join(this.uploadDir, file);
        try {
          const stats = await fs.stat(filePath);

          // Only delete files, not directories
          if (stats.isFile()) {
            const fileAge = now - stats.mtimeMs;

            if (fileAge > maxAge) {
              await fs.unlink(filePath);
              uploadsCleaned++;
              totalSpaceFreed += stats.size;
              console.log(`  ✓ Deleted old upload: ${file} (${this.formatBytes(stats.size)})`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error processing upload file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning uploads directory:', error);
    }

    // Clean output directory
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      const outputFiles = await fs.readdir(this.outputDir);

      for (const file of outputFiles) {
        const filePath = path.join(this.outputDir, file);
        try {
          const stats = await fs.stat(filePath);

          if (stats.isFile()) {
            const fileAge = now - stats.mtimeMs;

            if (fileAge > maxAge) {
              await fs.unlink(filePath);
              outputsCleaned++;
              totalSpaceFreed += stats.size;
              console.log(`  ✓ Deleted old output: ${file} (${this.formatBytes(stats.size)})`);
            }
          }
        } catch (error) {
          console.error(`  ✗ Error processing output file ${file}:`, error);
        }
      }
    } catch (error) {
      console.error('Error cleaning output directory:', error);
    }

    console.log(
      `✅ Cleanup complete: ${uploadsCleaned} uploads, ${outputsCleaned} outputs removed (${this.formatBytes(totalSpaceFreed)} freed)`
    );

    return {
      uploadsCleaned,
      outputsCleaned,
      totalSpaceFreed,
    };
  }

  /**
   * Get statistics about stored files
   */
  async getStats(): Promise<{
    uploads: { count: number; totalSize: number };
    outputs: { count: number; totalSize: number };
  }> {
    const stats = {
      uploads: { count: 0, totalSize: 0 },
      outputs: { count: 0, totalSize: 0 },
    };

    // Uploads stats
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      const uploadFiles = await fs.readdir(this.uploadDir);

      for (const file of uploadFiles) {
        try {
          const filePath = path.join(this.uploadDir, file);
          const fileStat = await fs.stat(filePath);
          if (fileStat.isFile()) {
            stats.uploads.count++;
            stats.uploads.totalSize += fileStat.size;
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
    } catch (error) {
      console.error('Error getting upload stats:', error);
    }

    // Outputs stats
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      const outputFiles = await fs.readdir(this.outputDir);

      for (const file of outputFiles) {
        try {
          const filePath = path.join(this.outputDir, file);
          const fileStat = await fs.stat(filePath);
          if (fileStat.isFile()) {
            stats.outputs.count++;
            stats.outputs.totalSize += fileStat.size;
          }
        } catch (error) {
          // Ignore errors for individual files
        }
      }
    } catch (error) {
      console.error('Error getting output stats:', error);
    }

    return stats;
  }

  /**
   * Format bytes to human-readable format
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

// Singleton instance
export default new FileCleanupService(24); // 24 hours default
