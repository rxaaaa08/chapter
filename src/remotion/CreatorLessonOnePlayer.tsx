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
    aria-label="Lesson 1 explainer: how a follower reaches your link"
    component={CreatorLessonOne}
    inputProps={{ handle }}
    durationInFrames={CREATOR_LESSON_ONE_DURATION}
    compositionWidth={CREATOR_LESSON_ONE_WIDTH}
    compositionHeight={CREATOR_LESSON_ONE_HEIGHT}
    fps={CREATOR_LESSON_ONE_FPS}
    controls
    clickToPlay
    showVolumeControls={false}
    style={{ width: '100%', aspectRatio: '9 / 16' }}
  />
);

export default CreatorLessonOnePlayer;
