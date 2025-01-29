import { Collection, CollectionItem } from '@/models/collection';
import { Injectable } from '@nestjs/common';

import { createCanvas, Image, registerFont } from 'canvas';
import { mkdir, writeFile } from 'fs/promises';

import path from 'path';
import nodeHtmlToImage from 'node-html-to-image';
import sharp from 'sharp';
import puppeteer from 'puppeteer';

/**
 * Service for generating notification images
 */
@Injectable()
export class ImageService {

  /**
   * Generates an image for an token
   * @param tokenId The token ID of the token
   * @param value The value of the token
   * @param imageUri The URI of the token image
   * @param collection The metadata of the collection
   * @param collectionItem The metadata of the collection item
   * @returns The generated image as a buffer
   */
  async generate(
    tokenId: string,
    value: string,
    imageUri: string,
    collection: Collection,
    collectionItem: CollectionItem
  ) {
    return await (Number(process.env.CARD_GEN_ENABLED) 
      ? this.generateCardImage(tokenId, value, imageUri, collection, collectionItem)
      : this.generateBasicImage(tokenId, value, imageUri, collection)
    );
  }

  /**
   * Generates a basic image for an token
   * @param tokenId The token ID of the token
   * @param value The value of the token
   * @param imageUri The URI of the token image
   * @param collectionMetadata The metadata of the collection
   * @returns The generated image as a buffer
   */
  async generateBasicImage(
    tokenId: string,
    value: string,
    imageUri: string,
    collectionMetadata: Collection,
  ) {
    // Create a temporary canvas at original size first
    const tempCanvas = createCanvas(1200, 1200);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.imageSmoothingEnabled = false;

    const tokenImg = await this.createTokenImage(imageUri);

    // Calculate height maintaining aspect ratio
    const aspectRatio = tokenImg.height / tokenImg.width;
    const scaledHeight = Math.round(1200 * aspectRatio);

    // Create final canvas with correct dimensions
    const canvas = createCanvas(1200, scaledHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;  // Critical for pixel art!

    // Draw background
    ctx.fillStyle = '#C3FF00';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw image at original size first, then scale
    tempCtx.drawImage(tokenImg, 0, 0, tokenImg.width, tokenImg.height);
    ctx.drawImage(tempCanvas, 0, 0, tokenImg.width, tokenImg.height, 
                 0, 0, canvas.width, canvas.height);

    // Convert to buffer
    const buffer = canvas.toBuffer('image/png');

    return buffer;
  }

  /**
   * Generates an image for an token
   * @param tokenId The token ID of the token
   * @param value The value of the token
   * @param imageUri The URI of the token image
   * @param collectionMetadata The metadata of the collection
   * @returns The generated image as a buffer
   */
  async generateCardImage(
    tokenId: string,
    value: string,
    imageUri: string,
    collection: Collection,
    collectionItem: CollectionItem
  ) {
    const { name, logoImageUri, websiteLink } = collection;

    // Register custom font
    registerFont(
      path.join(__dirname, '../../src/assets/fonts/enter-the-gungeon-small.ttf'),
      { family: 'RetroComputer' },
    );

    const backgroundColor = '#C3FF00'; //C3FF00
    const textColor = '#000000';
    const borderColor = '#000000';
    const borderWidth = 16;

    const canvasWidth = 1200;
    const canvasHeight = 1470;
    const padding = 80;

    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;

    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // add black background to top 3rd of canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight / 4);

    // Add collection image
    const collectionImageSize = 100;
    if (logoImageUri) {
      const collectionImage = await fetch(logoImageUri);
      const collectionImageBuffer = await collectionImage.arrayBuffer();
      const collectionImageData = new Uint8Array(collectionImageBuffer);
      const collectionImg = new Image();
      collectionImg.src = Buffer.from(collectionImageData);
      ctx.drawImage(
        collectionImg,
        padding + borderWidth / 2,
        padding,
        collectionImageSize,
        collectionImageSize,
      );
    }

    // Add collection name to top
    ctx.fillStyle = backgroundColor;
    ctx.font = 'normal 60px RetroComputer';
    const collectionNameHeight = 50;
    ctx.fillText(
      name.toUpperCase(),
      logoImageUri ? (padding + collectionImageSize + 40) : (padding + 10),
      padding + collectionNameHeight + 5,
    );

    // Add collection url
    let collectionUrlHeight = 0;
    if (websiteLink) {
      ctx.fillStyle = backgroundColor;
      ctx.font = 'normal 30px RetroComputer';
      const collectionUrl = websiteLink.replace('https://', '');
      collectionUrlHeight = 20;
      ctx.fillText(
        collectionUrl.toUpperCase(),
        logoImageUri ? (padding + collectionImageSize + 40) : (padding + 10),
        padding + collectionNameHeight + collectionUrlHeight + 30,
      );
    }

    const tokenImg = await this.createTokenImage(imageUri);
    const imageWidth = canvasWidth - (padding * 2) - borderWidth;
    const imageHeight = canvasWidth - (padding * 2) - borderWidth;

    // Add a background to the image
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(
      padding + borderWidth / 2,
      padding + collectionNameHeight + collectionUrlHeight + 50 + (padding / 2) + borderWidth / 2,
      imageWidth,
      imageHeight,
    );
    
    // Add the token image
    ctx.drawImage(
      tokenImg,
      padding + borderWidth / 2,
      padding + collectionNameHeight + collectionUrlHeight + 50 + (padding / 2) + borderWidth / 2,
      imageWidth,
      imageHeight,
    );

    // Add border to image
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.strokeRect(
      padding,
      padding + collectionNameHeight + collectionUrlHeight + 40 + (padding / 2),
      canvasWidth - (padding * 2),
      canvasWidth - (padding * 2),
    );

    // Add token name to bottom under image
    ctx.fillStyle = textColor;
    ctx.font = 'normal 80px RetroComputer';
    const itemNameWidth = ctx.measureText(collectionItem.name).width;
    if (itemNameWidth > canvasWidth - (padding * 2)) {
      ctx.font = 'normal 60px RetroComputer';
    }
    ctx.fillText(
      collectionItem.name.toUpperCase(),
      padding,
      canvasHeight - padding,
    );

    return canvas.toBuffer('image/png');
  }

  /**
   * Creates an image from a data URI (SVG or PNG)
   * @param imageUri The URI of the token image
   * @returns The generated image as a buffer
   */
  async createTokenImage(imageUri: string): Promise<Image> {
    try {
      console.log('Puppeteer cache directory:', process.env.PUPPETEER_CACHE_DIR);
      console.log('Puppeteer executable path:', puppeteer.executablePath());
      
      let imageBuffer: Buffer;
  
      if (imageUri.startsWith('data:image/svg+xml;base64,')) {
        // Decode base64 SVG
        const svgContent = Buffer.from(
          imageUri.replace('data:image/svg+xml;base64,', ''),
          'base64'
        ).toString('utf-8');
        
        // Convert SVG to PNG buffer using node-html-to-image
        imageBuffer = await nodeHtmlToImage({
          puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
          encoding: 'binary',
          html: `
            <html>
              <head>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1200px;
                    height: 1200px;
                  }
                  svg {
                    width: 100%;
                    height: auto;
                  }
                </style>
              </head>
              <body>
                ${svgContent}
              </body>
            </html>
          `,
        }) as Buffer;
      } else if (imageUri.endsWith('.svg')) {
        // Fetch SVG content and render to PNG buffer
        const response = await fetch(imageUri);
        const svgContent = await response.text();
  
        imageBuffer = await nodeHtmlToImage({
          puppeteerArgs: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
          encoding: 'binary',
          html: `
            <html>
              <head>
                <style>
                  body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 1200px;
                    height: 1200px;
                  }
                  svg {
                    width: 100%;
                    height: auto;
                  }
                </style>
              </head>
              <body>
                ${svgContent}
              </body>
            </html>
          `,
        }) as Buffer;
      } else {
        // Handle non-SVG formats (e.g., PNG, JPEG)
        const response = await fetch(imageUri);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
  
        // Convert to PNG if not already in PNG format
        imageBuffer = await sharp(buffer).toFormat('png').toBuffer();
      }
  
      // Create an Image object from the buffer
      const image = new Image();
      image.src = imageBuffer;
  
      return image;
    } catch (error) {
      console.error('Error creating token image:', error);
      throw new Error('Failed to create token image');
    }
  }

  /**
   * Saves an image to a file
   * @param collectionName The name of the collection
   * @param tokenId The token ID of the token
   * @param imageBuffer The image to save
   */
  async saveImage(
    collectionName: string,
    tokenId: string,
    imageBuffer: Buffer,
  ) {
    const folderPath = path.join(__dirname, `../../_static`);
    await mkdir(folderPath, { recursive: true });

    await writeFile(
      path.join(folderPath, `${collectionName}--${tokenId}.png`),
      imageBuffer,
    );
  }
}
