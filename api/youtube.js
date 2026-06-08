// api/youtube.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { url } = req.query;
  if (!url) return res.status(400).json({ success: false, error: "URL required" });

  try {
    // Use ytdl API from https://ytdl.vercel.app (public)
    const apiUrl = `https://ytdl.vercel.app/api/info?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (!data.formats) throw new Error('No formats found');

    const videoFormats = [];
    const audioFormats = [];

    for (const fmt of data.formats) {
      if (fmt.hasVideo && fmt.hasAudio) {
        let quality = fmt.qualityLabel || fmt.height + 'p';
        videoFormats.push({
          quality: quality,
          extension: fmt.container || 'mp4',
          size: fmt.contentLength ? (parseInt(fmt.contentLength) / 1048576).toFixed(2) + ' MB' : 'Unknown',
          downloadUrl: fmt.url
        });
      } else if (fmt.hasAudio && !fmt.hasVideo) {
        let quality = fmt.audioBitrate ? fmt.audioBitrate + 'kbps' : 'AAC';
        audioFormats.push({
          quality: quality,
          extension: fmt.container || 'm4a',
          size: fmt.contentLength ? (parseInt(fmt.contentLength) / 1048576).toFixed(2) + ' MB' : 'Unknown',
          downloadUrl: fmt.url
        });
      }
    }

    // Sort video: highest quality first
    const videoOrder = ['2160p', '1440p', '1080p', '720p', '480p', '360p'];
    videoFormats.sort((a,b) => {
      let aIdx = videoOrder.findIndex(q => a.quality.includes(q));
      let bIdx = videoOrder.findIndex(q => b.quality.includes(q));
      if (aIdx === -1) aIdx = 999;
      if (bIdx === -1) bIdx = 999;
      return aIdx - bIdx;
    });
    audioFormats.sort((a,b) => {
      let aBit = parseInt(a.quality) || 0;
      let bBit = parseInt(b.quality) || 0;
      return bBit - aBit;
    });

    res.status(200).json({
      success: true,
      video: {
        title: data.title,
        thumbnail: data.thumbnail,
        videoId: data.videoId,
        duration: data.lengthSeconds
      },
      formats: { video: videoFormats, audio: audioFormats }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
                      }
