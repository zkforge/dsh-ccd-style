import { useEffect, useState } from 'react';
import { Whale } from './Whale.tsx';

/**
 * The whale itself: the artwork, plus the one piece of state it owns — whether
 * the page is hidden.
 *
 * It is a decoration. It reads no session, holds no pose of its own and takes
 * no pointer events: the seat and the artwork are both `pointer-events: none`,
 * so a press in that corner behaves exactly as if the whale were not there.
 * The whole appearance is driven by where it is mounted — the new-session page
 * — and not by anything the component knows.
 * @returns the whale mark.
 */
export function ComposerPet() {
  const [hidden, setHidden] = useState(() => document.hidden);

  useEffect(() => {
    const visibility = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);

  return (
    <span className="ccd-composer-pet" aria-hidden="true" data-paused={hidden || undefined}>
      <Whale />
    </span>
  );
}
