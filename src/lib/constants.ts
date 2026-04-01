import { TeamConfig, Participant } from './types';

export const TEAMS: Record<string, TeamConfig> = {
  SRH: { name: 'Sunrisers Hyderabad', short: 'SRH', color: '#FF822A', textColor: '#000000' },
  KKR: { name: 'Kolkata Knight Riders', short: 'KKR', color: '#3A225D', textColor: '#FFFFFF' },
  CSK: { name: 'Chennai Super Kings', short: 'CSK', color: '#FFC107', textColor: '#000000' },
  GT:  { name: 'Gujarat Titans', short: 'GT',  color: '#1C1C1C', textColor: '#FFFFFF' },
  DC:  { name: 'Delhi Capitals', short: 'DC',  color: '#004C93', textColor: '#FFFFFF' },
  PBKS:{ name: 'Punjab Kings', short: 'PBKS', color: '#ED1B24', textColor: '#FFFFFF' },
  MI:  { name: 'Mumbai Indians', short: 'MI',  color: '#004BA0', textColor: '#FFFFFF' },
  RR:  { name: 'Rajasthan Royals', short: 'RR',  color: '#EA1A85', textColor: '#FFFFFF' },
  LSG: { name: 'Lucknow Super Giants', short: 'LSG', color: '#A72056', textColor: '#FFFFFF' },
  RCB: { name: 'Royal Challengers Bengaluru', short: 'RCB', color: '#EC1C24', textColor: '#FFFFFF' },
};

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F0B27A', '#82E0AA', '#F1948A', '#85929E', '#73C6B6',
  '#E59866', '#A3E4D7', '#F5B7B1', '#AED6F1', '#D7BDE2',
  '#A9DFBF', '#FAD7A0', '#D5F5E3', '#FADBD8', '#D6EAF8',
  '#E8DAEF', '#FCF3CF', '#D4EFDF', '#F9E79F',
];

export const PARTICIPANTS: Participant[] = [
  'BK', 'Dharaneesh', 'Dinesh', 'Gerard', 'Haroon', 'Kerun', 'Kishore',
  'Krish', 'Naina', 'Ramnath', 'Safer', 'Shakthi', 'Vijay', 'Jaya',
  'Yal', 'Alphonse', 'Guhan', 'Jessinth', 'Kesh', 'Panicking',
  'Ranjith', 'Selva', 'Vamsi', 'Shahul', 'Venkat', 'Satish',
  'Azhar', 'Siva', 'Sriram',
].map((name, i) => ({
  id: name.toLowerCase(),
  name,
  avatar_color: AVATAR_COLORS[i],
}));

export const POINTS_CONFIG = {
  league: 2,
  power: 4,
  qualifier1: 8,
  eliminator: 10,
  qualifier2: 10,
  final: 15,
  underdogBonus: 3,
  jokerBonus: 10,
  doubleHeaderBonus: 2,
  minStreak: 3,
  triviaCorrect: 1,
} as const;

export function getMatchPoints(matchType: string, isPowerMatch: boolean): number {
  if (matchType === 'league') {
    return isPowerMatch ? POINTS_CONFIG.power : POINTS_CONFIG.league;
  }
  return POINTS_CONFIG[matchType as keyof typeof POINTS_CONFIG] as number || POINTS_CONFIG.league;
}
