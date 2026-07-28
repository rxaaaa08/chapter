// Inspiration reels shown behind the "Watch our videos" link on the creator
// dashboard (see CreatorInspiration.tsx). Two audiences need different examples:
//   - creators shoot their own reels in their own style;
//   - video editors cut our raw event footage into highlight reels.
// So each audience gets its own list. This is a deliberately hardcoded list —
// there is no admin editor for it; to add/swap/remove a reel, edit this file.
//
// Titles are intentionally simple ("Reel 1", "Reel 2"…) for now; swap them for
// descriptive names whenever the owner sends them. Links open on Instagram in a
// new tab (the phone hands off to the IG app if installed).
export type InspirationReel = { title: string; instagramUrl: string };

export const CREATOR_INSPIRATION_REELS: InspirationReel[] = [
  { title: 'Reel 1', instagramUrl: 'https://www.instagram.com/reel/DZm-ODwSO5I/' },
  { title: 'Reel 2', instagramUrl: 'https://www.instagram.com/reel/DVtQTHEEk02/' },
  { title: 'Reel 3', instagramUrl: 'https://www.instagram.com/reel/DZmhk91SWIg/' },
  { title: 'Reel 4', instagramUrl: 'https://www.instagram.com/reel/DZne_NvS5RD/' },
];

export const EDITOR_INSPIRATION_REELS: InspirationReel[] = [
  { title: 'Reel 1', instagramUrl: 'https://www.instagram.com/reel/DZvQkKRS2Ae/' },
  { title: 'Reel 2', instagramUrl: 'https://www.instagram.com/reel/Da9esaMSv8C/' },
  { title: 'Reel 3', instagramUrl: 'https://www.instagram.com/reel/DaVUGfqSnxc/' },
  { title: 'Reel 4', instagramUrl: 'https://www.instagram.com/reel/DZbrorbzvIB/' },
];
