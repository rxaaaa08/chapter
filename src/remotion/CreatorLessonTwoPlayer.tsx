import React from 'react';
import { Player } from '@remotion/player';
import {
  CREATOR_LESSON_TWO_DURATION,
  CREATOR_LESSON_TWO_FPS,
  CREATOR_LESSON_TWO_HEIGHT,
  CREATOR_LESSON_TWO_WIDTH,
  CreatorLessonTwo,
} from './CreatorLessonTwo';

type Props = { handle: string };

const CreatorLessonTwoPlayer: React.FC<Props> = ({ handle }) => (
  <Player
    aria-label="Lesson 2 explainer: how a booking becomes your commission"
    component={CreatorLessonTwo}
    inputProps={{ handle }}
    durationInFrames={CREATOR_LESSON_TWO_DURATION}
    compositionWidth={CREATOR_LESSON_TWO_WIDTH}
    compositionHeight={CREATOR_LESSON_TWO_HEIGHT}
    fps={CREATOR_LESSON_TWO_FPS}
    controls
    clickToPlay
    showVolumeControls={false}
    style={{ width: '100%', aspectRatio: '9 / 16' }}
  />
);

export default CreatorLessonTwoPlayer;
