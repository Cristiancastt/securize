import * as os from 'os';
import dns from 'dns';
import http from 'http';
import https from 'https';
import net from 'net';
import geoip, { Lookup } from 'geoip-lite';
import useragent, { Agent } from 'useragent';
import { networkInterfaces } from 'os';

interface ClientInfo {
  ip: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  device: string | null;
  dnsInfo: dns.LookupAddress[];
  isProxy: boolean;
  isTor: boolean;
  requestHeaders: http.IncomingHttpHeaders;
  geoLocation: geoip.Lookup | null;
  platform: string;
  cpuArch: string;
  cpuCores: number;
  totalMemory: number;
  freeMemory: number;
  networkInterfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
  timestamp: string;
  timezoneOffset: number;
  isHttps: boolean;
}

const getClientIP = (req: http.IncomingMessage): string | null => {
  try {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor && typeof forwardedFor === 'string') {
      return forwardedFor.split(',')[0].trim();
    }
    return req.socket.remoteAddress || null;
  } catch (error) {
    console.error('Error getting client IP:', error);
    return null;
  }
};

const checkProxy = (req: http.IncomingMessage): boolean => {
  try {
    const proxyHeaders = [
      'via',
      'x-forwarded-for',
      'forwarded',
      'proxy-connection',
    ];
    return proxyHeaders.some(header => req.headers[header] !== undefined);
  } catch (error) {
    console.error('Error checking proxy:', error);
    return false;
  }
};

const checkTor = async (ip: string): Promise<boolean> => {
  try {
    const hostname = `${ip.replace('::ffff:', '')}.exitlist.torproject.org`;
    const hostnames = await dns.promises.reverse(hostname);
    return hostnames.length > 0;
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.warn(`Error checking Tor exit node: ${error}`);
    return false;
  }
};

const getDNSInfo = async (): Promise<dns.LookupAddress[]> => {
  try {
    return await dns.promises.lookup(os.hostname(), { all: true });
  } catch (error) {
    console.error('Error getting DNS info:', error);
    return [];
  }
};

const getSystemInfo = () => {
  try {
    return {
      platform: os.platform(),
      cpuArch: os.arch(),
      cpuCores: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      networkInterfaces: os.networkInterfaces(),
    };
  } catch (error) {
    console.error('Error getting system info:', error);
    return {
      platform: 'unknown',
      cpuArch: 'unknown',
      cpuCores: 0,
      totalMemory: 0,
      freeMemory: 0,
      networkInterfaces: {},
    };
  }
};

const parseUserAgent = (userAgentString: string | null) => {
  try {
    if (!userAgentString) return { browser: null, os: null, device: null };
    const agent: Agent = useragent.parse(userAgentString);
    return {
      browser: `${agent.family} ${agent.major}.${agent.minor}.${agent.patch}`,
      os: agent.os.toString(),
      device: agent.device.family,
    };
  } catch (error) {
    console.error('Error parsing user agent:', error);
    return { browser: null, os: null, device: null };
  }
};

export const getClientInfo = async (
  req: http.IncomingMessage
): Promise<ClientInfo> => {
  try {
    const ip = getClientIP(req);
    const dnsInfo = await getDNSInfo();
    const isProxy = checkProxy(req);
    const systemInfo = getSystemInfo();
    const userAgentString = req.headers['user-agent'] || null;
    const { browser, os, device } = parseUserAgent(userAgentString);
    const geoLocation: Lookup | null = ip ? geoip.lookup(ip) : null;
    const isTor = ip ? await checkTor(ip) : false;

    return {
      ip,
      userAgent: userAgentString,
      browser,
      os,
      device,
      dnsInfo,
      isProxy,
      isTor,
      requestHeaders: req.headers,
      geoLocation,
      platform: systemInfo.platform,
      cpuArch: systemInfo.cpuArch,
      cpuCores: systemInfo.cpuCores,
      totalMemory: systemInfo.totalMemory,
      freeMemory: systemInfo.freeMemory,
      networkInterfaces: systemInfo.networkInterfaces,
      timestamp: new Date().toISOString(),
      timezoneOffset: new Date().getTimezoneOffset(),
      isHttps: req.socket instanceof http.ClientRequest,
    };
  } catch (error) {
    console.error('Error getting client info:', error);
    throw new Error('Failed to get client info');
  }
};

export const getServerPublicIP = async (): Promise<string> => {
  try {
    return await new Promise((resolve, reject) => {
      https
        .get('https://api.ipify.org', res => {
          let data = '';
          res.on('data', chunk => {
            data += chunk;
          });
          res.on('end', () => {
            resolve(data);
          });
        })
        .on('error', reject);
    });
  } catch (error) {
    console.error('Error getting server public IP:', error);
    throw new Error('Failed to get server public IP');
  }
};

export const isPrivateIP = (ip: string): boolean => {
  try {
    const parts = ip.split('.').map(Number);
    return (
      parts[0] === 10 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168)
    );
  } catch (error) {
    console.error('Error checking if IP is private:', error);
    return false;
  }
};

export const getClientInfoSummary = (clientInfo: ClientInfo): string => {
  try {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `IP: ${clientInfo.ip}, User-Agent: ${clientInfo.userAgent}, Proxy: ${
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      clientInfo.isProxy
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    }, Tor: ${clientInfo.isTor}, Location: ${
      clientInfo.geoLocation?.country ?? ''
    }`;
  } catch (error) {
    console.error('Error getting client info summary:', error);
    return 'Error generating client info summary';
  }
};

export const clientInfoMiddleware = async (
  req: http.IncomingMessage & { clientInfo?: ClientInfo },
  res: http.ServerResponse,
  next: () => void
): Promise<void> => {
  try {
    req.clientInfo = await getClientInfo(req);
    next();
  } catch (error) {
    console.error('Error in client info middleware:', error);
    next();
  }
};
