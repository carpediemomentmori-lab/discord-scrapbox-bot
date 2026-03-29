export async function uploadToGyazo(discordImageUrl) {
  // Discordから画像をダウンロード
  const downloadRes = await fetch(discordImageUrl);
  if (!downloadRes.ok) {
    throw new Error(`Failed to download image: ${downloadRes.status}`);
  }
  const buffer = await downloadRes.arrayBuffer();
  const contentType = downloadRes.headers.get('content-type') || 'image/png';

  // Gyazoにアップロード
  const formData = new FormData();
  formData.append('access_token', process.env.GYAZO_ACCESS_TOKEN);
  formData.append('imagedata', new Blob([buffer], { type: contentType }), 'image');

  const uploadRes = await fetch('https://upload.gyazo.com/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`Gyazo upload failed: ${uploadRes.status}`);
  }

  const data = await uploadRes.json();
  console.log(`[Gyazo] Uploaded: ${data.url}`);
  return data.url; // https://i.gyazo.com/xxxx.png
}
