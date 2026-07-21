import React from 'react';
import { Player } from '@remotion/player';
import {
  CREATOR_LESSON_SEVEN_DURATION,
  CREATOR_LESSON_SEVEN_FPS,
  CREATOR_LESSON_SEVEN_HEIGHT,
  CREATOR_LESSON_SEVEN_WIDTH,
  CreatorLessonSeven,
} from './CreatorLessonSeven';

type Props = { handle: string };

const CreatorLessonSevenPlayer: React.FC<Props> = ({ handle }) => (
  <Player
    aria-label="Lesson 7 explainer: bio link versus auto-DM"
    component={CreatorLessonSeven}
    inputProps={{ handle }}
    durationInFrames={CREATOR_LESSON_SEVEN_DURATION}
    compositionWidth={CREATOR_LESSON_SEVEN_WIDTH}
    compositionHeight={CREATOR_LESSON_SEVEN_HEIGHT}
    fps={CREATOR_LESSON_SEVEN_FPS}
    controls
    clickToPlay
    showVolumeControls={false}
    style={{ width: '100%', aspectRatio: '9 / 16' }}
  />
);

export default CreatorLessonSevenPlayer;
