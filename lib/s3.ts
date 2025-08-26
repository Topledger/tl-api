import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// Create S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export interface S3Config {
  bucket: string;
  key: string;
}

/**
 * Fetch a JSON file from S3 and parse it
 * @param config S3 configuration with bucket and key
 * @returns Parsed JSON data
 */
export async function getS3Json<T = any>(config: S3Config): Promise<T> {
  try {
    const command = new GetObjectCommand({
      Bucket: config.bucket,
      Key: config.key,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      throw new Error('No data returned from S3');
    }

    // Convert stream to string
    const bodyString = await response.Body.transformToString();
    
    // Parse JSON
    const data = JSON.parse(bodyString);
    
    return data as T;
  } catch (error) {
    console.error('Error fetching data from S3:', error);
    throw new Error(`Failed to fetch data from S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get API data from S3 bucket
 * Uses the admin/api-data/api-data.json file path
 */
export async function getApiDataFromS3() {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  return getS3Json({
    bucket: bucketName,
    key: 'admin/api-data/api-data.json',
  });
}

/**
 * Save JSON data to S3
 * @param config S3 configuration with bucket and key
 * @param data Data to save
 */
export async function putS3Json(config: S3Config, data: any): Promise<void> {
  try {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3');
    
    const command = new PutObjectCommand({
      Bucket: config.bucket,
      Key: config.key,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json',
    });

    await s3Client.send(command);
  } catch (error) {
    console.error('Error saving data to S3:', error);
    throw new Error(`Failed to save data to S3: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get user-specific API keys from S3
 * @param userId User ID (from session)
 */
export async function getUserApiKeysFromS3(userId: string) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  try {
    return await getS3Json({
      bucket: bucketName,
      key: `users/${userId}/api-keys.json`,
    });
  } catch (error) {
    // If file doesn't exist, return empty array
    if (error instanceof Error && error.message.includes('NoSuchKey')) {
      return [];
    }
    throw error;
  }
}

/**
 * Save user-specific API keys to S3
 * @param userId User ID (from session)
 * @param apiKeys Array of API keys
 */
export async function saveUserApiKeysToS3(userId: string, apiKeys: any[]) {
  const bucketName = process.env.AWS_S3_BUCKET_NAME;
  
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET_NAME environment variable is not set');
  }

  return putS3Json({
    bucket: bucketName,
    key: `users/${userId}/api-keys.json`,
  }, apiKeys);
}

/**
 * Check if S3 is properly configured
 */
export function isS3Configured(): boolean {
  const hasAccessKey = !!process.env.AWS_ACCESS_KEY_ID;
  const hasSecretKey = !!process.env.AWS_SECRET_ACCESS_KEY;
  const hasRegion = !!process.env.AWS_REGION;
  const hasBucket = !!process.env.AWS_S3_BUCKET_NAME;
  
  console.log('S3 Configuration Check:', {
    hasAccessKey,
    hasSecretKey,
    hasRegion,
    hasBucket,
    accessKey: process.env.AWS_ACCESS_KEY_ID ? `${process.env.AWS_ACCESS_KEY_ID.substring(0, 8)}...` : 'missing',
    bucket: process.env.AWS_S3_BUCKET_NAME || 'missing'
  });
  
  return hasAccessKey && hasSecretKey && hasRegion && hasBucket;
}
