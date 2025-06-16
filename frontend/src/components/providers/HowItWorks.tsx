import React from 'react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: "Choose a Provider",
      description: "Browse and select from our verified providers"
    },
    {
      number: 2,
      title: "Book Your Time",
      description: "Select an available time slot that works for you"
    },
    {
      number: 3,
      title: "Get Confirmed",
      description: "Receive confirmation and calendar invites"
    }
  ];

  return (
    <div className="mt-12 bg-blue-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-blue-900 mb-2">
        How it works
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
        {steps.map((step) => (
          <div key={step.number} className="flex items-start space-x-2">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold text-blue-900">
                {step.number}
              </div>
            </div>
            <div>
              <div className="font-medium">{step.title}</div>
              <div className="text-blue-700">{step.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}; 