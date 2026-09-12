// lib/serialize.ts
//
// `LessonVideo.fileSize` is a BigInt, which `JSON.stringify` refuses to
// serialize. Every route that returns a video must widen it to a string first;
// this is the single place that happens.

/** A video row as it leaves the API: fileSize widened from BigInt to string. */
export type SerializedVideo<T extends { fileSize: bigint }> = Omit<
  T,
  "fileSize"
> & { fileSize: string };

export function serializeVideo<T extends { fileSize: bigint }>(
  video: T
): SerializedVideo<T> {
  return { ...video, fileSize: video.fileSize.toString() };
}

export function serializeVideos<T extends { fileSize: bigint }>(
  videos: T[]
): SerializedVideo<T>[] {
  return videos.map(serializeVideo);
}
