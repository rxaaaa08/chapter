import React from 'react';
import { Composition } from 'remotion';
import {
  CREATOR_LESSON_ONE_DURATION,
  CREATOR_LESSON_ONE_FPS,
  CREATOR_LESSON_ONE_HEIGHT,
  CREATOR_LESSON_ONE_WIDTH,
  CreatorLessonOne,
} from './CreatorLessonOne';
import {
  CREATOR_LESSON_TWO_DURATION,
  CREATOR_LESSON_TWO_FPS,
  CREATOR_LESSON_TWO_HEIGHT,
  CREATOR_LESSON_TWO_WIDTH,
  CreatorLessonTwo,
} from './CreatorLessonTwo';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="creator-lesson-1"
      component={CreatorLessonOne}
      durationInFrames={CREATOR_LESSON_ONE_DURATION}
      fps={CREATOR_LESSON_ONE_FPS}
      width={CREATOR_LESSON_ONE_WIDTH}
      height={CREATOR_LESSON_ONE_HEIGHT}
      defaultProps={{ handle: 'yourhandle' }}
    />
    <Composition
      id="creator-lesson-2"
      component={CreatorLessonTwo}
      durationInFrames={CREATOR_LESSON_TWO_DURATION}
      fps={CREATOR_LESSON_TWO_FPS}
      width={CREATOR_LESSON_TWO_WIDTH}
      height={CREATOR_LESSON_TWO_HEIGHT}
      defaultProps={{ handle: 'yourhandle' }}
    />
  </>
);
