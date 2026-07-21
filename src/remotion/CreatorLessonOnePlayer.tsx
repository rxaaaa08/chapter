import React from 'react';
import { Player } from '@remotion/player';
import {
  CREATOR_LESSON_ONE_DURATION,
  CREATOR_LESSON_ONE_FPS,
  CREATOR_LESSON_ONE_HEIGHT,
  CREATOR_LESSON_ONE_WIDTH,
  CreatorLessonOne,
} from './CreatorLessonOne';

type Props = {
  handle: string;
};

const CreatorLessonOnePlayer: React.FC<Props> = ({ handle }) => (
  <Player
    aria-label="Lesson 1 infographic: from comment to creator commission"
    component={CreatorLessonOne}
    inputProps={{ handle }}
    durationInFrames={CREATOR_LESSON_ONE_DURATION}
    compositionWidth={CREATOR_LESSON_ONE_WIDTH}
    compositionHeight={CREATOR_LESSON_ONE_HEIGHT}
    fps={CREATOR_LESSON_ONE_FPS}
    acknowledgeRemotionLicense
    controls
    clickToPlay
    showVolumeControls={false}
    style={{ width: '100%', aspectRatio: '16 / 9' }}
  />
);

export default CreatorLessonOnePlayer;
