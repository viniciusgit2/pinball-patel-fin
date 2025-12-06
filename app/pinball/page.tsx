'use client';

import { useEffect, useRef, useState } from 'react';

export default function PinballGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lifeLost, setLifeLost] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  const gameStateRef = useRef({
    ball: { x: 600, y: 700, vx: 0, vy: 0, radius: 15 },
    leftFlipper: { angle: 0.5, targetAngle: 0.5 },
    rightFlipper: { angle: -0.5, targetAngle: -0.5 },
    bumpers: [
      { x: 300, y: 280, radius: 45, points: 100 },
      { x: 600, y: 200, radius: 45, points: 100 },
      { x: 900, y: 280, radius: 45, points: 100 },
      { x: 450, y: 420, radius: 35, points: 50 },
      { x: 750, y: 420, radius: 35, points: 50 },
    ],
    targets: [
      { x: 120, y: 550, width: 30, height: 90, hit: false, points: 200, color: '#ffff00' },
      { x: 1050, y: 550, width: 30, height: 90, hit: false, points: 200, color: '#ffff00' },
      { x: 200, y: 120, width: 25, height: 80, hit: false, points: 300, color: '#ff00ff' },
      { x: 500, y: 100, width: 25, height: 80, hit: false, points: 300, color: '#ff00ff' },
      { x: 800, y: 120, width: 25, height: 80, hit: false, points: 300, color: '#ff00ff' },
      { x: 180, y: 350, width: 20, height: 70, hit: false, points: 150, color: '#00ffff' },
      { x: 1000, y: 350, width: 20, height: 70, hit: false, points: 150, color: '#00ffff' },
      { x: 380, y: 250, width: 15, height: 50, hit: false, points: 100, color: '#00ff88' },
      { x: 530, y: 250, width: 15, height: 50, hit: false, points: 100, color: '#00ff88' },
      { x: 680, y: 250, width: 15, height: 50, hit: false, points: 100, color: '#00ff88' },
      { x: 250, y: 700, width: 30, height: 60, hit: false, points: 500, color: '#ff0066' },
      { x: 920, y: 700, width: 30, height: 60, hit: false, points: 500, color: '#ff0066' },
    ],
    inPlay: false,
    ballFell: false,
    launchEffect: 0,
  });

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/audio/audio jogo.mp3');
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;
    
    // Initialize Web Audio API for sound effects
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Play/pause background music based on mute state
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
    }
  }, [isMuted]);

  // Sound effect functions
  const playSound = (frequency: number, duration: number, volume: number = 0.3) => {
    if (isMuted || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(volume, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (e) {
      console.log('Sound effect failed:', e);
    }
  };

  const playSoundEffect = (type: 'bumper' | 'target' | 'flipper' | 'launch' | 'gameOver') => {
    switch (type) {
      case 'bumper':
        playSound(800, 0.1, 0.2);
        break;
      case 'target':
        playSound(1200, 0.15, 0.25);
        break;
      case 'flipper':
        playSound(400, 0.05, 0.15);
        break;
      case 'launch':
        playSound(600, 0.2, 0.2);
        break;
      case 'gameOver':
        playSound(200, 0.5, 0.3);
        break;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleBallLost = () => {
    const newLives = lives - 1;
    setLifeLost(true);
    playSoundEffect('gameOver');
    
    setTimeout(() => {
      setLifeLost(false);
      if (newLives <= 0) {
        setGameOver(true);
        setHighScore(s => Math.max(s, score));
        if (audioRef.current) {
          audioRef.current.pause();
        }
      } else {
        setLives(newLives);
        gameStateRef.current.ball = { x: 600, y: 700, vx: 0, vy: 0, radius: 15 };
        gameStateRef.current.inPlay = false;
        gameStateRef.current.ballFell = false;
      }
    }, 1000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const GRAVITY = 0.13;
    const FRICTION = 0.987;
    const FLIPPER_SPEED = 0.3;
    const BOUNCE_FACTOR = 0.6;

    const resetBall = () => {
      const state = gameStateRef.current;
      state.ball = { x: 600, y: 700, vx: 0, vy: 0, radius: 15 };
      state.inPlay = false;
    };

    const launchBall = () => {
      const state = gameStateRef.current;
      if (!state.inPlay) {
        state.ball.vx = -0.8;
        state.ball.vy = -5.5;
        state.inPlay = true;
        state.launchEffect = 20;
        playSoundEffect('launch');
      }
    };

    const checkBumperCollision = (ball: any, bumper: any) => {
      const dx = ball.x - bumper.x;
      const dy = ball.y - bumper.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < ball.radius + bumper.radius) {
        const angle = Math.atan2(dy, dx);
        const speed = 5;
        ball.vx = Math.cos(angle) * speed;
        ball.vy = Math.sin(angle) * speed;
        setScore(s => s + bumper.points);
        playSoundEffect('bumper');
        return true;
      }
      return false;
    };

    const checkTargetCollision = (ball: any, target: any) => {
      if (target.hit) return false;
      
      if (ball.x > target.x && ball.x < target.x + target.width &&
          ball.y > target.y && ball.y < target.y + target.height) {
        target.hit = true;
        ball.vx *= -1;
        setScore(s => s + target.points);
        playSoundEffect('target');
        return true;
      }
      return false;
    };

    const checkFlipperCollision = (ball: any, flipper: any, isLeft: boolean) => {
      const flipperX = isLeft ? 375 : 825;
      const flipperY = 825;
      const flipperLength = 150;
      
      const endX = flipperX + Math.cos(flipper.angle) * flipperLength;
      const endY = flipperY + Math.sin(flipper.angle) * flipperLength;
      
      const dx = ball.x - flipperX;
      const dy = ball.y - flipperY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < ball.radius + flipperLength && distance > 0) {
        const flipperAngle = Math.atan2(endY - flipperY, endX - flipperX);
        const ballAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(flipperAngle - ballAngle);
        
        if (angleDiff < 0.5) {
          const speed = 5;
          ball.vx = Math.cos(flipperAngle - Math.PI / 4) * speed * (isLeft ? 1 : -1);
          ball.vy = Math.sin(flipperAngle - Math.PI / 2) * speed;
          playSoundEffect('flipper');
          return true;
        }
      }
      return false;
    };

    const update = () => {
      const state = gameStateRef.current;
      const ball = state.ball;

      if (state.inPlay) {
        // Apply gravity
        ball.vy += GRAVITY;
        
        // Apply friction
        ball.vx *= FRICTION;
        ball.vy *= FRICTION;
        
        // Update position
        ball.x += ball.vx;
        ball.y += ball.vy;

        // Wall collisions
        if (ball.x - ball.radius < 75) {
          ball.x = 75 + ball.radius;
          ball.vx *= -BOUNCE_FACTOR;
        }
        if (ball.x + ball.radius > 1125) {
          ball.x = 1125 - ball.radius;
          ball.vx *= -BOUNCE_FACTOR;
        }
        if (ball.y - ball.radius < 75) {
          ball.y = 75 + ball.radius;
          ball.vy *= -BOUNCE_FACTOR;
        }

        // Check if ball fell off
        if (ball.y > 875 && !state.ballFell) {
          state.ballFell = true;
          handleBallLost();
        }

        // Bumper collisions
        state.bumpers.forEach(bumper => checkBumperCollision(ball, bumper));

        // Target collisions
        state.targets.forEach(target => checkTargetCollision(ball, target));

        // Flipper collisions
        checkFlipperCollision(ball, state.leftFlipper, true);
        checkFlipperCollision(ball, state.rightFlipper, false);
      }

      // Update flippers
      state.leftFlipper.angle += (state.leftFlipper.targetAngle - state.leftFlipper.angle) * FLIPPER_SPEED;
      state.rightFlipper.angle += (state.rightFlipper.targetAngle - state.rightFlipper.angle) * FLIPPER_SPEED;
    };

    const draw = () => {
      if (!ctx || !canvas) return;

      const state = gameStateRef.current;

      // Clear canvas with dark background
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw neon borders with glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ffff';
      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(75, 75, 1050, 825);
      
      // Add inner glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ff00ff';
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(77, 77, 1046, 821);
      ctx.shadowBlur = 0;

      // Draw bumpers with neon glow
      state.bumpers.forEach(bumper => {
        // Outer glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ff0066';
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0066';
        ctx.fill();
        
        // Inner circle
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius - 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ff3388';
        ctx.fill();
        
        // Center highlight
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(bumper.x, bumper.y, bumper.radius - 12, 0, Math.PI * 2);
        ctx.fillStyle = '#ff99cc';
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Draw targets with neon glow
      state.targets.forEach(target => {
        if (!target.hit) {
          const targetColor = target.color || '#ffff00';
          ctx.shadowBlur = 20;
          ctx.shadowColor = targetColor;
          ctx.fillStyle = targetColor;
          ctx.fillRect(target.x, target.y, target.width, target.height);
          
          ctx.shadowBlur = 10;
          const brightColor = targetColor === '#ff0066' ? '#ff3388' : 
                            targetColor === '#ff00ff' ? '#ff66ff' :
                            targetColor === '#00ffff' ? '#66ffff' :
                            targetColor === '#00ff88' ? '#66ffaa' : '#ffff66';
          ctx.fillStyle = brightColor;
          ctx.fillRect(target.x + 3, target.y + 3, target.width - 6, target.height - 6);
          
          // Draw point value
          ctx.shadowBlur = 5;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(target.points.toString(), target.x + target.width / 2, target.y + target.height / 2 + 3);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = '#222233';
          ctx.fillRect(target.x, target.y, target.width, target.height);
        }
      });

      // Draw flippers with neon glow
      const drawFlipper = (x: number, y: number, angle: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // Outer glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#00ff88';
        ctx.fillStyle = '#00ff88';
        ctx.fillRect(0, -18, 150, 36);
        
        // Inner bright part
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#66ffaa';
        ctx.fillRect(2, -14, 146, 28);
        ctx.shadowBlur = 0;
        
        ctx.restore();
      };

      drawFlipper(375, 825, state.leftFlipper.angle);
      drawFlipper(825, 825, state.rightFlipper.angle);

      // Draw ball with intense neon glow
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      
      // Add cyan glow layer
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#00ffff';
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.radius - 2, 0, Math.PI * 2);
      ctx.fillStyle = '#eeffff';
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw launcher
      if (!state.inPlay) {
        const launcherX = 620;
        const launcherY = 780;
        const launcherWidth = 40;
        const launcherHeight = 80;
        
        // Launcher tube with glow - RED
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ff0000';
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(launcherX - launcherWidth / 2, launcherY, launcherWidth, launcherHeight);
        
        // Inner bright part - GOLDEN
        ctx.shadowBlur = 10;
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(launcherX - launcherWidth / 2 + 3, launcherY + 3, launcherWidth - 6, launcherHeight - 6);
        
        // Ball in launcher
        ctx.shadowBlur = 25;
        ctx.shadowColor = '#ffaa00';
        ctx.beginPath();
        ctx.arc(launcherX, launcherY + 20, state.ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffcc00';
        ctx.fill();
        
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ff6600';
        ctx.beginPath();
        ctx.arc(launcherX, launcherY + 20, state.ball.radius - 2, 0, Math.PI * 2);
        ctx.fillStyle = '#ffee88';
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Launch effect
      if (state.launchEffect > 0) {
        const effectSize = (20 - state.launchEffect) * 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#ff0000';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(620, 800, Math.max(1, effectSize), 0, Math.PI * 2);
        ctx.stroke();
        
        if (effectSize > 10) {
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#ffcc00';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(620, 800, effectSize - 10, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        state.launchEffect--;
        ctx.shadowBlur = 0;
      }

      // Draw launch hint with neon style
      if (!state.inPlay) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Pressione ESPAÇO para lançar', 600, 720);
        ctx.shadowBlur = 0;
      }
    };

    const gameLoop = () => {
      update();
      draw();
      requestAnimationFrame(gameLoop);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.code === 'Space') {
        e.preventDefault();
        launchBall();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        state.leftFlipper.targetAngle = -1.2;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        state.rightFlipper.targetAngle = 1.2;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        state.leftFlipper.targetAngle = 0.5;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        state.rightFlipper.targetAngle = -0.5;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [score, lives]);

  const handleRestart = () => {
    setScore(0);
    setLives(3);
    setGameOver(false);
    setLifeLost(false);
    gameStateRef.current.ball = { x: 600, y: 700, vx: 0, vy: 0, radius: 15 };
    gameStateRef.current.inPlay = false;
    gameStateRef.current.ballFell = false;
    gameStateRef.current.targets.forEach(t => t.hit = false);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-6xl font-bold mb-2 drop-shadow-lg" style={{
          color: '#00ffff',
          textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #ff00ff'
        }}>
          🎯 PINBALL
        </h1>
        <div className="flex gap-8 justify-center items-center">
          <div className="text-white">
            <div className="text-sm opacity-75" style={{ color: '#00ffff' }}>Pontuação</div>
            <div className="text-3xl font-bold" style={{
              color: '#ffff00',
              textShadow: '0 0 10px #ffff00, 0 0 20px #ffff00'
            }}>{score}</div>
          </div>
          <div className="text-white">
            <div className="text-sm opacity-75" style={{ color: '#00ffff' }}>Vidas</div>
            <div className="text-3xl font-bold" style={{
              color: '#ff00ff',
              textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff'
            }}>{'❤️'.repeat(Math.max(0, lives))}</div>
          </div>
          <div className="text-white">
            <div className="text-sm opacity-75" style={{ color: '#00ffff' }}>Recorde</div>
            <div className="text-3xl font-bold" style={{
              color: '#00ff88',
              textShadow: '0 0 10px #00ff88, 0 0 20px #00ff88'
            }}>{highScore}</div>
          </div>
          <button
            onClick={toggleMute}
            className="text-white px-4 py-2 rounded-lg transition-all text-2xl"
            style={{
              background: 'rgba(0, 255, 255, 0.2)',
              border: '2px solid #00ffff',
              boxShadow: '0 0 10px #00ffff'
            }}
            title={isMuted ? 'Ativar som' : 'Silenciar'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <div className="relative" style={{ width: '65vw', maxWidth: '800px' }}>
        <canvas
          ref={canvasRef}
          width={1280}
          height={920}
          className="rounded-lg w-full h-auto"
          style={{
            border: '4px solid #00ffff',
            boxShadow: '0 0 20px #00ffff, 0 0 40px #ff00ff, inset 0 0 20px rgba(0,255,255,0.1)'
          }}
        />
        
        {lifeLost && !gameOver && (
          <div className="absolute inset-0 bg-red-600 bg-opacity-40 flex items-center justify-center rounded-lg animate-pulse pointer-events-none">
            <div className="text-center">
              <h2 className="text-6xl font-bold mb-2" style={{
                color: '#ff0000',
                textShadow: '0 0 20px #ff0000, 0 0 40px #ff0000, 0 0 60px #ff0000'
              }}>💔</h2>
              <p className="text-4xl font-bold" style={{
                color: '#ffffff',
                textShadow: '0 0 10px #ff0000, 0 0 20px #ff0000'
              }}>VIDA PERDIDA!</p>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="absolute inset-0 bg-black bg-opacity-90 flex items-center justify-center rounded-lg" style={{
            backdropFilter: 'blur(10px)'
          }}>
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-4" style={{
                color: '#ff00ff',
                textShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff'
              }}>Game Over!</h2>
              <p className="text-3xl mb-6" style={{
                color: '#ffff00',
                textShadow: '0 0 10px #ffff00, 0 0 20px #ffff00'
              }}>Pontuação: {score}</p>
              <button
                onClick={handleRestart}
                className="px-8 py-3 rounded-lg text-xl font-bold transition-transform hover:scale-110"
                style={{
                  background: 'linear-gradient(135deg, #00ff88, #00ffff)',
                  color: '#000',
                  boxShadow: '0 0 20px #00ffff, 0 0 40px #00ff88'
                }}
              >
                Jogar Novamente
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center max-w-md">
        <h3 className="text-xl font-bold mb-2" style={{
          color: '#00ffff',
          textShadow: '0 0 10px #00ffff'
        }}>Controles:</h3>
        <p style={{ color: '#ffffff', opacity: 0.8 }}>
          <strong style={{ color: '#ffff00' }}>ESPAÇO:</strong> Lançar bola<br />
          <strong style={{ color: '#ffff00' }}>← ou A:</strong> Flipper esquerdo<br />
          <strong style={{ color: '#ffff00' }}>→ ou D:</strong> Flipper direito
        </p>
      </div>
    </div>
  );
}
