"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================
// TYPES
// ============================================================

type GameMode = "freeplay" | "linear" | "binary";
type TabView = "game" | "sort-game" | "learn" | "compare" | "teacher";

interface CardData {
  value: number;
  revealed: boolean;
  eliminated: boolean;
  isPossible: boolean;
}

interface GameStats {
  totalRounds: number;
  correctAnswers: number;
  totalChecks: number;
  bestChecks: number | null;
  checksHistory: number[];
}

// ============================================================
// CONSTANTS
// ============================================================

const DECK_SIZE = 100;
const NUMBER_MIN = -1000;
const NUMBER_MAX = 10000;
const SORT_MINI_GAME_SIZE = 20;

// ============================================================
// RANDOM NUMBER GENERATION
// ============================================================

function generateUniqueRandomIntegers(count: number, min: number, max: number): number[] {
  const set = new Set<number>();
  const range = max - min + 1;
  while (set.size < count) {
    const num = Math.floor(Math.random() * range) + min;
    set.add(num);
  }
  return Array.from(set);
}

function generateTarget(deck: number[]): { target: number; inDeck: boolean } {
  if (Math.random() < 0.5) {
    const target = deck[Math.floor(Math.random() * deck.length)];
    return { target, inDeck: true };
  } else {
    const min = deck[0] - 500;
    const max = deck[deck.length - 1] + 500;
    let target: number;
    let attempts = 0;
    do {
      target = Math.floor(Math.random() * (max - min + 1)) + min;
      attempts++;
    } while (deck.includes(target) && attempts < 50);
    return { target, inDeck: false };
  }
}

function findTargetIndex(deck: number[], target: number): number {
  return deck.indexOf(target);
}

function binarySearchMaxSteps(size: number): number {
  return Math.ceil(Math.log2(size));
}

// ============================================================
// SCORING
// ============================================================

function getScoreLabel(checks: number, maxLinear: number): { label: string; className: string; stars: number } {
  const ratio = maxLinear > 0 ? checks / maxLinear : 1;
  if (ratio <= 0.1) return { label: "Excellent!", className: "score-excellent", stars: 3 };
  if (ratio <= 0.25) return { label: "Great!", className: "score-great", stars: 2 };
  if (ratio <= 0.5) return { label: "Good", className: "score-good", stars: 1 };
  return { label: "Keep Practicing", className: "score-practicing", stars: 0 };
}

// ============================================================
// CARD COMPONENT
// ============================================================

function Card({
  card,
  index,
  onClick,
}: {
  card: CardData;
  index: number;
  onClick: () => void;
}) {
  const isFlipped = card.revealed;
  const classes = [
    "card-container",
    isFlipped ? "flipped" : "",
    card.eliminated ? "eliminated" : "",
    card.isPossible && !card.eliminated && !isFlipped ? "possible" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={
        isFlipped
          ? `Card ${index + 1}: ${card.value}`
          : card.eliminated
          ? `Card ${index + 1}: eliminated`
          : `Card ${index + 1}: face down`
      }
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="card-inner">
        <div className="card-face card-back" />
        <div className="card-face card-front">
          <span className="card-number">{card.value}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SORTING MINI-GAME
// ============================================================

function SortingMiniGame({ onComplete }: { onComplete: () => void }) {
  const [sortCards, setSortCards] = useState<number[]>([]);
  const [sorted, setSorted] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState("");

  const generateSortRound = useCallback(() => {
    const nums = generateUniqueRandomIntegers(SORT_MINI_GAME_SIZE, -100, 200);
    setSortCards(nums);
    setSorted(false);
    setAttempts(0);
    setMessage("");
  }, []);

  useEffect(() => {
    generateSortRound();
  }, [generateSortRound]);

  function checkIfSorted(cards: number[]) {
    return cards.every((v, i, arr) => i === 0 || arr[i - 1] <= v);
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newCards = [...sortCards];
    const [moved] = newCards.splice(dragIdx, 1);
    newCards.splice(idx, 0, moved);
    setSortCards(newCards);
    setDragIdx(idx);
  }

  function handleDrop(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      return;
    }
    setDragIdx(null);
    setAttempts((a) => a + 1);
    // Check after the onDragOver already moved the card
    if (checkIfSorted(sortCards)) {
      setSorted(true);
      setMessage("Great! Now the cards are sorted. Sorting lets us use faster searching strategies!");
    }
  }

  function handleTouchStart(idx: number) {
    setDragIdx(idx);
  }

  function handleTouchEnd(idx: number) {
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      return;
    }
    const newCards = [...sortCards];
    const [moved] = newCards.splice(dragIdx, 1);
    newCards.splice(idx, 0, moved);
    setSortCards(newCards);
    setDragIdx(null);
    setAttempts((a) => a + 1);
    if (checkIfSorted(newCards)) {
      setSorted(true);
      setMessage("Great! Now the cards are sorted. Sorting lets us use faster searching strategies!");
    }
  }

  return (
    <div className="fade-in">
      <div className="panel-highlight mb-6">
        <h3 className="text-xl font-bold text-white mb-2">🃏 Messy Deck Challenge</h3>
        <p className="text-slate-300 text-sm">
          These {SORT_MINI_GAME_SIZE} cards are in random order. Drag and drop them to sort from smallest to largest!
        </p>
        <p className="text-slate-400 text-xs mt-1">Moves: {attempts}</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6 min-h-[100px]">
        {sortCards.map((num, idx) => (
          <div
            key={`sort-${num}-${idx}`}
            className="sort-card"
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDrop={() => handleDrop(idx)}
            onDragEnd={() => setDragIdx(null)}
            onTouchStart={() => handleTouchStart(idx)}
            onTouchEnd={() => handleTouchEnd(idx)}
            style={{
              opacity: dragIdx === idx ? 0.5 : 1,
            }}
          >
            {num}
          </div>
        ))}
      </div>

      {message && (
        <div className="slide-up panel-highlight text-center">
          <p className="text-green-400 font-bold text-lg mb-2">✅ {message}</p>
          <div className="flex flex-col items-center gap-2 mt-3">
            <p className="text-slate-300 text-sm">
              Sorting → Sorted Data → Faster Searching → Binary Search
            </p>
            <button className="btn-primary mt-2" onClick={onComplete}>
              Continue to Searching →
            </button>
          </div>
        </div>
      )}

      {!sorted && (
        <button className="btn-secondary" onClick={generateSortRound}>
          Reset Cards
        </button>
      )}
    </div>
  );
}

