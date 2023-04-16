import {
  cssom,
  getSheet,
  setup,
  tw,
  TwindConfig,
} from "https://esm.sh/@twind/core@1.1.3";
import { JSX, options as preactOptions, VNode } from "preact";
import { STYLE_ELEMENT_ID } from "./shared.ts";

export default function hydrate(options: TwindConfig, state: string[]) {
  const originalHook = preactOptions.vnode;
  // deno-lint-ignore no-explicit-any
  preactOptions.vnode = (vnode: VNode<JSX.DOMAttributes<any>>) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;

      if (typeof props.class === "string") {
        props.class = tw(props.class);
      }
      if (typeof props.className === "string") {
        props.className = tw(props.className);
      }
    }

    originalHook?.(vnode);
  };

  const elem = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  const sheet = cssom(elem);

  const resume = getSheet().resume.bind(sheet);

  sheet.resume = (addClassName, insert) => {
    for (const className of state) {
      addClassName(className);
    }

    resume(addClassName, insert);
  };
  document.querySelector('[data-twind="claimed"]')?.remove();

  setup(options, sheet);
}
