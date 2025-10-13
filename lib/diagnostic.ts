import { account, client } from '@/lib/appwrite';

export async function checkAppwriteConnection(): Promise<{
  isConnected: boolean;
  error?: string;
  endpoint?: string;
  projectId?: string;
}> {
  try {
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

    if (!endpoint || !projectId) {
      return {
        isConnected: false,
        error: 'Missing Appwrite configuration',
      };
    }

    // Try to ping the health endpoint
    const healthUrl = `${endpoint}/health/version`;
    const response = await fetch(healthUrl);
    
    if (!response.ok) {
      return {
        isConnected: false,
        error: `Appwrite health check failed: ${response.status}`,
        endpoint,
        projectId,
      };
    }

    // Try to get account (will fail if no session, but that's ok)
    try {
      await account.get();
    } catch (error) {
      // 401 is expected if not logged in - connection is working
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((error as any)?.code === 401) {
        return {
          isConnected: true,
          endpoint,
          projectId,
        };
      }
    }

    return {
      isConnected: true,
      endpoint,
      projectId,
    };
  } catch (error) {
    return {
      isConnected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function checkNetworkConnectivity(): Promise<{
  isOnline: boolean;
  latency?: number;
}> {
  if (typeof navigator === 'undefined') {
    return { isOnline: true };
  }

  if (!navigator.onLine) {
    return { isOnline: false };
  }

  try {
    const start = Date.now();
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
    });
    const latency = Date.now() - start;

    return { isOnline: true, latency };
  } catch {
    return { isOnline: false };
  }
}

export async function runDiagnostics(): Promise<void> {
  console.log('Running diagnostics...');
  console.log('='.repeat(50));

  // Check environment variables
  console.log('Environment Variables:');
  console.log('  Endpoint:', process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'Missing');
  console.log('  Project ID:', process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || 'Missing');
  console.log('  Database ID:', process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'Missing');
  console.log('');

  // Check network connectivity
  console.log('Network Connectivity:');
  const network = await checkNetworkConnectivity();
  console.log('  Online:', network.isOnline ? 'Yes' : 'No');
  if (network.latency) {
    console.log('  Latency:', `${network.latency}ms`);
  }
  console.log('');

  // Check Appwrite connection
  console.log('Appwrite Connection:');
  const appwrite = await checkAppwriteConnection();
  console.log('  Connected:', appwrite.isConnected ? 'Yes' : 'No');
  if (appwrite.error) {
    console.log('  Error:', appwrite.error);
  }
  if (appwrite.endpoint) {
    console.log('  Endpoint:', appwrite.endpoint);
  }
  if (appwrite.projectId) {
    console.log('  Project ID:', appwrite.projectId);
  }
  console.log('');

  console.log('='.repeat(50));
  console.log('Diagnostics complete');
}
