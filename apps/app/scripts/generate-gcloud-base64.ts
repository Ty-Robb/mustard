#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

/**
 * Script to generate base64-encoded Google Cloud service account key
 * for use in production environments (e.g., Vercel)
 * 
 * Usage:
 * 1. Download your service account key from Google Cloud Console
 * 2. Run: npx tsx src/scripts/generate-gcloud-base64.ts path/to/your-service-account-key.json
 * 3. Copy the output and add it to your production environment variables
 */

function generateBase64Key(filePath: string): void {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Error: File not found: ${filePath}`);
      process.exit(1);
    }

    // Read the JSON file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Validate it's valid JSON
    try {
      const parsed = JSON.parse(fileContent);
      
      // Check for required fields
      const requiredFields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email'];
      const missingFields = requiredFields.filter(field => !parsed[field]);
      
      if (missingFields.length > 0) {
        console.error(`❌ Error: Invalid service account key. Missing fields: ${missingFields.join(', ')}`);
        process.exit(1);
      }
      
      if (parsed.type !== 'service_account') {
        console.error(`❌ Error: Invalid key type. Expected 'service_account', got '${parsed.type}'`);
        process.exit(1);
      }
      
      console.log('✅ Valid Google Cloud service account key detected');
      console.log(`📋 Project ID: ${parsed.project_id}`);
      console.log(`📧 Service Account: ${parsed.client_email}`);
      
    } catch (e) {
      console.error('❌ Error: Invalid JSON format');
      process.exit(1);
    }

    // Convert to base64
    const base64 = Buffer.from(fileContent).toString('base64');
    
    console.log('\n🔐 Base64-encoded service account key:');
    console.log('=====================================\n');
    console.log(base64);
    console.log('\n=====================================');
    
    console.log('\n📝 Instructions:');
    console.log('1. Copy the base64 string above');
    console.log('2. Go to your Vercel project settings');
    console.log('3. Navigate to Settings > Environment Variables');
    console.log('4. Add a new variable:');
    console.log('   - Name: GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY');
    console.log('   - Value: [paste the base64 string]');
    console.log('   - Environment: Production (and Preview if needed)');
    console.log('\n5. Also ensure you have set:');
    console.log('   - GOOGLE_CLOUD_PROJECT_ID: ' + JSON.parse(fileContent).project_id);
    console.log('   - GOOGLE_CLOUD_REGION: us-central1 (or your preferred region)');
    console.log('\n6. Redeploy your application');
    
    // Optionally save to a file
    const outputPath = path.join(process.cwd(), 'gcloud-service-account-base64.txt');
    fs.writeFileSync(outputPath, base64);
    console.log(`\n💾 Base64 key also saved to: ${outputPath}`);
    console.log('⚠️  Remember to delete this file after adding to Vercel!');
    
  } catch (error) {
    console.error('❌ Error reading file:', error);
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Google Cloud Service Account Base64 Encoder');
  console.log('==========================================\n');
  console.log('Usage: npx tsx src/scripts/generate-gcloud-base64.ts <path-to-service-account-key.json>\n');
  console.log('Example: npx tsx src/scripts/generate-gcloud-base64.ts ~/Downloads/my-project-key.json\n');
  console.log('Steps:');
  console.log('1. Go to Google Cloud Console (https://console.cloud.google.com)');
  console.log('2. Select your project');
  console.log('3. Go to IAM & Admin > Service Accounts');
  console.log('4. Create a new service account or use existing one');
  console.log('5. Create a new key (JSON format)');
  console.log('6. Run this script with the downloaded JSON file');
  process.exit(0);
}

const filePath = path.resolve(args[0]);
generateBase64Key(filePath);
