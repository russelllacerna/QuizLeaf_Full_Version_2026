import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const STORAGE_KEY = "quizleaf_full_decks_v1";

const starterDecks = [
  {
    id: "js-basics",
    title: "JavaScript Basics",
    description: "Core JavaScript concepts for beginners.",
    cards: [
      {
        id: "js1",
        front: "What is a JavaScript variable?",
        back: "A named container used to store a value.",
      },
      {
        id: "js2",
        front:
          "Which keyword creates a block-scoped variable that can be reassigned?",
        back: "let",
      },
      {
        id: "js3",
        front: "What does === check?",
        back: "Strict equality: value and type must both match.",
      },
      {
        id: "js4",
        front: "What is an array?",
        back: "An ordered collection of values.",
      },
    ],
  },
  {
    id: "networking",
    title: "Networking Fundamentals",
    description: "Useful networking terms for IT students.",
    cards: [
      {
        id: "net1",
        front: "What does LAN stand for?",
        back: "Local Area Network.",
      },
      {
        id: "net2",
        front: "What does IP stand for?",
        back: "Internet Protocol.",
      },
      {
        id: "net3",
        front: "What device forwards packets between networks?",
        back: "A router.",
      },
      {
        id: "net4",
        front:
          "What is the common name for an Ethernet cable using twisted-pair copper?",
        back: "A twisted-pair Ethernet cable, such as Cat5e or Cat6.",
      },
    ],
  },
  {
    id: "machine-learning",
    title: "Machine Learning",
    description: "Quick review cards for ML and Python.",
    cards: [
      {
        id: "ml1",
        front: "What is supervised learning?",
        back: "Learning from labeled training data.",
      },
      {
        id: "ml2",
        front:
          "What Python library provides high-performance numerical arrays?",
        back: "NumPy.",
      },
      {
        id: "ml3",
        front: "What is a model's prediction confidence?",
        back: "A numerical indication of how strongly the model favors a class or prediction.",
      },
      {
        id: "ml4",
        front: "What is overfitting?",
        back: "When a model learns training data too closely and performs poorly on unseen data.",
      },
    ],
  },
];

function loadDecks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return starterDecks;
}

