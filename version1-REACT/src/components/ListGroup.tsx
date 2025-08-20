// src/components/ListGroup.tsx
import { useState } from "react";

// 1) Define the "shape" of inputs this component accepts (PROPS).
export type ListGroupProps = {
  items: string[]; // required: an array of strings
  heading?: string; // optional: a title
  onSelectItem?: (value: string) => void; // optional: event callback
};

// 2) Read props and give "heading" a default value.
//    This component is "pure" w.r.t. inputs: it displays what you pass.
export default function ListGroup({
  items,
  heading = "Cities",
  onSelectItem,
}: ListGroupProps) {
  // 3) Track which item is selected (STATE).
  //    State persists across renders; local variables don't.
  const [selected, setSelected] = useState<string | null>(null);

  // 4) Handle a click (EVENT).
  const handleClick = (value: string) => {
    setSelected(value); // update local state
    onSelectItem?.(value); // notify parent if it provided a callback
  };

  // 5) Conditional render: show a helpful message if list is empty.
  if (items.length === 0) return <p className="text-muted">No items found.</p>;

  // 6) Render the list. Note:
  //    - key={city} helps React reconcile lists efficiently
  //    - Conditional class adds Bootstrap "active" style
  //    - role + tabIndex make it keyboard-focusable (basic a11y)
  return (
    <>
      <h2 className="mb-3">{heading}</h2>
      <ul className="list-group">
        {items.map((city) => (
          <li
            key={city}
            className={`list-group-item ${selected === city ? "active" : ""}`}
            onClick={() => handleClick(city)}
            role="button"
            tabIndex={0}
          >
            {city}
          </li>
        ))}
      </ul>
    </>
  );
}
