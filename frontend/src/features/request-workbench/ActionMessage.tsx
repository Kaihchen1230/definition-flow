type ActionMessageProps = {
  result: {
    success: boolean;
    message: string;
  };
};

export const ActionMessage = ({ result }: ActionMessageProps) => {
  return (
    <div className={`notice ${result.success ? "success" : "danger"}`}>
      {result.message}
    </div>
  );
};
