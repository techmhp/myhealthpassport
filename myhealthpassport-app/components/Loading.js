const Loading = () => {
  return (
    <div className="w-full mx-auto font-sans">
      <div className="text-center py-8">
        <div className="inline-flex items-center gap-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading data...</span>
        </div>
      </div>
    </div>
  );
};

export default Loading;
