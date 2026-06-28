import { Check } from 'lucide-react';

export default function Timeline({
  steps = [],
  activeStep,
  className = '',
  ...props
}) {
  return (
    <div className={`flex flex-col relative pl-6 space-y-6 ${className}`} {...props}>
      {/* Central vertical line */}
      <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-100" />

      {steps.map((step, idx) => {
        const isCompleted = idx < activeStep;
        const isActive = idx === activeStep;
        
        return (
          <div key={idx} className="relative flex flex-col space-y-1">
            {/* Step dot indicator */}
            <div
              className={`absolute -left-6 top-1 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isActive
                  ? 'bg-white border-primary text-primary'
                  : 'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {isCompleted ? (
                <Check size={10} strokeWidth={3} />
              ) : (
                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-transparent'}`} />
              )}
            </div>

            <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.title}
            </span>
            {step.description && (
              <span className="text-[11px] text-gray-400 font-medium leading-relaxed">
                {step.description}
              </span>
            )}
            {step.date && (
              <span className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">
                {step.date}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
