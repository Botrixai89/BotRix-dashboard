import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 

// Returns a random name from a predefined list
export function getRandomName() {
  const names = [
    'Alex', 'Jamie', 'Taylor', 'Jordan', 'Morgan', 'Casey', 'Riley', 'Drew', 'Skyler',
    'Avery', 'Peyton', 'Quinn', 'Reese', 'Rowan', 'Sawyer', 'Emerson', 'Finley', 'Harper',
    'Charlie', 'Sam', 'Cameron', 'Dakota', 'Elliot', 'Jesse', 'Kai', 'Logan', 'Parker',
    'Remy', 'Shay', 'Toby', 'Blake', 'Corey', 'Dylan', 'Frankie', 'Jules', 'Kendall',
    'Lane', 'Marley', 'Nico', 'Oakley', 'Phoenix', 'Reagan', 'Sage', 'Tatum', 'Val',
    'Wren', 'Zion', 'John', 'Tom', 'Chris', 'Pat', 'Alexis', 'Robin', 'Shawn', 'Tracy'
  ];
  return names[Math.floor(Math.random() * names.length)];
} 