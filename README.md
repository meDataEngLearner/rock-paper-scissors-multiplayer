# Rock, Paper, Scissors Mobile App

A modern, engaging mobile app for playing Rock, Paper, Scissors with beautiful animations, haptic feedback, and multiplayer support.

## Features

### 🎮 Core Gameplay
- **Single Player vs Computer**: Challenge the AI with intelligent random choices
- **Multiplayer Mode**: Play with friends in real-time
- **3-Second Countdown**: Builds anticipation before each round
- **Smooth Animations**: Engaging visual feedback throughout the game

### 🏆 Scoring System
- Track wins, losses, and ties
- Real-time win percentage calculation
- Persistent score tracking during session

### 🎨 Modern UI/UX
- **Gradient Backgrounds**: Beautiful color schemes
- **Haptic Feedback**: Tactile responses for all interactions
- **Smooth Transitions**: Fluid animations between screens
- **Responsive Design**: Optimized for all screen sizes

### 🌐 Multiplayer Features
- **Room System**: Create or join game rooms with unique IDs
- **Real-time Updates**: Live opponent status and game state
- **Room Sharing**: Share room IDs with friends
- **Copy to Clipboard**: Easy room ID sharing

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **React Navigation** for screen management
- **Expo Haptics** for tactile feedback
- **Expo Linear Gradient** for beautiful gradients
- **Expo Clipboard & Sharing** for social features

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rock-paper-scissors-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on your device**
   - Install the Expo Go app on your mobile device
   - Scan the QR code displayed in the terminal
   - Or press 'a' for Android emulator or 'i' for iOS simulator

## Project Structure

```
rock-paper-scissors-app/
├── App.tsx                 # Main app component with navigation
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx      # Game mode selection
│   │   ├── GameScreen.tsx      # Main gameplay screen
│   │   ├── MultiplayerScreen.tsx   # Multiplayer setup
│   │   └── RoomScreen.tsx      # Room management
│   └── components/
│       ├── GameCard.tsx        # Central game display
│       ├── ChoiceButton.tsx    # Rock/Paper/Scissors buttons
│       └── ScoreBoard.tsx      # Score tracking display
├── assets/                 # App icons and splash screens
├── package.json           # Dependencies and scripts
├── app.json              # Expo configuration
└── tsconfig.json         # TypeScript configuration
```

## Game Flow

### Single Player Mode
1. Select "Play vs Computer" from home screen
2. Wait for 3-second countdown
3. Choose Rock, Paper, or Scissors
4. View results with animations
5. Play again or return to menu

### Multiplayer Mode
1. Select "Play vs Friend" from home screen
2. Create a new room or join existing room
3. Share room ID with friend
4. Wait for opponent to join
5. Start the game when both players are ready
6. Play rounds with synchronized countdown

## Customization

### Colors and Themes
The app uses a dark theme with gradient backgrounds. You can customize colors in:
- `src/screens/HomeScreen.tsx` - Home screen gradients
- `src/components/GameCard.tsx` - Game card colors
- `src/components/ChoiceButton.tsx` - Button colors

### Animations
All animations are built using React Native's Animated API:
- Countdown pulse animation
- Button press animations
- Card reveal animations
- Score updates

## Future Enhancements

- [ ] Real-time multiplayer with WebSocket backend
- [ ] User authentication and profiles
- [ ] Global leaderboards
- [ ] Custom themes and avatars
- [ ] Sound effects and background music
- [ ] Tournament mode
- [ ] AI difficulty levels

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub or contact the development team.

---

**Enjoy playing Rock, Paper, Scissors! 🎮✂️📄🪨** 