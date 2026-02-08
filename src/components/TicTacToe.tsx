import { createMemo, createSignal, For, type Component } from "solid-js";

type Player = "X" | "O" | null;
type Board = Player[];

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8], // rows
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8], // cols
  [0, 4, 8],
  [2, 4, 6], // diagonals
] as const;

const checkWinner = (
  b: Board,
): { winner: Player; combo: readonly number[] | null } => {
  for (const combo of WINNING_COMBOS) {
    const [a, c, d] = combo;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) {
      return { winner: b[a], combo };
    }
  }
  return { winner: null, combo: null };
};

const isBoardFull = (b: Board): boolean => b.every((cell) => cell !== null);

const getEmptyCells = (b: Board): number[] =>
  b.map((v, i) => (v === null ? i : -1)).filter((i) => i !== -1);

// Minimax with limited depth to make AI beatable
const minimax = (
  b: Board,
  depth: number,
  isMax: boolean,
  maxDepth: number,
): number => {
  const { winner } = checkWinner(b);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (isBoardFull(b) || depth >= maxDepth) return 0;

  const empty = getEmptyCells(b);

  if (isMax) {
    let best = -Infinity;
    for (const i of empty) {
      b[i] = "O";
      best = Math.max(best, minimax(b, depth + 1, false, maxDepth));
      b[i] = null;
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      b[i] = "X";
      best = Math.min(best, minimax(b, depth + 1, true, maxDepth));
      b[i] = null;
    }
    return best;
  }
};

const getAIMove = (board: Board): number => {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  // Make AI beatable: 10% chance to make a random move
  if (Math.random() < 0.1) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  // Clone board for minimax calculations
  const boardCopy = [...board];
  let bestScore = -Infinity;
  let bestMove = empty[0];
  const maxDepth = 4;

  for (const i of empty) {
    boardCopy[i] = "O";
    const score = minimax(boardCopy, 0, false, maxDepth);
    boardCopy[i] = null;
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }

  return bestMove;
};

const GamepadIcon: Component = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="var(--primary)"
    class="icon icon-tabler icons-tabler-filled icon-tabler-device-gamepad"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M20 5a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-16a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3zm-12 4l-.117 .007a1 1 0 0 0 -.883 .993v1h-1a1 1 0 0 0 -1 1l.007 .117a1 1 0 0 0 .993 .883h1v1a1 1 0 0 0 1 1l.117 -.007a1 1 0 0 0 .883 -.993v-1h1a1 1 0 0 0 1 -1l-.007 -.117a1 1 0 0 0 -.993 -.883h-1v-1a1 1 0 0 0 -1 -1m10 3a1 1 0 0 0 -1 1v.01a1 1 0 0 0 2 0v-.01a1 1 0 0 0 -1 -1m-3 -2a1 1 0 0 0 -1 1v.01a1 1 0 0 0 2 0v-.01a1 1 0 0 0 -1 -1" />
  </svg>
);

type GameStatus = "playing" | "player-won" | "ai-won" | "draw";

