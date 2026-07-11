import React, { Suspense, lazy, useEffect, useState } from 'react';
import { ParticleField } from './ParticleField';

const Spline = lazy(() => import('@splinetool/react-spline'));

// Placeholder public Spline scene — swap for a branded ExamFlow AI scene export
// (spline.design → Export → "Public URL") when one is available.
const DEFAULT_SCENE = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode';

interface SplineErrorBoundaryState {
  hasError: boolean;
}

class SplineErrorBoundary extends React.Component<{ children: React.ReactNode; fallback: React.ReactNode }, SplineErrorBoundaryState> {
  constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 900);
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return isDesktop;
}

export interface SplineSceneProps {
  scene?: string;
  className?: string;
}

/** Interactive 3D hero background. WebGL is heavy, so this only mounts on desktop viewports
 * and always falls back to the lightweight canvas ParticleField on mobile, while loading,
 * or if the scene fails to load (e.g. offline, or the placeholder URL above gets rate-limited). */
export const SplineScene: React.FC<SplineSceneProps> = ({ scene = DEFAULT_SCENE, className }) => {
  const isDesktop = useIsDesktop();
  const fallback = <ParticleField className={className} />;

  if (!isDesktop) return fallback;

  return (
    <SplineErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Spline scene={scene} className={className} />
      </Suspense>
    </SplineErrorBoundary>
  );
};
