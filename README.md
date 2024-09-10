# Securize

![Securize Logo](https://via.placeholder.com/150x150.png?text=Securize)

[![npm version](https://badge.fury.io/js/securize.svg)](https://badge.fury.io/js/securize)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Securize is a powerful Node.js library designed to extract detailed client information from HTTP requests. It provides comprehensive data collection capabilities, including IP addresses, user agent details, system information, DNS info, proxy detection, TOR detection, geolocation, and more.

## 🚀 Features

- 🌐 Extracts client IP addresses, with support for `x-forwarded-for` headers
- 🕵️ Detects proxy and TOR network usage
- 🖥️ Parses user agent to determine browser, OS, and device information
- 🔍 Fetches DNS lookup information
- 💻 Collects system information (CPU, memory, network interfaces)
- 🛠️ Provides middleware for seamless integration with Express.js
- 🏠 Checks if an IP address is private
- 🌍 Retrieves server public IP

## 📦 Installation

Using npm:

```bash
npm install securize
```

Using yarn:

```bash
yarn add securize
```

## 🛠️ Usage

### 1. Middleware for Express.js

Automatically attach client information to each incoming request:

```javascript
import express from 'express';
import { clientInfoMiddleware } from 'securize';

const app = express();

app.use(clientInfoMiddleware);

app.get('/', (req, res) => {
  const clientInfo = req.clientInfo;
  res.json({ message: 'Hello from Express!', clientInfo });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 2. Fetch Client Information Directly in a Route

Call `getClientInfo` directly inside a route:

```javascript
import express from 'express';
import { getClientInfo } from 'securize';

const app = express();

app.get('/info', async (req, res) => {
  const clientInfo = await getClientInfo(req);
  res.json({ clientInfo });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### 3. Get Server Public IP

Retrieve the public IP address of the server:

```javascript
import { getServerPublicIP } from 'securize';

getServerPublicIP()
  .then(ip => {
    console.log(`Server Public IP: ${ip}`);
  })
  .catch(error => {
    console.error('Failed to get public IP:', error);
  });
```

### 4. Check if an IP is Private

Check whether a given IP address is private:

```javascript
import { isPrivateIP } from 'securize';

const ip = '192.168.0.1';
console.log(`Is ${ip} a private IP? ${isPrivateIP(ip)}`);
```

## 📚 API Reference

### `getClientInfo(req: http.IncomingMessage): Promise<ClientInfo>`

Retrieves detailed client information.

#### ClientInfo Object Structure

```typescript
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
```

### `clientInfoMiddleware(req, res, next)`

Middleware that automatically attaches `clientInfo` to each request.

### `getServerPublicIP(): Promise<string>`

Retrieves the public IP address of the server.

### `isPrivateIP(ip: string): boolean`

Returns `true` if the IP address is private; otherwise, returns `false`.

### `getClientInfoSummary(clientInfo: ClientInfo): string`

Returns a summary of the ClientInfo object, including IP, user-agent, proxy status, TOR status, and geolocation.

## 🌟 Example

Here's a complete example of how to integrate Securize with an Express.js server:

```javascript
import express from 'express';
import {
  getClientInfo,
  clientInfoMiddleware,
  getServerPublicIP,
  isPrivateIP,
  getClientInfoSummary,
} from 'securize';

const app = express();

// Use middleware to attach client information
app.use(clientInfoMiddleware);

app.get('/', (req, res) => {
  const clientInfo = req.clientInfo;
  const summary = getClientInfoSummary(clientInfo);
  res.json({
    message: 'Hello from Express!',
    clientInfoSummary: summary,
    clientInfo,
  });
});

app.get('/info', async (req, res) => {
  const clientInfo = await getClientInfo(req);
  res.json({ clientInfo });
});

app.get('/server-ip', async (req, res) => {
  const publicIP = await getServerPublicIP();
  res.json({ serverPublicIP: publicIP });
});

app.post('/check-private-ip', (req, res) => {
  const { ip } = req.body;
  const isPrivate = isPrivateIP(ip);
  res.json({ ip, isPrivate });
});

app.listen(3000, async () => {
  const serverIP = await getServerPublicIP();
  console.log(`Server running on port 3000`);
  console.log(`Server public IP: ${serverIP}`);
});
```

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check [issues page](https://github.com/Cristiancastt/securize/issues).