function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function App() {
  const [decks, setDecks] = useState(loadDecks);
  const [page, setPage] = useState("home");
  const [selectedDeckId, setSelectedDeckId] = useState(null);
  const [search, setSearch] = useState("");
  const [studyIndex, setStudyIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState({});
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
  }, [decks]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  const selectedDeck = decks.find((deck) => deck.id === selectedDeckId);

  const filteredDecks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return decks;
    return decks.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q),
    );
  }, [decks, search]);

  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);

  function notify(message) {
    setToast(message);
  }

  function openStudy(deckId) {
    const deck = decks.find((d) => d.id === deckId);
    if (!deck?.cards.length) {
      notify("Add at least one flashcard before studying.");
      return;
    }
    setSelectedDeckId(deckId);
    setStudyIndex(0);
    setFlipped(false);
    setKnown({});
    setPage("study");
  }

  function openDecks() {
    setPage("decks");
    setSearch("");
  }

  function deleteDeck(id) {
    const deck = decks.find((d) => d.id === id);
    if (!deck || !confirm(`Delete "${deck.title}"?`)) return;
    setDecks((current) => current.filter((d) => d.id !== id));
    if (selectedDeckId === id) setSelectedDeckId(null);
    notify("Deck deleted.");
  }

  function createDeck(data) {
    const deck = {
      id: makeId("deck"),
      title: data.title.trim(),
      description: data.description.trim() || "A new QuizLeaf study deck.",
      cards: data.cards
        .filter((c) => c.front.trim() && c.back.trim())
        .map((c) => ({
          id: makeId("card"),
          front: c.front.trim(),
          back: c.back.trim(),
        })),
    };
    setDecks((current) => [deck, ...current]);
    notify("Deck created successfully.");
    openStudy(deck.id);
  }

  function editDeck(updated) {
    setDecks((current) =>
      current.map((d) => (d.id === updated.id ? updated : d)),
    );
    notify("Deck updated.");
  }

  function resetAll() {
    if (
      !confirm(
        "Reset QuizLeaf to the starter decks? Your created decks will be removed.",
      )
    )
      return;
    setDecks(starterDecks);
    notify("Starter decks restored.");
  }

  function nextCard() {
    if (!selectedDeck) return;
    setStudyIndex((i) => Math.min(i + 1, selectedDeck.cards.length - 1));
    setFlipped(false);
  }

  function prevCard() {
    setStudyIndex((i) => Math.max(i - 1, 0));
    setFlipped(false);
  }

  function markCard(value) {
    if (!selectedDeck) return;
    const card = selectedDeck.cards[studyIndex];
    setKnown((current) => ({ ...current, [card.id]: value }));
    if (studyIndex < selectedDeck.cards.length - 1) {
      setTimeout(nextCard, 120);
    } else {
      notify("Deck complete! Nice work.");
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <button
          className="brand"
          onClick={() => setPage("home")}
          aria-label="QuizLeaf home"
        >
          <span className="brand-mark">🍃</span>
          <span>QuizLeaf</span>
        </button>
        <nav>
          <button
            className={page === "home" ? "nav-active" : ""}
            onClick={() => setPage("home")}
          >
            Home
          </button>
          <button
            className={page === "decks" ? "nav-active" : ""}
            onClick={openDecks}
          >
            My Decks
          </button>
          <button className="nav-primary" onClick={() => setPage("create")}>
            + Create Deck
          </button>
        </nav>
      </header>

      <main>
        {page === "home" && (
          <Home
            decks={decks}
            totalCards={totalCards}
            onCreate={() => setPage("create")}
            onStudy={openStudy}
            onDecks={openDecks}
          />
        )}

        {page === "decks" && (
          <Decks
            decks={filteredDecks}
            search={search}
            setSearch={setSearch}
            onCreate={() => setPage("create")}
            onStudy={openStudy}
            onEdit={(id) => {
              setSelectedDeckId(id);
              setPage("edit");
            }}
            onDelete={deleteDeck}
            onReset={resetAll}
          />
        )}

        {page === "create" && (
          <DeckEditor mode="create" onCancel={openDecks} onSave={createDeck} />
        )}

        {page === "edit" && selectedDeck && (
          <DeckEditor
            mode="edit"
            initial={selectedDeck}
            onCancel={openDecks}
            onSave={(data) => {
              editDeck(data);
              setPage("decks");
            }}
          />
        )}

        {page === "study" && selectedDeck && (
          <Study
            deck={selectedDeck}
            index={studyIndex}
            flipped={flipped}
            known={known}
            onFlip={() => setFlipped((v) => !v)}
            onPrev={prevCard}
            onNext={nextCard}
            onMark={markCard}
            onExit={openDecks}
          />
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}

      <footer>QuizLeaf 🍃 · Review smarter. Remember longer.</footer>
    </div>
  );
}

function Home({ decks, totalCards, onCreate, onStudy, onDecks }) {
  const recent = decks.slice(0, 3);
  return (
    <section className="home-page">
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow">LEARN • REVIEW • REMEMBER</div>
          <h1>
            Turn your notes into
            <br />
            <span>knowledge that sticks.</span>
          </h1>
          <p>
            Create simple flashcard decks and study them with a leaf-shaped card
            designed for quick, focused review.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={onCreate}>
              Create a Deck <span>→</span>
            </button>
            <button className="button button-secondary" onClick={onDecks}>
              Browse Decks
            </button>
          </div>
          <div className="stats">
            <div>
              <strong>{decks.length}</strong>
              <span>Decks</span>
            </div>
            <div>
              <strong>{totalCards}</strong>
              <span>Flashcards</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>Reviews</span>
            </div>
          </div>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="floating-note note-one">Review</div>
          <div className="floating-note note-two">Remember</div>
          <div className="hero-leaf">
            <div className="leaf-vein"></div>
            <div className="hero-leaf-text">
              QUIZ
              <br />
              <span>LEAF</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section-heading">
        <div>
          <div className="eyebrow">QUICK START</div>
          <h2>Pick a deck and start learning.</h2>
        </div>
        <button className="text-button" onClick={onDecks}>
          View all →
        </button>
      </div>

      <div className="deck-grid">
        {recent.map((deck) => (
          <DeckCard key={deck.id} deck={deck} onStudy={onStudy} />
        ))}
      </div>
    </section>
  );
}

function DeckCard({ deck, onStudy, onEdit, onDelete }) {
  return (
    <article className="deck-card">
      <div className="mini-leaf">🍃</div>
      <div className="deck-card-content">
        <h3>{deck.title}</h3>
        <p>{deck.description}</p>
        <div className="deck-meta">
          {deck.cards.length} {deck.cards.length === 1 ? "card" : "cards"}
        </div>
        <div className="card-actions">
          <button
            className="button button-primary small"
            onClick={() => onStudy(deck.id)}
          >
            Study
          </button>
          {onEdit && (
            <button
              className="icon-button"
              onClick={() => onEdit(deck.id)}
              title="Edit"
            >
              ✎
            </button>
          )}
          {onDelete && (
            <button
              className="icon-button danger"
              onClick={() => onDelete(deck.id)}
              title="Delete"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function Decks({
  decks,
  search,
  setSearch,
  onCreate,
  onStudy,
  onEdit,
  onDelete,
  onReset,
}) {
  return (
    <section className="content-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">YOUR LIBRARY</div>
          <h1>My Decks</h1>
          <p>Create, manage, and study your flashcards.</p>
        </div>
        <button className="button button-primary" onClick={onCreate}>
          + New Deck
        </button>
      </div>
      <div className="toolbar">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search your decks..."
        />
        <button className="button button-ghost" onClick={onReset}>
          Reset starters
        </button>
      </div>
      {decks.length ? (
        <div className="deck-grid deck-grid-large">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onStudy={onStudy}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="empty">
          <div className="empty-leaf">🍃</div>
          <h2>No decks found</h2>
          <p>Try another search or create your first deck.</p>
          <button className="button button-primary" onClick={onCreate}>
            Create Deck
          </button>
        </div>
      )}
    </section>
  );
}

function DeckEditor({ mode, initial, onCancel, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [cards, setCards] = useState(
    initial?.cards?.map((c) => ({ ...c })) || [
      { id: makeId("draft"), front: "", back: "" },
      { id: makeId("draft"), front: "", back: "" },
    ],
  );

  function updateCard(id, field, value) {
    setCards((current) =>
      current.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  }

  function addCard() {
    setCards((current) => [
      ...current,
      { id: makeId("draft"), front: "", back: "" },
    ]);
  }

  function removeCard(id) {
    if (cards.length <= 1) return;
    setCards((current) => current.filter((c) => c.id !== id));
  }

  function submit(e) {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a deck title.");
    const validCards = cards.filter((c) => c.front.trim() && c.back.trim());
    if (!validCards.length)
      return alert("Add at least one complete flashcard.");
    onSave({
      id: initial?.id,
      title,
      description,
      cards: validCards.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
      })),
    });
  }

  return (
    <section className="content-page editor-page">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            {mode === "create" ? "BUILD A DECK" : "MANAGE DECK"}
          </div>
          <h1>{mode === "create" ? "Create a Deck" : "Edit Deck"}</h1>
          <p>Add the questions and answers you want to remember.</p>
        </div>
      </div>
      <form onSubmit={submit}>
        <div className="form-panel">
          <label>
            Deck name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Web Development"
              autoFocus
            />
          </label>
          <label>
            Description <span className="muted">(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you study?"
            ></textarea>
          </label>
        </div>
        <div className="cards-editor-header">
          <div>
            <h2>Flashcards</h2>
            <p>{cards.length} cards</p>
          </div>
          <button
            type="button"
            className="button button-secondary"
            onClick={addCard}
          >
            + Add Card
          </button>
        </div>
        <div className="editor-cards">
          {cards.map((card, i) => (
            <div className="editor-card" key={card.id}>
              <div className="editor-card-number">{i + 1}</div>
              <label>
                Question / Front
                <textarea
                  value={card.front}
                  onChange={(e) => updateCard(card.id, "front", e.target.value)}
                  placeholder="What do you want to remember?"
                />
              </label>
              <label>
                Answer / Back
                <textarea
                  value={card.back}
                  onChange={(e) => updateCard(card.id, "back", e.target.value)}
                  placeholder="Write the answer..."
                />
              </label>
              <button
                type="button"
                className="remove-card"
                onClick={() => removeCard(card.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button
            type="button"
            className="button button-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button className="button button-primary">
            {mode === "create" ? "Create Deck" : "Save Changes"} →
          </button>
        </div>
      </form>
    </section>
  );
}

function Study({
  deck,
  index,
  flipped,
  known,
  onFlip,
  onPrev,
  onNext,
  onMark,
  onExit,
}) {
  const card = deck.cards[index];
  const percent = Math.round(((index + 1) / deck.cards.length) * 100);
  const knownCount = Object.values(known).filter(Boolean).length;

  return (
    <section className="study-page">
      <div className="study-top">
        <button className="back-button" onClick={onExit}>
          ← Back to decks
        </button>
        <div>
          <strong>{deck.title}</strong>
          <span>{deck.cards.length} cards</span>
        </div>
        <div className="study-count">
          {index + 1} / {deck.cards.length}
        </div>
      </div>

      <div className="progress-track">
        <div style={{ width: `${percent}%` }}></div>
      </div>

      <div className="study-intro">
        <div className="eyebrow">STUDY MODE</div>
        <h1>Focus on one leaf at a time.</h1>
        <p>Tap the leaf to reveal the answer.</p>
      </div>

      <div className="leaf-stage">
        <button
          className={`flash-leaf ${flipped ? "is-flipped" : ""}`}
          onClick={onFlip}
          aria-label="Flip flashcard"
        >
          <span className="leaf-shadow"></span>
          <span className="flash-leaf-shape"></span>
          <span className="flash-leaf-vein"></span>
          <span className="flash-content">
            <small>{flipped ? "ANSWER" : "QUESTION"}</small>
            <strong>{flipped ? card.back : card.front}</strong>
            <em>
              {flipped ? "Tap to see the question" : "Tap to reveal answer"}
            </em>
          </span>
        </button>
      </div>

      <div className="study-controls">
        <button
          className="button button-secondary"
          onClick={onPrev}
          disabled={index === 0}
        >
          ← Previous
        </button>
        <div className="mark-controls">
          <button
            className={`review-button again ${known[card.id] === "again" ? "selected" : ""}`}
            onClick={() => onMark("again")}
          >
            ↻ Again
          </button>
          <button
            className={`review-button good ${known[card.id] === "good" ? "selected" : ""}`}
            onClick={() => onMark("good")}
          >
            ✓ Got it
          </button>
        </div>
        <button
          className="button button-primary"
          onClick={onNext}
          disabled={index === deck.cards.length - 1}
        >
          Next →
        </button>
      </div>

      <div className="study-footer">
        <span>
          {knownCount} of {deck.cards.length} marked as known
        </span>
        <span>Tip: say the answer before flipping.</span>
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
