"use client";

import { useEffect, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Container, Engine } from "@tsparticles/engine";

export default function ParticlesBackground() {
    const [init, setInit] = useState(false);

    useEffect(() => {
        initParticlesEngine(async (engine: Engine) => {
            await loadSlim(engine);
        }).then(() => {
            setInit(true);
        });
    }, []);

    const particlesLoaded = async (container?: Container): Promise<void> => {
        // console.log(container);
    };

    if (init) {
        return (
            <Particles
                id="tsparticles"
                particlesLoaded={particlesLoaded}
                className="absolute inset-0 w-full h-full z-0"
                options={{
                    fullScreen: { enable: false }, // Only cover the container (Hero)
                    background: {
                        color: {
                            value: "transparent",
                        },
                    },
                    fpsLimit: 120,
                    interactivity: {
                        events: {
                            onHover: {
                                enable: true,
                                mode: "grab",
                            },
                            onClick: {
                                enable: true,
                                mode: "push",
                            },
                            resize: true as any // ts workaround if needed, usually boolean is fine but types vary
                        },
                        modes: {
                            grab: {
                                distance: 140,
                                links: {
                                    opacity: 1,
                                },
                            },
                            push: {
                                quantity: 4,
                            },
                        },
                    },
                    particles: {
                        number: {
                            value: 80,
                            density: {
                                enable: true,
                                width: 800, // standard density area
                                height: 800
                            }
                        },
                        color: { value: "#ffffff" },
                        links: {
                            enable: true,
                            distance: 150,
                            color: "#ffffff",
                            opacity: 0.4,
                            width: 1
                        },
                        move: {
                            enable: true,
                            speed: 1,
                            direction: "none",
                            outModes: { default: "bounce" }
                        },
                        size: { value: { min: 1, max: 3 } },
                        opacity: {
                            value: 0.5
                        }
                    },
                    detectRetina: true,
                }}
            />
        );
    }

    return <></>;
}
