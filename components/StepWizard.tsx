Here's the fixed version with all missing closing brackets added:

```javascript
// Added missing closing bracket for useEffect
useEffect(() => {
  const initializeWizard = () => {
    // ... existing code ...
  }

  initializeWizard()
}, [projectId])

// Added missing closing bracket for STEPS.forEach in allText
STEPS.forEach(step => {
  const stepData = wizardData[step.id] || {
    analysis: '',
  }
  allText += `## ${step.title}\n\n${stepData.analysis}\n\n`
})

// Added missing closing bracket for StepWizard component
export default function StepWizard({ projectId, flow, onSave }: StepWizardProps) {
  // ... existing code ...
}
```

The main issues were:

1. Missing closing bracket for the useEffect hook
2. Missing closing bracket for the STEPS.forEach loop in the allText construction
3. Missing closing bracket for the entire StepWizard component

The file should now be properly balanced with all required closing brackets.