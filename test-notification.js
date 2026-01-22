require('dotenv').config();
const OneSignal = require('onesignal-node');

const appId = process.env.ONESIGNAL_APP_ID;
const apiKey = process.env.ONESIGNAL_API_KEY;

console.log('=== Test OneSignal Notification ===');
console.log('App ID:', appId ? `${appId.substring(0, 8)}...` : 'NOT SET');
console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET');

if (!appId || !apiKey) {
  console.error('ERROR: OneSignal credentials not configured!');
  process.exit(1);
}

const playerIdFromArgs = process.argv[2];

if (!playerIdFromArgs) {
  console.error('ERROR: Please provide a player ID as argument');
  console.log('Usage: node test-notification.js <PLAYER_ID>');
  process.exit(1);
}

const client = new OneSignal.Client(appId, apiKey);

const notification = {
  headings: { en: 'Test - Folki' },
  contents: { en: 'Esta é uma notificação de teste do backend.' },
  include_player_ids: [playerIdFromArgs],
};

console.log('\nSending notification to player:', playerIdFromArgs);
console.log('Notification:', JSON.stringify(notification, null, 2));

client
  .createNotification(notification)
  .then((response) => {
    console.log('\n✅ SUCCESS!');
    console.log('Response:', JSON.stringify(response.body, null, 2));

    if (response.body.errors) {
      console.log('\n⚠️  Errors found:');
      console.log(JSON.stringify(response.body.errors, null, 2));
    }

    if (response.body.recipients === 0) {
      console.log('\n⚠️  WARNING: 0 recipients received the notification!');
      console.log('This could mean:');
      console.log('1. The player ID is invalid or not subscribed');
      console.log('2. The device is not registered in OneSignal');
      console.log('3. The user has uninstalled the app');
    }
  })
  .catch((error) => {
    console.error('\n❌ FAILED!');
    console.error('Error:', error.message);
    if (error.body) {
      console.error('Error body:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  });
