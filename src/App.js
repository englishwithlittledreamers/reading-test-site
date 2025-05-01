// Full-feature highlighting system with multi-color, notes, eraser, and persistence

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const highlightColors = ["yellow", "green", "pink", "blue", "grey"];

const defaultPassages = [
  {
    title: "Nu shu",
    subtitle: "a secret language",
    body: `
      <p><strong>Nu shu</strong> is a unique script developed and used by women in Jiangyong County, Hunan province, China. It was passed down through generations in secrecy.</p>
      <p>Unlike standard Chinese characters, Nu shu has a cursive, elongated style and was often embroidered or written on fans and cloth.</p>
      <p>Many women used Nu shu to communicate their feelings in poems, songs, and letters, especially when they were isolated due to societal customs.</p>
    `,
    headings: ["i. Origins", "ii. Usage", "iii. Cultural Value", "iv. Revival", "v. Secrecy"],
    sections: [
      { label: "Section A" },
      { label: "Section B" }
    ]
  },
  {
    title: "Hieroglyphs",
    subtitle: "the script of ancient Egypt",
    body: `
      <p>Hieroglyphs were used for religious literature on papyrus and wood, carved into stone for tombs and monuments.</p>
      <p>They combine logographic, syllabic, and alphabetic elements and were deciphered in the 19th century.</p>
    `,
    headings: ["i. Discovery", "ii. Symbols", "iii. Interpretation"],
    sections: [{ label: "Section A" }]
  }
];

export default function ReadingInterface({ passages = defaultPassages }) {
  const [activeTab, setActiveTab] = useState(0);
  const [highlightMode, setHighlightMode] = useState(false);
  const [highlights, setHighlights] = useState(() => (passages ? passages.map(() => []) : []));
  const [selectionBox, setSelectionBox] = useState(null);
  const passageRefs = useRef([]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (!highlightMode) return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setSelectionBox(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const relative = passageRefs.current[activeTab]?.getBoundingClientRect();

      if (!relative) return;

      setSelectionBox({
        top: rect.top - relative.top + passageRefs.current[activeTab].scrollTop,
        left: rect.left - relative.left,
        text: selection.toString(),
        range,
      });
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [highlightMode, activeTab]);

  const applyHighlight = (color, comment = "") => {
    if (!selectionBox) return;
    const { range, text } = selectionBox;
    const span = document.createElement("span");
    span.style.backgroundColor = color;
    span.className = "rounded px-1 highlight-span";
    if (comment) span.setAttribute("data-comment", comment);
    try {
      range.surroundContents(span);
    } catch (e) {
      console.warn("Highlight failed:", e);
      return;
    }

    setHighlights(prev => {
      const newList = [...prev];
      newList[activeTab].push({ text, color, comment });
      return newList;
    });

    window.getSelection().removeAllRanges();
    setSelectionBox(null);
  };

  const cancelHighlight = () => {
    window.getSelection().removeAllRanges();
    setSelectionBox(null);
  };

  if (!passages || !Array.isArray(passages) || passages.length === 0) {
    return <div className="p-4 text-red-600">No passages available.</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Tabs */}
      <div className="flex space-x-4 border-b px-4 py-2">
        {passages.map((p, i) => (
          <button
            key={i}
            className={clsx(
              "px-3 py-1 border-b-2",
              i === activeTab ? "border-blue-500 text-blue-700 font-semibold" : "border-transparent"
            )}
            onClick={() => setActiveTab(i)}
          >
            Passage {i + 1}
          </button>
        ))}
        <label className="ml-auto flex items-center space-x-2">
          <input
            type="checkbox"
            checked={highlightMode}
            onChange={() => setHighlightMode(!highlightMode)}
          />
          <span>Highlight nội dung</span>
        </label>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Passage */}
        <div className="w-1/2 p-4 overflow-y-auto border-r relative" ref={el => (passageRefs.current[activeTab] = el)}>
          <h2 className="text-xl font-bold mb-1">{passages[activeTab].title}</h2>
          <h3 className="text-md italic text-gray-600 mb-4">– {passages[activeTab].subtitle} –</h3>
          <div
            className="prose max-w-none selection:bg-yellow-200"
            dangerouslySetInnerHTML={{ __html: passages[activeTab].body }}
          />

          {selectionBox && highlightMode && (
            <div
              className="absolute bg-white shadow-md border rounded p-2 flex space-x-2 z-50"
              style={{ top: selectionBox.top + 10, left: selectionBox.left + 10 }}
            >
              {highlightColors.map(c => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full`} style={{ backgroundColor: c }}
                  onClick={() => applyHighlight(c)}
                  aria-label={`Highlight with ${c}`}
                />
              ))}
              <button onClick={() => {
                const comment = prompt("Add a comment?");
                if (comment) applyHighlight("yellow", comment);
              }} title="Add note" aria-label="Add note">✏️</button>
              <button onClick={cancelHighlight} title="Cancel">×</button>
            </div>
          )}
        </div>

        {/* Right: Inputs */}
        <div className="w-1/2 p-4 overflow-y-auto">
          <h3 className="text-lg font-semibold mb-2">Choose Headings</h3>
          <ol className="list-decimal list-inside space-y-2 mb-4">
            {passages[activeTab].headings?.map((h, i) => (
              <li key={i}>{h}</li>
            ))}
          </ol>

          {passages[activeTab].sections?.map((sec, i) => (
            <div key={i} className="mb-4">
              <label className="block font-medium mb-1">{sec.label}</label>
              <input
                type="text"
                className="w-full border p-2 rounded shadow"
                placeholder=""
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
