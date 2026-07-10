import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';
import path from 'path';

const PROJECT_ID = 'catalystiq-b086f';
const FCM_URL = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

async function getAccessToken(): Promise<string> {
  const auth = new GoogleAuth({
    keyFile: path.join(__dirname, '../../firebase-service-account.json'),
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token || '';
}

export async function sendPushNotification({
  token, title, body, data,
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    await axios.post(
      FCM_URL,
      {
        message: {
          token,
          notification: { title, body },
          data: data ?? {},
          android: {
            priority: 'high',
            notification: {
              channel_id: 'setups',
              sound: 'default',
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Push sent: ${title}`);
  } catch (err) {
    console.error('❌ Push failed:', err);
  }
}

export async function sendToTopic(
  topic: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    const accessToken = await getAccessToken();
    await axios.post(
      FCM_URL,
      {
        message: {
          topic,
          notification: { title, body },
          data: data ?? {},
          android: {
            priority: 'high',
            notification: {
              channel_id: 'setups',
              sound: 'default',
            },
          },
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`✅ Topic push sent: ${title}`);
  } catch (err) {
    console.error('❌ Topic push failed:', err);
  }
}

export async function sendNewSetupAlert(
  sym: string,
  score: number,
  action: string,
  price: string
): Promise<void> {
  await sendToTopic(
    'all',
    `🎯 New setup — ${sym}`,
    `Score ${score}% · ${action === 'sell' ? '▼ Sell' : '▲ Buy'} · Price ${price}`,
    { type: 'new_setup', sym, score: score.toString() }
  );
}

export async function sendPriceAlert(
  sym: string,
  price: string,
  zone: string
): Promise<void> {
  await sendToTopic(
    'all',
    `⚡ Price alert — ${sym}`,
    `${price} has entered the ${zone} zone`,
    { type: 'price_alert', sym }
  );
}