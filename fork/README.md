# fork/

Upstream projects forked to `chirag127/*` and vendored as submodules. Nothing here ships in the install catalog; it is the research/backport base for the `*-auto-bypass` scripts.

| Submodule | Upstream | Why |
|---|---|---|
| [OmniRoute](https://github.com/chirag127/OmniRoute-1) | `diegosouzapw/OmniRoute` | Free multi-provider AI gateway. Fork used for experimentation; local changes stay on the fork. |
| [Turnstile-Slip](https://github.com/chirag127/Turnstile-Slip) | `Iruko233/Turnstile-Slip` | Node + Chrome `cf_clearance` harvester. Source of the click-timing model used by `turnstile-auto-bypass`. |
| [Turnstile-Solver](https://github.com/chirag127/Turnstile-Solver) | `Theyka/Turnstile-Solver` | Patchright multi-threaded solver. Reference for retry/backoff behaviour. |

## Rules

- Fork, never vendor a copy. `git submodule update --init --recursive` after cloning.
- Upstream PRs go from a branch on the fork, never from `main`.
- Local changes to a fork are committed on the fork and pushed; the pointer bump lands here.
- License of each submodule stays upstream's. SUL/fair-code projects (OmniRoute is MIT, check each) are not relicensed.

## Sync

```bash
git submodule update --init --recursive fork
git -C fork/<name> fetch upstream
git -C fork/<name> merge upstream/main   # or rebase your branch
git add fork/<name> && git commit -m "chore(fork): bump <name>"
```
