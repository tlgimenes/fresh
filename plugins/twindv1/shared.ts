import { JSX, options as preactOptions, VNode } from "preact";
import {
  setup as twSetup,
  Sheet,
  tw,
  TwindConfig,
} from "https://esm.sh/@twind/core@1.1.3";

export const STYLE_ELEMENT_ID = "__FRSH_TWIND";

export interface Options extends TwindConfig {
  /** The import.meta.url of the module defining these options. */
  selfURL: string;
}

declare module "preact" {
  namespace JSX {
    interface DOMAttributes<Target extends EventTarget> {
      class?: string;
      className?: string;
    }
  }
}

export function setup({ selfURL: _selfURL, ...config }: Options, sheet: Sheet) {
  const originalClass: string[] = [];
  const resetOriginalClass = () =>
    originalClass.splice(0, originalClass.length);

  twSetup(config, sheet);

  const originalHook = preactOptions.vnode;
  preactOptions.vnode = (vnode: VNode<JSX.DOMAttributes<EventTarget>>) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;

      if (typeof props.class === "string") {
        const transformed = tw(props.class);

        if (transformed !== props.class) {
          originalClass.push(props.class);
        }

        props.class = transformed;
      }
      if (typeof props.className === "string") {
        const transformed = tw(props.className);

        if (transformed !== props.className) {
          originalClass.push(props.className);
        }

        props.className = tw(props.className);
      }
    }

    originalHook?.(vnode);
  };

  return {
    originalClass,
    resetOriginalClass,
  };
}
