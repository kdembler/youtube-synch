import { youtube_v3 } from 'googleapis/build/src/apis/youtube/v3';

const YOUTUBE_THUMBNAIL_QUALITY_TYPES = ["maxres", "standard", "high", "medium", "default"] as const;

const selectHighestQualityThumbnail = (thumbnailsObject?: youtube_v3.Schema$ThumbnailDetails) => {
  if(!thumbnailsObject){
    return null;
  }

  const availableQualityTypes = Object.keys(thumbnailsObject);

  for(let index = 0; index < YOUTUBE_THUMBNAIL_QUALITY_TYPES.length; index++) {
    if (availableQualityTypes.includes(YOUTUBE_THUMBNAIL_QUALITY_TYPES[index])) {
      return thumbnailsObject[YOUTUBE_THUMBNAIL_QUALITY_TYPES[index]];
    }
  }
}

const formatVideoData = (videos: youtube_v3.Schema$PlaylistItem[]) => {
  const formattedVideos = videos.map(video => {
    return {
      title: video?.snippet?.title ?? "",
      description: video?.snippet?.description ?? "",
      thumbnail: selectHighestQualityThumbnail(video?.snippet?.thumbnails),
      publishedAt: video?.contentDetails?.videoPublishedAt ?? "",
      videoId: video?.contentDetails?.videoId ?? ""
    };
  });

  return formattedVideos;
};

export default formatVideoData;