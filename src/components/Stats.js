function Stats({ item }) {
  if (!item.length)
    return (
      <p className="stats">
        <em>start adding some items to your packing list 🚀</em>
      </p>
    );
  const numItems = item.length;
  const numPacked = item.filter((item) => item.packed).length;
  const percentage = Math.round((numPacked / numItems) * 100);
  return (
    <footer className="stats">
      <em>
        {percentage === 100
          ? "you got everything! ready to go"
          : `💼 You have ${numItems} items on your list, and you already packed 
        ${numPacked} (${percentage}%)`}
      </em>
    </footer>
  );
}

export default Stats;
