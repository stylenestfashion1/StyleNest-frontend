# Third-Party Notices

This project includes source-level components adapted from the
[React Bits](https://reactbits.dev) component library
(GitHub: [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits)),
obtained via its `shadcn` registry (`npx shadcn add @react-bits/<component>`),
plus one npm dependency one of those components pulls in.

## React Bits components

| Component in this repo | React Bits registry name | Used for |
|---|---|---|
| `src/components/SplashCursor.jsx` | `SplashCursor-JS-TW` | WebGL fluid-cursor effect on the Men/Women/Home entry sections |
| `src/components/SplashCursorOriginal.jsx` | `SplashCursor-JS-TW` | Unmodified reference copy, not imported/used anywhere |
| `src/components/ScrollStack.jsx` | `ScrollStack-JS-TW` | Scroll-driven card-stacking effect (category browsing) |
| `src/components/ScrollExpand.jsx` | `ScrollExpand-JS-TW` | Scroll-driven media-expand campaign sections |
| `src/components/ParticleText.jsx` | `ParticleText-JS-TW` | Particle-assembled headline text on entry sections |

**License:** React Bits is distributed under the **MIT + Commons Clause
License Condition v1.0** (per its repository's `LICENSE.md`, copyright David
Haz). In summary: free use, modification, and distribution *as part of an
application or product* (including commercial use) is permitted, provided
the copyright notice is retained; selling, sublicensing, or redistributing
the components themselves — standalone, bundled, or ported — is not. This
project uses these components exactly that way: embedded within the
StyleNest storefront, not distributed as a standalone library.

Full text: https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md

`SplashCursor.jsx` and `ScrollStack.jsx` carry in-file comments describing
what was changed from the original registry source (performance tuning,
lifecycle/reliability hardening, and — for `ScrollStack.jsx` — a measurement
bugfix) and, in `SplashCursorOriginal.jsx`'s case, an unmodified reference
copy is kept alongside for comparison. No copyright or attribution text
from the original source was present to strip, since the registry delivers
raw component source without an embedded license header; attribution is
recorded here instead, per the license's requirement to keep the notice
"included in all copies or substantial portions of the Software."

## npm dependencies pulled in by the above

| Package | Version | License | Pulled in by |
|---|---|---|---|
| [`lenis`](https://github.com/darkroomengineering/lenis) | ^1.3.13 | MIT | `ScrollStack.jsx` (smooth-scroll driver) |

---

If another React Bits (or similar third-party) component is added to this
project later, add a row above rather than creating a second notices file.
