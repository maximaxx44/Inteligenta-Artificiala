"""Pygame visualizer for the exact same Boids model used by index.html."""

import argparse
import json
import subprocess
from pathlib import Path

import pygame


def load_frames(scenario):
    command = ["node", str(Path(__file__).with_name("experiments.js")), "--frames", scenario]
    return json.loads(subprocess.check_output(command, encoding="utf-8"))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--scenario", default="base",
                        choices=("base", "near", "wide", "aligned", "compact", "noSeparation"))
    args = parser.parse_args()
    frames = load_frames(args.scenario)

    pygame.display.init()
    pygame.font.init()
    screen = pygame.display.set_mode((600, 638))
    pygame.display.set_caption("Boids - " + args.scenario)
    font = pygame.font.Font(None, 22)
    clock = pygame.time.Clock()
    step = 0
    paused = False
    running = True
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    running = False
                elif event.key == pygame.K_SPACE:
                    paused = not paused
                elif event.key == pygame.K_r:
                    step = 0
                    paused = False
        screen.fill("#10202a")
        for line in range(60, 600, 60):
            pygame.draw.line(screen, "#274551", (line, 0), (line, 600))
            pygame.draw.line(screen, "#274551", (0, line), (600, line))
        for points in frames[step]:
            pygame.draw.polygon(screen, "#9aebd0", points)
        pygame.draw.rect(screen, "#172731", (0, 600, 600, 38))
        label = font.render(f"Step {step}/600    Space: pause    R: restart", True, "#eaf4f5")
        screen.blit(label, (12, 611))
        pygame.display.flip()
        if not paused and step < len(frames) - 1:
            step += 1
        clock.tick(30)
    pygame.quit()


if __name__ == "__main__":
    main()
