# External Research and Skill Provenance

Snapshot date: 2026-06-22. GitHub stars are time-sensitive and are recorded only as an adoption
signal, not a quality guarantee.

## Repositories evaluated

| Repository                                                                              | Stars at snapshot | License reported                           | Recent activity   | Evaluation                                                                                  |
| --------------------------------------------------------------------------------------- | ----------------: | ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------- |
| [obra/superpowers](https://github.com/obra/superpowers)                                 |           235,846 | MIT                                        | Pushed 2026-06-22 | Selected: focused engineering methodology and explicit Codex support.                       |
| [anthropics/skills](https://github.com/anthropics/skills)                               |           153,869 | Mixed/not reported at repository root      | Pushed 2026-06-09 | Strong adoption, but not selected as the implementation-process source.                     |
| [ComposioHQ/awesome-claude-skills](https://github.com/ComposioHQ/awesome-claude-skills) |            65,526 | Not reported at repository root            | Pushed 2026-05-22 | A catalog rather than one controlled implementation method.                                 |
| [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)     |            26,117 | MIT                                        | Pushed 2026-06-20 | Broad catalog; useful for discovery, unnecessary for current scope.                         |
| [openai/skills](https://github.com/openai/skills)                                       |            22,716 | Per-skill/repository metadata not reported | Pushed 2026-06-17 | Official Codex catalog; existing built-in skills remain preferred when directly applicable. |

Metadata was read from the official GitHub API and repository files. Star counts must be refreshed
before making a future claim about relative popularity.

## Selected skills

Source: [`obra/superpowers`](https://github.com/obra/superpowers)

- `writing-plans` — decomposition, exact file mapping, acceptance steps, and self-review.
- `executing-plans` — checkpointed inline plan execution.
- `test-driven-development` — failing behavior test before production implementation.
- `systematic-debugging` — root-cause evidence before a fix.
- `verification-before-completion` — fresh command evidence before success claims.

Installed under the user's Codex skill directory on 2026-06-22. Codex must be restarted before new
sessions can automatically discover them.

## Adoption boundaries

- Use the skills as engineering process guidance; do not import their runtime code into the CRM.
- User, system, developer, repository, and security instructions override external skill guidance.
- Do not spawn subagents unless the user explicitly requests delegation or parallel agents.
- Do not commit after every small step automatically; commit only when the user authorizes repository
  history changes and the staged scope is reviewed.
- Do not install additional third-party skills merely because they have many stars.
- Review a skill's complete instructions and license before first use.

## Why stars are insufficient

Selection also considered license clarity, current maintenance, direct Codex compatibility, task fit,
instruction scope, security impact, and whether the method produces inspectable evidence. Popularity
helped identify mature candidates; it did not decide architecture or product scope.
