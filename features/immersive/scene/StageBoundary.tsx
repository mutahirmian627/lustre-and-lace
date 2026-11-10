"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Called once if anything in the 3D scene throws while rendering. */
  onError: (error: Error) => void;
}

/**
 * Catches a crash anywhere in the 3D scene (a shader that won't compile on some graphics driver, say) so it can only
 * ever cost the visitor the live scene, never the page. The loader then shows the pictures and offers to try again.
 */
export class StageBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error("[immersive] the 3D scene failed; showing pictures instead", error);
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
