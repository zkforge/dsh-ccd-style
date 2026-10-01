import type { Context } from '@deepseek-ai/cordis';
import type { HostServices } from '../contracts/ports.ts';
import { TARGET_DSH_VERSION } from '../../shared/identity.ts';

/** This compatibility boundary targets the pinned SDK, not arbitrary DSH versions. */
export function createHostServices(ctx: Context): HostServices {
  const slots = ctx.slots;
  const theme = ctx.theme;
  const workspace = ctx.uiWorkspace;
  if (typeof slots?.inject !== 'function' || typeof slots.register !== 'function'
    || typeof theme?.overrideTokens !== 'function'
    || typeof workspace?.startSession !== 'function') {
    throw new Error(`DSH ${TARGET_DSH_VERSION} UI services are required`);
  }
  return {
    slots,
    theme,
    workspace: {
      openSession: target => workspace.openSession(target),
      openWorkspace: (id, beforeOpen) => workspace.openWorkspace(id, beforeOpen),
      startSession: id => workspace.startSession(id),
    },
  };
}
