function Message() {
  // define here
  const name = "Chief";

  if (name) return <h1> Helloo, {name}!</h1>;
  else return <h1>Hello World, World! {name}</h1>;
}

export default Message;
