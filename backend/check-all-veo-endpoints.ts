#!/usr/bin/env ts-node
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const execAsync = promisify(exec);

const VEO_MODELS = [
  'veo_3_1-components-4K',
  'veo_3_1-4K',
  'veo_3_1-fast-4K',
  'veo_3_1-fast-components-4K',
  'veo3.1-4k',
  'veo3.1-components-4k',
  'veo_3_1',
  'veo_3_1-components',
  'veo_3_1-fast',
  'veo3.1',
  'veo3.1-pro',
  'veo3.1-pro-4k',
  'veo3-pro-frames',
  'veo3.1-components',
  'veo3.1-fast-components',
  'veo3.1-fast',
  'veo3',
  'veo3-fast',
  'veo3-fast-frames',
  'veo3-frames',
];

interface ModelEndpointInfo {
  model: string;
  endpoint: string;
  price: string;
  ref: string;
}

async function clickAndExtractEndpoint(modelRef: string): Promise<string | null> {
  try {
    await execAsync(`agent-browser click @${modelRef}`);
    await execAsync('agent-browser wait 2000');
    
    const { stdout } = await execAsync('agent-browser snapshot');
    
    const endpointMatch = stdout.match(/\/v1\/video\/create|\/v1\/videos|openAI视频格式/);
    
    await execAsync('agent-browser press Escape');
    await execAsync('agent-browser wait 500');
    
    if (endpointMatch) {
      if (endpointMatch[0].includes('openAI') || endpointMatch[0] === '/v1/videos') {
        return '/v1/videos';
      } else {
        return '/v1/video/create';
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking model ${modelRef}:`, error);
    return null;
  }
}

async function main() {
  console.log('Opening pricing page...');
  await execAsync('agent-browser open "https://aiapikey.ai/pricing"');
  await execAsync('agent-browser wait 3000');
  
  console.log('Searching for veo models...');
  const { stdout: snapshot1 } = await execAsync('agent-browser snapshot -i');
  const searchBoxMatch = snapshot1.match(/textbox.*\[ref=(e\d+)\]/);
  
  if (!searchBoxMatch) {
    throw new Error('Cannot find search box');
  }
  
  const searchRef = searchBoxMatch[1];
  await execAsync(`agent-browser fill @${searchRef} "veo"`);
  await execAsync('agent-browser wait 3000');
  
  const { stdout: snapshot2 } = await execAsync('agent-browser snapshot');
  
  const results: ModelEndpointInfo[] = [];
  
  const modelMatches = snapshot2.matchAll(/heading "([^"]+veo[^"]+)".*\[ref=(e\d+)\]/g);
  const modelRefs: { model: string; ref: string }[] = [];
  
  for (const match of modelMatches) {
    modelRefs.push({ model: match[1], ref: match[2] });
  }
  
  console.log(`Found ${modelRefs.length} veo models`);
  console.log('');
  
  for (const { model, ref } of modelRefs) {
    console.log(`Checking ${model}...`);
    const endpoint = await clickAndExtractEndpoint(ref);
    
    if (endpoint) {
      console.log(`  ✅ ${endpoint}`);
      results.push({ model, endpoint, price: '', ref });
    } else {
      console.log(`  ❌ Could not determine endpoint`);
    }
    
    await execAsync('sleep 1');
  }
  
  console.log('');
  console.log('='.repeat(70));
  console.log('Summary:');
  console.log('='.repeat(70));
  
  const byEndpoint = results.reduce((acc, item) => {
    if (!acc[item.endpoint]) acc[item.endpoint] = [];
    acc[item.endpoint].push(item.model);
    return acc;
  }, {} as Record<string, string[]>);
  
  Object.entries(byEndpoint).forEach(([endpoint, models]) => {
    console.log(`\n${endpoint}:`);
    models.forEach(m => console.log(`  - ${m}`));
  });
  
  const csvContent = 'Model,Endpoint\n' + 
    results.map(r => `${r.model},${r.endpoint}`).join('\n');
  
  fs.writeFileSync('./veo-endpoints-result.csv', csvContent);
  console.log('\nResults saved to veo-endpoints-result.csv');
}

main().catch(console.error);