const TicTacToe: Component = () => {
  const [board, setBoard] = createSignal<Board>(Array(9).fill(null));
  const [gameStatus, setGameStatus] = createSignal<GameStatus>("playing");
  const [winningCombo, setWinningCombo] = createSignal<
    readonly number[] | null
  >(null);
  const [playerScore, setPlayerScore] = createSignal(0);
  const [aiScore, setAiScore] = createSignal(0);
  const [isAiThinking, setIsAiThinking] = createSignal(false);

  const statusText = createMemo(() => {
    switch (gameStatus()) {
      case "player-won":
        return "You win! 🎉";
      case "ai-won":
        return "AI wins! 🤖";
      case "draw":
        return "It's a draw! 🤝";
      default:
        return isAiThinking() ? "AI thinking..." : "Your turn (X)";
    }
  });

  const isGameOver = createMemo(() => gameStatus() !== "playing");

  const makeMove = (index: number, player: Player): boolean => {
    const currentBoard = board();
    if (currentBoard[index] || isGameOver()) return false;

    const newBoard = [...currentBoard];
    newBoard[index] = player;
    setBoard(newBoard);
    return true;
  };

  const endGame = (
    status: GameStatus,
    combo: readonly number[] | null = null,
  ) => {
    setGameStatus(status);
    setWinningCombo(combo);

    if (status === "player-won") {
      setPlayerScore((s) => s + 1);
    } else if (status === "ai-won") {
      setAiScore((s) => s + 1);
    }
  };

  const handleAiMove = () => {
    const currentBoard = board();
    const aiMove = getAIMove(currentBoard);

    if (aiMove !== -1) {
      const newBoard = [...currentBoard];
      newBoard[aiMove] = "O";
      setBoard(newBoard);

      const { winner, combo } = checkWinner(newBoard);
      if (winner) {
        endGame("ai-won", combo);
        setIsAiThinking(false);
        return;
      }

      if (isBoardFull(newBoard)) {
        endGame("draw");
        setIsAiThinking(false);
        return;
      }
    }

    setIsAiThinking(false);
  };

  const handlePlayerMove = (index: number) => {
    if (isAiThinking() || isGameOver()) return;
    if (!makeMove(index, "X")) return;

    const currentBoard = board();
    const { winner, combo } = checkWinner(currentBoard);

    if (winner) {
      endGame("player-won", combo);
      return;
    }

    if (isBoardFull(currentBoard)) {
      endGame("draw");
      return;
    }

    // AI's turn
    setIsAiThinking(true);
    setTimeout(handleAiMove, 300);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setGameStatus("playing");
    setWinningCombo(null);
    setIsAiThinking(false);
  };

  const isCellDisabled = (index: number): boolean => {
    return board()[index] !== null || isGameOver() || isAiThinking();
  };

  const getCellClasses = (index: number): string => {
    const value = board()[index];
    const combo = winningCombo();
    const isWinner = combo?.includes(index);

    const classes = [
      "ttt-cell",
      "bg-muted",
      "hover:bg-muted/80",
      "text-foreground",
      "flex",
      "aspect-square",
      "items-center",
      "justify-center",
      "rounded",
      "text-2xl",
      "font-bold",
      "transition-colors",
      "disabled:cursor-not-allowed",
    ];

    if (value === "X") classes.push("x");
    if (value === "O") classes.push("o");
    if (isWinner) classes.push("winner");

    return classes.join(" ");
  };

  return (
    <div class="bg-card border-border relative flex h-full flex-col rounded-lg border p-4">
      <div class="mb-3 flex items-center justify-between">
        <h3 class="text-muted-foreground flex items-center gap-2 text-xs font-medium tracking-wider uppercase">
          <GamepadIcon />
          Tic Tac Toe
        </h3>
        <button
          onClick={resetGame}
          class="text-muted-foreground hover:text-foreground text-xs transition-colors"
        >
          Reset
        </button>
      </div>

      <div class="text-foreground mb-3 text-center text-sm font-medium">
        {statusText()}
      </div>

      <div class="flex flex-1 items-center justify-center">
        <div class="grid aspect-square w-full max-w-45 grid-cols-3 gap-1">
          <For each={[0, 1, 2, 3, 4, 5, 6, 7, 8]}>
            {(index) => (
              <button
                class={getCellClasses(index)}
                disabled={isCellDisabled(index)}
                onClick={() => handlePlayerMove(index)}
              >
                {board()[index]}
              </button>
            )}
          </For>
        </div>
      </div>

      <div class="mt-3 flex justify-center gap-4 text-xs">
        <span class="text-muted-foreground">
          You: <span class="text-foreground font-medium">{playerScore()}</span>
        </span>
        <span class="text-muted-foreground">
          AI: <span class="text-foreground font-medium">{aiScore()}</span>
        </span>
      </div>

      <style>{`
        .ttt-cell.x {
          color: hsl(var(--primary));
        }
        .ttt-cell.o {
          color: hsl(var(--destructive, 0 84% 60%));
        }
        .ttt-cell.winner {
          animation: pulse 0.5s ease-in-out 2;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

export default TicTacToe;
