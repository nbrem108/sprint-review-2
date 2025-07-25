/**
 * Asset Embedder Service
 * Handles embedding of images, CSS, and fonts into export files
 */

export interface AssetEmbedder {
  embedImage(url: string): Promise<string>;
  embedCSS(css: string): string;
  embedFont(fontFamily: string, fontUrl: string): Promise<string>;
  getEmbeddedAssets(): Map<string, string>;
  clearCache(): void;
  getCacheStats(): { size: number; totalSize: number };
}

export class AssetEmbedderService implements AssetEmbedder {
  private embeddedAssets: Map<string, string> = new Map();
  private assetSizes: Map<string, number> = new Map();

  /**
   * Embed an image as base64 data URL
   */
  async embedImage(url: string): Promise<string> {
    if (this.embeddedAssets.has(url)) {
      return this.embeddedAssets.get(url)!;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      
      // Store the embedded asset
      this.embeddedAssets.set(url, base64);
      this.assetSizes.set(url, blob.size);
      
      console.log(`✅ Embedded image: ${url} (${this.formatFileSize(blob.size)})`);
      return base64;
    } catch (error) {
      console.warn(`⚠️ Failed to embed image: ${url}`, error);
      return '';
    }
  }

  /**
   * Embed CSS content
   */
  embedCSS(css: string): string {
    return css;
  }

  /**
   * Embed a font file
   */
  async embedFont(fontFamily: string, fontUrl: string): Promise<string> {
    try {
      const response = await fetch(fontUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch font: ${response.statusText}`);
      }

      const blob = await response.blob();
      const base64 = await this.blobToBase64(blob);
      
      // Store the embedded asset
      const key = `font:${fontFamily}:${fontUrl}`;
      this.embeddedAssets.set(key, base64);
      this.assetSizes.set(key, blob.size);
      
      console.log(`✅ Embedded font: ${fontFamily} (${this.formatFileSize(blob.size)})`);
      return base64;
    } catch (error) {
      console.warn(`⚠️ Failed to embed font: ${fontFamily}`, error);
      return fontUrl; // Fallback to original URL
    }
  }

  /**
   * Get all embedded assets
   */
  getEmbeddedAssets(): Map<string, string> {
    return new Map(this.embeddedAssets);
  }

  /**
   * Clear the asset cache
   */
  clearCache(): void {
    this.embeddedAssets.clear();
    this.assetSizes.clear();
    console.log('🗑️ Asset cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; totalSize: number } {
    const totalSize = Array.from(this.assetSizes.values()).reduce((sum, size) => sum + size, 0);
    return {
      size: this.embeddedAssets.size,
      totalSize
    };
  }

  /**
   * Convert blob to base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Format file size for display
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const assetEmbedder = new AssetEmbedderService(); 