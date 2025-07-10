import React, { useState, useEffect } from 'react';

interface StepWizardProps {
  projectId: string;
  flow: string;
  onSave?: (data: any) => void;
}

interface StepData {
  analysis: string;
}

interface WizardData {
  [key: string]: StepData;
}

interface Step {
  id: string;
  title: string;
}

const STEPS: Step[] = [
  { id: 'step1', title: 'Step 1' },
  { id: 'step2', title: 'Step 2' },
  { id: 'step3', title: 'Step 3' },
];

export default function StepWizard({ projectId, flow, onSave }: StepWizardProps) {
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const initializeWizard = () => {
      // Initialize wizard data
      const initialData: WizardData = {};
      STEPS.forEach(step => {
        initialData[step.id] = {
          analysis: '',
        };
      });
      setWizardData(initialData);
    };

    initializeWizard();
  }, [projectId]);

  const handleSave = () => {
    let allText = '';
    
    STEPS.forEach(step => {
      const stepData = wizardData[step.id] || {
        analysis: '',
      };
      allText += `## ${step.title}\n\n${stepData.analysis}\n\n`;
    });

    if (onSave) {
      onSave({ allText, wizardData });
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStepData = (stepId: string, data: Partial<StepData>) => {
    setWizardData(prev => ({
      ...prev,
      [stepId]: {
        ...prev[stepId],
        ...data,
      },
    }));
  };

  const currentStepData = STEPS[currentStep];

  return (
    <div className="step-wizard">
      <div className="wizard-header">
        <h2>Step Wizard - {flow}</h2>
        <div className="step-indicator">
          Step {currentStep + 1} of {STEPS.length}
        </div>
      </div>

      <div className="wizard-content">
        <h3>{currentStepData.title}</h3>
        <textarea
          value={wizardData[currentStepData.id]?.analysis || ''}
          onChange={(e) => updateStepData(currentStepData.id, { analysis: e.target.value })}
          placeholder="Enter your analysis here..."
          className="w-full h-32 p-2 border rounded"
        />
      </div>

      <div className="wizard-navigation">
        <button
          onClick={prevStep}
          disabled={currentStep === 0}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <button
          onClick={nextStep}
          disabled={currentStep === STEPS.length - 1}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Next
        </button>
        
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Save
        </button>
      </div>
    </div>
  );
}

export default StepWizard