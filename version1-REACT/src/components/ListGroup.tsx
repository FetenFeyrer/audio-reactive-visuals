function ListGroup() {
  let items = [
    "New York",
    "San Francisco",
    "Tokyo",
    "Leipzig",
    "Bittenfeld",
    "Blablabla",
    "Bliblibli",
    "Wurzelheim",
  ];

  // This is basically a function
  const getMessage = () => {
    return items.length === 0 ? <p>No item found, kek</p> : null;
  };

  // This is the mainreturn of ListGroup()
  return (
    <>
      <h2>Blabla</h2>
      {getMessage()}
      <ul className="list-group">
        {items.map((items) => (
          <li className="list-group-item" key={items}>
            {items}
          </li>
        ))}
      </ul>
    </>
  );
}

// Export for App.tsx
export default ListGroup;
