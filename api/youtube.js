// api/youtube.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) {
    return res.status(400).json({
      success: false,
      error: "YouTube link required! Use ?url=YOUR_YOUTUBE_LINK"
    });
  }

  try {
    // Use ytdown.to API (free, no key)
    const apiResponse = await fetch('https://app.ytdown.to/proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': 'https://app.ytdown.to/en34/',
        'Origin': 'https://app.ytdown.to'
      },
      body: new URLSearchParams({ url })
    });

    const data = await apiResponse.json();
    if (!data || !data.api || !data.api.mediaItems) throw new Error('No media items');

    const videoId = extractVideoId(url);
    const videoFormats = [];
    const audioFormats = [];

    for (const item of data.api.mediaItems) {
      let quality = 'Unknown';
      let resolution = null;
      if (item.mediaRes && item.mediaRes !== false) {
        resolution = item.mediaRes;
        const height = parseInt(resolution.split('x')[1]);
        if (height === 2160) quality = '4K';
        else if (height === 1440) quality = '2K';
        else if (height === 1080) quality = '1080p';
        else if (height === 720) quality = '720p';
        else if (height === 480) quality = '480p';
        else if (height === 360) quality = '360p';
        else quality = `${height}p`;
      }
      if (item.type === 'Audio' && item.mediaQuality) quality = item.mediaQuality;

      // Get direct download URL (polling as in original script)
      let directUrl = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const check = await fetch(item.mediaUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const contentType = check.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const json = await check.json();
          if (json.status === 'completed' && json.fileUrl) {
            directUrl = json.fileUrl;
            break;
          }
          await new Promise(r => setTimeout(r, 1500));
        } else {
          directUrl = item.mediaUrl;
          break;
        }
      }
      if (!directUrl) continue;

      const formatObj = {
        quality: quality,
        extension: item.mediaExtension || (item.type === 'Audio' ? 'mp3' : 'mp4'),
        size: item.mediaFileSize || 'Unknown',
        downloadUrl: directUrl
      };
      if (item.type === 'Audio') audioFormats.push(formatObj);
      else videoFormats.push(formatObj);
    }

    // Sort: video highest first, audio highest bitrate first
    const videoOrder = ['4K', '2K', '1080p', '720p', '480p', '360p'];
    videoFormats.sort((a,b) => videoOrder.indexOf(a.quality) - videoOrder.indexOf(b.quality));
    audioFormats.sort((a,b) => (parseInt(b.quality)||0) - (parseInt(a.quality)||0));

    const title = data.api.title || 'Unknown';
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    res.status(200).json({
      success: true,
      video: { title, thumbnail, videoId },
      formats: { video: videoFormats, audio: audioFormats }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

function extractVideoId(url) {
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1]?.split('?')[0];
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : null;
      }
