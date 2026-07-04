import fs from 'fs';

const filePath = 'lib/posOrderIdentity.ts';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  `    latestQueue = normalizeQueueNumber(latestQueueResult.data?.queue_number) || 0\n  }\n\n  const queueNumber`,
  `    latestQueue = normalizeQueueNumber(latestQueueResult.data?.queue_number) || 0\n\n  const queueNumber`
);

fs.writeFileSync(filePath, content);
console.log('Fixed bracket');
