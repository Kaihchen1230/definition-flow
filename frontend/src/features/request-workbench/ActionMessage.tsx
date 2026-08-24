type ActionMessageProps = {
  result: {
    success: boolean;
    message: string;
  };
};

export const ActionMessage = ({ result }: ActionMessageProps) => {
  return (
    <div className={`panel text-sm ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
      {result.message}
    </div>
  );
};
