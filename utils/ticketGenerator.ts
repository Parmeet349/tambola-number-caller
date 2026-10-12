// utils/ticketGenerator.ts
import { WinClaimType } from './partySync';

export function generateTicket(): number[][] {
  const cols = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
    [30, 31, 32, 33, 34, 35, 36, 37, 38, 39],
    [40, 41, 42, 43, 44, 45, 46, 47, 48, 49],
    [50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    [60, 61, 62, 63, 64, 65, 66, 67, 68, 69],
    [70, 71, 72, 73, 74, 75, 76, 77, 78, 79],
    [80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90],
  ];

  let valid = false;
  let ticket: number[][] = [];

  while (!valid) {
    ticket = [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ];

    let colCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (let r = 0; r < 3; r++) {
      let colsForThisRow: number[] = [];
      while (colsForThisRow.length < 5) {
        let c = Math.floor(Math.random() * 9);
        if (!colsForThisRow.includes(c) && colCounts[c] < 3) {
          colsForThisRow.push(c);
          colCounts[c]++;
        }
      }
      colsForThisRow.forEach((c) => {
        let pool = cols[c];
        let val = pool[Math.floor(Math.random() * pool.length)];
        while (ticket[0][c] === val || ticket[1][c] === val) {
          val = pool[Math.floor(Math.random() * pool.length)];
        }
        ticket[r][c] = val;
      });
    }

    // Ensure authentic Tambola rule: every column must have at least 1 number
    if (colCounts.some((count) => count === 0)) {
      continue;
    }

    for (let c = 0; c < 9; c++) {
      let vals: number[] = [];
      for (let r = 0; r < 3; r++) if (ticket[r][c] !== 0) vals.push(ticket[r][c]);
      vals.sort((a, b) => a - b);
      let vIdx = 0;
      for (let r = 0; r < 3; r++) if (ticket[r][c] !== 0) ticket[r][c] = vals[vIdx++];
    }
    valid = true;
  }
  return ticket;
}

/**
 * Verify whether a claim is valid against currently called numbers
 */
export function checkWinClaim(
  ticket: number[][],
  calledSet: Set<number>,
  claimType: WinClaimType
): { isValid: boolean; matchedCount: number; missing: number[] } {
  const allNumbers: number[] = [];
  ticket.forEach((row) => row.forEach((n) => n > 0 && allNumbers.push(n)));

  if (claimType === 'Early 5') {
    const called = allNumbers.filter((n) => calledSet.has(n));
    return {
      isValid: called.length >= 5,
      matchedCount: called.length,
      missing: called.length >= 5 ? [] : allNumbers.filter((n) => !calledSet.has(n)),
    };
  }

  if (claimType === 'Top Line') {
    const row = ticket[0].filter((n) => n > 0);
    const missing = row.filter((n) => !calledSet.has(n));
    return {
      isValid: missing.length === 0,
      matchedCount: row.length - missing.length,
      missing,
    };
  }

  if (claimType === 'Middle Line') {
    const row = ticket[1].filter((n) => n > 0);
    const missing = row.filter((n) => !calledSet.has(n));
    return {
      isValid: missing.length === 0,
      matchedCount: row.length - missing.length,
      missing,
    };
  }

  if (claimType === 'Bottom Line') {
    const row = ticket[2].filter((n) => n > 0);
    const missing = row.filter((n) => !calledSet.has(n));
    return {
      isValid: missing.length === 0,
      matchedCount: row.length - missing.length,
      missing,
    };
  }

  if (claimType === 'Four Corners') {
    const topRow = ticket[0].filter((n) => n > 0);
    const bottomRow = ticket[2].filter((n) => n > 0);
    if (topRow.length === 0 || bottomRow.length === 0) {
      return { isValid: false, matchedCount: 0, missing: [] };
    }
    const corners = [topRow[0], topRow[topRow.length - 1], bottomRow[0], bottomRow[bottomRow.length - 1]];
    const missing = corners.filter((n) => !calledSet.has(n));
    return {
      isValid: missing.length === 0,
      matchedCount: 4 - missing.length,
      missing,
    };
  }

  if (claimType === 'Full House') {
    const missing = allNumbers.filter((n) => !calledSet.has(n));
    return {
      isValid: missing.length === 0,
      matchedCount: 15 - missing.length,
      missing,
    };
  }

  return { isValid: false, matchedCount: 0, missing: [] };
}
