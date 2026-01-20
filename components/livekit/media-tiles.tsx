import React, { useMemo } from 'react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import {
  type TrackReference,
  useLocalParticipant,
  useTracks,
  useVoiceAssistant,
} from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { AgentTile } from './agent-tile';
import { AvatarTile } from './avatar-tile';
import { VideoTile } from './video-tile';

const MotionVideoTile = motion.create(VideoTile);
const MotionAgentTile = motion.create(AgentTile);
const MotionAvatarTile = motion.create(AvatarTile);

const animationProps = {
  initial: {
    opacity: 0,
    scale: 0,
  },
  animate: {
    opacity: 1,
    scale: 1,
  },
  exit: {
    opacity: 0,
    scale: 0,
  },
  transition: {
    type: 'spring',
    stiffness: 675,
    damping: 75,
    mass: 1,
  },
};

const classNames = {
  // GRID
  // 2 Columns x 3 Rows
  grid: [
    'h-full w-full',
    'grid gap-x-2 place-content-center',
    'grid-cols-[1fr_1fr] grid-rows-[90px_1fr_90px]',
  ],
  // Agent
  // chatOpen: true,
  // hasSecondTile: true
  // layout: Column 1 / Row 1
  // align: x-end y-center
  agentChatOpenWithSecondTile: ['col-start-1 row-start-1', 'self-center justify-self-end'],
  // Agent
  // chatOpen: true,
  // hasSecondTile: false
  // layout: Column 1 / Row 1 / Column-Span 2
  // align: x-center y-center
  agentChatOpenWithoutSecondTile: ['col-start-1 row-start-1', 'col-span-2', 'place-content-center'],
  // Agent
  // chatOpen: false
  // layout: Column 1 / Row 1 / Column-Span 2 / Row-Span 3
  // align: x-center y-center
  agentChatClosed: ['col-start-1 row-start-1', 'col-span-2 row-span-3', 'place-content-center'],
  // Second tile
  // chatOpen: true,
  // hasSecondTile: true
  // layout: Column 2 / Row 1
  // align: x-start y-center
  secondTileChatOpen: ['col-start-2 row-start-1', 'self-center justify-self-start'],
  // Second tile
  // chatOpen: false,
  // hasSecondTile: false
  // layout: Column 2 / Row 2
  // align: x-end y-end
  secondTileChatClosed: ['col-start-2 row-start-3', 'place-content-end'],
};

export function useLocalTrackRef(source: Track.Source) {
  const { localParticipant } = useLocalParticipant();
  const publication = localParticipant.getTrackPublication(source);
  const trackRef = useMemo<TrackReference | undefined>(
    () => (publication ? { source, participant: localParticipant, publication } : undefined),
    [source, publication, localParticipant]
  );
  return trackRef;
}

interface MediaTilesProps {
  chatOpen: boolean;
}

export function MediaTiles({ chatOpen }: MediaTilesProps) {
  const {
    state: agentState,
    audioTrack: agentAudioTrack,
    videoTrack: agentVideoTrack,
  } = useVoiceAssistant();
  const [screenShareTrack] = useTracks([Track.Source.ScreenShare]);
  const cameraTrack: TrackReference | undefined = useLocalTrackRef(Track.Source.Camera);

  const isCameraEnabled = cameraTrack && !cameraTrack.publication.isMuted;
  const isScreenShareEnabled = screenShareTrack && !screenShareTrack.publication.isMuted;

  const isAvatar = agentVideoTrack !== undefined;

  const avatarMaxWidth = chatOpen ? 'max-w-2xl' : 'max-w-6xl';
  const agentMaxWidth = chatOpen ? 'max-w-md' : 'max-w-lg';

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4">
      {/* Main agent tile (avatar or audio visualizer) */}
      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          {!isAvatar && (
            // audio-only agent
            <MotionAgentTile
              key="agent"
              layoutId="agent"
              {...animationProps}
              state={agentState}
              audioTrack={agentAudioTrack}
              className={cn('h-auto w-full', agentMaxWidth)}
            />
          )}
          {isAvatar && (
            // avatar agent
            <MotionAvatarTile
              key="avatar"
              layoutId="avatar"
              {...animationProps}
              videoTrack={agentVideoTrack}
              className={cn('h-auto w-full', avatarMaxWidth)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Secondary tiles (camera/screen) - shown below avatar if needed */}
      {(isCameraEnabled || isScreenShareEnabled) && (
        <div className="flex gap-2">
          <AnimatePresence>
            {cameraTrack && isCameraEnabled && (
              <MotionVideoTile
                key="camera"
                layoutId="camera"
                {...animationProps}
                trackRef={cameraTrack}
                className="h-[120px] w-[160px]"
              />
            )}
            {isScreenShareEnabled && (
              <MotionVideoTile
                key="screen"
                layoutId="screen"
                {...animationProps}
                trackRef={screenShareTrack}
                className="h-[120px] w-[160px]"
              />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