// ============================================================
// MAIN GAME COMPONENT
// ============================================================

export default function Game() {
  // ---- State ----
  const [activeTab, setActiveTab] = useState<TabView>("game");
  const [gameMode, setGameMode] = useState<GameMode>("freeplay");
  const [classroomMode, setClassroomMode] = useState(false);

  // Deck state
  const [deck, setDeck] = useState<CardData[]>([]);
  const [sortedValues, setSortedValues] = useState<number[]>([]);
  const [target, setTarget] = useState(0);
  const [targetInDeck, setTargetInDeck] = useState(true);
  const [targetDeckIndex, setTargetDeckIndex] = useState(-1);

  // Game state
  const [checks, setChecks] = useState(0);
  const [cardsRevealed, setCardsRevealed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [resultTitle, setResultTitle] = useState("");

  // Binary search state
  const [searchLow, setSearchLow] = useState(0);
  const [searchHigh, setSearchHigh] = useState(DECK_SIZE - 1);
  const [binaryMessage, setBinaryMessage] = useState("");
  const [binaryHint, setBinaryHint] = useState("");
  const [binaryStep, setBinaryStep] = useState(0);

  // Linear search state
  const [linearIndex, setLinearIndex] = useState(0);

  // Stats
  const [stats, setStats] = useState<GameStats>({
    totalRounds: 0,
    correctAnswers: 0,
    totalChecks: 0,
    bestChecks: null,
    checksHistory: [],
  });

  // Teacher demo
  const [teacherTarget, setTeacherTarget] = useState("");
  const [teacherExists, setTeacherExists] = useState(true);
  const [teacherRevealAll, setTeacherRevealAll] = useState(false);

  // Ref to avoid stale closures
  const checksRef = useRef(0);
  const gameOverRef = useRef(false);

  useEffect(() => {
    checksRef.current = checks;
  }, [checks]);

  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  // ---- Initialize ----
  useEffect(() => {
    startNewRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Core Functions ----
  const startNewRound = useCallback(() => {
    const numbers = generateUniqueRandomIntegers(DECK_SIZE, NUMBER_MIN, NUMBER_MAX);
    numbers.sort((a, b) => a - b);

    const newDeck: CardData[] = numbers.map((value) => ({
      value,
      revealed: false,
      eliminated: false,
      isPossible: true,
    }));

    const { target: newTarget, inDeck } = generateTarget(numbers);

    setDeck(newDeck);
    setSortedValues(numbers);
    setTarget(newTarget);
    setTargetInDeck(inDeck);
    setTargetDeckIndex(inDeck ? findTargetIndex(numbers, newTarget) : -1);
    setChecks(0);
    setCardsRevealed(0);
    setGameOver(false);
    setResultMessage("");
    setResultTitle("");
    setSearchLow(0);
    setSearchHigh(DECK_SIZE - 1);
    setBinaryMessage("");
    setBinaryHint("");
    setBinaryStep(0);
    setLinearIndex(0);
    setTeacherRevealAll(false);
    checksRef.current = 0;
    gameOverRef.current = false;
  }, []);

  const updateStats = useCallback(
    (finalChecks: number) => {
      setStats((prev) => {
        const newBest =
          prev.bestChecks === null ? finalChecks : Math.min(prev.bestChecks, finalChecks);
        return {
          totalRounds: prev.totalRounds + 1,
          correctAnswers: prev.correctAnswers + 1,
          totalChecks: prev.totalChecks + finalChecks,
          bestChecks: newBest,
          checksHistory: [...prev.checksHistory, finalChecks],
        };
      });
    },
    []
  );

  const revealCard = useCallback(
    (index: number) => {
      if (gameOverRef.current) return;
      if (deck[index].revealed) return;

      // Binary search mode: only allow non-eliminated cards
      if (gameMode === "binary" && deck[index].eliminated) return;

      // Linear search mode: only allow sequential
      if (gameMode === "linear" && index !== linearIndex) return;

      const newChecks = checksRef.current + 1;
      const newDeck = [...deck];
      newDeck[index] = { ...newDeck[index], revealed: true };
      setDeck(newDeck);
      setChecks(newChecks);
      setCardsRevealed((c) => c + 1);

      const revealedValue = newDeck[index].value;

      // Binary search logic
      if (gameMode === "binary") {
        const newStep = binaryStep + 1;
        setBinaryStep(newStep);

        if (revealedValue === target) {
          setGameOver(true);
          setResultTitle("🎯 TARGET FOUND!");
          setResultMessage(`You found ${target} using Binary Search!`);
          updateStats(newChecks);
        } else if (revealedValue < target) {
          // Target is higher — eliminate left half including this card
          const newLow = index + 1;
          setSearchLow(newLow);
          const updatedDeck = newDeck.map((card, i) =>
            i < newLow ? { ...card, eliminated: true } : card
          );
          // Keep the just-revealed card visible
          updatedDeck[index] = { ...updatedDeck[index], eliminated: false, revealed: true };
          setDeck(updatedDeck);
          setBinaryMessage(`TARGET IS HIGHER than ${revealedValue}`);
          setBinaryHint(
            `Step ${newStep}: Eliminate cards 1–${newLow}. Remaining range: cards ${newLow + 1}–${searchHigh + 1}`
          );
        } else {
          // Target is lower — eliminate right half including this card
          const newHigh = index - 1;
          setSearchHigh(newHigh);
          const updatedDeck = newDeck.map((card, i) =>
            i > newHigh ? { ...card, eliminated: true } : card
          );
          updatedDeck[index] = { ...updatedDeck[index], eliminated: false, revealed: true };
          setDeck(updatedDeck);
          setBinaryMessage(`TARGET IS LOWER than ${revealedValue}`);
          setBinaryHint(
            `Step ${newStep}: Eliminate cards ${newHigh + 2}–${DECK_SIZE}. Remaining range: cards 1–${newHigh + 1}`
          );
        }
        return;
      }

      // Linear search: advance pointer
      if (gameMode === "linear") {
        if (revealedValue === target) {
          setGameOver(true);
          setResultTitle("🎯 TARGET FOUND!");
          setResultMessage(`You found ${target} using Linear Search in ${newChecks} checks!`);
          updateStats(newChecks);
        } else {
          setLinearIndex(index + 1);
          if (index + 1 >= DECK_SIZE) {
            setGameOver(true);
            if (targetInDeck) {
              setResultTitle("❌ MISSED THE TARGET");
              setResultMessage(`The target ${target} was in the deck but you didn't find it.`);
            } else {
              setResultTitle("✅ CORRECT!");
              setResultMessage(`The target ${target} is NOT in the deck. You checked all ${DECK_SIZE} cards!`);
            }
            updateStats(newChecks);
          }
        }
        return;
      }

      // Free play — just reveal, no special logic
    },
    [deck, gameMode, linearIndex, searchHigh, target, targetInDeck, binaryStep, updateStats]
  );

  const handleFoundIt = useCallback(() => {
    if (gameOverRef.current) return;

    const currentChecks = checksRef.current;
    const foundInRevealed = deck.some((card) => card.revealed && card.value === target);

    if (foundInRevealed) {
      setGameOver(true);
      setResultTitle("🎉 CORRECT!");
      setResultMessage(`You found ${target} in ${currentChecks} checks.`);
      updateStats(currentChecks);
    } else {
      setResultTitle("⚠️ NOT YET!");
      setResultMessage("The target has not been revealed yet. Keep checking!");
      setTimeout(() => {
        setResultTitle("");
        setResultMessage("");
      }, 3000);
    }
  }, [deck, target, updateStats]);

  const handleNotInDeck = useCallback(() => {
    if (gameOverRef.current) return;

    const currentChecks = checksRef.current;
    if (!targetInDeck) {
      setGameOver(true);
      setResultTitle("🎉 CORRECT!");
      setResultMessage(
        `The target ${target} is NOT in the deck. You proved it in ${currentChecks} checks!`
      );
      updateStats(currentChecks);
    } else {
      setResultTitle("❌ WRONG ANSWER");
      setResultMessage("The target is still somewhere in the deck. Keep looking!");
      setTimeout(() => {
        setResultTitle("");
        setResultMessage("");
      }, 3000);
    }
  }, [targetInDeck, target, updateStats]);

  // ---- Derived values ----
  const avgChecks =
    stats.checksHistory.length > 0
      ? (stats.totalChecks / stats.totalRounds).toFixed(1)
      : "—";

  const linearMaxSteps = targetInDeck ? targetDeckIndex + 1 : DECK_SIZE;
  const binaryMaxSteps = binarySearchMaxSteps(DECK_SIZE);

  const scoreInfo = gameOver
    ? getScoreLabel(checks, linearMaxSteps)
    : null;

  // ---- Teacher demo: apply custom target ----
  const applyTeacherTarget = () => {
    const num = parseInt(teacherTarget);
    if (isNaN(num)) return;

    const exists = sortedValues.includes(num);
    if (teacherExists && !exists) {
      setResultTitle("ℹ️ Info");
      setResultMessage(`${num} is not in the current deck. Generating new deck...`);
      setTimeout(() => {
        const numbers = generateUniqueRandomIntegers(DECK_SIZE - 1, NUMBER_MIN, NUMBER_MAX);
        numbers.push(num);
        numbers.sort((a, b) => a - b);
        const newDeck: CardData[] = numbers.map((value) => ({
          value,
          revealed: false,
          eliminated: false,
          isPossible: true,
        }));
        setDeck(newDeck);
        setSortedValues(numbers);
        setTarget(num);
        setTargetInDeck(true);
        setTargetDeckIndex(findTargetIndex(numbers, num));
        setChecks(0);
        setCardsRevealed(0);
        setGameOver(false);
        setResultMessage("");
        setResultTitle("");
        setSearchLow(0);
        setSearchHigh(DECK_SIZE - 1);
        setBinaryMessage("");
        setBinaryStep(0);
        setLinearIndex(0);
        setTeacherRevealAll(false);
        checksRef.current = 0;
        gameOverRef.current = false;
      }, 1500);
    } else {
      setTarget(num);
      setTargetInDeck(exists);
      setTargetDeckIndex(exists ? findTargetIndex(sortedValues, num) : -1);
      setChecks(0);
      setCardsRevealed(0);
      setGameOver(false);
      setResultMessage("");
      setResultTitle("");
      setSearchLow(0);
      setSearchHigh(DECK_SIZE - 1);
      setBinaryMessage("");
      setBinaryHint("");
      setBinaryStep(0);
      setLinearIndex(0);
      setTeacherRevealAll(false);
      checksRef.current = 0;
      gameOverRef.current = false;
    }
  };

  const revealAllCards = () => {
    setTeacherRevealAll(true);
    const newDeck = deck.map((c) => ({ ...c, revealed: true, eliminated: false }));
    setDeck(newDeck);
  };

  const switchMode = (mode: GameMode) => {
    setGameMode(mode);
    startNewRound();
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className={`min-h-screen flex flex-col ${classroomMode ? "classroom-mode" : ""}`}>
      {/* Header */}
      <header className="text-center py-6 px-4">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight">
          <span className="text-indigo-400">100-CARD</span>{" "}
          <span className="text-white">ALGORITHM</span>{" "}
          <span className="text-emerald-400">CHALLENGE</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base">
          Can you find the target using the fewest checks?
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex justify-center gap-2 px-4 mb-4 flex-wrap">
        <button className={`tab-btn ${activeTab === "game" ? "active" : ""}`} onClick={() => setActiveTab("game")}>
          🎮 Game
        </button>
        <button className={`tab-btn ${activeTab === "sort-game" ? "active" : ""}`} onClick={() => setActiveTab("sort-game")}>
          🃏 Sort Challenge
        </button>
        <button className={`tab-btn ${activeTab === "learn" ? "active" : ""}`} onClick={() => setActiveTab("learn")}>
          📚 Learn
        </button>
        <button className={`tab-btn ${activeTab === "compare" ? "active" : ""}`} onClick={() => setActiveTab("compare")}>
          ⚡ Compare
        </button>
        <button className={`tab-btn ${activeTab === "teacher" ? "active" : ""}`} onClick={() => setActiveTab("teacher")}>
          👨‍🏫 Teacher
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-8">
        {/* ==================== GAME TAB ==================== */}
        {activeTab === "game" && (
          <div className="max-w-5xl mx-auto">
            {/* Mode Selector */}
            <div className="flex justify-center gap-2 mb-4 flex-wrap">
              <button className={`tab-btn ${gameMode === "freeplay" ? "active" : ""}`} onClick={() => switchMode("freeplay")}>
                🆓 Free Play
              </button>
              <button className={`tab-btn ${gameMode === "linear" ? "active" : ""}`} onClick={() => switchMode("linear")}>
                📏 Linear Search
              </button>
              <button className={`tab-btn ${gameMode === "binary" ? "active" : ""}`} onClick={() => switchMode("binary")}>
                🔍 Binary Search
              </button>
            </div>

            {/* Mode Explanation */}
            <div className="panel text-center mb-4 py-3">
              {gameMode === "freeplay" && (
                <p className="text-slate-300 text-sm">
                  Click any card to reveal it. Find the target or prove it&apos;s not in the deck!
                </p>
              )}
              {gameMode === "linear" && (
                <p className="text-slate-300 text-sm">
                  📏 <strong>Linear Search:</strong> Start from card #1 and reveal them one by one in order.
                  You cannot skip ahead!
                </p>
              )}
              {gameMode === "binary" && (
                <p className="text-slate-300 text-sm">
                  🔍 <strong>Binary Search:</strong> The cards are sorted! Click the <strong>middle</strong> of
                  the possible range to eliminate half the cards each time.
                </p>
              )}
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="stat-card">
                <div className="stat-label">Target Number</div>
                <div className="stat-value text-indigo-400">{target}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Checks</div>
                <div className="stat-value">{checks}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Cards Revealed</div>
                <div className="stat-value">
                  {cardsRevealed} <span className="text-sm text-slate-400">/ {DECK_SIZE}</span>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Status</div>
                <div className="stat-value text-sm">
                  {gameOver ? (
                    <span className={scoreInfo?.className}>{scoreInfo?.label}</span>
                  ) : gameMode === "binary" && binaryMessage ? (
                    <span className="text-amber-400 text-xs">{binaryMessage}</span>
                  ) : (
                    <span className="text-slate-300">Searching...</span>
                  )}
                </div>
              </div>
            </div>

            {/* Binary Search hint */}
            {gameMode === "binary" && (binaryHint || checks === 0) && (
              <div className="panel-highlight text-center mb-4 py-3 fade-in">
                {checks === 0 && !binaryHint && (
                  <p className="text-blue-300 text-sm font-semibold">
                    Click the middle card (#{Math.floor((searchLow + searchHigh) / 2) + 1}) to start!
                  </p>
                )}
                {binaryHint && (
                  <>
                    <p className="text-amber-300 text-sm font-semibold">{binaryHint}</p>
                    <p className="text-slate-400 text-xs mt-1">
                      Remaining range: cards {searchLow + 1} to {searchHigh + 1} of {DECK_SIZE}
                    </p>
                  </>
                )}
                {/* Visual bar */}
                <div className="number-line mt-3 mx-auto" style={{ maxWidth: "500px" }}>
                  <div
                    className="number-line-fill"
                    style={{
                      left: `${(searchLow / DECK_SIZE) * 100}%`,
                      width: `${((searchHigh - searchLow + 1) / DECK_SIZE) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Linear Search progress */}
            {gameMode === "linear" && !gameOver && (
              <div className="panel-highlight text-center mb-4 py-3 fade-in">
                <p className="text-blue-300 text-sm font-semibold">
                  {linearIndex === 0
                    ? "Start! Click card #1 to begin Linear Search."
                    : `Next card to check: #${linearIndex + 1} of ${DECK_SIZE}`}
                </p>
                <div className="number-line mt-3 mx-auto" style={{ maxWidth: "500px" }}>
                  <div
                    className="number-line-fill"
                    style={{
                      left: "0%",
                      width: `${(linearIndex / DECK_SIZE) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Result Message */}
            {resultTitle && (
              <div className="slide-up panel-highlight text-center mb-4 py-4">
                <p
                  className={`text-2xl font-black mb-1 ${
                    resultTitle.includes("CORRECT") || resultTitle.includes("FOUND")
                      ? "text-green-400"
                      : resultTitle.includes("WRONG") || resultTitle.includes("MISSED")
                      ? "text-red-400"
                      : "text-amber-400"
                  }`}
                >
                  {resultTitle}
                </p>
                <p className="text-slate-300">{resultMessage}</p>
              </div>
            )}

            {/* Card Grid */}
            <div className={`card-grid ${classroomMode ? "max-w-full" : ""}`}>
              {deck.map((card, index) => (
                <Card
                  key={index}
                  card={card}
                  index={index}
                  onClick={() => revealCard(index)}
                />
              ))}
            </div>

            {/* Action Buttons */}
            {!gameOver && (
              <div className="flex justify-center gap-4 mt-6 flex-wrap">
                <button className="btn-success" onClick={handleFoundIt}>
                  ✅ FOUND IT
                </button>
                <button className="btn-danger" onClick={handleNotInDeck}>
                  ❌ NOT IN THE DECK
                </button>
              </div>
            )}

            {/* Game Over - Results Panel */}
            {gameOver && (
              <div className="slide-up mt-6 max-w-lg mx-auto">
                <div className="panel-highlight text-center py-6">
                  <h3 className="text-2xl font-black text-white mb-2">🏁 ROUND COMPLETE</h3>
                  <p className="text-slate-400 text-sm mb-4">
                    {resultTitle.includes("FOUND") ? "Target found!" : "Target not in deck!"}
                  </p>

                  {/* Star rating */}
                  {scoreInfo && (
                    <div className="mb-4">
                      {Array.from({ length: 3 }, (_, i) => (
                        <span
                          key={i}
                          className={`text-2xl mx-0.5 ${i < scoreInfo.stars ? "opacity-100" : "opacity-20"}`}
                        >
                          ⭐
                        </span>
                      ))}
                      <p className={`text-lg font-bold ${scoreInfo.className}`}>{scoreInfo.label}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="stat-card">
                      <div className="stat-label">Target</div>
                      <div className="stat-value text-indigo-400">{target}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Your Checks</div>
                      <div className="stat-value">{checks}</div>
                    </div>
                  </div>

                  {/* Strategy Comparison */}
                  <div className="panel mb-4 py-4">
                    <p className="text-sm text-slate-400 mb-3 font-semibold">Strategy Comparison</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">📏 Linear Search</p>
                        <p className="text-amber-400 font-bold text-lg">{linearMaxSteps} checks</p>
                        <p className="text-slate-500 text-[10px]">worst case</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs mb-1">🔍 Your Search</p>
                        <p className="text-white font-bold text-lg">{checks} checks</p>
                        {gameMode === "binary" && (
                          <p className="text-slate-500 text-[10px]">
                            max possible: {binaryMaxSteps}
                          </p>
                        )}
                      </div>
                    </div>
                    {checks < linearMaxSteps && (
                      <div className="mt-3 py-2 bg-green-500/10 rounded-lg border border-green-500/20">
                        <p className="text-green-400 font-bold text-sm">
                          🎉 You saved {linearMaxSteps - checks} checks!
                        </p>
                        <p className="text-green-300/60 text-xs">
                          Linear search needed {linearMaxSteps} checks, you used {checks}.
                        </p>
                      </div>
                    )}
                    {checks >= linearMaxSteps && linearMaxSteps < DECK_SIZE && (
                      <p className="text-amber-400 text-sm mt-2">
                        Try using the sorted order to find it faster next time!
                      </p>
                    )}
                  </div>

                  {/* Cumulative Stats */}
                  <div className="panel mb-4 py-3">
                    <p className="text-xs text-slate-500 mb-2">Session Statistics</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <p className="text-slate-400">Rounds</p>
                        <p className="text-white font-bold">{stats.totalRounds}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Best</p>
                        <p className="text-emerald-400 font-bold">
                          {stats.bestChecks !== null ? stats.bestChecks : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Avg</p>
                        <p className="text-white font-bold">{avgChecks}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Total</p>
                        <p className="text-white font-bold">{stats.totalChecks}</p>
                      </div>
                    </div>
                  </div>

                  <button className="btn-primary" onClick={startNewRound}>
                    🔄 NEW ROUND
                  </button>
                </div>
              </div>
            )}

            {/* New Round button (when not game over) */}
            {!gameOver && (
              <div className="flex justify-center mt-4">
                <button className="btn-secondary" onClick={startNewRound}>
                  🔄 New Round
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================== SORT MINI-GAME TAB ==================== */}
        {activeTab === "sort-game" && (
          <div className="max-w-3xl mx-auto">
            <SortingMiniGame onComplete={() => setActiveTab("game")} />
          </div>
        )}

        {/* ==================== LEARN TAB ==================== */}
        {activeTab === "learn" && (
          <div className="max-w-3xl mx-auto space-y-6 fade-in">
            {/* Why Sorted? */}
            <div className="panel-highlight">
              <h3 className="text-xl font-bold text-white mb-3">
                🤔 Why Are the Cards Sorted?
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                The cards are secretly arranged from <strong>smallest to largest</strong>.
                You don&apos;t see the complete order because the cards are face down.
              </p>
              <p className="text-slate-300 text-sm mb-3">
                When you reveal a card, its <strong>position</strong> becomes useful information!
              </p>

              <div className="panel py-4 mt-3">
                <p className="text-slate-400 text-xs mb-2">Example:</p>
                <div className="flex gap-1 justify-center flex-wrap mb-3">
                  {[1, 2, 3].map((i) => (
                    <div key={`example-${i}`} className="sort-card opacity-40">?</div>
                  ))}
                  <div className="sort-card !bg-indigo-100 !border-indigo-400">250</div>
                  {[5, 6, 7].map((i) => (
                    <div key={`example-${i}`} className="sort-card opacity-40">?</div>
                  ))}
                </div>
                <p className="text-slate-300 text-sm text-center">
                  If card #4 reveals <strong className="text-indigo-400">250</strong>, then:
                </p>
                <ul className="text-slate-300 text-sm mt-2 space-y-1 list-none">
                  <li>→ Cards 1–3 must contain values <strong className="text-blue-400">≤ 250</strong></li>
                  <li>→ Cards 5–7 must contain values <strong className="text-emerald-400">≥ 250</strong></li>
                </ul>
              </div>
            </div>

            {/* Linear Search */}
            <div className="panel">
              <h3 className="text-xl font-bold text-white mb-3">
                📏 Linear Search
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                Start at the first card and check one card at a time. Simple, but slow!
              </p>
              <div className="flex flex-col items-center gap-1 my-4">
                {[1, 2, 3, 4, 5].map((num, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className={`px-3 py-1 rounded text-xs font-bold ${
                        i === 4
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-slate-700/50 text-slate-300 border border-slate-600/30"
                      }`}
                    >
                      Card #{num}
                    </div>
                    <span className="text-slate-500 text-xs">
                      {i === 4 ? "FOUND! ✅" : "→"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-xs text-center mt-2">
                Worst case: check all {DECK_SIZE} cards!
              </p>
            </div>

            {/* Binary Search */}
            <div className="panel-highlight">
              <h3 className="text-xl font-bold text-white mb-3">
                🔍 Binary Search
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                Because the cards are <strong>sorted</strong>, you don&apos;t need to check every card!
              </p>
              <p className="text-slate-300 text-sm mb-3 font-semibold">
                Strategy: Check the MIDDLE card, then eliminate half.
              </p>

              <div className="panel py-4 mt-3">
                <div className="flex flex-col items-center gap-2">
                  {[
                    { count: 100, label: "cards", color: "indigo" },
                    { count: 50, label: "possible", color: "amber" },
                    { count: 25, label: "possible", color: "amber" },
                    { count: 12, label: "possible", color: "amber" },
                    { count: 6, label: "possible", color: "amber" },
                    { count: 3, label: "possible", color: "amber" },
                  ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div
                        className={`px-4 py-2 rounded text-sm font-bold border ${
                          step.color === "indigo"
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                            : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        }`}
                      >
                        {step.count} {step.label}
                      </div>
                      <div className="text-slate-500 text-xs my-1">↓ check middle</div>
                    </div>
                  ))}
                  <div className="px-4 py-2 rounded bg-green-500/20 text-green-300 text-sm font-bold border border-green-500/30">
                    Found! ✅
                  </div>
                </div>
                <p className="text-slate-400 text-xs text-center mt-3">
                  Binary Search finds any number in at most ~{binarySearchMaxSteps(DECK_SIZE)} checks!
                </p>
              </div>
            </div>

            {/* Algorithm Discovery */}
            <div className="panel">
              <h3 className="text-xl font-bold text-white mb-3">
                💡 What Did You Notice?
              </h3>
              <div className="space-y-3">
                {[
                  {
                    q: "Did checking every card work?",
                    a: "Yes, but it takes a lot of steps.",
                  },
                  {
                    q: "Could you find the number faster?",
                    a: "Yes! If the cards are sorted, you can use the position to eliminate cards.",
                  },
                  {
                    q: "Why does knowing the cards are sorted help?",
                    a: "Because you can throw away half the cards after each check!",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-indigo-400 text-lg font-bold">{i + 1}.</span>
                    <div>
                      <p className="text-slate-300 text-sm">
                        <strong>{item.q}</strong>
                      </p>
                      <p className="text-slate-400 text-sm">{item.a}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="panel-highlight mt-4 py-4 text-center">
                <p className="text-lg font-bold text-white mb-2">The Big Lesson 🎯</p>
                <p className="text-indigo-300 text-sm font-semibold">
                  An algorithm is a strategy for solving a problem.
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  Good algorithms solve problems with fewer steps.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== COMPARE TAB ==================== */}
        {activeTab === "compare" && (
          <div className="max-w-3xl mx-auto space-y-6 fade-in">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-black text-white mb-2">
                ⚡ Linear Search vs Binary Search
              </h3>
              <p className="text-slate-400 text-sm">See why algorithms matter!</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Linear Search Visual */}
              <div className="panel">
                <h4 className="text-lg font-bold text-white mb-3 text-center">
                  📏 Linear Search
                </h4>
                <p className="text-slate-400 text-xs text-center mb-3">
                  &quot;Check one by one.&quot;
                </p>
                <div className="flex flex-col items-center gap-1">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-12 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                          i === 9
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-slate-700/50 text-slate-400 border border-slate-600/30"
                        }`}
                      >
                        #{i + 1}
                      </div>
                      {i === 9 ? (
                        <span className="text-green-400 text-[10px]">FOUND</span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">↓</span>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-center text-slate-400 text-xs mt-3">
                  100 → 99 → 98 → ... → 1
                </p>
                <p className="text-center text-amber-400 text-xs mt-1 font-semibold">
                  Up to {DECK_SIZE} checks!
                </p>
              </div>

              {/* Binary Search Visual */}
              <div className="panel-highlight">
                <h4 className="text-lg font-bold text-white mb-3 text-center">
                  🔍 Binary Search
                </h4>
                <p className="text-slate-400 text-xs text-center mb-3">
                  &quot;Check middle, eliminate half.&quot;
                </p>
                <div className="flex flex-col items-center gap-1">
                  {[
                    { count: 100, action: "check middle" },
                    { count: 50, action: "eliminate half" },
                    { count: 25, action: "eliminate half" },
                    { count: 12, action: "eliminate half" },
                    { count: 6, action: "eliminate half" },
                    { count: 3, action: "eliminate half" },
                    { count: 1, action: "FOUND", isFound: true },
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-16 h-5 rounded text-[10px] font-bold flex items-center justify-center ${
                          step.isFound
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {step.count} cards
                      </div>
                      <span className="text-slate-500 text-[10px]">{step.action}</span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-slate-400 text-xs mt-3">
                  100 → 50 → 25 → 12 → 6 → 3 → 1
                </p>
                <p className="text-center text-emerald-400 text-xs mt-1 font-semibold">
                  Only {binarySearchMaxSteps(DECK_SIZE)} checks!
                </p>
              </div>
            </div>

            <div className="panel text-center">
              <p className="text-lg font-bold text-white mb-2">Why Binary Search Wins</p>
              <p className="text-slate-300 text-sm">
                Binary Search uses the fact that cards are{" "}
                <strong className="text-indigo-400">sorted</strong> to eliminate{" "}
                <strong className="text-emerald-400">half</strong> the remaining cards with each
                check.
              </p>
              <p className="text-slate-300 text-sm mt-2">
                For {DECK_SIZE} cards: Linear Search needs up to{" "}
                <strong className="text-amber-400">{DECK_SIZE}</strong> checks, while Binary
                Search needs at most{" "}
                <strong className="text-emerald-400">{binarySearchMaxSteps(DECK_SIZE)}</strong>.
              </p>
              <div className="panel-highlight mt-4 py-3">
                <p className="text-indigo-300 text-sm font-semibold">
                  🎯 The goal: &quot;Can I solve this problem with fewer steps?&quot;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TEACHER TAB ==================== */}
        {activeTab === "teacher" && (
          <div className="max-w-3xl mx-auto space-y-6 fade-in">
            <div className="panel-highlight">
              <h3 className="text-xl font-bold text-white mb-3">👨‍🏫 Teacher Demo Mode</h3>
              <p className="text-slate-300 text-sm mb-4">
                Use this mode on a classroom projector. Customize the target, reveal cards,
                and demonstrate search strategies.
              </p>

              {/* Classroom Mode Toggle */}
              <div className="flex items-center gap-3 mb-4">
                <button
                  className={`btn-secondary ${
                    classroomMode
                      ? "!bg-indigo-500/30 !border-indigo-400 !text-indigo-300"
                      : ""
                  }`}
                  onClick={() => setClassroomMode(!classroomMode)}
                >
                  {classroomMode ? "📺 Classroom Mode: ON" : "📺 Classroom Mode: OFF"}
                </button>
                <span className="text-slate-400 text-xs">
                  Large text &amp; high contrast for projectors
                </span>
              </div>

              {/* Set Custom Target */}
              <div className="panel py-4 mb-4">
                <h4 className="text-white font-bold mb-3">Set Custom Target</h4>
                <div className="flex gap-3 items-end flex-wrap">
                  <div>
                    <label className="text-slate-400 text-xs block mb-1">Target Number</label>
                    <input
                      type="number"
                      value={teacherTarget}
                      onChange={(e) => setTeacherTarget(e.target.value)}
                      className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white w-32 focus:outline-none focus:border-indigo-500"
                      placeholder="e.g. 42"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs block mb-1">Target Exists?</label>
                    <select
                      value={teacherExists ? "yes" : "no"}
                      onChange={(e) => setTeacherExists(e.target.value === "yes")}
                      className="bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="yes">Yes, in the deck</option>
                      <option value="no">No, not in deck</option>
                    </select>
                  </div>
                  <button className="btn-primary" onClick={applyTeacherTarget}>
                    Apply Target
                  </button>
                </div>
              </div>

              {/* Teacher Actions */}
              <div className="panel py-4 mb-4">
                <h4 className="text-white font-bold mb-3">Actions</h4>
                <div className="flex gap-3 flex-wrap">
                  <button className="btn-primary" onClick={startNewRound}>
                    🔄 New Deck
                  </button>
                  <button className="btn-secondary" onClick={revealAllCards}>
                    👁️ Reveal All Cards
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      switchMode("linear");
                      setActiveTab("game");
                    }}
                  >
                    📏 Demo Linear Search
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      switchMode("binary");
                      setActiveTab("game");
                    }}
                  >
                    🔍 Demo Binary Search
                  </button>
                </div>
              </div>

              {/* Current Deck Info */}
              <div className="panel py-4">
                <h4 className="text-white font-bold mb-3">Current Deck Info</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Target:</span>{" "}
                    <span className="text-indigo-400 font-bold">{target}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">In deck:</span>{" "}
                    <span
                      className={`font-bold ${
                        targetInDeck ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {targetInDeck ? "Yes" : "No"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Min:</span>{" "}
                    <span className="text-white font-mono">
                      {deck.length > 0 ? deck[0].value : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Max:</span>{" "}
                    <span className="text-white font-mono">
                      {deck.length > 0 ? deck[DECK_SIZE - 1]?.value : "—"}
                    </span>
                  </div>
                </div>

                {teacherRevealAll && (
                  <div className="mt-4">
                    <p className="text-slate-400 text-xs mb-2">Complete sorted deck:</p>
                    <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
                      {deck.map((card, i) => (
                        <span
                          key={i}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                            card.value === target
                              ? "bg-green-500/30 text-green-300 border border-green-500/50"
                              : "bg-slate-700/50 text-slate-300"
                          }`}
                        >
                          {card.value}
                        </span>
                      ))}
                    </div>
                    {targetInDeck && (
                      <p className="text-green-400 text-xs mt-2 font-semibold">
                        Target {target} is at position {targetDeckIndex + 1} (index {targetDeckIndex})
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-500 text-xs border-t border-slate-800">
        100-Card Algorithm Challenge · Teaching Sorting → Searching → Algorithmic Thinking
      </footer>
    </div>
  );
}
