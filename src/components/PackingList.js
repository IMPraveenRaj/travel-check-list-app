import Item from "./Item";
import { useState } from "react";
function PackingList({ item, onDeleteItem, onToggleItem, onClearList }) {
  const [sortBy, setSortBy] = useState("input");
  console.log(sortBy);
  let sortedItems = item;

  if (sortBy === "input") sortedItems = item;

  if (sortBy === "input")
    sortedItems = item
      .slice()
      .sort((a, b) => b.description.localeCompare(a.description));
  if (sortBy === "packed")
    sortedItems = item
      .slice()
      .sort((a, b) => Number(a.packed) - Number(b.packed));

  return (
    <div className="list">
      <ul>
        {sortedItems.map((item) => (
          <Item
            onToggleItem={onToggleItem}
            onDeleteItem={onDeleteItem}
            key={item.id}
            item={item}
          ></Item>
        ))}
      </ul>
      <div
        className="actions"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <select>
          <option value="input">Sort By Input Order</option>
          <option value="description">Sort By Description</option>
          <option value="packed">Sort By Packed Status</option>
        </select>
        <button onClick={onClearList}>ClearList</button>
      </div>
    </div>
  );
}

export default PackingList;
