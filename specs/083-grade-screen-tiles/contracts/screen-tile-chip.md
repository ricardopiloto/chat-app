# Contract: Screen tile chip

| ID | Rule |
|----|------|
| SC-01 | Screen tile chip shows participant **handle** plus an explicit screen-share affordance (icon and/or short label). |
| SC-02 | Camera tile chip remains handle-only (current behavior). |
| SC-03 | Affordance is i18n-aware (`en` + `pt-BR`) and exposed to AT (`aria-label` includes handle + “screen”/“tela”). |
| SC-04 | Spotlight control (if on chip) appears **only** on screen tiles, not camera tiles. |
