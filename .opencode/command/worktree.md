---
description: Crea un worktree de git en .worktrees/<nombre> a partir del argumento recibido.
---

Ejecuta ÚNICAMENTE el siguiente comando bash y no hagas nada más:

    git worktree add .worktrees/<nombre>

- `<nombre>` sale del argumento recibido ($ARGUMENTS): úsalo tal cual si no tiene espacios; si tiene espacios, reemplázalos por guiones medios (ej. "feature login page" → "feature-login-page") y elimina caracteres no válidos para un nombre de directorio.
- No cambies de directorio de trabajo.
- No hagas commits, no revises archivos, ni ningún otro paso.
- Si el argumento es muy largo simplificalo a un nomrbre significativo.

Ejecuta el comando desde el directorio actual con la herramienta Shell; si falla, solo reporta el error del comando.