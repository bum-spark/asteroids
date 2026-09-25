# Asteroids

Clon del clásico arcade **Asteroids** implementado en canvas HTML5 puro, sin dependencias ni bundler.

## Descripción

Nave espacial en un campo de asteroides con envolvimiento de bordes (el espacio es toroidal). Destruye asteroides para sumar puntos: los grandes se parten en medianos, los medianos en pequeños. Incluye power-ups especiales y tipos de asteroides únicos como la estrella fugaz.

## Tecnologías

- **HTML5 Canvas** — renderizado 2D
- **JavaScript (ES6+)** — lógica del juego en un solo archivo `game.js`
- Sin frameworks, sin bundler, sin dependencias

## Cómo correr

Abre `index.html` directamente en el navegador (doble clic), o usa un servidor local:

```bash
npx serve .
```

Luego visita `http://localhost:3000`.

## Controles

| Tecla     | Acción     |
| --------- | ---------- |
| `←` `→`   | Rotar nave |
| `↑`       | Propulsar  |
| `Espacio` | Disparar   |
| `1` – `6` | Cambiar skin de la nave |

## Puntuación

| Asteroide | Puntos |
| --------- | ------ |
| Grande    | 20     |
| Mediano   | 50     |
| Pequeño   | 100    |

## Características

- 3 vidas con invencibilidad temporal al reaparecer (parpadeo)
- Asteroides se parten en fragmentos más pequeños al ser destruidos
- Partículas de explosión al destruir asteroides
- Power-up **Velocidad**: suelta al azar al destruir asteroides; al recogerlo duplica la aceleración durante 5 segundos, con barra de tiempo restante en la esquina inferior izquierda
- Power-up **Escudo**: suelta al azar al destruir asteroides o estrellas fugaces; al recogerlo protege la nave durante 6 segundos con una burbuja que anula los impactos (asteroides y estrellas siguen su camino intactos), con barra de tiempo restante bajo la de Velocidad
- Power-up **Triple shot**: suelta al azar al destruir asteroides o estrellas fugaces; al recogerlo dispara 3 balas en paralelo durante 5 segundos, con barra de tiempo restante
- **Skins**: 6 naves desbloqueables con las teclas `1`–`6` (se guarda la selección)
- **Nave ESCOPETA**: silueta de doble cañón que lanza 2 disparos dispersos por ráfaga (abanico de 0.4 rad) en lugar de un tiro recto; con el power-up Triple shot pasa a 3 balas en abanico
- **Estrella fugaz**: asteroide especial en forma de estrella dorada, más rápido que los normales, con estela y destellos; aparece con poca probabilidad al destruir asteroides, desaparece solo y da 200 puntos
