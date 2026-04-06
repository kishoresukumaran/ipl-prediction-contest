export interface Participant {
  id: string;
  name: string;
  avatar_color: string;
}

export interface Match {
  id: number;
  match_date: string;
  start_time: string;
  day_of_week: string;
  home_team: string;
  away_team: string;
  venue: string;
  match_type: 'league' | 'qualifier1' | 'eliminator' | 'qualifier2' | 'final';
  is_power_match: boolean;
  underdog_team: string | null;
  winner: string | null;
  is_completed: boolean;
  result_updated_at: string | null;
}

export interface Prediction {
  id: number;
  match_id: number;
  participant_id: string;
  predicted_team: string;
}

export interface Joker {
  participant_id: string;
  match_id: number | null;
  declared_at: string | null;
}

export interface Trivia {
  id: number;
  trivia_date: string;
  question: string;
  correct_answer: string | null;
}

export interface TriviaResponse {
  id: number;
  trivia_id: number;
  participant_id: string;
  response: string | null;
  is_correct: boolean;
}

export interface TriviaPoints {
  id: number;
  player: string;
  trivia_id: number;
  prediction: string;
  correct_answer: string;
  correct_check: number; // 1 for correct, 0 for incorrect
  points_earned: number;
}


export interface StreakInfo {
  start: number; // match id
  end: number;   // match id
  length: number;
}

export interface PlayerPointsBreakdown {
  participantId: string;
  participantName: string;
  totalPoints: number;
  basePoints: number;
  powerMatchPoints: number;
  underdogBonus: number;
  jokerBonus: number;
  doubleHeaderBonus: number;
  streakBonus: number;
  abandonedPoints: number;
  triviaPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  currentStreak: number;
  longestStreak: number;
  streaks: StreakInfo[];
  rank?: number;
  previousRank?: number;
}

export interface MatchWithPredictions extends Match {
  predictions: (Prediction & { participant_name: string; is_correct?: boolean })[];
}

export interface TeamConfig {
  name: string;
  short: string;
  color: string;
  textColor: string;
}

export interface InsightsData {
  pointsRace: { matchId: number; matchDate: string; [playerId: string]: number | string }[];
  teamPopularity: { team: string; correct: number; wrong: number; total: number }[];
  accuracyByPlayer: { id: string; name: string; accuracy: number; correct: number; total: number }[];
  weeklyPoints: { week: string; [playerId: string]: number | string }[];
}
