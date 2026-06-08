# 🎲 3D Dice Rotation Game

> A stunning interactive 3D dice rolling game with milestone celebrations and leaderboard tracking!

## 🌟 Features

- **Interactive 3D Dice** - Beautiful rotating dice with smooth physics animations
- **Real-time Scoring** - Track your correct guesses and compete for a high score
- **Milestone Celebrations** - Reach every multiple of 5 (5, 10, 15, 20...) to trigger spectacular fireworks with sound! 🎆
- **Click-to-Stop Celebration** - Click anywhere to stop the fireworks anytime
- **High Score Tracking** - Your best score is saved locally in your browser
- **Responsive Design** - Plays beautifully on all screen sizes
- **Smooth Animations** - Enjoy particle effects and visual feedback on every roll
- **Fireworks Sound Effects** - Enjoy audio feedback with every celebration burst

## 🎮 How to Play

1. **Enter a Guess** - Pick a number between 1 and 6
2. **Roll the Dice** - Click the "Roll" button or tap the dice to spin it
3. **Check Results** - Your guess is compared with the rolled number
4. **Score Points** - Correct guesses increase your score
5. **Reach Milestones** - Get a score of 5, 10, 15, 20... to trigger the celebration with fireworks!

## 🎯 Gameplay

- Each correct guess adds 1 point to your score
- Incorrect guesses don't reset your score, so keep trying!
- Your high score is automatically saved and persists between sessions
- When you reach a multiple of 5, celebrate with fireworks and sound effects
- **Click anywhere during celebration to stop it and continue playing**
- The game never ends - challenge yourself to beat your previous record!
- Unlimited celebration milestones - celebrate at every 5 points!

## 🚀 Technical Stack

- **Three.js** - 3D graphics rendering
- **Canvas API** - 2D pip visualization
- **WebGL** - Hardware-accelerated graphics
- **Web Audio API** - Procedurally generated fireworks sounds
- **Pure JavaScript** - No frameworks, lightweight and fast

## 🎨 Visual Design

- Dark gradient background for immersive experience
- Responsive HUD (Heads-Up Display) with game controls
- Real-time dice face preview
- Particle-based fireworks celebration system with multi-burst sequences
- Smooth quaternion-based dice rotations
- Sound-synchronized visual effects

## 💾 Local Storage

- High scores are saved to browser `localStorage`
- Your progress is preserved even after closing the browser
- No data is sent to external servers

## 📁 Project Structure

```
3Dice/
├── index.html           # Main HTML entry point
├── favicon.svg          # App icon
├── README.md            # This file
└── src/
    ├── main.js          # Game logic and Three.js setup
    ├── RoundedBoxGeometry.js  # Custom 3D geometry
    └── styles.css       # Styling and animations
```

## ✨ Special Thanks

Built with ❤️ using Three.js, Web Audio API, and modern web technologies.

---

**Ready to roll? Open `https://santubenia.github.io/3Dice/` in your browser and start playing! 🎲**
