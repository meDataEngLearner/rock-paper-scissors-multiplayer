// Utility to provide random hand sign images for rock, paper, scissors

export const handImages = {
  rock: [
    require('../../assets/rock/hand_rock_blue.png'),
    require('../../assets/rock/hand_rock_white.png'),
  ],
  paper: [
    require('../../assets/paper/hand_paper_yellow.png'),
    require('../../assets/paper/hand_paper_white.png'),
  ],
  scissors: [
    require('../../assets/scissors/hand_scissors_red.png'),
    require('../../assets/scissors/hand_scissors_white.png'),
  ],
};

export function getRandomHandImage(action: 'rock' | 'paper' | 'scissors') {
  const arr = handImages[action];
  return arr[Math.floor(Math.random() * arr.length)];
} 