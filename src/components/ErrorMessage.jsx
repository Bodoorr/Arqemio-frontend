const ErrorMessage = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
    >
      <span className="mt-0.5 font-semibold text-red-600">!</span>

      <p className="text-sm leading-5 text-red-700">{message}</p>
    </div>
  );
};

export default ErrorMessage;
