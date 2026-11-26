import React from 'react';
import {useT} from '../lib/useT';
import {SkySet} from './SkySet';
import {WindowSet} from './WindowSet';
import {SectionSet} from './SectionSet';

/**
 * Airplane-window explainer: three miniature set pieces on separate plinths.
 * The camera path (story.json) glides/whips between them:
 *   A (x=0)  toy jet           - hook
 *   B (x=14) window module     - "three layers of plastic"
 *   C (x=28) pressure section  - the actual story
 */
export const Scene: React.FC = () => {
  const t = useT();
  return (
    <>
      <SkySet t={t} />
      <WindowSet t={t} />
      <SectionSet t={t} />
    </>
  );
};
