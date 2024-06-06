import { useState } from "react";
import Logo from "./Logo";
import Form from "./Form";
import PackingList from "./PackingList";
import Stats from "./Stats";
export default function App() {
  const [items, setItems] = useState([]);

  function handleAddItems(item) {
    setItems(() => [...items, item]);
    console.log(items);
  }

  function handleDeleteItems(id) {
    console.log(id);
    setItems((items) => items.filter((item) => item.id !== id));
  }

  function handleToggleItems(id) {
    console.log(id);
    setItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, packed: !item.packed } : item
      )
    );
    console.log(items);
  }

  function handleClearList() {
    const confirmed = window.confirm(
      "are you sure you want to delete all itemes?"
    );

    if (confirmed) setItems([]);
  }
  return (
    <div className="app">
      <Logo />
      <Form onAddItem={handleAddItems} />
      <PackingList
        item={items}
        onDeleteItem={handleDeleteItems}
        onToggleItem={handleToggleItems}
        onClearList={handleClearList}
      />
      <Stats item={items} />
    </div>
  );
}
