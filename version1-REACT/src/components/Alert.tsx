type AlertProps = {
  show: boolean; // control visibility
  children: React.ReactNode; // what the alert displays
  onClose?: () => void; // optional close button handler
};

export default function Alert({ show, children, onClose }: AlertProps) {
  if (!show) return null; // conditional rendering: nothing if show=false

  return (
    <div className="alert alert-info alert-dismissible fade show" role="alert">
      {children}
      {onClose && (
        <button
          type="button"
          className="btn-close"
          onClick={onClose}
          aria-label="Close"
        />
      )}
    </div>
  );
}
