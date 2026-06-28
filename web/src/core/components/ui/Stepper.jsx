
export default function Stepper({
  steps = [],
  activeStep,
  className = '',
  ...props
}) {
  return (
    <div className={`flex items-center w-full justify-between relative py-2 ${className}`} {...props}>
      {/* Central progress line behind dots */}
      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 z-0" />
      
      {steps.map((step, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        
        return (
          <div key={idx} className="flex flex-col items-center relative z-10 shrink-0 select-none">
            <div
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-sans font-bold text-xs transition-all ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                  ? 'bg-white border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-400'
              }`}
            >
              {idx + 1}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider mt-2 bg-background px-1.5 ${
              isActive ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'
            }`}>
              {step}
            </span>
          </div>
        );
      })}
    </div>
  );
}
