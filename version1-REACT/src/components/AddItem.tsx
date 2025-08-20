import { useState } from "react";

type AddItemProps = {
  onAdd: (value: string) => void;  // parent tells us what to do with new items
};

export default function AddItem({ onAdd }: AddItemProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a city name.");
      return;
    }

    onAdd(trimmed);
    setValue("");        // clear field on success
    setError(null);      // clear any previous error
  };

  return (
    <form onSubmit={submit} className="d-flex gap-2 my-3">
      <div className="flex-grow-1">
        <input
          className={`form-control ${error ? "is-invalid" : ""}`}
          placeholder="Add a city..."
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
        />
        {error && <div className="invalid-feedback">{error}</div>}
      </div>

      <button className="btn btn-primary" type="submit">
        Add
      </button>
    </form>
  );
}