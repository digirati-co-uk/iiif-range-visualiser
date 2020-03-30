export type TimeStop = {
  type: 'time-stop';
  canvasIndex: number;
  start: number;
  end: number;
  duration: number;
  rangeId: string;
  rangeStack: string[];
};

export type TimePlan = {
  type: 'time-plan';
  duration: number;
  start: number;
  end: number;
  stops: TimeStop[];
  rangeId: string;
  canvases: any[];
  rangeStack: string[];
  items: Array<TimeStop | TimePlan>;
};

// functions.
// - forward 20
// - back 20
// - next range from time
// - previous range from time
// - time to range
// - canvas clock to range
