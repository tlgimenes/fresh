import {
  getSheet,
  setup,
  Sheet,
  stringify,
  tw,
  TwindConfig,
} from "https://esm.sh/@twind/core@1.1.3";
import { JSX, options as preactOptions, VNode } from "preact";
import { STYLE_ELEMENT_ID } from "./shared.ts";

function freshSheet(classes: string[]): Sheet<CSSStyleSheet> {
  const element = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  const target = element.sheet!;

  let resuming = true

  return {
    target,

    snapshot() {
      // collect current rules
      const rules = Array.from(target.cssRules, (rule) => rule.cssText);

      return () => {
        // remove all existing rules
        this.clear();

        // add all snapshot rules back
        // eslint-disable-next-line @typescript-eslint/unbound-method
        rules.forEach(this.insert as (cssText: string, index: number) => void);
      };
    },

    clear() {
      // remove all added rules
      for (let index = target.cssRules.length; index--;) {
        target.deleteRule(index);
      }
    },

    destroy() {
      target.ownerNode?.remove();
    },

    insert(cssText, index) {
      if (resuming) {
        return
      }

      try {
        // Insert
        target.insertRule(cssText, index);
      } catch (error) {
        // Empty rule to keep index valid — not using `*{}` as that would show up in all rules (DX)
        target.insertRule(":root{}", index);

        // Some thrown errors are because of specific pseudo classes
        // lets filter them to prevent unnecessary warnings
        // ::-moz-focus-inner
        // :-moz-focusring
        if (!/:-[mwo]/.test(cssText)) {
          console.warn((error as Error).message, "TWIND_INVALID_CSS", cssText);
        }
      }
    },

    resume: (addClassName, insert) => {
      // Add missing fresh classnames
      classes.forEach(addClassName);

      // hydration from SSR sheet
      const textContent = stringify(target);
      const RE = /\/\*!([\da-z]+),([\da-z]+)(?:,(.+?))?\*\//g;

      // only if this is a hydratable sheet
      if (RE.test(textContent)) {
        // RE has global flag — reset index to get the first match as well
        RE.lastIndex = 0;

        // 2. add all existing class attributes to the token/className cache
        if (typeof document != "undefined") {
          for (const el of document.querySelectorAll("[class]")) {
            addClassName(el.getAttribute("class") as string);
          }
        }

        // 3. parse SSR styles
        let lastMatch: RegExpExecArray | null | undefined;

        while (
          (function commit(match?: RegExpExecArray | null) {
            if (lastMatch) {
              insert(
                // grep the cssText from the previous match end up to this match start
                textContent.slice(
                  lastMatch.index + lastMatch[0].length,
                  match?.index,
                ),
                {
                  p: parseInt(lastMatch[1], 36),
                  o: parseInt(lastMatch[2], 36) / 2,
                  n: lastMatch[3],
                },
              );
            }

            return (lastMatch = match);
          })(RE.exec(textContent))
        ) {
          /* no-op */
        }
      }

      resuming = false
    },
  };
}

export default function hydrate(options: TwindConfig, state: string[]) {
  // const originalHook = preactOptions.vnode;
  // // deno-lint-ignore no-explicit-any
  // preactOptions.vnode = (vnode: VNode<JSX.DOMAttributes<any>>) => {
  //   if (typeof vnode.type === "string" && typeof vnode.props === "object") {
  //     const { props } = vnode;

  //     if (typeof props.class === "string") {
  //       props.class = tw(props.class);
  //     }
  //     if (typeof props.className === "string") {
  //       props.className = tw(props.className);
  //     }
  //   }

  //   originalHook?.(vnode);
  // };

  const sheet = freshSheet(state);

  setup(options, sheet);
}
