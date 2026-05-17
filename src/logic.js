const SEEDS = {
  add: {
    1: [[12, 3], [21, 4], [13, 5], [32, 6], [41, 5]],
    2: [[12, 13], [21, 34], [25, 22], [41, 15], [33, 24]],
    3: [[15, 6], [18, 4], [23, 8], [27, 5], [19, 7]],
    4: [[16, 25], [27, 18], [35, 27], [48, 23], [56, 27]],
    5: [[14, 22], [17, 8], [36, 27], [25, 13], [48, 19]],
    6: [[47, 38], [56, 24], [39, 27], [65, 18], [49, 36]],
  },
  sub: {
    1: [[15, 3], [24, 2], [19, 4], [38, 5], [47, 3]],
    2: [[45, 23], [38, 17], [76, 34], [59, 26], [88, 45]],
    3: [[22, 7], [31, 4], [24, 9], [32, 5], [43, 8]],
    4: [[32, 15], [41, 23], [52, 28], [65, 37], [81, 44]],
    5: [[45, 23], [32, 15], [56, 28], [67, 45], [82, 47]],
    6: [[51, 28], [73, 46], [84, 37], [92, 58], [65, 29]],
  },
  mult: {
    1: { mode: "tap", pairs: [[2, 1], [2, 2], [2, 3], [2, 4], [2, 5]] },
    2: { mode: "tap", pairs: [[3, 1], [3, 2], [3, 3], [3, 4], [3, 5]] },
    3: { mode: "tap", pairs: [[4, 1], [4, 2], [4, 3], [4, 4], [4, 5]] },
    4: { mode: "drag", pairs: [[2, 3], [3, 2], [3, 3], [4, 2], [2, 4]] },
    5: { mode: "drag", pairs: [[3, 4], [4, 3], [3, 5], [5, 3], [4, 4]] },
    6: { mode: "drag", pairs: [[5, 4], [4, 5], [5, 5], [3, 5], [4, 4]] },
  },
};

export function getProblems(world, level) {
  if (world === "mult") {
    const { mode, pairs } = SEEDS.mult[level];
    return pairs.map(([a, b]) => ({ op: "×", a, b, answer: a * b, mode }));
  }
  const op = world === "add" ? "+" : "-";
  return SEEDS[world][level].map(([a, b]) => ({
    op,
    a,
    b,
    answer: op === "+" ? a + b : a - b,
  }));
}

export function analyze(p) {
  const aTens = Math.floor(p.a / 10);
  const aOnes = p.a % 10;
  const bTens = Math.floor(p.b / 10);
  const bOnes = p.b % 10;
  const answerTens = Math.floor(p.answer / 10);
  const answerOnes = p.answer % 10;
  if (p.op === "+") {
    return { aTens, aOnes, bTens, bOnes, answerTens, answerOnes,
             carry: aOnes + bOnes >= 10 };
  }
  if (p.op === "-") {
    const needsBorrow = aOnes < bOnes;
    const out = { aTens, aOnes, bTens, bOnes, answerTens, answerOnes,
                  borrow: needsBorrow };
    if (needsBorrow) {
      out.borrowFromTens = aTens - 1;
      out.borrowedOnes = aOnes + 10;
    }
    return out;
  }
  return { aTens, aOnes, bTens, bOnes, answerTens, answerOnes };
}
